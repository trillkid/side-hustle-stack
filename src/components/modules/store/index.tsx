'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

import { useCart, type CartItem } from './cart-store'

// ---------- types ----------
type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  createdAt: string
}

type StoreOrder = {
  id: string
  customerName: string
  email: string
  total: number
  itemsJson: string
  status: string
  createdAt: string
}

// ---------- small helpers ----------
function ProductImage({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false)
  const showImg = src && !broken
  return (
    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-t-xl">
      {showImg ? (
        <img
          src={src}
          alt={name}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-stone-100 dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-900">
          <Package className="h-10 w-10 text-amber-500/60" />
        </div>
      )}
    </AspectRatio>
  )
}

// ---------- main component ----------
export default function StoreModule() {
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const items = useCart((s) => s.items)
  const addToCart = useCart((s) => s.add)
  const removeFromCart = useCart((s) => s.remove)
  const setQty = useCart((s) => s.setQty)
  const clearCart = useCart((s) => s.clear)

  const cartCount = useMemo(
    () => items.reduce((s, i) => s + i.qty, 0),
    [items]
  )
  const cartSubtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items]
  )

  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [query, setQuery] = useState('')

  const [cartOpen, setCartOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError(null)
    try {
      const params = new URLSearchParams()
      if (activeCategory && activeCategory !== 'All')
        params.set('category', activeCategory)
      const res = await fetch(
        `/api/store/products${params.toString() ? `?${params}` : ''}`,
        { cache: 'no-store' }
      )
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      setProductsError('Could not load products. Please retry.')
    } finally {
      setLoadingProducts(false)
    }
  }, [activeCategory])

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    setOrdersError(null)
    try {
      const res = await fetch('/api/store/orders', { cache: 'no-store' })
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setOrders(data.orders ?? [])
    } catch {
      setOrdersError('Could not load recent orders.')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.category && set.add(p.category))
    return ['All', ...Array.from(set)]
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [products, query])

  const handleAddToCart = (p: Product) => {
    addToCart({ productId: p.id, name: p.name, price: p.price })
    toast({
      title: 'Added to cart',
      description: p.name,
    })
  }

  return (
    <div className="space-y-6">
      {/* ---------- header ---------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
              <ShoppingBag className="h-5 w-5" />
            </span>
            Digital Product Store
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sell templates, presets, eBooks &amp; more. Add products, build a
            cart, and check out — all in one place.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAddOpen(true)}
            className="border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Button>
          <Button
            onClick={() => setCartOpen(true)}
            className="bg-amber-500 text-white shadow-sm hover:bg-amber-600"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-xs font-semibold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ---------- filters ---------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = c === activeCategory
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                aria-pressed={active}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-amber-500 text-white'
                    : 'border border-border bg-background text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300'
                )}
              >
                {c}
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
      </div>

      {/* ---------- products grid ---------- */}
      {loadingProducts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : productsError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{productsError}</span>
            <Button size="sm" variant="outline" onClick={fetchProducts}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs text-muted-foreground">
              Try a different search or add your first product.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <Card
              key={p.id}
              className="group overflow-hidden transition-shadow hover:shadow-md"
            >
              <ProductImage src={p.image} name={p.name} />
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {p.category}
                  </Badge>
                  <span className="text-base font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(p.price)}
                  </span>
                </div>
                <h3 className="line-clamp-1 font-semibold leading-tight">
                  {p.name}
                </h3>
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                  {p.description}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
                  onClick={() => handleAddToCart(p)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ---------- recent orders ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-amber-500" />
            Recent orders
          </CardTitle>
          <CardDescription>
            The latest 5 orders placed in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : ordersError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not load orders</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{ordersError}</span>
                <Button size="sm" variant="outline" onClick={fetchOrders}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
              <p className="text-sm text-muted-foreground">No orders yet.</p>
              <p className="text-xs text-muted-foreground">
                Add products to your cart and check out to see them here.
              </p>
            </div>
          ) : (
            <ul className="-mx-2 max-h-96 divide-y overflow-y-auto pr-1 [scrollbar-width:thin]">
              {orders.slice(0, 5).map((o) => {
                let itemCount = 0
                try {
                  const parsed = JSON.parse(o.itemsJson) as CartItem[]
                  itemCount = Array.isArray(parsed)
                    ? parsed.reduce((s, i) => s + (i.qty || 0), 0)
                    : 0
                } catch {
                  itemCount = 0
                }
                return (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 px-2 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {o.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.email} · {itemCount} item{itemCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(o.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ---------- add product dialog ---------- */}
      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          fetchProducts()
          fetchOrders()
        }}
      />

      {/* ---------- cart sheet ---------- */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'flex flex-col gap-0 p-0',
            isMobile ? 'max-h-[90vh]' : 'sm:max-w-md'
          )}
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
              Your cart
            </SheetTitle>
            <SheetDescription>
              {cartCount > 0
                ? `${cartCount} item${cartCount === 1 ? '' : 's'} ready to check out.`
                : 'Your cart is empty.'}
            </SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No items yet</p>
              <p className="text-xs text-muted-foreground">
                Browse the store and add something you like.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
              <ul className="space-y-2">
                {items.map((i) => (
                  <li
                    key={i.productId}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(i.price)} each
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(i.price * i.qty)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setQty(i.productId, i.qty - 1)}
                        aria-label={`Decrease ${i.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm tabular-nums">
                        {i.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setQty(i.productId, i.qty + 1)}
                        aria-label={`Increase ${i.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(i.productId)}
                        aria-label={`Remove ${i.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SheetFooter className="border-t p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => clearCart()}
                disabled={items.length === 0}
              >
                Clear
              </Button>
              <Button
                className="flex-[2] bg-amber-500 text-white hover:bg-amber-600"
                disabled={items.length === 0}
                onClick={() => setCheckoutOpen(true)}
              >
                Checkout
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ---------- checkout dialog ---------- */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={items}
        subtotal={cartSubtotal}
        onSuccess={() => {
          clearCart()
          setCartOpen(false)
          setCheckoutOpen(false)
          fetchOrders()
        }}
      />
    </div>
  )
}

// ---------- add product dialog ----------
function AddProductDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setName('')
    setDescription('')
    setPrice('')
    setImage('')
    setCategory('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = Number.parseFloat(price)
    if (
      !name.trim() ||
      !description.trim() ||
      !category.trim() ||
      Number.isNaN(priceNum) ||
      priceNum < 0
    ) {
      toast({
        title: 'Missing fields',
        description: 'Name, description, category and a valid price are required.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/store/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: priceNum,
          image,
          category,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to create product')
      }
      toast({
        title: 'Product added',
        description: `${name} is now live in your store.`,
      })
      reset()
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast({
        title: 'Could not add product',
        description: err instanceof Error ? err.message : 'Unknown error',
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
        if (!submitting) onOpenChange(v)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new product</DialogTitle>
          <DialogDescription>
            Fill in the details. The product will appear at the top of your
            store immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Notion Productivity OS"
              disabled={submitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <Input
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line description of what buyers get"
              disabled={submitting}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-price">Price (CAD)</Label>
              <Input
                id="p-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.00"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-cat">Category</Label>
              <Input
                id="p-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Template, eBook, Preset…"
                disabled={submitting}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-img">Image URL (optional)</Label>
            <Input
              id="p-img"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for a gradient placeholder.
            </p>
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
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Add product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- checkout dialog ----------
function CheckoutDialog({
  open,
  onOpenChange,
  items,
  subtotal,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  items: CartItem[]
  subtotal: number
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ total: number; mock?: boolean } | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setSuccess(null)
  }

  const handleClose = (v: boolean) => {
    if (submitting) return
    onOpenChange(v)
    if (!v) {
      // allow close animation before wiping state
      setTimeout(reset, 200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: 'Check your details',
        description: 'We need a valid name and email.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      // Call the unified checkout endpoint. If Stripe is configured, it
      // returns { url } to redirect to. Otherwise it returns { mock: true }
      // and creates a mock order.
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          email,
          items: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to start checkout')
      }
      const data = await res.json()

      if (data.url) {
        // Real Stripe — redirect to Stripe-hosted checkout
        toast({
          title: 'Redirecting to Stripe…',
          description: 'Complete your card payment on the secure Stripe page.',
        })
        window.location.href = data.url
        return
      }

      // Mock mode — order was created with status 'mock'
      setSuccess({
        total: items.reduce((s, i) => s + i.price * i.qty, 0),
        mock: true,
      })
      toast({
        title: 'Mock order placed',
        description:
          'Stripe is not connected yet, so no real money moved. Connect Stripe in Settings to accept real payments.',
        variant: 'default',
      })
      onSuccess()
    } catch (err) {
      toast({
        title: 'Checkout failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                success.mock ? 'bg-amber-500/15' : 'bg-emerald-500/15'
              }`}
            >
              <CheckCircle2
                className={`h-8 w-8 ${
                  success.mock ? 'text-amber-600' : 'text-emerald-600'
                }`}
              />
            </div>
            <DialogTitle className="text-xl">
              {success.mock ? 'Mock order placed' : 'Order placed!'}
            </DialogTitle>
            <DialogDescription>
              {success.mock ? (
                <>
                  This was a <strong>mock</strong> order for{' '}
                  {formatCurrency(success.total)} — no real money moved. Connect
                  Stripe in <strong>Settings</strong> to accept real card
                  payments.
                </>
              ) : (
                <>
                  Your payment of{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(success.total)}
                  </span>{' '}
                  was processed successfully. A confirmation has been sent to
                  your email.
                </>
              )}
            </DialogDescription>
            <Button
              className="mt-2 bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => handleClose(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>
                Enter your details. If Stripe is connected, you&apos;ll be
                redirected to a secure Stripe page to pay. Otherwise this will
                be a mock order.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">Customer name</Label>
                <Input
                  id="c-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {items.length} item{items.length === 1 ? '' : 's'}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="bg-amber-500 text-white hover:bg-amber-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    `Pay ${formatCurrency(subtotal)}`
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
