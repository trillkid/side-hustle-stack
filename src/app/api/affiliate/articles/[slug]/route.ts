import { NextResponse } from 'next/server'
import { db, dbClient } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const article = await db.reviewArticle.findUnique({
      where: { slug },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Manually compute click count (libsql doesn't support _count)
    const clickResult = await dbClient.execute({
      sql: 'SELECT COUNT(*) as cnt FROM AffiliateClick WHERE articleId = ?',
      args: [article.id],
    })
    const clickCount = Number(clickResult.rows[0]?.cnt ?? 0)

    const articleWithCount = { ...article, _count: { clicks: clickCount } }

    return NextResponse.json({ article: articleWithCount })
  } catch (err) {
    console.error('[affiliate/articles/[slug] GET]', err)
    return NextResponse.json(
      { error: 'Failed to load article' },
      { status: 500 }
    )
  }
}
