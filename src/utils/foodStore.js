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
  lastParams: null,

  fetchAll: async (params = { includeDeleted: true }) => {
    set({ loading: true, error: null, lastParams: params });
    try {
      const jsonRes = await foodApi.getAll(params);
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
        await get().fetchAll(get().lastParams);
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
        await get().fetchAll(get().lastParams);
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

  restore: async (id) => {
    try {
      // Optimistically mark item as active in local state
      set(state => ({
        foods: state.foods.map(f => f.id === id ? { ...f, isDeleted: false, isAvailable: true } : f)
      }));

      const json = await foodApi.restore(id);
      if (json.success) {
        toast.success(json.message || 'Food item restored successfully');
        try {
          const channel = new BroadcastChannel('pos_foods_channel');
          channel.postMessage({ type: 'FOOD_UPDATED', id });
          channel.close();
        } catch {}
        if (json.data) {
          set(state => ({
            foods: state.foods.map(f => f.id === id ? { ...f, ...json.data, isDeleted: false, isAvailable: true } : f)
          }));
        }
        return { success: true, data: json.data };
      }
      await get().fetchAll(get().lastParams);
      toast.error(json.error || 'Failed to restore food item');
      return { success: false, error: json.error || 'Failed to restore food item' };
    } catch (e) {
      await get().fetchAll(get().lastParams);
      const errorMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Failed to restore food item';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  remove: async (id) => {
    try {
      // Optimistically update state so UI immediately archives item
      set(state => ({
        foods: state.foods.map(f => f.id === id ? { ...f, isDeleted: true, isAvailable: false } : f)
      }));

      const json = await foodApi.remove(id);
      if (json.success) {
        toast.success(json.message || 'Food item archived successfully');
        try {
          const channel = new BroadcastChannel('pos_foods_channel');
          channel.postMessage({ type: 'FOOD_UPDATED', id });
          channel.close();
        } catch {}
        return true;
      }
      // Revert if request failed
      await get().fetchAll(get().lastParams);
      toast.error(json.error || 'Failed to archive food item');
      return false;
    } catch (e) {
      await get().fetchAll(get().lastParams);
      const errorMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Item is linked to past orders and will be archived/hidden instead of permanently deleted.';
      toast.error(errorMsg);
      return false;
    }
  },
}));