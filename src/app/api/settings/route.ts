import { NextResponse } from 'next/server'
import { getSettings, updateSettings, maskSecret } from '@/lib/settings'

// GET — returns settings (secrets masked) so the UI can show connection status
export async function GET() {
  const s = await getSettings()
  return NextResponse.json({
    siteName: s.siteName,
    notificationEmail: s.notificationEmail,
    amazonAffiliateTag: s.amazonAffiliateTag,
    // NEVER send the secret key to the client. Send a masked version + a boolean.
    stripePublishableKey: s.stripePublishableKey, // publishable is safe to expose
    stripeSecretKeyMasked: maskSecret(s.stripeSecretKey),
    stripeConnected: !!s.stripeSecretKey && !!s.stripePublishableKey,
    amazonConnected: !!s.amazonAffiliateTag,
  })
}

// POST — save settings. Accepts all fields; empty strings clear them.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  const input: Parameters<typeof updateSettings>[0] = {}

  if (typeof body.siteName === 'string') input.siteName = body.siteName
  if (typeof body.notificationEmail === 'string')
    input.notificationEmail = body.notificationEmail || null

  if (typeof body.amazonAffiliateTag === 'string') {
    // Normalize: strip whitespace, strip any "?tag=" prefix the user might paste
    let tag = body.amazonAffiliateTag.trim()
    if (tag.startsWith('tag=')) tag = tag.slice(4)
    input.amazonAffiliateTag = tag || null
  }

  if (typeof body.stripePublishableKey === 'string') {
    input.stripePublishableKey = body.stripePublishableKey.trim() || null
  }

  if (typeof body.stripeSecretKey === 'string') {
    // Only update if the user actually typed a new key (not the masked placeholder)
    const val = body.stripeSecretKey.trim()
    if (val && val.startsWith('sk_')) {
      input.stripeSecretKey = val
    } else if (val === '') {
      input.stripeSecretKey = null // explicit clear
    }
    // If val is the masked placeholder (••••...), do nothing — keep existing
  }

  // Validate Stripe key pair if either is being set
  if (
    (input.stripePublishableKey && !input.stripeSecretKey) ||
    (input.stripeSecretKey && !input.stripePublishableKey)
  ) {
    // Allow partial save but warn
    const saved = await updateSettings(input)
    return NextResponse.json(
      {
        ok: true,
        warning:
          'Stripe needs BOTH a publishable key and a secret key to work. Add the missing one.',
        settings: {
          stripeConnected:
            !!saved.stripePublishableKey && !!saved.stripeSecretKey,
        },
      },
      { status: 200 }
    )
  }

  // Validate email format if provided
  if (input.notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.notificationEmail)) {
    return NextResponse.json(
      { error: 'Notification email looks invalid.' },
      { status: 400 }
    )
  }

  await updateSettings(input)
  return NextResponse.json({ ok: true })
}
