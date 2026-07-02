import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const projects = await db.portfolioProject.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('[jobs/portfolio GET]', error)
    return NextResponse.json(
      { error: 'Failed to load portfolio' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim()
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const url = body.url ? String(body.url).trim() : null
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null
    const tags = body.tags ? String(body.tags).trim() : ''

    const created = await db.portfolioProject.create({
      data: { title, description, url, imageUrl, tags },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('[jobs/portfolio POST]', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
