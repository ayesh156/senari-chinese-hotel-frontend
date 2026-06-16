/**
 * Zustand store for Invoice/Order management.
 * Fetches orders from GET /api/orders.
 */
import { create } from 'zustand'

export const useInvoiceStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const rawRes = await fetch(`${baseUrl}/orders`)
      const jsonRes = await rawRes.json()

      const ordersArray = Array.isArray(jsonRes.data)
        ? jsonRes.data
        : (Array.isArray(jsonRes) ? jsonRes : [])

      set({ orders: ordersArray, loading: false, error: null })
      console.log(`[invoiceStore] fetchOrders → ${ordersArray.length} orders`)
    } catch (e) {
      console.error('[invoiceStore] fetchOrders ERROR:', e.message)
      set({ error: e.message, loading: false })
    }
  },

  deleteOrder: async (id) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/orders/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await get().fetchOrders()
        return true
      }
      return false
    } catch (e) {
      console.error('[invoiceStore] deleteOrder ERROR:', e.message)
      return false
    }
  },
}))