import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Stripe webhook — verifies the signature, records paid orders.
// To use in production: point a Stripe webhook endpoint at this URL
// (https://yourdomain.com/api/store/webhook) and set the STRIPE_WEBHOOK_SECRET
// env var to the signing secret Stripe gives you.
//
// For local dev, you can skip this — the /api/store/confirm-order endpoint
// handles success via the redirect URL.

export async function POST(req: Request) {
  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 400 }
    )
  }

  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event
  const rawBody = await req.text()

  if (webhookSecret && sig) {
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        sig,
        webhookSecret
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bad signature'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  } else {
    // No webhook secret configured — parse the body as an unsigned event
    // (only acceptable in dev; in production always set the secret)
    try {
      event = JSON.parse(rawBody) as Stripe.Event
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status === 'paid') {
      // Idempotency: skip if we already have this order
      const existing = await db.storeOrder.findFirst({
        where: { stripeSessionId: session.id },
      })
      if (!existing) {
        await db.storeOrder.create({
          data: {
            customerName:
              (session.metadata?.customerName as string) ||
              session.customer_details?.name ||
              'Customer',
            email:
              (session.metadata?.email as string) ||
              session.customer_details?.email ||
              '',
            total: (session.amount_total ?? 0) / 100,
            itemsJson: session.metadata?.itemsJson || '[]',
            status: 'paid',
            stripeSessionId: session.id,
          },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
