import Stripe from 'stripe'
import { getSettings } from './settings'

/**
 * Returns a Stripe SDK instance configured with the stored secret key,
 * or null if Stripe is not yet configured.
 */
export async function getStripe(): Promise<Stripe | null> {
  const settings = await getSettings()
  if (!settings.stripeSecretKey) return null
  return new Stripe(settings.stripeSecretKey, {
    apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion,
    typescript: true,
  })
}

export function isStripeConfiguredSync(settings: {
  stripeSecretKey: string | null
}): boolean {
  return !!settings.stripeSecretKey
}
