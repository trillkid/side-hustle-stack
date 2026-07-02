import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL

  // If the URL is a libsql/Turso URL (production on Vercel), use the adapter.
  // Otherwise (local dev with SQLite file), use the standard Prisma client.
  if (url && url.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN
    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter, log: ['error', 'warn'] })
  }

  return new PrismaClient({ log: ['error', 'warn'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
