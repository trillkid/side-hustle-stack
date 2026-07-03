import { NextResponse } from 'next/server'
import { db, dbClient } from '@/lib/db'

// Whitelist of allowed icon names (mapped on the client to lucide icons)
const ALLOWED_ICONS = new Set([
  'Briefcase',
  'Globe',
  'Palette',
  'PenLine',
  'Code2',
  'Heart',
])

function normalizeIcon(icon: unknown): string {
  if (typeof icon === 'string' && ALLOWED_ICONS.has(icon)) return icon
  return 'Briefcase'
}

export async function GET() {
  try {
    const services = await db.freelanceService.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    })

    // Manually compute lead counts per service (libsql doesn't support _count)
    const serviceIds = services.map((s: { id: string }) => s.id)
    let leadCounts: Map<string, number> = new Map()
    if (serviceIds.length > 0) {
      const result = await dbClient.execute({
        sql: `SELECT serviceId, COUNT(*) as cnt FROM FreelanceLead WHERE serviceId IN (${serviceIds.map(() => '?').join(',')}) GROUP BY serviceId`,
        args: serviceIds,
      })
      for (const row of result.rows) {
        leadCounts.set(row.serviceId as string, Number(row.cnt))
      }
    }

    const servicesWithCounts = services.map((s: { id: string }) => ({
      ...s,
      _count: { leads: leadCounts.get(s.id) ?? 0 },
    }))

    return NextResponse.json(servicesWithCounts)
  } catch (err) {
    console.error('[freelance/services GET]', err)
    return NextResponse.json(
      { error: 'Failed to load services' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description =
      typeof body.description === 'string' ? body.description.trim() : ''
    const priceNum = Number(body.price)
    const category =
      typeof body.category === 'string' ? body.category.trim() : ''

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: 'Price must be a non-negative number' },
        { status: 400 }
      )
    }

    const service = await db.freelanceService.create({
      data: {
        title,
        description,
        price: priceNum,
        category,
        icon: normalizeIcon(body.icon),
        active: true,
      },
    })

    // Attach _count.leads: 0 for Prisma-compatible shape (new service)
    const serviceWithCount = { ...service, _count: { leads: 0 } }

    return NextResponse.json(serviceWithCount, { status: 201 })
  } catch (err) {
    console.error('[freelance/services POST]', err)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
