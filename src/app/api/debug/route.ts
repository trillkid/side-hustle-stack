import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

export async function GET() {
  const url = process.env.DATABASE_URL
  const token = process.env.DATABASE_AUTH_TOKEN

  let libsqlTest: string
  try {
    const client = createClient({ url: url!, authToken: token })
    const result = await client.execute("SELECT COUNT(*) as count FROM FreelanceService")
    libsqlTest = `SUCCESS - ${JSON.stringify(result.rows)}`
  } catch (e) {
    libsqlTest = `FAILED - ${e instanceof Error ? e.message : 'unknown'}`
  }

  let prismaTest: string
  try {
    const libsql = createClient({ url: url!, authToken: token })
    const adapter = new PrismaLibSql(libsql)
    const prisma = new PrismaClient({ adapter })
    const count = await prisma.freelanceService.count()
    prismaTest = `SUCCESS - found ${count} services`
    await prisma.$disconnect()
  } catch (e) {
    prismaTest = `FAILED - ${e instanceof Error ? e.message : 'unknown'}`
  }

  return NextResponse.json({ urlSet: !!url, libsqlTest, prismaTest })
}
