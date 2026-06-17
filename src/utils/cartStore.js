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
  // Hydrate cart from existing order (for edit mode)
  hydrateFromOrder: (order) => {
    let name = '';
    try { if (order.notes) { const p = JSON.parse(order.notes); if (p.customerName) name = p.customerName; } } catch {}
    if (!name) name = order.customerName || 'Walk-in Customer';
    const subtotal = Number(order.subtotal || 0);
    const discountAmt = Number(order.discount || 0);
    // Convert amount to percentage: if subtotal > 0, percent = (discountAmt / subtotal) * 100
    const percent = subtotal > 0 ? Math.round((discountAmt / subtotal) * 100) : 0;
    const items = (order.items || []).map(i => ({
      id: i.foodId || i.id,
      name: i.food?.name || i.name || 'Item',
      price: Number(i.unitPrice),
      image: i.food?.image || '',
      quantity: i.quantity,
    }))
    set({
      cartItems: items,
      orderType: order.type === 'DINE_IN' ? 'Dine-in' : 'Takeaway',
      discount: String(percent > 0 ? percent : ''),
      discountType: '%',
      customerCash: String(order.amountPaid || ''),
      customerName: name,
    })
  },

  updateOrder: async ({ orderId, orderType, customerName, amountPaid }) => {
    const state = get()
    if (state.cartItems.length === 0) return false
    set({ isPaying: true })
    try {
      const subtotal = state.getSubtotal()
      const discountAmt = state.getDiscountAmount()
      const total = state.getGrandTotal()
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: orderType === 'Dine-in' ? 'DINE_IN' : 'TAKEAWAY',
          items: state.cartItems.map(i => ({ foodId: i.id, quantity: i.quantity, unitPrice: i.price })),
          subtotal,
          discount: discountAmt,
          total,
          amountPaid: Number(amountPaid) || 0,
          customerName: customerName || 'Walk-in Customer',
        }),
      })
      if (!res.ok) { const errorText = await res.text(); console.error('[cartStore] Update Failed:', errorText); return false }
      const json = await res.json()
      if (json.success) {
        // Edit mode: DO NOT clear cart — user stays on the edit screen
        // Just return the updated data so the receipt modal can show
        return json.data
      }
      return false
    } catch (e) { console.error('[cartStore] updateOrder ERROR:', e.message); return false }
    finally { set({ isPaying: false }) }
  },

  submitOrder: async ({ orderType, invoiceNumber, customerName, amountPaid }) => {
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
          amountPaid: Number(amountPaid) || 0,
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