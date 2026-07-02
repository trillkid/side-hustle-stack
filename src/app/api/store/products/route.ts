import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where = category && category !== 'All' ? { category } : undefined
    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ products })
  } catch (error) {
    console.error('[store/products GET]', error)
    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, image, category } = body ?? {}

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof description !== 'string' ||
      typeof price !== 'number' ||
      Number.isNaN(price) ||
      price < 0 ||
      typeof category !== 'string' ||
      !category.trim()
    ) {
      return NextResponse.json(
        { error: 'Invalid product fields' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price,
        image: typeof image === 'string' ? image.trim() : '',
        category: category.trim(),
      },
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('[store/products POST]', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
