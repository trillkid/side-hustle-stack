import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSettings, withAffiliateTag } from '@/lib/settings'

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

    // If the user has an Amazon Associates tag configured, inject it so
    // the click is attributed to their account and they earn commission.
    const settings = await getSettings()
    const finalUrl = withAffiliateTag(
      article.affiliateUrl,
      settings.amazonAffiliateTag
    )

    return NextResponse.json({ url: finalUrl })
  } catch (err) {
    console.error('[affiliate/clicks POST]', err)
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    )
  }
}
