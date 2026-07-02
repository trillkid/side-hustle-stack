'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowDown,
  ArrowUp,
  AlertCircle,
  Copy,
  ExternalLink,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type LinkItem = {
  id: string
  label: string
  url: string
  clicks: number
  order: number
}

type PageData = {
  id: string
  slug: string
  title: string
  bio: string
  themeColor: string
  plan: 'free' | 'pro'
  createdAt: string
  links: LinkItem[]
  totalClicks: number
}

const PRESET_COLORS: { name: string; value: string }[] = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Teal', value: '#14b8a6' },
]

const ACCENT = '#8b5cf6'

function getInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function isHexColor(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v)
}

export default function LinkForgeModule() {
  const { toast } = useToast()
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Page settings draft (live mirror for preview)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [draftColor, setDraftColor] = useState('#10b981')
  const [savingPage, setSavingPage] = useState(false)
  const [togglingPlan, setTogglingPlan] = useState(false)

  // Add link form
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [addingLink, setAddingLink] = useState(false)

  // Per-link editing draft
  const [linkDrafts, setLinkDrafts] = useState<
    Record<string, { label: string; url: string }>
  >({})
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const skipNextDraftSync = useRef(false)

  const fetchPage = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/linkforge/page', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load')
      const data: PageData = await res.json()
      setPage(data)
      if (!skipNextDraftSync.current) {
        setDraftTitle(data.title)
        setDraftBio(data.bio)
        setDraftColor(data.themeColor)
        setLinkDrafts(
          Object.fromEntries(
            data.links.map((l) => [l.id, { label: l.label, url: l.url }])
          )
        )
      }
      skipNextDraftSync.current = false
    } catch {
      setError('Could not load your link page. Please retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // ---- Page settings handlers ----
  const pageDirty =
    page != null &&
    (draftTitle !== page.title ||
      draftBio !== page.bio ||
      draftColor !== page.themeColor)

  async function savePage() {
    if (!page || !pageDirty) return
    setSavingPage(true)
    try {
      const patch: Record<string, string> = {}
      if (draftTitle.trim() && draftTitle !== page.title) patch.title = draftTitle
      if (draftBio !== page.bio) patch.bio = draftBio
      if (isHexColor(draftColor) && draftColor !== page.themeColor) {
        patch.themeColor = draftColor
      }
      const res = await fetch('/api/linkforge/page', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Page saved', description: 'Your changes are live.' })
      skipNextDraftSync.current = true
      await fetchPage()
    } catch {
      toast({
        title: 'Save failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSavingPage(false)
    }
  }

  async function togglePlan(checked: boolean) {
    if (!page) return
    const next = checked ? 'pro' : 'free'
    if (next === page.plan) return
    setTogglingPlan(true)
    try {
      const res = await fetch('/api/linkforge/page', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      })
      if (!res.ok) throw new Error('Failed to update plan')
      skipNextDraftSync.current = true
      await fetchPage()
      toast(
        next === 'pro'
          ? { title: 'Upgraded to Pro!', description: 'Unlock advanced analytics & themes.' }
          : { title: 'Switched to Free', description: 'Downgraded — Pro features locked.' }
      )
    } catch {
      toast({
        title: 'Could not change plan',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setTogglingPlan(false)
    }
  }

  // ---- Link handlers ----
  async function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return
    setAddingLink(true)
    try {
      const res = await fetch('/api/linkforge/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel, url: newUrl }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add link')
      }
      setNewLabel('')
      setNewUrl('')
      toast({ title: 'Link added', description: 'New link is live on your page.' })
      await fetchPage()
    } catch (e) {
      toast({
        title: 'Could not add link',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAddingLink(false)
    }
  }

  async function saveLink(id: string) {
    const draft = linkDrafts[id]
    const original = page?.links.find((l) => l.id === id)
    if (!draft || !original) return
    if (draft.label === original.label && draft.url === original.url) return
    setSavingLinkId(id)
    try {
      const patch: Record<string, string> = {}
      if (draft.label.trim() && draft.label !== original.label) patch.label = draft.label
      if (draft.url.trim() && draft.url !== original.url) patch.url = draft.url
      const res = await fetch(`/api/linkforge/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Link updated' })
      await fetchPage()
    } catch {
      toast({
        title: 'Could not save link',
        variant: 'destructive',
      })
    } finally {
      setSavingLinkId(null)
    }
  }

  async function deleteLink(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/linkforge/links/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ title: 'Link deleted' })
      await fetchPage()
    } catch {
      toast({ title: 'Could not delete link', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  async function reorder(index: number, dir: 'up' | 'down') {
    if (!page) return
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= page.links.length) return
    const a = page.links[index]
    const b = page.links[target]
    setReorderingId(a.id)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/linkforge/links/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/linkforge/links/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: a.order }),
        }),
      ])
      if (!r1.ok || !r2.ok) throw new Error('Failed to reorder')
      await fetchPage()
    } catch {
      toast({ title: 'Could not reorder', variant: 'destructive' })
    } finally {
      setReorderingId(null)
    }
  }

  async function recordClick(link: LinkItem) {
    try {
      const res = await fetch(`/api/linkforge/links/${link.id}/click`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed')
      await fetchPage()
      if (typeof window !== 'undefined') {
        window.open(link.url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      toast({ title: 'Could not open link', variant: 'destructive' })
    }
  }

  async function copyPublishedUrl() {
    if (!page) return
    const url = `https://linkforge.app/${page.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Copied!', description: url })
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  // ---- Render ----
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-[520px] w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {error || 'Could not load your link page.'}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => fetchPage()}>
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const isPro = page.plan === 'pro'
  const maxClicks = Math.max(1, ...page.links.map((l) => l.clicks))
  const publishedUrl = `linkforge.app/${page.slug}`

  return (
    <div className="space-y-6">
      {/* Header row */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: ACCENT }}
            >
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">LinkForge</h2>
                {isPro ? (
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    PRO
                  </Badge>
                ) : (
                  <Badge variant="secondary">FREE</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Your link-in-bio SaaS — $9/mo Pro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="plan-toggle" className="text-sm font-medium">
                Free
              </Label>
              <Switch
                id="plan-toggle"
                checked={isPro}
                onCheckedChange={togglePlan}
                disabled={togglingPlan}
                style={isPro ? { backgroundColor: ACCENT } : undefined}
              />
              <Label htmlFor="plan-toggle" className="text-sm font-medium">
                Pro
              </Label>
            </div>
            {togglingPlan && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </CardContent>
        {!isPro && (
          <div
            className="border-t px-4 py-2 text-xs sm:px-6"
            style={{ backgroundColor: `${ACCENT}10`, color: ACCENT }}
          >
            Upsell: upgrade to Pro for custom themes, advanced analytics &amp; unlimited links.
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — Editor */}
        <div className="space-y-6">
          {/* Page settings */}
          <Card>
            <CardHeader>
              <CardTitle>Page settings</CardTitle>
              <CardDescription>
                These appear on your public link page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="lf-title">Title</Label>
                <Input
                  id="lf-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={savePage}
                  placeholder="Your name"
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lf-bio">Bio</Label>
                <Textarea
                  id="lf-bio"
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  onBlur={savePage}
                  placeholder="A short tagline"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {draftBio.length}/200
                </p>
              </div>
              <div className="space-y-2">
                <Label>Theme color</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => {
                    const selected = draftColor.toLowerCase() === c.value.toLowerCase()
                    return (
                      <Tooltip key={c.value}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setDraftColor(c.value)}
                            aria-label={c.name}
                            aria-pressed={selected}
                            className={cn(
                              'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                              selected
                                ? 'border-foreground ring-2 ring-offset-2 ring-offset-background'
                                : 'border-transparent'
                            )}
                            style={{
                              backgroundColor: c.value,
                              ...(selected ? { boxShadow: `0 0 0 2px ${c.value}` } : {}),
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{c.name}</TooltipContent>
                      </Tooltip>
                    )
                  })}
                  <Separator orientation="vertical" className="mx-1 h-6" />
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs"
                    title="Custom color"
                  >
                    <span
                      className="h-5 w-5 rounded border"
                      style={{ backgroundColor: draftColor }}
                    />
                    <span className="font-mono text-[11px] uppercase">{draftColor}</span>
                    <input
                      type="color"
                      value={isHexColor(draftColor) ? draftColor : '#8b5cf6'}
                      onChange={(e) => setDraftColor(e.target.value)}
                      className="sr-only"
                      aria-label="Custom theme color"
                    />
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={savePage} disabled={!pageDirty || savingPage} size="sm">
                  {savingPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Links editor */}
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>
                Reorder, edit, or remove links on your page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {page.links.length === 0 && (
                <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                  No links yet. Add your first link below.
                </p>
              )}
              <ul className="space-y-2">
                {page.links.map((link, index) => {
                  const draft = linkDrafts[link.id] ?? { label: link.label, url: link.url }
                  const dirty =
                    draft.label !== link.label || draft.url !== link.url
                  const isSavingThis = savingLinkId === link.id
                  const isReordering = reorderingId === link.id
                  const isDeleting = deletingId === link.id
                  return (
                    <li
                      key={link.id}
                      className={cn(
                        'rounded-lg border bg-card p-3 transition-opacity',
                        (isSavingThis || isReordering || isDeleting) && 'opacity-70'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical
                          className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground"
                          aria-hidden
                        />
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                          <Input
                            value={draft.label}
                            onChange={(e) =>
                              setLinkDrafts((prev) => ({
                                ...prev,
                                [link.id]: { ...draft, label: e.target.value },
                              }))
                            }
                            placeholder="Label"
                            className="h-9"
                          />
                          <Input
                            value={draft.url}
                            onChange={(e) =>
                              setLinkDrafts((prev) => ({
                                ...prev,
                                [link.id]: { ...draft, url: e.target.value },
                              }))
                            }
                            placeholder="https://"
                            className="h-9"
                          />
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={index === 0 || isReordering}
                                onClick={() => reorder(index, 'up')}
                                aria-label="Move up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move up</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={
                                  index === page.links.length - 1 || isReordering
                                }
                                onClick={() => reorder(index, 'down')}
                                aria-label="Move down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move down</TooltipContent>
                          </Tooltip>
                          <Button
                            variant={dirty ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 px-2"
                            disabled={!dirty || isSavingThis}
                            onClick={() => saveLink(link.id)}
                          >
                            {isSavingThis ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </Button>
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    disabled={isDeleting}
                                    aria-label="Delete link"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete link?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove “{link.label}” from your
                                  page. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => deleteLink(link.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between pl-6">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          clicks: {link.clicks}
                        </Badge>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {link.url}
                        </a>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <Separator />

              {/* Add link */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Add a new link
                </Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label"
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLabel && newUrl) addLink()
                    }}
                  />
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://"
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLabel && newUrl) addLink()
                    }}
                  />
                  <Button
                    onClick={addLink}
                    disabled={!newLabel.trim() || !newUrl.trim() || addingLink}
                    size="sm"
                    className="h-9"
                    style={{ backgroundColor: ACCENT, borderColor: ACCENT }}
                  >
                    {addingLink ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-1 h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Live phone preview */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lf-url">Published URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="lf-url"
                readOnly
                value={publishedUrl}
                className="font-mono text-sm"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPublishedUrl}
                    aria-label="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy link</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center pt-2">
            <div
              className="relative w-full max-w-xs overflow-hidden rounded-[2rem] border bg-muted shadow-xl"
              style={{ aspectRatio: '9 / 19' }}
            >
              {/* Status bar */}
              <div className="flex h-6 items-center justify-between bg-muted px-5 text-[10px] text-muted-foreground">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span className="h-1.5 w-3 rounded-sm border border-current" />
                </span>
              </div>

              {isPro && (
                <div
                  className="absolute right-3 top-9 z-10 rotate-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow"
                  style={{ backgroundColor: ACCENT }}
                >
                  Pro
                </div>
              )}

              <div className="flex h-[calc(100%-1.5rem)] flex-col items-center overflow-y-auto px-5 py-6 text-center">
                {/* Avatar */}
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md ring-4 ring-background"
                  style={{ backgroundColor: draftColor }}
                >
                  {getInitials(draftTitle)}
                </div>

                <h3 className="mt-3 text-base font-semibold leading-tight">
                  {draftTitle || 'Your Name'}
                </h3>
                {draftBio && (
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {draftBio}
                  </p>
                )}

                <div className="mt-5 flex w-full flex-col gap-2.5">
                  {page.links.map((link) => {
                    const draft = linkDrafts[link.id] ?? {
                      label: link.label,
                      url: link.url,
                    }
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => recordClick(link)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
                        style={{ backgroundColor: draftColor }}
                        title={`Open ${draft.url || link.url}`}
                      >
                        {draft.label || link.label}
                      </button>
                    )
                  })}
                  {page.links.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No links yet — add some on the left.
                    </p>
                  )}
                </div>

                <p
                  className="mt-auto pt-5 text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: ACCENT }}
                >
                  LinkForge
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Tap a link in the preview to record a click.
          </p>
        </div>
      </div>

      {/* Analytics (full width) */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Performance of your link page. Updates live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total clicks
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{page.totalClicks}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Links
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{page.links.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Plan
              </p>
              <p className="mt-1 text-xl font-semibold uppercase">{page.plan}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Avg / link
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {page.links.length
                  ? Math.round(page.totalClicks / page.links.length)
                  : 0}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Clicks per link</h4>
            {page.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No links to analyze yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {page.links.map((link) => {
                  const pct = Math.round((link.clicks / maxClicks) * 100)
                  return (
                    <li key={link.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {link.label}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {link.clicks}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: draftColor,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
