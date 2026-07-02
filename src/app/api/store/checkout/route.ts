import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { getSettings } from '@/lib/settings'

// POST — create a real Stripe Checkout Session for the cart.
// Body: { customerName, email, items: [{ productId, qty }] }
// Returns: { url } to redirect to, OR { mock: true, orderId } if Stripe isn't configured.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { customerName, email, items } = body as {
    customerName?: string
    email?: string
    items?: { productId: string; qty: number }[]
  }

  if (!customerName || !email || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Missing customer name, email, or items.' },
      { status: 400 }
    )
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'A valid email is required.' },
      { status: 400 }
    )
  }

  // Look up real product prices from DB (never trust client prices)
  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  })

  const lineItems = []
  let totalCents = 0
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product) continue
    const qty = Math.max(1, Math.min(99, Number(item.qty) || 1))
    const unitCents = Math.round(product.price * 100)
    totalCents += unitCents * qty
    lineItems.push({
      price_data: {
        currency: 'cad',
        product_data: {
          name: product.name,
          description: product.description.slice(0, 200),
        },
        unit_amount: unitCents,
      },
      quantity: qty,
    })
  }

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: 'No valid products in cart.' },
      { status: 400 }
    )
  }

  const stripe = await getStripe()
  const settings = await getSettings()

  // ----- MOCK MODE (Stripe not configured) -----
  if (!stripe || !settings.stripePublishableKey) {
    const order = await db.storeOrder.create({
      data: {
        customerName,
        email,
        total: totalCents / 100,
        itemsJson: JSON.stringify(
          lineItems.map((li) => ({
            name: li.price_data.product_data.name,
            qty: li.quantity,
            unit: li.price_data.unit_amount / 100,
          }))
        ),
        status: 'mock',
        stripeSessionId: null,
      },
    })
    return NextResponse.json({
      mock: true,
      orderId: order.id,
      message:
        'Stripe is not connected yet, so this was a mock order. Connect Stripe in Settings to accept real payments.',
    })
  }

  // ----- REAL STRIPE MODE -----
  try {
    const origin =
      req.headers.get('origin') ||
      req.headers.get('x-forwarded-host') ||
      'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      success_url: `${origin}/?stripe_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?stripe_cancel=1`,
      metadata: {
        customerName,
        email,
        // store the cart so the webhook/confirm endpoint can rebuild the order
        itemsJson: JSON.stringify(
          lineItems.map((li) => ({
            name: li.price_data.product_data.name,
            qty: li.quantity,
            unit: li.price_data.unit_amount / 100,
          }))
        ),
      },
    })

    return NextResponse.json({
      mock: false,
      url: session.url,
      sessionId: session.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
