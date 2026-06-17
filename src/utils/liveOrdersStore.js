/**
 * Zustand store for Live Orders (Kanban board).
 * Fetches from GET /api/orders/live.
 * Supports Socket.io real-time updates.
 */
import { create } from 'zustand'

export const useLiveOrdersStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchLiveOrders: async () => {
    set({ loading: true, error: null })
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const rawRes = await fetch(`${baseUrl}/orders/live`)
      const jsonRes = await rawRes.json()

      const list = Array.isArray(jsonRes.data)
        ? jsonRes.data
        : (Array.isArray(jsonRes) ? jsonRes : [])

      set({ orders: list, loading: false, error: null })
      console.log(`[liveOrdersStore] fetchLiveOrders → ${list.length} orders`)
    } catch (e) {
      console.error('[liveOrdersStore] fetchLiveOrders ERROR:', e.message)
      set({ error: e.message, loading: false })
    }
  },

  // Called by Socket.io listener when status changes
  updateOrderStatus: (updatedOrder) => {
    set((state) => {
      if (updatedOrder.status === 'COMPLETED') {
        // Remove from live board
        return { orders: state.orders.filter(o => o.id !== updatedOrder.id) }
      }
      // Replace with updated data
      return {
        orders: state.orders.map(o =>
          o.id === updatedOrder.id ? updatedOrder : o
        ),
      }
    })
  },

  // Called by Socket.io when a new order is placed via QuickPOS
  addNewOrder: (order) => {
    set((state) => {
      // Don't add duplicates
      if (state.orders.find(o => o.id === order.id)) return state
      return { orders: [...state.orders, order] }
    })
  },

  advanceOrder: async (id, status) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.success) {
        // Optimistic: apply locally immediately
        const current = get().orders
        if (status === 'COMPLETED') {
          set({ orders: current.filter(o => o.id !== id) })
        } else {
          set({
            orders: current.map(o => o.id === id ? { ...o, status } : o),
          })
        }
        return true
      }
      console.error('[liveOrdersStore] advanceOrder failed:', json.error)
      return false
    } catch (e) {
      console.error('[liveOrdersStore] advanceOrder ERROR:', e.message)
      return false
    }
  },
}))