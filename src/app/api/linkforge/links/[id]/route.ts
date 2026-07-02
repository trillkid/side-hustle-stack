import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH — update label/url/order for a specific link.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { label, url, order } = body as {
      label?: string
      url?: string
      order?: number
    }

    const existing = await db.linkItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (typeof label === 'string' && label.trim()) data.label = label.trim()
    if (typeof url === 'string' && url.trim()) data.url = url.trim()
    if (typeof order === 'number' && Number.isFinite(order)) data.order = order

    if (Object.keys(data).length === 0) {
      return NextResponse.json({
        id: existing.id,
        label: existing.label,
        url: existing.url,
        clicks: existing.clicks,
        order: existing.order,
      })
    }

    const updated = await db.linkItem.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: updated.id,
      label: updated.label,
      url: updated.url,
      clicks: updated.clicks,
      order: updated.order,
    })
  } catch (err) {
    console.error('[linkforge/links/[id] PATCH]', err)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
  }
}

// DELETE — remove a link.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.linkItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    await db.linkItem.delete({ where: { id } })

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('[linkforge/links/[id] DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}
