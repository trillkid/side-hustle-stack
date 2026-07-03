'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Heart,
  Palette,
  Briefcase,
  Sparkles,
  PartyPopper,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  Instagram,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency, timeAgo } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

// ---------------- Types ----------------
type Service = {
  id: string
  title: string
  description: string
  price: number
  category: string
  icon: string
  active: boolean
  createdAt: string
}

type Lead = {
  id: string
  name: string
  email: string
  message: string
  status: string
  createdAt: string
}

const BALLOON_CATEGORIES = ['Event Decor', 'Weddings', 'Seasonal']

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; blurb: string }
> = {
  'Event Decor': {
    label: 'Garlands & Arches',
    icon: Palette,
    color: '#ec4899',
    blurb: 'Custom balloon garlands, arches, and bouquets for any celebration.',
  },
  Weddings: {
    label: 'Weddings',
    icon: Heart,
    color: '#f43f5e',
    blurb: 'Romantic ceremony arches, reception garlands, and proposal setups.',
  },
  Seasonal: {
    label: 'Seasonal & Holiday',
    icon: PartyPopper,
    color: '#8b5cf6',
    blurb: 'Halloween, Christmas, and New Year\'s Eve themed balloon packages.',
  },
}

// ---------------- Hero ----------------
function Hero({ onBookNow }: { onBookNow: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-8 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-purple-950/30">
      <div className="absolute right-4 top-4 text-6xl opacity-20">🎈</div>
      <div className="absolute bottom-4 left-8 text-5xl opacity-20">🎉</div>
      <div className="absolute right-20 bottom-8 text-4xl opacity-20">✨</div>
      <div className="relative z-10 max-w-2xl">
        <Badge className="mb-3 border-transparent text-white" style={{ backgroundColor: '#ec4899' }}>
          <Sparkles className="mr-1 h-3 w-3" /> Toronto & GTA
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Custom Balloon Decor for Every Celebration
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Beautiful, hand-crafted balloon garlands, arches, and bouquets for
          birthdays, weddings, holidays, and corporate events. Custom colors to
          match your theme — delivered and installed across Toronto & the GTA.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={onBookNow}
            size="lg"
            className="bg-pink-600 text-white hover:bg-pink-600/90"
          >
            <PartyPopper className="h-4 w-4" />
            Book your event
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="ml-1">Loved by Toronto party hosts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Gallery ----------------
function Gallery() {
  const images = [
    { emoji: '🎈', label: 'Birthday Garlands', color: 'from-pink-400 to-rose-400' },
    { emoji: '💍', label: 'Wedding Arches', color: 'from-rose-300 to-pink-300' },
    { emoji: '🎃', label: 'Halloween Decor', color: 'from-purple-500 to-orange-500' },
    { emoji: '🎄', label: 'Christmas Garlands', color: 'from-red-500 to-green-500' },
    { emoji: '🎉', label: 'NYE Arches', color: 'from-yellow-400 to-pink-500' },
    { emoji: '👶', label: 'Baby Showers', color: 'from-sky-300 to-pink-300' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-pink-500" />
          What we create
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.label}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br text-center',
                img.color
              )}
            >
              <span className="text-4xl">{img.emoji}</span>
              <span className="px-2 text-xs font-medium text-white drop-shadow">
                {img.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------- Service Card ----------------
function ServiceCard({
  service,
  onBook,
}: {
  service: Service
  onBook: (s: Service) => void
}) {
  const meta = CATEGORY_META[service.category]
  const Icon = meta?.icon ?? PartyPopper
  return (
    <Card className="flex flex-col overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ backgroundColor: `${meta?.color ?? '#ec4899'}1a` }}
      >
        <Icon className="h-4 w-4" style={{ color: meta?.color }} />
        <span className="text-xs font-medium" style={{ color: meta?.color }}>
          {meta?.label}
        </span>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <h4 className="font-semibold leading-tight">{service.title}</h4>
        <p className="text-sm text-muted-foreground">{service.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-pink-600">
            {formatCurrency(service.price)}
          </span>
          <Button
            size="sm"
            onClick={() => onBook(service)}
            className="bg-pink-600 text-white hover:bg-pink-600/90"
          >
            Book this
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------- Booking Dialog ----------------
function BookingDialog({
  service,
  services,
  open,
  onOpenChange,
  onSubmit,
}: {
  service: Service | null
  services: Service[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (input: {
    name: string
    email: string
    message: string
    serviceId: string | null
  }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (service) {
      setSelectedService(service.id)
      setMessage('')
      setName('')
      setEmail('')
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        name,
        email,
        message,
        serviceId: selectedService || null,
      })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-pink-500" />
            Book your balloon decor
          </DialogTitle>
          <DialogDescription>
            Tell us about your event. We&apos;ll get back to you within 24 hours
            with availability and next steps.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="b-name">Your name</Label>
            <Input
              id="b-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-email">Email</Label>
            <Input
              id="b-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-service">Package</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="b-service">
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title} · {formatCurrency(s.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-msg">Event details</Label>
            <Textarea
              id="b-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your event: date, location, theme/colors, number of guests..."
              required
              disabled={submitting}
              rows={4}
            />
          </div>
          <DialogFooter>
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
              className="bg-pink-600 text-white hover:bg-pink-600/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Request booking
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- Main Module ----------------
export default function BalloonsModule() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingService, setBookingService] = useState<Service | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      const r = await fetch('/api/freelance/services', { cache: 'no-store' })
      const data = (await r.json()) as Service[]
      // Filter to only balloon-related categories
      setServices(
        data.filter((s) => BALLOON_CATEGORIES.includes(s.category))
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLeads = useCallback(async () => {
    try {
      const r = await fetch('/api/freelance/leads', { cache: 'no-store' })
      const data = (await r.json()) as Lead[]
      setLeads(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchServices()
    fetchLeads()
  }, [fetchServices, fetchLeads])

  async function handleBooking(input: {
    name: string
    email: string
    message: string
    serviceId: string | null
  }) {
    const r = await fetch('/api/freelance/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!r.ok) throw new Error('Failed to submit booking')
    const created = (await r.json()) as Lead
    setLeads((prev) => [created, ...prev])
    toast({
      title: 'Booking request sent! 🎈',
      description: 'We\'ll reply within 24 hours. Check your email.',
    })
  }

  const grouped = BALLOON_CATEGORIES.map((cat) => ({
    category: cat,
    services: services.filter((s) => s.category === cat),
  }))

  const recentBalloonLeads = leads.filter((l) => l).slice(0, 3)

  return (
    <div className="space-y-6">
      <Hero onBookNow={() => setBookingOpen(true)} />

      {/* Quick stats / trust */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/15">
              <MapPin className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Toronto & GTA</p>
              <p className="text-xs text-muted-foreground">On-site setup included</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/15">
              <Palette className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Custom colors</p>
              <p className="text-xs text-muted-foreground">Match your theme</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">3-5 day garlands</p>
              <p className="text-xs text-muted-foreground">Air-filled, long-lasting</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Gallery />

      {/* Services by category */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, services: catServices }) => {
            if (catServices.length === 0) return null
            const meta = CATEGORY_META[category]
            const Icon = meta.icon
            return (
              <section key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${meta.color}1a` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{meta.label}</h3>
                    <p className="text-sm text-muted-foreground">{meta.blurb}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catServices.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      onBook={(svc) => {
                        setBookingService(svc)
                        setBookingOpen(true)
                      }}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* About / Contact strip */}
      <Card className="border-2 border-pink-500/30 bg-pink-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ready to book your event?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about your celebration and we&apos;ll create something
                beautiful. Custom packages available — just ask!
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                setBookingService(null)
                setBookingOpen(true)
              }}
              className="bg-pink-600 text-white hover:bg-pink-600/90"
            >
              <PartyPopper className="h-4 w-4" />
              Book now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent booking requests (for the owner) */}
      {recentBalloonLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Recent booking requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBalloonLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lead.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(lead.createdAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">
                  {lead.message}
                </p>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              💡 Full lead management is in the Freelance tab — reply with AI-drafted responses there.
            </p>
          </CardContent>
        </Card>
      )}

      <BookingDialog
        service={bookingService}
        services={services}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onSubmit={handleBooking}
      />
    </div>
  )
}
