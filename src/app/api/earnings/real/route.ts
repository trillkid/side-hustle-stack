import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

// GET — returns the REAL Stripe balance (available + pending) in CAD.
// Returns { configured: false } if Stripe isn't set up yet.
export async function GET() {
  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({
      configured: false,
      available: null,
      pending: null,
      message: 'Stripe not connected. Add your keys in Settings.',
    })
  }

  try {
    const balance = await stripe.balance.retrieve()

    // Stripe returns amounts in cents + per-currency arrays. We sum CAD (and
    // fall back to the first currency if CAD isn't present).
    const pickCurrency = (arr: { currency: string; amount: number }[]) => {
      const cad = arr.find((a) => a.currency === 'cad')
      if (cad) return cad.amount
      return arr[0]?.amount ?? 0
    }

    const available = pickCurrency(balance.available) / 100
    const pending = pickCurrency(balance.pending) / 100

    return NextResponse.json({
      configured: true,
      available,
      pending,
      total: available + pending,
      currency: 'CAD',
      lastUpdated: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe API error'
    return NextResponse.json(
      { configured: true, error: message, available: null, pending: null },
      { status: 200 } // 200 so the UI can show the error message gracefully
    )
  }
}
