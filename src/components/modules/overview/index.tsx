'use client'

import { useEffect, useState } from 'react'
import {
  Briefcase,
  ShoppingBag,
  Link2,
  PenTool,
  TrendingUp,
  Users,
  MousePointerClick,
  FileText,
  Trophy,
  DollarSign,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'

type Overview = {
  counts: {
    services: number
    leads: number
    newLeads: number
    wonLeads: number
    products: number
    orders: number
    articles: number
    affiliateClicks: number
    linkPages: number
    totalLinkClicks: number
    applications: number
    interviewCount: number
    offerCount: number
    portfolio: number
  }
  earnings: {
    storeRevenue: number
    freelanceProjected: number
    storeProjected: number
    affiliateProjected: number
    linkforgeProjected: number
    total: number
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  hint?: string
  accent: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight truncate">
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type RealEarnings = {
  configured: boolean
  available: number | null
  pending: number | null
  total: number | null
  error?: string
  message?: string
}

export default function Overview() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [real, setReal] = useState<RealEarnings | null>(null)
  const [realLoading, setRealLoading] = useState(true)

  const fetchReal = () => {
    setRealLoading(true)
    fetch('/api/earnings/real', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setReal(d as RealEarnings))
      .finally(() => setRealLoading(false))
  }

  useEffect(() => {
    let alive = true
    fetch('/api/overview')
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .finally(() => alive && setLoading(false))

    // Fetch real Stripe balance. realLoading already defaults to true,
    // so no synchronous setState is needed here.
    fetch('/api/earnings/real', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setReal(d as RealEarnings)
      })
      .finally(() => alive && setRealLoading(false))

    return () => {
      alive = false
    }
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  // Only store revenue is "real" — and even that is mock until Stripe is connected.
  const totalEstimated = data.earnings.total

  const earningsBars = [
    {
      label: 'Store orders (mock — no Stripe)',
      value: data.earnings.storeProjected,
      color: '#f59e0b',
      real: false,
    },
    {
      label: 'Affiliate clicks (estimate)',
      value: data.earnings.affiliateProjected,
      color: '#ef4444',
      real: false,
    },
    {
      label: 'LinkForge Pro (no billing)',
      value: data.earnings.linkforgeProjected,
      color: '#8b5cf6',
      real: false,
    },
    {
      label: 'Freelance (won × est. avg)',
      value: data.earnings.freelanceProjected,
      color: '#10b981',
      real: false,
    },
  ]
  const maxBar = Math.max(...earningsBars.map((b) => b.value), 1)

  return (
    <div className="space-y-6">
      {/* REAL balance card — pulls live from Stripe when configured */}
      <Card className="border-2 border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <p className="text-sm font-medium">
                  Real, withdrawable balance (Stripe)
                </p>
                {real?.configured && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={fetchReal}
                    disabled={realLoading}
                    aria-label="Refresh balance"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${realLoading ? 'animate-spin' : ''}`}
                    />
                  </Button>
                )}
              </div>
              {realLoading ? (
                <Skeleton className="mt-2 h-10 w-40" />
              ) : !real?.configured ? (
                <>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(0)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stripe is not connected yet. Go to{' '}
                    <strong>Settings</strong> to add your Stripe keys — then
                    this shows your <em>actual</em> balance, live.
                  </p>
                </>
              ) : real.error ? (
                <>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">
                    Couldn&apos;t load
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {real.error}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(real.available ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Available to withdraw now.{' '}
                    {real.pending && real.pending > 0
                      ? `${formatCurrency(real.pending)} pending. `
                      : ''}
                    Withdraw from your{' '}
                    <a
                      href="https://dashboard.stripe.com/payouts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline inline-flex items-center gap-0.5"
                    >
                      Stripe dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                    .
                  </p>
                </>
              )}
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-background/60 p-4 text-sm">
              <p className="font-medium">How money actually reaches you:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Connect Stripe → real card payments land here</li>
                <li>• Add Amazon tag → affiliate commission from Amazon</li>
                <li>• Share freelance link → real clients pay invoices</li>
                <li>• Withdraw straight from Stripe to your bank</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimated projections — clearly labeled as estimates, NOT balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Estimated projections (NOT real money)
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-muted-foreground">
                {formatCurrency(totalEstimated)}
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                A <strong>transparent estimate</strong> of what this activity{' '}
                <em>could</em> be worth — based on demo data and made-up
                averages ($4/click, $350/won lead, $9/pro page). It is{' '}
                <strong>not</strong> a balance and <strong>cannot</strong> be
                withdrawn.
              </p>
            </div>
            <div className="w-full md:w-80 space-y-3">
              {earningsBars.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">
                      {formatCurrency(b.value)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(b.value / maxBar) * 100}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Freelance services"
          value={data.counts.services}
          hint={`${data.counts.leads} leads · ${data.counts.newLeads} new`}
          accent="#10b981"
        />
        <StatCard
          icon={ShoppingBag}
          label="Products sold"
          value={data.counts.orders}
          hint={`${data.counts.products} products listed`}
          accent="#f59e0b"
        />
        <StatCard
          icon={MousePointerClick}
          label="Affiliate clicks"
          value={data.counts.affiliateClicks}
          hint={`${data.counts.articles} review articles`}
          accent="#ef4444"
        />
        <StatCard
          icon={Link2}
          label="LinkForge clicks"
          value={data.counts.totalLinkClicks}
          hint={`${data.counts.linkPages} published pages`}
          accent="#8b5cf6"
        />
        <StatCard
          icon={Users}
          label="Job applications"
          value={data.counts.applications}
          hint={`${data.counts.interviewCount} interviewing`}
          accent="#0ea5e9"
        />
        <StatCard
          icon={Trophy}
          label="Offers received"
          value={data.counts.offerCount}
          hint="From your job tracker"
          accent="#22c55e"
        />
        <StatCard
          icon={FileText}
          label="Portfolio projects"
          value={data.counts.portfolio}
          hint="Showcase your work"
          accent="#ec4899"
        />
        <StatCard
          icon={DollarSign}
          label="Store orders (mock)"
          value={formatCurrency(data.earnings.storeRevenue)}
          hint="Fake cards — no real money yet"
          accent="#14b8a6"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenTool className="h-4 w-4" />
            What each number really means (and what it would take to make it real)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <Badge className="mr-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Freelance
            </Badge>
            The &ldquo;~$350 per won lead&rdquo; is a made-up average. Real money
            happens when a real client hires you and pays a real invoice (Stripe,
            PayPal, Wise). Share your freelance link with real people.
          </p>
          <p>
            <Badge className="mr-2 bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Store
            </Badge>
            The store checkout is currently <strong>mock</strong> — it accepts
            fake card numbers. To collect real payments, connect Stripe. Then
            real customer orders = real money you can withdraw from Stripe.
          </p>
          <p>
            <Badge className="mr-2 bg-red-500/15 text-red-700 dark:text-red-300">
              Affiliate
            </Badge>
            The &ldquo;~$4 per click&rdquo; is a made-up estimate. Real affiliate
            income is tracked by Amazon Associates (or similar) — not this app.
            Sign up, swap in your real affiliate links, and the network pays you.
          </p>
          <p>
            <Badge className="mr-2 bg-violet-500/15 text-violet-700 dark:text-violet-300">
              LinkForge
            </Badge>
            The &ldquo;$9/mo Pro&rdquo; is just a label right now — no billing is
            connected. To actually charge users, connect Stripe subscriptions.
          </p>
          <p className="border-t pt-3 text-xs">
            <strong>In short:</strong> this app is the <em>software</em>. Real
            income requires connecting a real payment processor (Stripe) and
            getting real customers. Nothing here is withdrawable until then.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
