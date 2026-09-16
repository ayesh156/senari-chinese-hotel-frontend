/**
 * Zustand store for Food Items CRUD.
 * Uses the API layer (foodApi) instead of raw fetch.
 */
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { foodApi } from '../api/food.api';

export const useFoodStore = create((set, get) => ({
  foods: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await foodApi.getAll();
      const foodsArray = Array.isArray(jsonRes.data) ? jsonRes.data : (Array.isArray(jsonRes) ? jsonRes : []);
      set({ foods: foodsArray, loading: false, error: null });
    } catch (e) {
      console.error('[foodStore] fetchAll ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  // 🌟 Clean Create: Extracts exact backend validation error and forwards to Form without duplicate toasts
  create: async (formData) => {
    set({ loading: true, error: null });
    try {
      const json = await foodApi.create(formData);
      if (json.success) {
        await get().fetchAll();
        set({ loading: false, error: null });
        return { success: true, data: json.data };
      }
      const errMsg = json.error || 'Failed to create food item';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    } catch (e) {
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Failed to create food item';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  // 🌟 Clean Update: Captures exact backend duplicate code message and passes to caller (stops double toast)
  update: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const json = await foodApi.update(id, data);
      if (json.success) {
        await get().fetchAll();
        set({ loading: false, error: null });
        return { success: true, data: json.data };
      }
      const errMsg = json.error || 'Failed to update food item';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    } catch (e) {
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Failed to update food item';
      set({ loading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  remove: async (id) => {
    try {
      const json = await foodApi.remove(id);
      if (json.success) {
        await get().fetchAll();
        toast.success('Food item deleted successfully');
        return true;
      }
      toast.error(json.error || 'Failed to delete food item');
      return false;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Cannot delete: This record is currently in use.');
      return false;
    }
  },
}));