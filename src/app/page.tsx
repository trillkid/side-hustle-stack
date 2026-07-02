'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  PenTool,
  Link2,
  BriefcaseBusiness,
  Github,
  Heart,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Overview from '@/components/modules/overview'
import FreelanceModule from '@/components/modules/freelance'
import StoreModule from '@/components/modules/store'
import AffiliateModule from '@/components/modules/affiliate'
import LinkForgeModule from '@/components/modules/linkforge'
import JobsModule from '@/components/modules/jobs'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'freelance', label: 'Freelance', icon: Briefcase },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'affiliate', label: 'Affiliate', icon: PenTool },
  { id: 'linkforge', label: 'LinkForge', icon: Link2 },
  { id: 'jobs', label: 'Jobs & Portfolio', icon: BriefcaseBusiness },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Home() {
  const [tab, setTab] = useState<TabId>('overview')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Side Hustle Stack</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                5 income tools in one
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex"
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                Source
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-2 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => {
              const active = tab === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {tab === 'overview' && <Overview />}
        {tab === 'freelance' && <FreelanceModule />}
        {tab === 'store' && <StoreModule />}
        {tab === 'affiliate' && <AffiliateModule />}
        {tab === 'linkforge' && <LinkForgeModule />}
        {tab === 'jobs' && <JobsModule />}
      </main>

      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            Built to help you earn — legitimately. No get-rich-quick, no scams.
          </p>
          <p>Side Hustle Stack · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
