import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

// GET — confirm a Stripe Checkout session by ID, mark the order paid, store it.
// Used by the success redirect (no webhook required for basic flow).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id.' },
      { status: 400 }
    )
  }

  // Check if we already recorded this order (idempotency)
  const existing = await db.storeOrder.findFirst({
    where: { stripeSessionId: sessionId },
  })
  if (existing) {
    return NextResponse.json({ order: existing, alreadyExisted: true })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured.' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed yet.', status: session.payment_status },
        { status: 400 }
      )
    }

    const customerName =
      (session.metadata?.customerName as string) ||
      session.customer_details?.name ||
      'Customer'
    const email =
      (session.metadata?.email as string) ||
      session.customer_details?.email ||
      ''
    const itemsJson = session.metadata?.itemsJson || '[]'

    // Compute total from session (authoritative from Stripe)
    const total =
      (session.amount_total ?? 0) / 100

    const order = await db.storeOrder.create({
      data: {
        customerName,
        email,
        total,
        itemsJson,
        status: 'paid',
        stripeSessionId: sessionId,
      },
    })

    return NextResponse.json({ order, alreadyExisted: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
