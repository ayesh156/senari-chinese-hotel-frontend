/**
 * Zustand store for Customer management.
 * Uses the API layer (customerApi) for all HTTP calls.
 * Computes derived stats (totalOrders, totalSpent, dueAmount) from the backend response.
 */
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { customerApi } from '../api/customer.api';

export const useCustomerStore = create((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await customerApi.getAll();
      const data = Array.isArray(jsonRes.data) ? jsonRes.data : (Array.isArray(jsonRes) ? jsonRes : []);
      set({ customers: data, loading: false, error: null });
    } catch (e) {
      console.error('[customerStore] fetchAll ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  create: async (data) => {
    try {
      const json = await customerApi.create(data);
      if (json.success) {
        await get().fetchAll();
        toast.success('Customer added successfully');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to create');
      return { success: false, error: json.error || 'Failed to create' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to create');
      return { success: false, error: e.message };
    }
  },

  update: async (id, data) => {
    try {
      const json = await customerApi.update(id, data);
      if (json.success) {
        await get().fetchAll();
        toast.success('Customer updated successfully');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to update');
      return { success: false, error: json.error || 'Failed to update' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to update');
      return { success: false, error: e.message };
    }
  },

  remove: async (id) => {
    try {
      const json = await customerApi.remove(id);
      if (json.success) {
        await get().fetchAll();
        toast.success('Customer deleted successfully');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete');
      return { success: false, error: json.error || 'Failed to delete' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Cannot delete: This record is currently in use.');
      return { success: false, error: e.message };
    }
  },

  settle: async (id, amount) => {
    try {
      const json = await customerApi.settle(id, amount);
      if (json.success) {
        await get().fetchAll();
        toast.success(`Payment of Rs. ${Number(amount).toLocaleString('en-LK')} recorded`);
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Settlement failed');
      return { success: false, error: json.error || 'Failed to settle' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Settlement failed');
      return { success: false, error: e.message };
    }
  },

  sendReminder: async (id, message) => {
    try {
      const json = await customerApi.sendReminder(id, message);
      if (json.success) {
        await get().fetchAll();
        toast.success('Reminder sent successfully');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to send reminder');
      return { success: false, error: json.error || 'Failed to send reminder' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to send reminder');
      return { success: false, error: e.message };
    }
  },
}));

export function calcDueCount(customers) {
  return customers.filter(c => Number(c.dueAmount || 0) > 0).length;
}

export function calcTotalDue(customers) {
  return customers.reduce((sum, c) => sum + Number(c.dueAmount || 0), 0);
}

export function calcTotalSpent(customers) {
  return customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
}