import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.portfolioProject.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (!title) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      data.title = title
    }

    if (typeof body.description === 'string') {
      const description = body.description.trim()
      if (!description) {
        return NextResponse.json(
          { error: 'Description cannot be empty' },
          { status: 400 }
        )
      }
      data.description = description
    }

    if (body.url !== undefined) {
      data.url = body.url ? String(body.url).trim() : null
    }

    if (body.imageUrl !== undefined) {
      data.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null
    }

    if (body.tags !== undefined) {
      data.tags = body.tags ? String(body.tags).trim() : ''
    }

    const updated = await db.portfolioProject.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[jobs/portfolio PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.portfolioProject.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    await db.portfolioProject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[jobs/portfolio DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
