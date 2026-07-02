'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Briefcase,
  Code2,
  Globe,
  Palette,
  PenLine,
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  Mail,
  Inbox,
  AlertCircle,
  Send,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatCurrency, timeAgo } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  _count?: { leads: number }
}

type Lead = {
  id: string
  name: string
  email: string
  message: string
  serviceId: string | null
  status: 'new' | 'contacted' | 'won' | 'lost'
  createdAt: string
  service: Service | null
}

type LeadStatus = Lead['status']

// ---------------- Constants ----------------

const ICON_WHITELIST = ['Briefcase', 'Globe', 'Palette', 'PenLine', 'Code2'] as const
type IconName = (typeof ICON_WHITELIST)[number]

const ICON_MAP: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Globe,
  Palette,
  PenLine,
  Code2,
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const STATUS_BADGE_CLASS: Record<LeadStatus, string> = {
  new: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  contacted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  won: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  lost: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
}

function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name as IconName] ?? Briefcase
  return <Comp className={className} />
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ---------------- Component ----------------

export default function FreelanceModule() {
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [leadsError, setLeadsError] = useState<string | null>(null)

  // Dialog state
  const [hireService, setHireService] = useState<Service | null>(null)
  const [addServiceOpen, setAddServiceOpen] = useState(false)

  const fetchServices = useCallback(async () => {
    setLoadingServices(true)
    setServicesError(null)
    try {
      const r = await fetch('/api/freelance/services', { cache: 'no-store' })
      if (!r.ok) throw new Error('Request failed')
      const data = (await r.json()) as Service[]
      setServices(data)
    } catch {
      setServicesError('Could not load services. Please try again.')
    } finally {
      setLoadingServices(false)
    }
  }, [])

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true)
    setLeadsError(null)
    try {
      const r = await fetch('/api/freelance/leads', { cache: 'no-store' })
      if (!r.ok) throw new Error('Request failed')
      const data = (await r.json()) as Lead[]
      setLeads(data)
    } catch {
      setLeadsError('Could not load leads. Please try again.')
    } finally {
      setLoadingLeads(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
    fetchLeads()
  }, [fetchServices, fetchLeads])

  // ---------------- Mutations ----------------

  async function handleCreateService(input: {
    title: string
    description: string
    price: string
    category: string
    icon: string
  }) {
    const r = await fetch('/api/freelance/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err?.error ?? 'Failed to add service')
    }
    const created = (await r.json()) as Service
    setServices((prev) => [created, ...prev])
    toast({
      title: 'Service published',
      description: `${created.title} is now live.`,
    })
  }

  async function handleCreateLead(input: {
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
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err?.error ?? 'Failed to send lead')
    }
    const created = (await r.json()) as Lead
    setLeads((prev) => [created, ...prev])
    setServices((prev) =>
      prev.map((s) =>
        s.id === created.serviceId
          ? { ...s, _count: { leads: (s._count?.leads ?? 0) + 1 } }
          : s
      )
    )
    toast({
      title: 'Lead sent',
      description: 'Thanks — the freelancer will reach out shortly.',
    })
  }

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    // Optimistic update
    const prev = leads
    setLeads((cur) =>
      cur.map((l) => (l.id === leadId ? { ...l, status } : l))
    )
    try {
      const r = await fetch(`/api/freelance/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) throw new Error()
      toast({
        title: 'Status updated',
        description: `Lead marked as ${status}.`,
      })
    } catch {
      setLeads(prev)
      toast({
        title: 'Update failed',
        description: 'Could not update status. Reverted.',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteLead(leadId: string) {
    const prev = leads
    setLeads((cur) => cur.filter((l) => l.id !== leadId))
    try {
      const r = await fetch(`/api/freelance/leads/${leadId}`, {
        method: 'DELETE',
      })
      if (!r.ok) throw new Error()
      toast({
        title: 'Lead deleted',
        description: 'The lead has been removed from your inbox.',
      })
    } catch {
      setLeads(prev)
      toast({
        title: 'Delete failed',
        description: 'Could not delete lead. Restored.',
        variant: 'destructive',
      })
    }
  }

  // ---------------- Render ----------------

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#10b9811a', color: '#10b981' }}
            >
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Freelance Hub
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Showcase your services, capture leads, and track them through to a
            closed deal.
          </p>
        </div>
        <Button
          onClick={() => setAddServiceOpen(true)}
          className="bg-emerald-600 text-white hover:bg-emerald-600/90"
        >
          <Plus className="h-4 w-4" />
          Add service
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Services showcase (left 2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Services showcase
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchServices}
              disabled={loadingServices}
            >
              <RefreshCw
                className={cn('h-4 w-4', loadingServices && 'animate-spin')}
              />
              Refresh
            </Button>
          </div>

          {servicesError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                <p>{servicesError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={fetchServices}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : loadingServices ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No services yet. Add your first service to start capturing
                  leads.
                </p>
                <Button
                  className="mt-2 bg-emerald-600 text-white hover:bg-emerald-600/90"
                  onClick={() => setAddServiceOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  onHire={() => setHireService(s)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Leads inbox (right col) */}
        <div className="lg:col-span-1">
          <LeadsInbox
            leads={leads}
            loading={loadingLeads}
            error={leadsError}
            onRetry={fetchLeads}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteLead}
          />
        </div>
      </div>

      {/* Add service dialog */}
      <AddServiceDialog
        open={addServiceOpen}
        onOpenChange={setAddServiceOpen}
        onSubmit={handleCreateService}
      />

      {/* Hire me / lead dialog */}
      <HireDialog
        service={hireService}
        services={services}
        onOpenChange={(open) => {
          if (!open) setHireService(null)
        }}
        onSubmit={handleCreateLead}
      />
    </div>
  )
}

// ---------------- Subcomponents ----------------

function ServiceCard({
  service,
  onHire,
}: {
  service: Service
  onHire: () => void
}) {
  return (
    <Card className="gap-0 py-0 overflow-hidden transition-shadow hover:shadow-md">
      <div className="h-1.5 w-full bg-emerald-500" />
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#10b9811a', color: '#10b981' }}
          >
            <ServiceIcon name={service.icon} className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-xs">
            {service.category}
          </Badge>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold leading-tight">{service.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Starting at</p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(service.price)}
            </p>
          </div>
          {typeof service._count?.leads === 'number' && (
            <p className="text-xs text-muted-foreground">
              {service._count.leads}{' '}
              {service._count.leads === 1 ? 'lead' : 'leads'}
            </p>
          )}
        </div>

        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
          onClick={onHire}
        >
          <Send className="h-4 w-4" />
          Hire me
        </Button>
      </CardContent>
    </Card>
  )
}

function LeadsInbox({
  leads,
  loading,
  error,
  onRetry,
  onStatusChange,
  onDelete,
}: {
  leads: Lead[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onStatusChange: (id: string, status: LeadStatus) => void
  onDelete: (id: string) => void
}) {
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Leads inbox
          </span>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            {leads.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <Mail className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No leads yet — share your services!
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto p-3 [scrollbar-width:thin]">
            <ul className="space-y-2">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {lead.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {lead.email}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(lead.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-foreground/90">
                    {lead.message}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {lead.service ? (
                      <Badge variant="outline" className="text-xs">
                        {lead.service.title}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        General
                      </Badge>
                    )}
                    <Badge className={cn('text-xs', STATUS_BADGE_CLASS[lead.status])}>
                      {lead.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Select
                      value={lead.status}
                      onValueChange={(v) =>
                        onStatusChange(lead.id, v as LeadStatus)
                      }
                    >
                      <SelectTrigger size="sm" className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete(lead)}
                      aria-label="Delete lead"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This will permanently remove the lead from ${pendingDelete.name}. This action cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ---------------- Dialogs ----------------

function AddServiceDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    title: string
    description: string
    price: string
    category: string
    icon: string
  }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [icon, setIcon] = useState<string>('Briefcase')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('')
    setCategory('')
    setIcon('Briefcase')
    setErrors({})
  }

  // Reset form whenever the dialog opens
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current) {
      resetForm()
    }
    prevOpen.current = open
  }, [open])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!description.trim()) e.description = 'Description is required'
    if (!category.trim()) e.category = 'Category is required'
    const priceNum = Number(price)
    if (!price.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      e.price = 'Enter a valid price'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price,
        category: category.trim(),
        icon,
      })
      onOpenChange(false)
    } catch (err) {
      // surfaced via toast in parent — keep dialog open
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a service</DialogTitle>
          <DialogDescription>
            Describe what you offer. Leads will be able to contact you about it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc-title">Title</Label>
            <Input
              id="svc-title"
              placeholder="e.g. Landing Page Build"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">Description</Label>
            <Textarea
              id="svc-desc"
              placeholder="What's included, turnaround, deliverables…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Price (CAD)</Label>
              <Input
                id="svc-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="450"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={!!errors.price}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-cat">Category</Label>
              <Input
                id="svc-cat"
                placeholder="e.g. Web Development"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-invalid={!!errors.category}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Icon (optional)</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_WHITELIST.map((name) => (
                  <SelectItem key={name} value={name}>
                    <span className="flex items-center gap-2">
                      <ServiceIcon name={name} className="h-4 w-4" />
                      {name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HireDialog({
  service,
  services,
  onOpenChange,
  onSubmit,
}: {
  service: Service | null
  services: Service[]
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    name: string
    email: string
    message: string
    serviceId: string | null
  }) => Promise<void>
}) {
  const open = service !== null
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Reset & pre-fill whenever the dialog opens for a service
  const prevOpen = useRef(false)
  useEffect(() => {
    if (open && !prevOpen.current && service) {
      setName('')
      setEmail('')
      setMessage('')
      setSelectedServiceId(service.id)
      setErrors({})
    }
    prevOpen.current = open
  }, [open, service])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim() || !isEmail(email.trim())) {
      e.email = 'Enter a valid email'
    }
    if (!message.trim()) e.message = 'Message is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        serviceId: selectedServiceId || null,
      })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a project</DialogTitle>
          <DialogDescription>
            Fill in your details and the freelancer will get back to you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Name</Label>
            <Input
              id="lead-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select
              value={selectedServiceId}
              onValueChange={setSelectedServiceId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service" />
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

          <div className="space-y-1.5">
            <Label htmlFor="lead-msg">Message</Label>
            <Textarea
              id="lead-msg"
              placeholder="Tell the freelancer what you need…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message}</p>
            )}
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
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
