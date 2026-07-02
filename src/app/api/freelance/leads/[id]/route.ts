import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ALLOWED_STATUSES = new Set(['new', 'contacted', 'won', 'lost'])

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (typeof body.status !== 'string' || !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json(
        {
          error: 'Status must be one of: new, contacted, won, lost',
        },
        { status: 400 }
      )
    }

    const existing = await db.freelanceLead.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const updated = await db.freelanceLead.update({
      where: { id },
      data: { status: body.status },
      include: { service: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[freelance/leads PATCH]', err)
    return NextResponse.json(
      { error: 'Failed to update lead' },
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

    const existing = await db.freelanceLead.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    await db.freelanceLead.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[freelance/leads DELETE]', err)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
