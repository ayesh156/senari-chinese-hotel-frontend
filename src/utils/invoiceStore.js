/**
 * Zustand store for Invoice/Order management.
 * Uses both the orderApi (for CRUD) and invoiceApi (for dedicated invoice endpoints).
 */
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { orderApi } from '../api/order.api';
import { invoiceApi } from '../api/invoice.api';

export const useInvoiceStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await orderApi.getAll();
      const ordersArray = Array.isArray(jsonRes.data)
        ? jsonRes.data
        : (Array.isArray(jsonRes) ? jsonRes : []);
      set({ orders: ordersArray, loading: false, error: null, pagination: { total: ordersArray.length } });
      console.log(`[invoiceStore] fetchOrders → ${ordersArray.length} orders`);
    } catch (e) {
      console.error('[invoiceStore] fetchOrders ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  /**
   * Fetch invoices via the dedicated invoice API (with search/filter/pagination).
   */
  fetchInvoices: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await invoiceApi.getAll(params);
      const list = Array.isArray(result.data) ? result.data : [];
      set({
        orders: list,
        loading: false,
        error: null,
        pagination: result.pagination || { page: 1, limit: 50, total: list.length, totalPages: 1 },
      });
      return result;
    } catch (e) {
      console.error('[invoiceStore] fetchInvoices ERROR:', e.message);
      set({ error: e.message, loading: false });
      return null;
    }
  },

  /**
   * Fetch a single invoice with full breakdown.
   */
  fetchInvoiceById: async (id) => {
    try {
      const result = await invoiceApi.getById(id);
      return result.data;
    } catch (e) {
      console.error('[invoiceStore] fetchInvoiceById ERROR:', e.message);
      return null;
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

  /**
   * Create a manual invoice via the invoice API.
   */
  createInvoice: async (data) => {
    try {
      const result = await invoiceApi.create(data);
      if (result.success && result.data) {
        get().addInvoiceToList(result.data);
        toast.success(`Invoice ${result.data.invoiceNumber} created successfully`);
        return result.data;
      }
      const errMsg = result.error || 'Failed to create invoice';
      toast.error(errMsg);
      return null;
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to create invoice';
      toast.error(msg);
      console.error('[invoiceStore] createInvoice ERROR:', e.message);
      return null;
    }
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