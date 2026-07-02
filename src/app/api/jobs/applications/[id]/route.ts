import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'] as const

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.jobApplication.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}

    if (typeof body.company === 'string') {
      const company = body.company.trim()
      if (!company) {
        return NextResponse.json(
          { error: 'Company cannot be empty' },
          { status: 400 }
        )
      }
      data.company = company
    }

    if (typeof body.role === 'string') {
      const role = body.role.trim()
      if (!role) {
        return NextResponse.json(
          { error: 'Role cannot be empty' },
          { status: 400 }
        )
      }
      data.role = role
    }

    if (typeof body.status === 'string') {
      const status = body.status.trim()
      if (!(STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      data.status = status
    }

    if (body.salary !== undefined) {
      data.salary = body.salary ? String(body.salary).trim() : null
    }

    if (body.link !== undefined) {
      data.link = body.link ? String(body.link).trim() : null
    }

    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes).trim() : null
    }

    if (body.appliedDate !== undefined) {
      if (body.appliedDate === null || body.appliedDate === '') {
        data.appliedDate = null
      } else {
        const parsed = new Date(body.appliedDate)
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: 'Invalid appliedDate' },
            { status: 400 }
          )
        }
        data.appliedDate = parsed
      }
    }

    const updated = await db.jobApplication.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[jobs/applications PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.jobApplication.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }
    await db.jobApplication.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[jobs/applications DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}
