/**
 * Zustand store for Live Orders (Kanban board).
 * Uses the API layer (orderApi) instead of raw fetch.
 */
import { create } from 'zustand';
import { orderApi } from '../api/order.api';

export const useLiveOrdersStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // ── Fetch active orders for Kanban board with auth token guard ──
  fetchLiveOrders: async () => {
    // Guard: Prevent firing network calls if the user is logging out or has no valid token
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pos-access-token') : null;
    if (!token) {
      set({ orders: [], loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const jsonRes = await orderApi.getLive();
      const list = Array.isArray(jsonRes.data)
        ? jsonRes.data
        : (Array.isArray(jsonRes) ? jsonRes : []);
      set({ orders: list, loading: false, error: null });
      console.log(`[liveOrdersStore] fetchLiveOrders → ${list.length} orders`);
    } catch (e) {
      console.error('[liveOrdersStore] fetchLiveOrders ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  // Called by Socket.io listener when status changes
  updateOrderStatus: (updatedOrder) => {
    set((state) => {
      if (updatedOrder.status === 'COMPLETED') {
        return { orders: state.orders.filter(o => o.id !== updatedOrder.id) };
      }
      return {
        orders: state.orders.map(o =>
          o.id === updatedOrder.id ? updatedOrder : o
        ),
      };
    });
  },

  // 🌟 Real-time Order Placement Handler (Prepend to top of Kanban queue)
  addNewOrder: (order) => {
    set((state) => {
      // Prevent duplicate order insertion
      if (state.orders.some(o => o.id === order.id)) return state;
      // Prepend newest incoming order so it appears instantly at the very top
      return { orders: [order, ...state.orders] };
    });
  },

  advanceOrder: async (id, status) => {
    try {
      const json = await orderApi.updateStatus(id, status);
      if (json.success) {
        const current = get().orders;
        if (status === 'COMPLETED') {
          set({ orders: current.filter(o => o.id !== id) });
        } else {
          set({
            orders: current.map(o => o.id === id ? { ...o, status } : o),
          });
        }
        return true;
      }
      console.error('[liveOrdersStore] advanceOrder failed:', json.error);
      return false;
    } catch (e) {
      console.error('[liveOrdersStore] advanceOrder ERROR:', e.message);
      return false;
    }
  },
}));