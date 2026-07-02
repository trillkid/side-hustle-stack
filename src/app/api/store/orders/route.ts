import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type OrderItemInput = {
  productId?: string
  name?: string
  price?: number
  qty?: number
}

export async function GET() {
  try {
    const orders = await db.storeOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[store/orders GET]', error)
    return NextResponse.json(
      { error: 'Failed to load orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, email, items } = body ?? {}

    if (
      typeof customerName !== 'string' ||
      !customerName.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing customer info or items' },
        { status: 400 }
      )
    }

    // Re-validate every cart line against current DB prices to prevent
    // client-side tampering. Unknown products are dropped.
    const safeItems: OrderItemInput[] = items
      .filter(
        (i: unknown): i is OrderItemInput =>
          !!i && typeof i === 'object' && 'productId' in (i as object)
      )
      .map((i) => ({
        productId: String((i as OrderItemInput).productId),
        name: String((i as OrderItemInput).name ?? ''),
        price: Number((i as OrderItemInput).price ?? 0),
        qty: Math.max(1, Math.floor(Number((i as OrderItemInput).qty ?? 1)) || 1),
      }))

    if (safeItems.length === 0) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 })
    }

    const productIds = safeItems.map((i) => i.productId)
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    })
    const priceMap = new Map(dbProducts.map((p) => [p.id, p]))

    const resolvedItems = safeItems
      .filter((i) => priceMap.has(i.productId))
      .map((i) => {
        const p = priceMap.get(i.productId)!
        return {
          productId: i.productId,
          name: p.name,
          price: p.price,
          qty: i.qty,
        }
      })

    if (resolvedItems.length === 0) {
      return NextResponse.json(
        { error: 'No matching products found' },
        { status: 400 }
      )
    }

    const total = resolvedItems.reduce((sum, i) => sum + i.price * i.qty, 0)

    const order = await db.storeOrder.create({
      data: {
        customerName: customerName.trim(),
        email: email.trim(),
        total,
        itemsJson: JSON.stringify(resolvedItems),
        status: 'paid',
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('[store/orders POST]', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
