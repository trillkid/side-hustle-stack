'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Building2,
  Briefcase,
  Loader2,
  AlertCircle,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// ---------- Types ----------
type Status = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected'

type JobApplication = {
  id: string
  company: string
  role: string
  status: string
  appliedDate: string | null
  link: string | null
  notes: string | null
  salary: string | null
  createdAt: string
}

type PortfolioProject = {
  id: string
  title: string
  description: string
  url: string | null
  imageUrl: string | null
  tags: string
  createdAt: string
}

// ---------- Column config ----------
const COLUMNS: {
  status: Status
  label: string
  accent: string
  badgeClass: string
  dotClass: string
}[] = [
  {
    status: 'wishlist',
    label: 'Wishlist',
    accent: '#71717a',
    badgeClass:
      'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-transparent',
    dotClass: 'bg-zinc-400',
  },
  {
    status: 'applied',
    label: 'Applied',
    accent: '#0ea5e9',
    badgeClass:
      'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-transparent',
    dotClass: 'bg-sky-500',
  },
  {
    status: 'interview',
    label: 'Interview',
    accent: '#f59e0b',
    badgeClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-transparent',
    dotClass: 'bg-amber-500',
  },
  {
    status: 'offer',
    label: 'Offer',
    accent: '#10b981',
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-transparent',
    dotClass: 'bg-emerald-500',
  },
  {
    status: 'rejected',
    label: 'Rejected',
    accent: '#f43f5e',
    badgeClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-transparent',
    dotClass: 'bg-rose-500',
  },
]

const STATUSES: Status[] = ['wishlist', 'applied', 'interview', 'offer', 'rejected']

// ---------- Application form dialog ----------
function ApplicationFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: JobApplication | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const isEdit = !!initial

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<Status>('wishlist')
  const [salary, setSalary] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')
  const [appliedDate, setAppliedDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setCompany(initial?.company ?? '')
      setRole(initial?.role ?? '')
      setStatus((initial?.status as Status) ?? 'wishlist')
      setSalary(initial?.salary ?? '')
      setLink(initial?.link ?? '')
      setNotes(initial?.notes ?? '')
      setAppliedDate(
        initial?.appliedDate ? initial.appliedDate.slice(0, 10) : ''
      )
    }
  }, [open, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim() || !role.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        company: company.trim(),
        role: role.trim(),
        status,
        salary: salary.trim() || null,
        link: link.trim() || null,
        notes: notes.trim() || null,
        appliedDate: appliedDate || null,
      }
      const url = isEdit
        ? `/api/jobs/applications/${initial!.id}`
        : '/api/jobs/applications'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to save application')
      }
      toast({
        title: isEdit ? 'Application updated' : 'Application added',
        description: `${company} · ${role}`,
      })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-500" />
            {isEdit ? 'Edit application' : 'Add application'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this job application.'
              : 'Track a new job application in your board.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-company">
                Company <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Shopify"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
              >
                <SelectTrigger id="app-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-salary">Salary</Label>
              <Input
                id="app-salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $120k"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-link">Link</Label>
              <Input
                id="app-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-date">Applied date</Label>
              <Input
                id="app-date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                type="date"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-notes">Notes</Label>
            <Textarea
              id="app-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recruiter name, interview rounds, etc."
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Add application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Portfolio form dialog ----------
function PortfolioFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setUrl('')
      setImageUrl('')
      setTags('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        url: url.trim() || null,
        imageUrl: imageUrl.trim() || null,
        tags: tags.trim(),
      }
      const res = await fetch('/api/jobs/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to create project')
      }
      toast({
        title: 'Project added',
        description: title,
      })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-sky-500" />
            Add project
          </DialogTitle>
          <DialogDescription>
            Showcase a project in your portfolio gallery.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proj-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coffee Shop Landing"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short summary of what it is and your role."
              rows={3}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proj-url">URL</Label>
              <Input
                id="proj-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-image">Image URL</Label>
              <Input
                id="proj-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-tags">Tags</Label>
            <Input
              id="proj-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Next.js, Tailwind, Design (comma separated)"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Application card ----------
function ApplicationCard({
  app,
  onStatusChange,
  onEdit,
  onDelete,
  busy,
}: {
  app: JobApplication
  onStatusChange: (id: string, status: Status) => void
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  busy: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{app.company}</p>
          <p className="truncate text-xs text-muted-foreground">{app.role}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {app.link && (
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-sky-600"
            >
              <a
                href={app.link}
                target="_blank"
                rel="noreferrer"
                aria-label="Open application link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(app)}
            aria-label="Edit application"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(app)}
            aria-label="Delete application"
            disabled={busy}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {(app.salary || app.appliedDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {app.salary && (
            <Badge
              className="border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-300"
              variant="secondary"
            >
              {app.salary}
            </Badge>
          )}
          {app.appliedDate && (
            <span className="text-[11px] text-muted-foreground">
              Applied {formatDate(app.appliedDate)}
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5">
        <Select
          value={app.status}
          onValueChange={(v) => onStatusChange(app.id, v as Status)}
          disabled={busy}
        >
          <SelectTrigger size="sm" className="h-7 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ---------- Main module ----------
export default function JobsModule() {
  const { toast } = useToast()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([])

  const [loadingApps, setLoadingApps] = useState(true)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [errorApps, setErrorApps] = useState<string | null>(null)
  const [errorPortfolio, setErrorPortfolio] = useState<string | null>(null)

  const [appDialogOpen, setAppDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null)
  const [projDialogOpen, setProjDialogOpen] = useState(false)

  const [appToDelete, setAppToDelete] = useState<JobApplication | null>(null)
  const [projectToDelete, setProjectToDelete] =
    useState<PortfolioProject | null>(null)
  const [deletingApp, setDeletingApp] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)

  const [statusBusyId, setStatusBusyId] = useState<string | null>(null)

  const refetchApplications = useCallback(async () => {
    setLoadingApps(true)
    setErrorApps(null)
    try {
      const res = await fetch('/api/jobs/applications', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load applications')
      const data: JobApplication[] = await res.json()
      setApplications(data)
    } catch (err) {
      setErrorApps(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingApps(false)
    }
  }, [])

  const refetchPortfolio = useCallback(async () => {
    setLoadingPortfolio(true)
    setErrorPortfolio(null)
    try {
      const res = await fetch('/api/jobs/portfolio', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load portfolio')
      const data: PortfolioProject[] = await res.json()
      setPortfolio(data)
    } catch (err) {
      setErrorPortfolio(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingPortfolio(false)
    }
  }, [])

  useEffect(() => {
    void refetchApplications()
    void refetchPortfolio()
  }, [refetchApplications, refetchPortfolio])

  const handleStatusChange = useCallback(
    async (id: string, status: Status) => {
      setStatusBusyId(id)
      // optimistic update
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
      try {
        const res = await fetch(`/api/jobs/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.error || 'Failed to update status')
        }
        toast({
          title: 'Status updated',
          description: `Moved to ${status}`,
        })
      } catch (err) {
        toast({
          title: 'Error',
          description:
            err instanceof Error ? err.message : 'Failed to update status',
          variant: 'destructive',
        })
        // revert on error
        void refetchApplications()
      } finally {
        setStatusBusyId(null)
      }
    },
    [refetchApplications, toast]
  )

  const handleEditApp = (app: JobApplication) => {
    setEditingApp(app)
    setAppDialogOpen(true)
  }

  const handleAddApp = () => {
    setEditingApp(null)
    setAppDialogOpen(true)
  }

  const handleConfirmDeleteApp = async () => {
    if (!appToDelete) return
    setDeletingApp(true)
    try {
      const res = await fetch(`/api/jobs/applications/${appToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to delete application')
      }
      toast({
        title: 'Application deleted',
        description: `${appToDelete.company} · ${appToDelete.role}`,
      })
      setAppToDelete(null)
      await refetchApplications()
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to delete application',
        variant: 'destructive',
      })
    } finally {
      setDeletingApp(false)
    }
  }

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return
    setDeletingProject(true)
    try {
      const res = await fetch(`/api/jobs/portfolio/${projectToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to delete project')
      }
      toast({
        title: 'Project deleted',
        description: projectToDelete.title,
      })
      setProjectToDelete(null)
      await refetchPortfolio()
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to delete project',
        variant: 'destructive',
      })
    } finally {
      setDeletingProject(false)
    }
  }

  // ---------- Derived ----------
  const totalApps = applications.length
  const interviewCount = applications.filter(
    (a) => a.status === 'interview'
  ).length
  const offerCount = applications.filter((a) => a.status === 'offer').length

  const appsByStatus = (status: Status) =>
    applications.filter((a) => a.status === status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600">
              <Briefcase className="h-4 w-4" />
            </span>
            Jobs &amp; Portfolio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track job applications on a kanban board and showcase your best
            work in a portfolio gallery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAddApp}
            className="bg-sky-600 text-white hover:bg-sky-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add application
          </Button>
          <Button
            variant="outline"
            onClick={() => setProjDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add project
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="secondary"
          className="border-transparent bg-sky-500/10 px-3 py-1 text-sky-700 dark:text-sky-300"
        >
          <Briefcase className="mr-1 h-3.5 w-3.5" />
          {totalApps} {totalApps === 1 ? 'application' : 'applications'}
        </Badge>
        <Badge
          variant="secondary"
          className="border-transparent bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-300"
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          {interviewCount} interviewing
        </Badge>
        <Badge
          variant="secondary"
          className="border-transparent bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-300"
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {offerCount} {offerCount === 1 ? 'offer' : 'offers'}
        </Badge>
      </div>

      {/* Section 1 — Kanban board */}
      {errorApps ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load applications</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            <span>{errorApps}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetchApplications()}
              className="h-7"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {loadingApps
            ? COLUMNS.map((col) => (
                <Card key={col.status} className="w-[280px] shrink-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-6 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))
            : COLUMNS.map((col) => {
                const items = appsByStatus(col.status)
                return (
                  <Card key={col.status} className="w-[280px] shrink-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              col.dotClass
                            )}
                          />
                          {col.label}
                        </span>
                        <Badge className={col.badgeClass} variant="secondary">
                          {items.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                        {items.length === 0 ? (
                          <p className="py-8 text-center text-xs text-muted-foreground">
                            No applications
                          </p>
                        ) : (
                          items.map((app) => (
                            <ApplicationCard
                              key={app.id}
                              app={app}
                              onStatusChange={handleStatusChange}
                              onEdit={handleEditApp}
                              onDelete={setAppToDelete}
                              busy={statusBusyId === app.id}
                            />
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
        </div>
      )}

      {/* Section 2 — Portfolio gallery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-sky-500" />
              Portfolio
            </span>
            <Badge
              variant="secondary"
              className="border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-300"
            >
              {portfolio.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorPortfolio ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not load portfolio</AlertTitle>
              <AlertDescription className="flex items-center gap-3">
                <span>{errorPortfolio}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void refetchPortfolio()}
                  className="h-7"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : loadingPortfolio ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border">
                  <Skeleton className="aspect-video w-full" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : portfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground">
                Click &ldquo;Add project&rdquo; to showcase your work.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((p) => {
                const tagList = p.tags
                  ? p.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : []
                return (
                  <div
                    key={p.id}
                    className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/20 via-sky-400/10 to-emerald-500/20">
                          <span className="text-5xl font-bold text-sky-600/60">
                            {p.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="space-y-1">
                        <p className="font-semibold leading-tight">{p.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                      {tagList.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tagList.map((t, i) => (
                            <Badge
                              key={`${p.id}-tag-${i}`}
                              variant="secondary"
                              className="text-[11px] font-normal"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {p.url && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-900 dark:text-sky-300 dark:hover:bg-sky-950"
                          >
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              Open
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setProjectToDelete(p)}
                          aria-label={`Delete ${p.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ApplicationFormDialog
        open={appDialogOpen}
        onOpenChange={setAppDialogOpen}
        initial={editingApp}
        onSaved={() => void refetchApplications()}
      />
      <PortfolioFormDialog
        open={projDialogOpen}
        onOpenChange={setProjDialogOpen}
        onSaved={() => void refetchPortfolio()}
      />

      {/* Delete confirmations */}
      <AlertDialog
        open={!!appToDelete}
        onOpenChange={(open) => {
          if (!deletingApp && !open) setAppToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className="font-medium text-foreground">
                {appToDelete?.company} · {appToDelete?.role}
              </span>{' '}
              from your board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingApp}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleConfirmDeleteApp}
              disabled={deletingApp}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingApp && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!deletingProject && !open) setProjectToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className="font-medium text-foreground">
                {projectToDelete?.title}
              </span>{' '}
              from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProject}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmDeleteProject}
              disabled={deletingProject}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingProject && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
