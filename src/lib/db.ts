import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL

  // During build, DATABASE_URL may not be set yet. Return a placeholder
  // that won't actually connect — it only gets used if a query runs at
  // build time (which it shouldn't for our routes).
  if (!url) {
    // Return a dummy client that will throw a clear error only if actually
    // used at runtime without a URL. This prevents build-time crashes.
    return new PrismaClient({ log: ['error', 'warn'] })
  }

  // If the URL is a libsql/Turso URL (production on Vercel), use the adapter.
  if (url.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN
    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter, log: ['error', 'warn'] })
  }

  // Local dev with SQLite file
  return new PrismaClient({ log: ['error', 'warn'] })
}

// Lazy initialization — only create the client when first accessed.
// This prevents crashes during `next build` when env vars aren't available.
let _client: PrismaClient | null = null
function getClient(): PrismaClient {
  if (!_client) {
    _client = createPrismaClient()
  }
  return _client
}

// Export a Proxy so `db.model.findMany()` works transparently, but the
// actual Prisma client is only created on first method call (runtime, not build).
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
}) as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _client ?? undefined
