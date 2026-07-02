import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type ClickBody = { articleId?: string }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ClickBody
    const articleId = body.articleId?.trim()

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      )
    }

    const article = await db.reviewArticle.findUnique({
      where: { id: articleId },
      select: { id: true, affiliateUrl: true },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    await db.affiliateClick.create({
      data: { articleId: article.id },
    })

    return NextResponse.json({ url: article.affiliateUrl })
  } catch (err) {
    console.error('[affiliate/clicks POST]', err)
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    )
  }
}
