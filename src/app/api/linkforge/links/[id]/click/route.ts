import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST — increment clicks on a link and return its URL.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.linkItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const updated = await db.linkItem.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      select: { url: true, clicks: true },
    })

    return NextResponse.json({ url: updated.url, clicks: updated.clicks })
  } catch (err) {
    console.error('[linkforge/links/[id]/click POST]', err)
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    )
  }
}
