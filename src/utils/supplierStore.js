import { toast } from 'react-toastify';
import { create } from 'zustand';
import { supplierApi } from '../api/supplier.api';

export const useSupplierStore = create((set, get) => ({
  suppliers: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await supplierApi.getAll();
      set({ suppliers: Array.isArray(jsonRes.data) ? jsonRes.data : [], loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  create: async (data) => {
    try {
      const json = await supplierApi.create(data);
      if (json.success) { await get().fetchAll(); toast.success('Supplier added successfully'); return { success: true, data: json.data }; }
      toast.error(json.error || 'Failed to add supplier');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to add supplier');
      return { success: false, error: e.message };
    }
  },

  update: async (id, data) => {
    try {
      const json = await supplierApi.update(id, data);
      if (json.success) { await get().fetchAll(); toast.success('Supplier updated successfully'); return { success: true, data: json.data }; }
      toast.error(json.error || 'Failed to update supplier');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to update supplier');
      return { success: false, error: e.message };
    }
  },

  remove: async (id) => {
    try {
      const json = await supplierApi.remove(id);
      if (json.success) { await get().fetchAll(); toast.success('Supplier deleted successfully'); return { success: true }; }
      toast.error(json.error || 'Failed to delete supplier');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Cannot delete: This record is currently in use.');
      return { success: false, error: e.message };
    }
  },

  settle: async (id, amount) => {
    try {
      const json = await supplierApi.settle(id, amount);
      if (json.success) { await get().fetchAll(); toast.success(`Payment of Rs. ${amount.toLocaleString('en-LK')} recorded`); return { success: true, data: json.data }; }
      toast.error(json.error || 'Settlement failed');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Settlement failed');
      return { success: false, error: e.message };
    }
  },

  sendReminder: async (id, message) => {
    try {
      const json = await supplierApi.sendReminder(id, message);
      if (json.success) { await get().fetchAll(); toast.success('Reminder sent successfully'); return { success: true }; }
      toast.error(json.error || 'Failed to send reminder');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to send reminder');
      return { success: false, error: e.message };
    }
  },
}));