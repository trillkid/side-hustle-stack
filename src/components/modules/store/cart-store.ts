'use client'

import { create } from 'zustand'

export type CartItem = {
  productId: string
  name: string
  price: number
  qty: number
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
  count: () => number
  subtotal: () => number
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) => {
    const items = get().items
    const existing = items.find((i) => i.productId === item.productId)
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
        ),
      })
    } else {
      set({ items: [...items, { ...item, qty }] })
    }
  },
  remove: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),
  setQty: (productId, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i.productId !== productId) })
      return
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, qty } : i
      ),
    })
  },
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}))
