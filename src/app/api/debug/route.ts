import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET() {
  const url = process.env.DATABASE_URL
  const token = process.env.DATABASE_AUTH_TOKEN

  // Test 1: Can we see the env vars?
  const envCheck = {
    urlSet: !!url,
    urlValue: url,
    tokenSet: !!token,
    tokenLength: token?.length,
  }

  // Test 2: Can we connect to Turso directly with libsql?
  let directTest: string
  try {
    const client = createClient({ url: url!, authToken: token })
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
    directTest = `SUCCESS - found ${result.rows.length} tables: ${result.rows.map(r => r.name).join(', ')}`
  } catch (e) {
    directTest = `FAILED - ${e instanceof Error ? e.message : 'unknown error'}`
  }

  return NextResponse.json({ envCheck, directTest })
}
