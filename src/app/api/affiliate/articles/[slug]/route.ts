import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const article = await db.reviewArticle.findUnique({
      where: { slug },
      include: { _count: { select: { clicks: true } } },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ article })
  } catch (err) {
    console.error('[affiliate/articles/[slug] GET]', err)
    return NextResponse.json(
      { error: 'Failed to load article' },
      { status: 500 }
    )
  }
}
