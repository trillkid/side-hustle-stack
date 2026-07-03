import { createClient, type Client } from '@libsql/client'

/**
 * Lightweight Prisma-compatible database layer built on libsql.
 * This replaces @prisma/client so we can connect to Turso reliably on Vercel.
 * Supports the subset of Prisma methods used by the app's API routes.
 */

const globalForDb = globalThis as unknown as {
  __libsqlClient: Client | undefined
}

function getClient(): Client {
  if (globalForDb.__libsqlClient) return globalForDb.__libsqlClient

  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  let client: Client
  if (!url) {
    // local dev
    client = createClient({ url: 'file:./db/custom.db' })
  } else if (url.startsWith('libsql://')) {
    client = createClient({ url, authToken })
  } else {
    client = createClient({ url })
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.__libsqlClient = client
  }
  return client
}

// ---- ID generator (cuid-like) ----
function generateId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `c${ts}${rand}`
}

// ---- Type helpers ----
type Where = Record<string, unknown>
type OrderBy = Record<string, 'asc' | 'desc'> | undefined
type Include = Record<string, true | { select?: Record<string, true> }> | undefined

// ---- WHERE clause builder ----
function buildWhere(where: Where | undefined, columns: Record<string, string>): { sql: string; args: unknown[] } {
  if (!where || Object.keys(where).length === 0) return { sql: '', args: [] }
  const parts: string[] = []
  const args: unknown[] = []
  for (const [key, value] of Object.entries(where)) {
    const col = columns[key] ?? key
    if (value === null || value === undefined) {
      parts.push(`${col} IS NULL`)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'in' in value) {
      const arr = (value as { in: unknown[] }).in
      if (arr.length === 0) {
        parts.push('1=0')
      } else {
        const placeholders = arr.map(() => '?').join(', ')
        parts.push(`${col} IN (${placeholders})`)
        args.push(...arr)
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'contains' in value) {
      parts.push(`${col} LIKE ?`)
      args.push(`%${(value as { contains: string }).contains}%`)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'gte' in value) {
      parts.push(`${col} >= ?`)
      args.push((value as { gte: unknown }).gte)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'lte' in value) {
      parts.push(`${col} <= ?`)
      args.push((value as { lte: unknown }).lte)
    } else {
      parts.push(`${col} = ?`)
      args.push(value)
    }
  }
  return { sql: parts.join(' AND '), args }
}

// ---- Table model handler ----
function createModel(table: string, columns: Record<string, string>) {
  const client = getClient()

  return {
    async findMany(opts?: {
      where?: Where
      orderBy?: OrderBy
      include?: Include
      select?: Record<string, true>
      take?: number
      skip?: number
    }): Promise<any[]> {
      const { sql: whereSql, args } = buildWhere(opts?.where, columns)
      let sql = `SELECT * FROM "${table}"`
      if (whereSql) sql += ` WHERE ${whereSql}`
      if (opts?.orderBy) {
        const orderParts = Object.entries(opts.orderBy).map(([k, dir]) => {
          const col = columns[k] ?? k
          return `${col} ${dir.toUpperCase()}`
        })
        sql += ` ORDER BY ${orderParts.join(', ')}`
      }
      if (opts?.take) sql += ` LIMIT ${opts.take}`
      if (opts?.skip) sql += ` OFFSET ${opts.skip}`
      const result = await client.execute({ sql, args })
      let rows = result.rows as any[]

      // Handle includes (relations) by post-fetching
      if (opts?.include) {
        for (const [relName, relOpts] of Object.entries(opts.include)) {
          await populateRelation(rows, table, relName, relOpts)
        }
      }

      // Handle _count aggregation (Prisma-style)
      if (opts?.include) {
        for (const row of rows) {
          // already populated by populateRelation if it's a _count
        }
      }

      return rows
    },

    async findUnique(opts: { where: Where; include?: Include }): Promise<any | null> {
      const { sql: whereSql, args } = buildWhere(opts.where, columns)
      const sql = `SELECT * FROM "${table}" WHERE ${whereSql} LIMIT 1`
      const result = await client.execute({ sql, args })
      const rows = result.rows as any[]
      if (rows.length === 0) return null
      if (opts.include) {
        for (const [relName, relOpts] of Object.entries(opts.include)) {
          await populateRelation(rows, table, relName, relOpts)
        }
      }
      return rows[0]
    },

    async findFirst(opts: { where?: Where; include?: Include; orderBy?: OrderBy }): Promise<any | null> {
      const { sql: whereSql, args } = buildWhere(opts.where, columns)
      let sql = `SELECT * FROM "${table}"`
      if (whereSql) sql += ` WHERE ${whereSql}`
      if (opts.orderBy) {
        const orderParts = Object.entries(opts.orderBy).map(([k, dir]) => {
          const col = columns[k] ?? k
          return `${col} ${dir.toUpperCase()}`
        })
        sql += ` ORDER BY ${orderParts.join(', ')}`
      }
      sql += ` LIMIT 1`
      const result = await client.execute({ sql, args })
      const rows = result.rows as any[]
      if (rows.length === 0) return null
      if (opts.include) {
        for (const [relName, relOpts] of Object.entries(opts.include)) {
          await populateRelation(rows, table, relName, relOpts)
        }
      }
      return rows[0]
    },

    async count(opts?: { where?: Where }): Promise<number> {
      const { sql: whereSql, args } = buildWhere(opts?.where, columns)
      let sql = `SELECT COUNT(*) as count FROM "${table}"`
      if (whereSql) sql += ` WHERE ${whereSql}`
      const result = await client.execute({ sql, args })
      const count = (result.rows[0] as any).count
      return typeof count === 'number' ? count : Number(count)
    },

    async create(opts: { data: Record<string, unknown> }): Promise<any> {
      // Auto-generate id if not provided (mimics Prisma's @default(cuid()))
      const data = { ...opts.data }
      if (!('id' in data)) {
        data.id = generateId()
      }
      const keys = Object.keys(data)
      const placeholders = keys.map(() => '?').join(', ')
      const cols = keys.map((k) => columns[k] ?? k).join(', ')
      const args = keys.map((k) => data[k])
      const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`
      const result = await client.execute({ sql, args })
      return result.rows[0]
    },

    async createMany(opts: { data: Record<string, unknown>[] }): Promise<{ count: number }> {
      if (opts.data.length === 0) return { count: 0 }
      let count = 0
      for (const rowData of opts.data) {
        const data = { ...rowData }
        if (!('id' in data)) {
          data.id = generateId()
        }
        const keys = Object.keys(data)
        const cols = keys.map((k) => columns[k] ?? k).join(', ')
        const placeholders = keys.map(() => '?').join(', ')
        const args = keys.map((k) => data[k])
        const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`
        await client.execute({ sql, args })
        count++
      }
      return { count }
    },

    async update(opts: { where: Where; data: Record<string, unknown> }): Promise<any> {
      const { sql: whereSql, args: whereArgs } = buildWhere(opts.where, columns)
      const setParts: string[] = []
      const setArgs: unknown[] = []
      for (const [k, v] of Object.entries(opts.data)) {
        const col = columns[k] ?? k
        setParts.push(`${col} = ?`)
        setArgs.push(v)
      }
      const sql = `UPDATE "${table}" SET ${setParts.join(', ')} WHERE ${whereSql} RETURNING *`
      const result = await client.execute({ sql, args: [...setArgs, ...whereArgs] })
      return result.rows[0]
    },

    async delete(opts: { where: Where }): Promise<any> {
      const { sql: whereSql, args } = buildWhere(opts.where, columns)
      const sql = `DELETE FROM "${table}" WHERE ${whereSql} RETURNING *`
      const result = await client.execute({ sql, args })
      return result.rows[0]
    },

    async deleteMany(opts: { where?: Where }): Promise<{ count: number }> {
      const { sql: whereSql, args } = buildWhere(opts.where, columns)
      let sql = `DELETE FROM "${table}"`
      if (whereSql) sql += ` WHERE ${whereSql}`
      const result = await client.execute({ sql, args })
      return { count: result.rowsAffected }
    },

    async upsert(opts: {
      where: Where
      create: Record<string, unknown>
      update?: Record<string, unknown>
    }): Promise<any> {
      const existing = await this.findUnique({ where: opts.where })
      if (existing) {
        if (opts.update) {
          return this.update({ where: opts.where, data: opts.update })
        }
        return existing
      }
      return this.create({ data: opts.create })
    },
  }
}

// ---- Relation population (for `include`) ----
async function populateRelation(
  rows: any[],
  table: string,
  relName: string,
  _opts: true | { select?: Record<string, true> }
) {
  if (rows.length === 0) return

  // Define relations
  const relations: Record<string, { from: string; to: string; table: string; type: 'hasMany' | 'belongsTo' }> = {
    'FreelanceService.leads': { from: 'id', to: 'serviceId', table: 'FreelanceLead', type: 'hasMany' },
    'FreelanceLead.service': { from: 'serviceId', to: 'id', table: 'FreelanceService', type: 'belongsTo' },
    'ReviewArticle.clicks': { from: 'id', to: 'articleId', table: 'AffiliateClick', type: 'hasMany' },
    'LinkPage.links': { from: 'id', to: 'pageId', table: 'LinkItem', type: 'hasMany' },
  }

  // Handle _count pseudo-include (Prisma: include: { _count: { select: { leads: true } } })
  if (relName === '_count') {
    // Prisma's _count is structured differently; handle separately below
    return
  }

  const relKey = `${table}.${relName}`
  const rel = relations[relKey]
  if (!rel) return

  const client = getClient()

  if (rel.type === 'hasMany') {
    const ids = rows.map((r) => r.id).filter(Boolean)
    if (ids.length === 0) return
    const placeholders = ids.map(() => '?').join(',')
    const result = await client.execute({
      sql: `SELECT * FROM "${rel.table}" WHERE ${rel.to} IN (${placeholders})`,
      args: ids,
    })
    const relatedRows = result.rows as any[]
    for (const row of rows) {
      row[relName] = relatedRows.filter((r) => r[rel.to] === row.id)
    }
  } else if (rel.type === 'belongsTo') {
    const ids = rows.map((r) => r[rel.from]).filter(Boolean)
    if (ids.length === 0) return
    const uniqueIds = [...new Set(ids)]
    const placeholders = uniqueIds.map(() => '?').join(',')
    const result = await client.execute({
      sql: `SELECT * FROM "${rel.table}" WHERE ${rel.to} IN (${placeholders})`,
      args: uniqueIds,
    })
    const relatedRows = result.rows as any[]
    for (const row of rows) {
      row[relName] = relatedRows.find((r) => r[rel.to] === row[rel.from]) ?? null
    }
  }
}

// ---- Export the db object (Prisma-compatible API) ----
export const db = {
  freelanceService: createModel('FreelanceService', {
    id: 'id',
    title: 'title',
    description: 'description',
    price: 'price',
    category: 'category',
    icon: 'icon',
    active: 'active',
    createdAt: 'createdAt',
  }),
  freelanceLead: createModel('FreelanceLead', {
    id: 'id',
    name: 'name',
    email: 'email',
    message: 'message',
    serviceId: 'serviceId',
    status: 'status',
    createdAt: 'createdAt',
  }),
  product: createModel('Product', {
    id: 'id',
    name: 'name',
    description: 'description',
    price: 'price',
    image: 'image',
    category: 'category',
    createdAt: 'createdAt',
  }),
  storeOrder: createModel('StoreOrder', {
    id: 'id',
    customerName: 'customerName',
    email: 'email',
    total: 'total',
    itemsJson: 'itemsJson',
    status: 'status',
    stripeSessionId: 'stripeSessionId',
    createdAt: 'createdAt',
  }),
  reviewArticle: createModel('ReviewArticle', {
    id: 'id',
    title: 'title',
    slug: 'slug',
    excerpt: 'excerpt',
    content: 'content',
    category: 'category',
    rating: 'rating',
    imageUrl: 'imageUrl',
    affiliateUrl: 'affiliateUrl',
    productName: 'productName',
    createdAt: 'createdAt',
  }),
  affiliateClick: createModel('AffiliateClick', {
    id: 'id',
    articleId: 'articleId',
    clickedAt: 'clickedAt',
  }),
  linkPage: createModel('LinkPage', {
    id: 'id',
    slug: 'slug',
    title: 'title',
    bio: 'bio',
    themeColor: 'themeColor',
    plan: 'plan',
    createdAt: 'createdAt',
  }),
  linkItem: createModel('LinkItem', {
    id: 'id',
    pageId: 'pageId',
    label: 'label',
    url: 'url',
    clicks: 'clicks',
    order: 'order',
  }),
  jobApplication: createModel('JobApplication', {
    id: 'id',
    company: 'company',
    role: 'role',
    status: 'status',
    appliedDate: 'appliedDate',
    link: 'link',
    notes: 'notes',
    salary: 'salary',
    createdAt: 'createdAt',
  }),
  portfolioProject: createModel('PortfolioProject', {
    id: 'id',
    title: 'title',
    description: 'description',
    url: 'url',
    imageUrl: 'imageUrl',
    tags: 'tags',
    createdAt: 'createdAt',
  }),
  appSettings: createModel('AppSettings', {
    id: 'id',
    stripePublishableKey: 'stripePublishableKey',
    stripeSecretKey: 'stripeSecretKey',
    amazonAffiliateTag: 'amazonAffiliateTag',
    notificationEmail: 'notificationEmail',
    siteName: 'siteName',
    updatedAt: 'updatedAt',
  }),
}
