import { createClient, type Client } from '@libsql/client'

const globalForDb = globalThis as unknown as {
  libsqlClient: Client | undefined
}

function createDbClient(): Client {
  const url = process.env.DATABASE_URL

  // No URL = local dev (won't actually be used in production)
  if (!url) {
    return createClient({ url: 'file:./db/custom.db' })
  }

  // Turso/libsql (production on Vercel)
  if (url.startsWith('libsql://')) {
    const authToken = process.env.DATABASE_AUTH_TOKEN
    return createClient({ url, authToken })
  }

  // Local SQLite file
  return createClient({ url })
}

export const dbClient = globalForDb.libsqlClient ?? createDbClient()

if (process.env.NODE_ENV !== 'production') globalForDb.libsqlClient = dbClient
