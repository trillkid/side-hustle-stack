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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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

export default function Overview() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/overview')
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .finally(() => alive && setLoading(false))
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

  const earningsBars = [
    {
      label: 'Freelance',
      value: data.earnings.freelanceProjected,
      color: '#10b981',
    },
    {
      label: 'Store revenue',
      value: data.earnings.storeProjected,
      color: '#f59e0b',
    },
    {
      label: 'Affiliate',
      value: data.earnings.affiliateProjected,
      color: '#ef4444',
    },
    {
      label: 'LinkForge Pro',
      value: data.earnings.linkforgeProjected,
      color: '#8b5cf6',
    },
  ]
  const maxBar = Math.max(...earningsBars.map((b) => b.value), 1)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Projected earnings (all modules)
                </span>
              </div>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {formatCurrency(data.earnings.total)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Live totals from your store + transparent projections for
                freelance, affiliate &amp; SaaS.
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
          label="Store revenue"
          value={formatCurrency(data.earnings.storeRevenue)}
          hint="From completed orders"
          accent="#14b8a6"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenTool className="h-4 w-4" />
            How these numbers translate to money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <Badge className="mr-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Freelance
            </Badge>
            Every &ldquo;won&rdquo; lead averages ~$350. Reply to new leads fast
            and convert them in the Freelance tab.
          </p>
          <p>
            <Badge className="mr-2 bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Store
            </Badge>
            Digital products earn passive revenue. Add more products and share
            your store link.
          </p>
          <p>
            <Badge className="mr-2 bg-red-500/15 text-red-700 dark:text-red-300">
              Affiliate
            </Badge>
            Each affiliate click is worth ~$4 in expected commission. Write more
            reviews to grow traffic.
          </p>
          <p>
            <Badge className="mr-2 bg-violet-500/15 text-violet-700 dark:text-violet-300">
              LinkForge
            </Badge>
            Each published Pro page is $9/mo. This is a real product you can
            charge users for.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
