'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Star,
  PenLine,
  Plus,
  Loader2,
  ExternalLink,
  AlertCircle,
  MousePointerClick,
  FileText,
  DollarSign,
  RefreshCw,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

const ACCENT = '#ef4444'
const COMMISSION_PER_CLICK = 4

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  rating: number
  imageUrl: string
  affiliateUrl: string
  productName: string
  createdAt: string
  _count?: { clicks: number }
}

// ---------- Small UI helpers ----------

function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      aria-label={`Rated ${rating} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{
            width: size,
            height: size,
            color: ACCENT,
            fill: i < rating ? ACCENT : 'transparent',
            strokeWidth: 1.5,
          }}
        />
      ))}
    </div>
  )
}

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            aria-label={`Rate ${n} out of 5`}
          >
            <Star
              style={{
                width: 22,
                height: 22,
                color: ACCENT,
                fill: n <= shown ? ACCENT : 'transparent',
                strokeWidth: 1.5,
              }}
            />
          </button>
        )
      })}
      <span className="ml-2 text-sm text-muted-foreground">
        {value > 0 ? `${value}/5` : 'No rating'}
      </span>
    </div>
  )
}

// ---------- Markdown renderer (no @tailwindcss/typography) ----------

function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mt-2">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground">{children}</h4>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2 hover:opacity-80"
              style={{ color: ACCENT }}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              {children}
            </pre>
          ),
          hr: () => <hr className="border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ---------- Article card ----------

function ArticleCard({
  article,
  onRead,
}: {
  article: Article
  onRead: (a: Article) => void
}) {
  return (
    <Card className="group overflow-hidden p-0 gap-0 py-0">
      <button
        type="button"
        onClick={() => onRead(article)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        aria-label={`Read review: ${article.title}`}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={article.imageUrl}
            alt={article.productName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute left-3 top-3">
            <Badge
              className="border-transparent text-white shadow-sm"
              style={{ backgroundColor: ACCENT }}
            >
              {article.category}
            </Badge>
          </div>
        </div>
      </button>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Stars rating={article.rating} />
          <span className="text-xs text-muted-foreground">
            {(article._count?.clicks ?? 0)}{' '}
            {(article._count?.clicks ?? 0) === 1 ? 'click' : 'clicks'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRead(article)}
          className="block w-full text-left"
        >
          <h3 className="line-clamp-2 font-semibold leading-snug hover:text-red-600 dark:hover:text-red-400 transition-colors">
            {article.title}
          </h3>
        </button>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {article.productName}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
            onClick={() => onRead(article)}
          >
            Read review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Write review dialog ----------

type WriteForm = {
  title: string
  productName: string
  category: string
  rating: number
  excerpt: string
  content: string
  imageUrl: string
  affiliateUrl: string
}

const EMPTY_FORM: WriteForm = {
  title: '',
  productName: '',
  category: '',
  rating: 0,
  excerpt: '',
  content: '',
  imageUrl: '',
  affiliateUrl: '',
}

function WriteReviewDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<WriteForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof WriteForm>(key: K, val: WriteForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const reset = () => setForm(EMPTY_FORM)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.rating < 1 || form.rating > 5) {
      toast({
        title: 'Rating required',
        description: 'Please pick a rating from 1 to 5 stars.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/affiliate/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create review')
      }
      toast({
        title: 'Review published',
        description: `"${form.title}" is now live on your affiliate board.`,
      })
      reset()
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast({
        title: 'Could not publish review',
        description:
          err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>
            Publish a product review with your affiliate link. Each click earns
            you commission.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="af-title">Title</Label>
              <Input
                id="af-title"
                placeholder="Blue Yeti X Review: Still the Best USB Mic?"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                maxLength={140}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-product">Product name</Label>
              <Input
                id="af-product"
                placeholder="Blue Yeti X"
                value={form.productName}
                onChange={(e) => set('productName', e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-category">Category</Label>
              <Input
                id="af-category"
                placeholder="Audio Gear"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                required
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <StarPicker
                value={form.rating}
                onChange={(v) => set('rating', v)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="af-excerpt">Excerpt</Label>
            <Textarea
              id="af-excerpt"
              placeholder="A one- or two-sentence hook shown on the card."
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              required
              rows={2}
              maxLength={240}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="af-content">Content (Markdown)</Label>
              <span className="text-xs text-muted-foreground">
                Markdown supported
              </span>
            </div>
            <Textarea
              id="af-content"
              placeholder={
                '## Verdict\n\nCrisp audio, easy setup. **Rating: 4.6/5**\n\n- Pros: warm vocals\n- Cons: heavy'
              }
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              required
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="af-image">Image URL</Label>
              <Input
                id="af-image"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="af-affiliate">Affiliate URL</Label>
              <Input
                id="af-affiliate"
                type="url"
                placeholder="https://www.amazon.com/dp/..."
                value={form.affiliateUrl}
                onChange={(e) => set('affiliateUrl', e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-white"
              style={{ backgroundColor: ACCENT }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Publish review
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Read review dialog ----------

function ReadReviewDialog({
  article,
  onOpenChange,
  onCheckout,
  checkingOut,
}: {
  article: Article | null
  onOpenChange: (v: boolean) => void
  onCheckout: (a: Article) => void
  checkingOut: boolean
}) {
  return (
    <Dialog
      open={!!article}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {article && (
          <>
            <DialogHeader>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  className="border-transparent text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {article.category}
                </Badge>
                <Stars rating={article.rating} size={16} />
                <span className="text-xs text-muted-foreground">
                  {(article._count?.clicks ?? 0)}{' '}
                  {(article._count?.clicks ?? 0) === 1 ? 'click' : 'clicks'}
                </span>
              </div>
              <DialogTitle className="text-left text-xl">
                {article.title}
              </DialogTitle>
              <DialogDescription className="text-left">
                Product: <span className="font-medium text-foreground">{article.productName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="relative h-40 w-full overflow-hidden rounded-md bg-muted sm:h-52">
              <img
                src={article.imageUrl}
                alt={article.productName}
                className="h-full w-full object-cover"
              />
            </div>

            <Markdown content={article.content} />

            <DialogFooter className="sticky bottom-0 -mx-6 mt-2 border-t bg-background/95 px-6 pb-6 pt-3 backdrop-blur">
              <Button
                type="button"
                onClick={() => onCheckout(article)}
                disabled={checkingOut}
                className="w-full text-white sm:w-auto"
                style={{ backgroundColor: ACCENT }}
                size="lg"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening…
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Check price →
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------- Main module ----------

export default function AffiliateModule() {
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [writeOpen, setWriteOpen] = useState(false)
  const [active, setActive] = useState<Article | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/affiliate/articles')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load articles')
      }
      setArticles(data.articles as Article[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // Keep `active` in sync if its click count changes (optimistic UI)
  const updateArticleClicks = useCallback(
    (id: string, delta: number) => {
      setArticles((prev) => {
        if (!prev) return prev
        return prev.map((a) =>
          a.id === id
            ? { ...a, _count: { clicks: (a._count?.clicks ?? 0) + delta } }
            : a
        )
      })
      setActive((prev) => {
        if (!prev || prev.id !== id) return prev
        return {
          ...prev,
          _count: { clicks: (prev._count?.clicks ?? 0) + delta },
        }
      })
    },
    []
  )

  const handleCheckout = useCallback(
    async (article: Article) => {
      setCheckingOut(true)
      // Optimistic click increment
      updateArticleClicks(article.id, 1)
      try {
        const res = await fetch('/api/affiliate/clicks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: article.id }),
        })
        const data = await res.json()
        if (!res.ok) {
          // Roll back optimistic increment
          updateArticleClicks(article.id, -1)
          throw new Error(data?.error || 'Failed to record click')
        }
        toast({
          title: 'Opening retailer…',
          description: 'Your click was tracked. Commission incoming.',
        })
        if (typeof window !== 'undefined' && data.url) {
          window.open(data.url, '_blank', 'noopener,noreferrer')
        }
      } catch (err) {
        toast({
          title: 'Click tracking failed',
          description:
            err instanceof Error ? err.message : 'Please try again.',
          variant: 'destructive',
        })
      } finally {
        setCheckingOut(false)
      }
    },
    [toast, updateArticleClicks]
  )

  const stats = useMemo(() => {
    if (!articles) return { total: 0, clicks: 0, commission: 0 }
    const clicks = articles.reduce((s, a) => s + (a._count?.clicks ?? 0), 0)
    return {
      total: articles.length,
      clicks,
      commission: clicks * COMMISSION_PER_CLICK,
    }
  }, [articles])

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
          >
            <PenLine className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Affiliate Reviews
            </h2>
            <p className="text-sm text-muted-foreground">
              Earn commission on every click
            </p>
          </div>
        </div>
        <Button
          onClick={() => setWriteOpen(true)}
          className="text-white"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="h-4 w-4" />
          Write review
        </Button>
      </div>

      {/* Performance summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Total reviews</p>
              <p className="text-2xl font-semibold tracking-tight">
                {loading ? '—' : stats.total}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
            >
              <MousePointerClick className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Total clicks</p>
              <p className="text-2xl font-semibold tracking-tight">
                {loading ? '—' : stats.clicks}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
            >
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Estimated commission
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                {loading ? '—' : formatCurrency(stats.commission)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                @ ~$4/click · transparent estimate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles area */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden p-0 gap-0 py-0">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load reviews</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchArticles}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : articles && articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
            >
              <PenLine className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground">
                Write your first product review to start earning commission.
              </p>
            </div>
            <Button
              onClick={() => setWriteOpen(true)}
              className="mt-1 text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <Plus className="h-4 w-4" />
              Write your first review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles?.map((a) => (
            <ArticleCard key={a.id} article={a} onRead={setActive} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <WriteReviewDialog
        open={writeOpen}
        onOpenChange={setWriteOpen}
        onCreated={fetchArticles}
      />
      <ReadReviewDialog
        article={active}
        onOpenChange={(v) => !v && setActive(null)}
        onCheckout={handleCheckout}
        checkingOut={checkingOut}
      />
    </div>
  )
}
