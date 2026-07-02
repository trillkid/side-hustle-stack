import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL
  const token = process.env.DATABASE_AUTH_TOKEN

  return NextResponse.json({
    urlSet: !!url,
    urlStartsWith: url ? url.slice(0, 15) : null,
    urlLength: url ? url.length : 0,
    tokenSet: !!token,
    tokenLength: token ? token.length : 0,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('TURSO')),
  })
}
