import { NextResponse } from 'next/server'
import { db, dbClient } from '@/lib/db'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function randomSuffix(len = 8): string {
  // cuid-like short suffix for uniqueness
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export async function GET() {
  try {
    const articles = await db.reviewArticle.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Manually compute click counts per article (libsql doesn't support
    // Prisma's _count include). Fetch all click counts in one query.
    const articleIds = articles.map((a: { id: string }) => a.id)
    let clickCounts: Map<string, number> = new Map()
    if (articleIds.length > 0) {
      const result = await dbClient.execute({
        sql: `SELECT articleId, COUNT(*) as cnt FROM AffiliateClick WHERE articleId IN (${articleIds.map(() => '?').join(',')}) GROUP BY articleId`,
        args: articleIds,
      })
      for (const row of result.rows) {
        clickCounts.set(row.articleId as string, Number(row.cnt))
      }
    }

    // Attach _count.clicks to each article (Prisma-compatible shape)
    const articlesWithCounts = articles.map((a: { id: string }) => ({
      ...a,
      _count: { clicks: clickCounts.get(a.id) ?? 0 },
    }))

    return NextResponse.json({ articles: articlesWithCounts })
  } catch (err) {
    console.error('[affiliate/articles GET]', err)
    return NextResponse.json(
      { error: 'Failed to load articles' },
      { status: 500 }
    )
  }
}

type CreateBody = {
  title?: string
  excerpt?: string
  content?: string
  category?: string
  rating?: number
  imageUrl?: string
  affiliateUrl?: string
  productName?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody

    const title = body.title?.trim()
    const excerpt = body.excerpt?.trim()
    const content = body.content?.trim()
    const category = body.category?.trim()
    const imageUrl = body.imageUrl?.trim()
    const affiliateUrl = body.affiliateUrl?.trim()
    const productName = body.productName?.trim()
    const rating = Number(body.rating)

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!excerpt) {
      return NextResponse.json({ error: 'Excerpt is required' }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }
    if (!affiliateUrl) {
      return NextResponse.json(
        { error: 'Affiliate URL is required' },
        { status: 400 }
      )
    }
    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      )
    }

    const base = slugify(title) || 'review'
    const slug = `${base}-${randomSuffix(8)}`

    const article = await db.reviewArticle.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        category,
        rating,
        imageUrl,
        affiliateUrl,
        productName,
      },
    })

    // Attach _count.clicks: 0 for Prisma-compatible shape (new article)
    const articleWithCount = { ...article, _count: { clicks: 0 } }

    return NextResponse.json({ article: articleWithCount }, { status: 201 })
  } catch (err) {
    console.error('[affiliate/articles POST]', err)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}
