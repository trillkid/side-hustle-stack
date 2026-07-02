import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Whitelist of allowed icon names (mapped on the client to lucide icons)
const ALLOWED_ICONS = new Set([
  'Briefcase',
  'Globe',
  'Palette',
  'PenLine',
  'Code2',
])

function normalizeIcon(icon: unknown): string {
  if (typeof icon === 'string' && ALLOWED_ICONS.has(icon)) return icon
  return 'Briefcase'
}

export async function GET() {
  try {
    const services = await db.freelanceService.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { leads: true } },
      },
    })
    return NextResponse.json(services)
  } catch (err) {
    console.error('[freelance/services GET]', err)
    return NextResponse.json(
      { error: 'Failed to load services' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description =
      typeof body.description === 'string' ? body.description.trim() : ''
    const priceNum = Number(body.price)
    const category =
      typeof body.category === 'string' ? body.category.trim() : ''

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: 'Price must be a non-negative number' },
        { status: 400 }
      )
    }

    const service = await db.freelanceService.create({
      data: {
        title,
        description,
        price: priceNum,
        category,
        icon: normalizeIcon(body.icon),
        active: true,
      },
      include: { _count: { select: { leads: true } } },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (err) {
    console.error('[freelance/services POST]', err)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
