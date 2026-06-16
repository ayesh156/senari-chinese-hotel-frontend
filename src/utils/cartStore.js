/**
 * Zustand store for POS Cart management.
 * Total = Subtotal - Discount (no tax/service charge).
 */
import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  // ── State ──
  cartItems: [],
  orderType: 'Dine-in',
  discount: '',
  discountType: '%',
  customerCash: '',
  customerName: '',
  isPaying: false,

  // ── Calculations ──────────────────────────────────────────────────────
  getSubtotal: () => {
    return get().cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal()
    const raw = parseFloat(get().discount) || 0
    return get().discountType === '%'
      ? Math.min(subtotal, Math.round(subtotal * raw / 100))
      : Math.min(subtotal, raw)
  },

  // Total = Subtotal - Discount (no tax or service charge)
  getGrandTotal: () => {
    return Math.max(0, get().getSubtotal() - get().getDiscountAmount())
  },

  // ── Actions ───────────────────────────────────────────────────────────
  addToCart: (foodItem) => {
    set((state) => {
      const existing = state.cartItems.find(i => i.id === foodItem.id)
      if (existing) {
        return {
          cartItems: state.cartItems.map(i =>
            i.id === foodItem.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return {
        cartItems: [...state.cartItems, {
          id: foodItem.id,
          name: foodItem.name,
          price: Number(foodItem.price),
          image: foodItem.image || '',
          quantity: 1,
        }],
      }
    })
  },

  removeFromCart: (id) => set((state) => ({ cartItems: state.cartItems.filter(i => i.id !== id) })),

  updateQuantity: (id, qty) => {
    if (qty <= 0) { get().removeFromCart(id); return }
    set((state) => ({ cartItems: state.cartItems.map(i => i.id === id ? { ...i, quantity: qty } : i) }))
  },

  increaseQuantity: (id) => set((state) => ({
    cartItems: state.cartItems.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i)
  })),

  decreaseQuantity: (id) => set((state) => {
    const item = state.cartItems.find(i => i.id === id)
    if (!item) return state
    if (item.quantity <= 1) return { cartItems: state.cartItems.filter(i => i.id !== id) }
    return { cartItems: state.cartItems.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i) }
  }),

  clearCart: () => set({ cartItems: [], discount: '', customerCash: '', customerName: '' }),

  setOrderType: (orderType) => set({ orderType }),
  setDiscount: (discount) => set({ discount }),
  setDiscountType: (discountType) => set({ discountType }),
  setCustomerCash: (customerCash) => set({ customerCash }),
  setCustomerName: (customerName) => set({ customerName }),

  // ── Submit order to backend ───────────────────────────────────────────
  submitOrder: async ({ orderType, invoiceNumber, customerName }) => {
    const state = get()
    if (state.cartItems.length === 0) return false

    set({ isPaying: true })
    try {
      const subtotal = state.getSubtotal()
      const discountAmt = state.getDiscountAmount()
      const total = state.getGrandTotal()

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: orderType === 'Dine-in' ? 'DINE_IN' : 'TAKEAWAY',
          items: state.cartItems.map(i => ({ foodId: i.id, quantity: i.quantity, unitPrice: i.price })),
          subtotal,
          discount: discountAmt,
          total,
          paymentMethod: 'Cash',
          customerName: customerName || 'Walk-in Customer',
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[cartStore] Order Submit Failed:', errorText)
        return false
      }

      const json = await res.json()
      if (json.success) {
        state.clearCart()
        return json.data // Return the full order from backend
      }
      console.error('[cartStore] submitOrder failed:', json.error)
      return false
    } catch (e) {
      console.error('[cartStore] submitOrder ERROR:', e.message)
      return false
    } finally {
      set({ isPaying: false })
    }
  },
}))