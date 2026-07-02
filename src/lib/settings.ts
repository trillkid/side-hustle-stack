import { db } from './db'

export type Settings = {
  stripePublishableKey: string | null
  stripeSecretKey: string | null
  amazonAffiliateTag: string | null
  notificationEmail: string | null
  siteName: string
}

/**
 * Returns the single row of app settings (creating it if missing).
 */
export async function getSettings(): Promise<Settings> {
  const row = await db.appSettings.findUnique({ where: { id: 'singleton' } })
  if (!row) {
    const created = await db.appSettings.create({ data: { id: 'singleton' } })
    return {
      stripePublishableKey: null,
      stripeSecretKey: null,
      amazonAffiliateTag: null,
      notificationEmail: null,
      siteName: created.siteName,
    }
  }
  return {
    stripePublishableKey: row.stripePublishableKey,
    stripeSecretKey: row.stripeSecretKey,
    amazonAffiliateTag: row.amazonAffiliateTag,
    notificationEmail: row.notificationEmail,
    siteName: row.siteName,
  }
}

export async function updateSettings(input: Partial<Settings>): Promise<Settings> {
  const data: Record<string, string | null> = {}
  if (input.stripePublishableKey !== undefined)
    data.stripePublishableKey = input.stripePublishableKey || null
  if (input.stripeSecretKey !== undefined)
    data.stripeSecretKey = input.stripeSecretKey || null
  if (input.amazonAffiliateTag !== undefined)
    data.amazonAffiliateTag = input.amazonAffiliateTag || null
  if (input.notificationEmail !== undefined)
    data.notificationEmail = input.notificationEmail || null
  if (input.siteName !== undefined) data.siteName = input.siteName

  await db.appSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  })
  return getSettings()
}

/** Mask a secret for display: show only last 4 chars. */
export function maskSecret(value: string | null): string {
  if (!value) return ''
  if (value.length <= 8) return '••••'
  return '••••••••' + value.slice(-4)
}

/** Inject the Amazon affiliate tag into an affiliate URL. */
export function withAffiliateTag(
  url: string,
  tag: string | null
): string {
  if (!tag || !url) return url
  try {
    const u = new URL(url)
    // Amazon expects the tag as ?tag=your-tag
    u.searchParams.set('tag', tag)
    return u.toString()
  } catch {
    // If URL parsing fails, just append it
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}tag=${encodeURIComponent(tag)}`
  }
}
