import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'] as const
type Status = (typeof STATUSES)[number]

export async function GET() {
  try {
    const applications = await db.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(applications)
  } catch (error) {
    console.error('[jobs/applications GET]', error)
    return NextResponse.json(
      { error: 'Failed to load applications' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const company = String(body.company ?? '').trim()
    const role = String(body.role ?? '').trim()
    if (!company || !role) {
      return NextResponse.json(
        { error: 'Company and role are required' },
        { status: 400 }
      )
    }

    let status: Status = 'wishlist'
    const incoming = String(body.status ?? '').trim()
    if ((STATUSES as readonly string[]).includes(incoming)) {
      status = incoming as Status
    }

    const salary = body.salary ? String(body.salary).trim() : null
    const link = body.link ? String(body.link).trim() : null
    const notes = body.notes ? String(body.notes).trim() : null

    let appliedDate: Date | null = null
    if (body.appliedDate) {
      const parsed = new Date(body.appliedDate)
      if (!Number.isNaN(parsed.getTime())) {
        appliedDate = parsed
      }
    }

    const created = await db.jobApplication.create({
      data: {
        company,
        role,
        status,
        salary,
        link,
        notes,
        appliedDate,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('[jobs/applications POST]', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
