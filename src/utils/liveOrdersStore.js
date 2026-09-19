/**
 * Zustand store for Live Orders (Kanban board).
 * Uses the API layer (orderApi) instead of raw fetch.
 */
import { create } from 'zustand';
import { orderApi } from '../api/order.api';
// 🌟 apiClient default import එක ඉවත් කර ආරක්ෂිත orderApi / direct fetch භාවිතය

export const useLiveOrdersStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 🌟 Resilient Live Orders Fetcher: Syntax error වලින් තොරව live orders ලබා ගැනීම
  fetchLiveOrders: async () => {
    try {
      let rawList = [];

      // orderApi.getLive ක්‍රමය තිබේ නම් එයින්ද, නැතහොත් direct fetch මඟින්ද data ලබා ගනී
      if (typeof orderApi.getLive === 'function') {
        const res = await orderApi.getLive();
        rawList = res?.data || (Array.isArray(res) ? res : []);
      } else {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
        const res = await fetch('/api/orders/live', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        rawList = json?.data || (Array.isArray(json) ? json : []);
      }

      const ordersArray = Array.isArray(rawList) ? rawList : [];

      // Normalize status and type field consistency
      const normalized = ordersArray.map(o => ({
        ...o,
        status: (o.status || 'PENDING').toUpperCase(),
        orderType: o.orderType || o.type || 'DINE_IN',
      }));

      set({ orders: normalized });
    } catch (err) {
      console.error('[liveOrdersStore] fetchLiveOrders Error:', err);
    }
  },

  // 🌟 Immediate Deduplicated Add: Prepend new order and ensure correct status formatting
  addNewOrder: (order) => {
    if (!order || !order.id) return;
    set((state) => {
      const exists = state.orders.some((o) => o.id === order.id);
      const formatted = {
        ...order,
        status: (order.status || 'PENDING').toUpperCase(),
        orderType: order.orderType || order.type || 'DINE_IN',
      };
      if (exists) {
        return {
          orders: state.orders.map((o) => (o.id === order.id ? formatted : o)),
        };
      }
      return { orders: [formatted, ...state.orders] };
    });
  },

  // 🌟 Update order status and automatically remove if marked COMPLETED
  updateOrderStatus: (updatedOrder) => {
    set((state) => {
      if (updatedOrder.status === 'COMPLETED') {
        return { orders: state.orders.filter(o => o.id !== updatedOrder.id) };
      }
      return {
        orders: state.orders.map(o =>
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        ),
      };
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