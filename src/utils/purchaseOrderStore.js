import { toast } from 'react-toastify';
import { fmtCurrencyDirect } from './currency';
import { create } from 'zustand';
import { purchaseOrderApi } from '../api/purchaseOrder.api';

export const PO_STATUS = {
  PAID:    'PAID',
  UNPAID:  'UNPAID',
  PARTIAL: 'PARTIAL',
};

export const PO_STATUS_LABELS = {
  [PO_STATUS.PAID]:    'Paid',
  [PO_STATUS.UNPAID]:  'Unpaid',
  [PO_STATUS.PARTIAL]: 'Partial',
};

export const usePurchaseOrderStore = create((set, get) => ({
  orders: [],
  suppliers: [],
  inventoryItems: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await purchaseOrderApi.getAll();
      set({ orders: Array.isArray(jsonRes.data) ? jsonRes.data : [], loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  create: async (data) => {
    try {
      const json = await purchaseOrderApi.create(data);
      if (json.success) {
        await get().fetchAll();
        toast.success('Purchase order created');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to create purchase order');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to create purchase order');
      return { success: false, error: e.message };
    }
  },

  update: async (id, data) => {
    try {
      const json = await purchaseOrderApi.update(id, data);
      if (json.success) {
        await get().fetchAll();
        toast.success('Purchase order updated');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to update purchase order');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to update purchase order');
      return { success: false, error: e.message };
    }
  },

  remove: async (id) => {
    try {
      const json = await purchaseOrderApi.remove(id);
      if (json.success) {
        await get().fetchAll();
        toast.success('Purchase order deleted');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete purchase order');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to delete purchase order');
      return { success: false, error: e.message };
    }
  },

  settle: async (id, amount, paymentMethod, notes) => {
    try {
      const json = await purchaseOrderApi.settle(id, amount, paymentMethod, notes);
      if (json.success) {
        await get().fetchAll();
        toast.success(`Payment of Rss. ${fmtCurrencyDirect(amount)} recorded`);
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Settlement failed');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Settlement failed');
      return { success: false, error: e.message };
    }
  },
}));