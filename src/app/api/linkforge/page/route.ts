import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — return the first LinkPage with its links (ordered) and aggregate clicks.
export async function GET() {
  try {
    const page = await db.linkPage.findFirst({
      orderBy: { createdAt: 'asc' },
      include: {
        links: { orderBy: { order: 'asc' } },
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'No LinkPage found' },
        { status: 404 }
      )
    }

    const totalClicks = page.links.reduce((sum, l) => sum + l.clicks, 0)

    return NextResponse.json({
      id: page.id,
      slug: page.slug,
      title: page.title,
      bio: page.bio,
      themeColor: page.themeColor,
      plan: page.plan,
      createdAt: page.createdAt,
      links: page.links.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        clicks: l.clicks,
        order: l.order,
      })),
      totalClicks,
    })
  } catch (err) {
    console.error('[linkforge/page GET]', err)
    return NextResponse.json(
      { error: 'Failed to load page' },
      { status: 500 }
    )
  }
}

// PATCH — update title/bio/themeColor/plan on the first LinkPage.
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { title, bio, themeColor, plan } = body as {
      title?: string
      bio?: string
      themeColor?: string
      plan?: string
    }

    const page = await db.linkPage.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!page) {
      return NextResponse.json(
        { error: 'No LinkPage found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    if (typeof title === 'string' && title.trim().length > 0) data.title = title.trim()
    if (typeof bio === 'string') data.bio = bio
    if (typeof themeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(themeColor)) {
      data.themeColor = themeColor
    }
    if (plan === 'free' || plan === 'pro') data.plan = plan

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: true, page: { ...page, links: [] } })
    }

    const updated = await db.linkPage.update({
      where: { id: page.id },
      data,
      include: { links: { orderBy: { order: 'asc' } } },
    })

    const totalClicks = updated.links.reduce((s, l) => s + l.clicks, 0)

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      bio: updated.bio,
      themeColor: updated.themeColor,
      plan: updated.plan,
      createdAt: updated.createdAt,
      links: updated.links.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        clicks: l.clicks,
        order: l.order,
      })),
      totalClicks,
    })
  } catch (err) {
    console.error('[linkforge/page PATCH]', err)
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
}
