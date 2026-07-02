'use client'

import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  CreditCard,
  Tag,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'

type SettingsState = {
  siteName: string
  notificationEmail: string
  amazonAffiliateTag: string
  stripePublishableKey: string
  stripeSecretKeyMasked: string
  stripeConnected: boolean
  amazonConnected: boolean
}

type RealEarnings = {
  configured: boolean
  available: number | null
  pending: number | null
  total: number | null
  currency?: string
  lastUpdated?: string
  error?: string
  message?: string
}

export default function SettingsModule() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<SettingsState | null>(null)
  const [earnings, setEarnings] = useState<RealEarnings | null>(null)
  const [earningsLoading, setEarningsLoading] = useState(true)

  // form state
  const [siteName, setSiteName] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [amazonTag, setAmazonTag] = useState('')
  const [stripePk, setStripePk] = useState('')
  const [stripeSk, setStripeSk] = useState('') // shows masked; user types new to replace
  const [showSk, setShowSk] = useState(false)

  async function fetchSettings() {
    setLoading(true)
    try {
      const r = await fetch('/api/settings', { cache: 'no-store' })
      const d = (await r.json()) as SettingsState
      setData(d)
      setSiteName(d.siteName)
      setNotificationEmail(d.notificationEmail ?? '')
      setAmazonTag(d.amazonAffiliateTag ?? '')
      setStripePk(d.stripePublishableKey ?? '')
      setStripeSk('') // never pre-fill the secret; user types if changing
    } finally {
      setLoading(false)
    }
  }

  async function fetchEarnings() {
    setEarningsLoading(true)
    try {
      const r = await fetch('/api/earnings/real', { cache: 'no-store' })
      const d = (await r.json()) as RealEarnings
      setEarnings(d)
    } finally {
      setEarningsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchEarnings()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, string> = {
        siteName,
        notificationEmail,
        amazonAffiliateTag: amazonTag,
        stripePublishableKey: stripePk,
      }
      // Only send secret key if the user typed a new one
      if (stripeSk) body.stripeSecretKey = stripeSk

      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) {
        throw new Error(d?.error ?? 'Failed to save')
      }
      toast({
        title: 'Settings saved',
        description: d.warning
          ? d.warning
          : 'Your changes are live.',
      })
      setStripeSk('')
      await fetchSettings()
      await fetchEarnings()
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#64748b1a', color: '#64748b' }}
            >
              <SettingsIcon className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect real services to turn this from a demo into a real business.
          </p>
        </div>
      </div>

      {/* Real earnings card */}
      <Card className="border-2 border-emerald-500/40 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Real Stripe balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {earningsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !earnings?.configured ? (
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {earnings?.message ?? 'Stripe not connected.'}
              </p>
            </div>
          ) : earnings.error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Couldn&apos;t reach Stripe</AlertTitle>
              <AlertDescription>{earnings.error}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(earnings.available ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(earnings.pending ?? 0)}
                </p>
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEarnings}
                  disabled={earningsLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            This is your <strong>actual</strong> Stripe balance. Withdraw it
            directly from your Stripe dashboard → Payouts. We never hold your
            money.
          </p>
        </CardContent>
      </Card>

      {/* Stripe section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Stripe (real card payments)
            </span>
            {data.stripeConnected ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge className="bg-zinc-500/15 text-zinc-700 dark:text-zinc-300">
                <XCircle className="mr-1 h-3 w-3" /> Not connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect Stripe so the Store can accept real card payments. Money
            goes straight to your Stripe account — withdraw anytime from your
            Stripe dashboard.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="stripe-pk" className="text-xs">
              Publishable key (starts with pk_)
            </Label>
            <Input
              id="stripe-pk"
              value={stripePk}
              onChange={(e) => setStripePk(e.target.value)}
              placeholder="pk_test_... or pk_live_..."
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripe-sk" className="text-xs">
              Secret key (starts with sk_)
              {data.stripeSecretKeyMasked && (
                <span className="ml-2 text-muted-foreground">
                  Current: {data.stripeSecretKeyMasked}
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                id="stripe-sk"
                type={showSk ? 'text' : 'password'}
                value={stripeSk}
                onChange={(e) => setStripeSk(e.target.value)}
                placeholder={
                  data.stripeSecretKeyMasked
                    ? '•••••••• (type a new key to replace)'
                    : 'sk_test_... or sk_live_...'
                }
                className="font-mono text-xs"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowSk(!showSk)}
                aria-label={showSk ? 'Hide key' : 'Show key'}
              >
                {showSk ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Don&apos;t have a Stripe account yet?{' '}
              <a
                href="https://dashboard.stripe.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-0.5"
              >
                Create one free <ExternalLink className="h-3 w-3" />
              </a>
              . Start in <strong>Test Mode</strong> (top-right toggle) and use
              test keys (<span className="font-mono">pk_test_…</span> /{' '}
              <span className="font-mono">sk_test_…</span>) to verify everything
              works before going live.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Amazon Associates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Amazon Associates tag
            </span>
            {data.amazonConnected ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge className="bg-zinc-500/15 text-zinc-700 dark:text-zinc-300">
                <XCircle className="mr-1 h-3 w-3" /> Not connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your affiliate tag is automatically appended to every affiliate
            link in the Affiliate tab, so Amazon credits you for any purchases.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="amazon-tag" className="text-xs">
              Affiliate tag (e.g. yourname-20)
            </Label>
            <Input
              id="amazon-tag"
              value={amazonTag}
              onChange={(e) => setAmazonTag(e.target.value)}
              placeholder="yourname-20"
              className="font-mono text-xs"
            />
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Don&apos;t have an Amazon Associates account?{' '}
              <a
                href="https://affiliate-program.amazon.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-0.5"
              >
                Sign up free <ExternalLink className="h-3 w-3" />
              </a>
              . You&apos;ll get a unique tag during signup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="site-name" className="text-xs">
              Site name
            </Label>
            <Input
              id="site-name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notif-email" className="text-xs">
              Notification email (optional — for new-lead alerts in a future update)
            </Label>
            <Input
              id="notif-email"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-emerald-600 text-white shadow-lg hover:bg-emerald-600/90"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save settings
        </Button>
      </div>
    </div>
  )
}
