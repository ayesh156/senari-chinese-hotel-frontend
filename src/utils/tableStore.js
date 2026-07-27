import { toast } from 'react-toastify';
import { create } from 'zustand';
import { tableApi } from '../api/table.api';

export const useTableStore = create((set, get) => ({
  tables: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await tableApi.getAll();
      set({ tables: Array.isArray(jsonRes.data) ? jsonRes.data : [], loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  create: async (data) => {
    try {
      const json = await tableApi.create(data);
      if (json.success) {
        await get().fetchAll();
        toast.success(`Table "${data.tableNumber}" added successfully`);
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to add table');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to add table');
      return { success: false, error: e.message };
    }
  },

  updateStatus: async (id, statusPayload) => {
    try {
      const json = await tableApi.updateStatus(id, statusPayload);
      if (json.success) {
        // Optimistic: update local state immediately
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id ? { ...t, ...json.data } : t
          ),
        }));
        toast.success('Table status updated');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to update table status');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to update table status');
      // Re-fetch to sync
      get().fetchAll();
      return { success: false, error: e.message };
    }
  },

  remove: async (id) => {
    try {
      const json = await tableApi.remove(id);
      if (json.success) {
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== id),
        }));
        toast.success('Table deleted successfully');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete table');
      return { success: false, error: json.error };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Cannot delete: This table is currently in use.');
      // Re-fetch to sync
      get().fetchAll();
      return { success: false, error: e.message };
    }
  },
}));