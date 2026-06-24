/**
 * Zustand store for Inventory Items.
 * Uses the API layer (inventoryApi) for all HTTP calls.
 */
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { inventoryApi } from '../api/inventory.api';

export function getStockStatus(item) {
  const qty = Number(item.quantityInStock ?? item.quantity ?? 0);
  const min = Number(item.minAlertLevel ?? item.minStockLevel ?? 0);
  if (qty <= 0) return 'out';
  if (qty <= min) return 'low';
  return 'in';
}

export function getStockValue(item) {
  const qty = Number(item.quantityInStock ?? item.quantity ?? 0);
  const price = Number(item.unitPrice ?? item.costPerUnit ?? 0);
  return qty * price;
}

function mapApiItem(item) {
  return {
    id: item.id,
    sku: item.sku,
    itemName: item.name,
    category: item.category?.name || '',
    quantityInStock: Number(item.quantity),
    unit: item.unit?.abbreviation || '',
    minAlertLevel: Number(item.minAlertLevel),
    unitPrice: Number(item.unitPrice),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const useInventoryStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const jsonRes = await inventoryApi.getAll();
      const rawItems = Array.isArray(jsonRes.data) ? jsonRes.data : (Array.isArray(jsonRes) ? jsonRes : []);
      set({ items: rawItems.map(mapApiItem), loading: false, error: null });
    } catch (e) {
      console.error('[inventoryStore] fetchAll ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  create: async (data) => {
    try {
      const json = await inventoryApi.create(data);
      if (json.success) {
        await get().fetchAll();
        toast.success('Inventory item added successfully');
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
      const json = await inventoryApi.update(id, data);
      if (json.success) {
        await get().fetchAll();
        toast.success('Inventory item updated successfully');
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to update');
      return { success: false, error: json.error || 'Failed to update' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to update');
      return { success: false, error: e.message };
    }
  },

  adjustStock: async (id, data) => {
    try {
      const json = await inventoryApi.adjustStock(id, data);
      if (json.success) {
        await get().fetchAll();
        toast.success(`Stock adjusted: ${data.adjustmentType || 'Manual Adjustment'}`);
        return { success: true, data: json.data };
      }
      toast.error(json.error || 'Failed to adjust stock');
      return { success: false, error: json.error || 'Failed to adjust stock' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to adjust stock');
      return { success: false, error: e.message };
    }
  },

  remove: async (id) => {
    try {
      const json = await inventoryApi.remove(id);
      if (json.success) {
        await get().fetchAll();
        toast.success('Inventory item deleted successfully');
        return { success: true };
      }
      toast.error(json.error || 'Failed to delete');
      return { success: false, error: json.error || 'Failed to delete' };
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Cannot delete: This record is currently in use.');
      return { success: false, error: e.message };
    }
  },
}));

export function calcTotalValue(items) {
  return items.reduce((sum, item) => sum + getStockValue(item), 0);
}
export function calcInStockCount(items) {
  return items.filter(item => getStockStatus(item) === 'in').length;
}
export function calcLowStockCount(items) {
  return items.filter(item => getStockStatus(item) === 'low').length;
}
export function calcOutOfStockCount(items) {
  return items.filter(item => getStockStatus(item) === 'out').length;
}