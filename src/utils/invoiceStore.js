/**
 * Zustand store for Invoice/Order management.
 * Uses the API layer (orderApi) instead of raw fetch.
 */
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { orderApi } from '../api/order.api';

export const useInvoiceStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await orderApi.getAll();
      const ordersArray = Array.isArray(jsonRes.data)
        ? jsonRes.data
        : (Array.isArray(jsonRes) ? jsonRes : []);
      set({ orders: ordersArray, loading: false, error: null });
      console.log(`[invoiceStore] fetchOrders → ${ordersArray.length} orders`);
    } catch (e) {
      console.error('[invoiceStore] fetchOrders ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  addInvoiceToList: (invoice) => {
    set((state) => {
      if (state.orders.find(o => o.id === invoice.id)) return state;
      return { orders: [invoice, ...state.orders] };
    });
  },

  updateInvoiceInList: (invoice) => {
    set((state) => {
      const filtered = state.orders.filter(o => o.id !== invoice.id);
      return { orders: [invoice, ...filtered] };
    });
  },

  deleteOrder: async (id) => {
    try {
      const json = await orderApi.remove(id);
      if (json.success) {
        await get().fetchOrders();
        toast.success('Invoice deleted successfully');
        return true;
      }
      const errMsg = json.error || 'Failed to delete invoice';
      toast.error(errMsg);
      return false;
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to delete invoice';
      toast.error(msg);
      console.error('[invoiceStore] deleteOrder ERROR:', e.message);
      return false;
    }
  },
}));