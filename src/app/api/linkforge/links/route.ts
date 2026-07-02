import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list links for the first page, ordered by `order` asc.
export async function GET() {
  try {
    const page = await db.linkPage.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!page) {
      return NextResponse.json({ links: [], totalClicks: 0 })
    }

    const links = await db.linkItem.findMany({
      where: { pageId: page.id },
      orderBy: { order: 'asc' },
    })

    const totalClicks = links.reduce((s, l) => s + l.clicks, 0)

    return NextResponse.json({
      links: links.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        clicks: l.clicks,
        order: l.order,
      })),
      totalClicks,
    })
  } catch (err) {
    console.error('[linkforge/links GET]', err)
    return NextResponse.json({ error: 'Failed to load links' }, { status: 500 })
  }
}

// POST — create a new link. order = max existing order + 1.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { label, url } = body as { label?: string; url?: string }

    if (!label || typeof label !== 'string' || !label.trim()) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const page = await db.linkPage.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!page) {
      return NextResponse.json({ error: 'No LinkPage found' }, { status: 404 })
    }

    const existing = await db.linkItem.findMany({
      where: { pageId: page.id },
      select: { order: true },
    })
    const nextOrder = existing.length ? Math.max(...existing.map((l) => l.order)) + 1 : 0

    const created = await db.linkItem.create({
      data: {
        pageId: page.id,
        label: label.trim(),
        url: url.trim(),
        order: nextOrder,
      },
    })

    return NextResponse.json({
      id: created.id,
      label: created.label,
      url: created.url,
      clicks: created.clicks,
      order: created.order,
    })
  } catch (err) {
    console.error('[linkforge/links POST]', err)
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}
