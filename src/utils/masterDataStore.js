/**
 * Centralized lookup data for POS (categories, units).
 * Stores FULL objects from the backend API.
 * Uses the api/ layer for all HTTP calls.
 */
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { categoryApi } from '../api/category.api';
import { unitApi } from '../api/unit.api';

export const useMasterDataStore = create((set, get) => ({
  foodCategories: [],
  inventoryCategories: [],
  units: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [foodJson, invJson, unitJson] = await Promise.all([
        categoryApi.getAll('FOOD'),
        categoryApi.getAll('INVENTORY'),
        unitApi.getAll(),
      ]);
      const foodList = Array.isArray(foodJson.data) ? foodJson.data : (Array.isArray(foodJson) ? foodJson : []);
      const invList = Array.isArray(invJson.data) ? invJson.data : (Array.isArray(invJson) ? invJson : []);
      const unitList = Array.isArray(unitJson.data) ? unitJson.data : (Array.isArray(unitJson) ? unitJson : []);
      set({ foodCategories: foodList, inventoryCategories: invList, units: unitList, loading: false, error: null });
    } catch (e) {
      console.error('[masterDataStore] fetchAll ERROR:', e.message);
      set({ error: e.message, loading: false });
    }
  },

  addFoodCategory: async (name) => {
    try {
      await categoryApi.create({ name, type: 'FOOD' });
      await get().fetchAll();
      toast.success('Food category added');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to add');
      return false;
    }
  },

  renameFoodCategory: async (oldName, newName) => {
    try {
      const category = get().foodCategories.find(c => c.name === oldName);
      if (!category) return false;
      await categoryApi.update(category.id, { name: newName });
      await get().fetchAll();
      toast.success('Food category renamed');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to rename');
      return false;
    }
  },

  deleteFoodCategory: async (name) => {
    try {
      const category = get().foodCategories.find(c => c.name === name);
      if (!category) return;
      await categoryApi.remove(category.id);
      await get().fetchAll();
      toast.success('Food category deleted');
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to delete');
    }
  },

  addInventoryCategory: async (name) => {
    try {
      await categoryApi.create({ name, type: 'INVENTORY' });
      await get().fetchAll();
      toast.success('Inventory category added');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to add');
      return false;
    }
  },

  renameInventoryCategory: async (oldName, newName) => {
    try {
      const category = get().inventoryCategories.find(c => c.name === oldName);
      if (!category) return false;
      await categoryApi.update(category.id, { name: newName });
      await get().fetchAll();
      toast.success('Inventory category renamed');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to rename');
      return false;
    }
  },

  deleteInventoryCategory: async (name) => {
    try {
      const category = get().inventoryCategories.find(c => c.name === name);
      if (!category) return;
      await categoryApi.remove(category.id);
      await get().fetchAll();
      toast.success('Inventory category deleted');
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to delete');
    }
  },

  addUnit: async (name) => {
    try {
      const abbreviation = name.toLowerCase().replace(/\s+/g, '');
      await unitApi.create({ name, abbreviation });
      await get().fetchAll();
      toast.success('Unit added');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to add');
      return false;
    }
  },

  renameUnit: async (oldName, newName) => {
    try {
      const unit = get().units.find(u => u.name === oldName);
      if (!unit) return false;
      const abbreviation = newName.toLowerCase().replace(/\s+/g, '');
      await unitApi.update(unit.id, { name: newName, abbreviation });
      await get().fetchAll();
      toast.success('Unit renamed');
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to rename');
      return false;
    }
  },

  deleteUnit: async (name) => {
    try {
      const unit = get().units.find(u => u.name === name);
      if (!unit) return;
      await unitApi.remove(unit.id);
      await get().fetchAll();
      toast.success('Unit deleted');
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to delete');
    }
  },
}));

export function buildFoodCategoryFilterOptions(categories) {
  if (!Array.isArray(categories)) return [{ value: 'All', label: 'All Categories' }];
  return [
    { value: 'All', label: 'All Categories' },
    ...categories.map(c => ({ value: c.name, label: c.name })),
  ];
}

export function buildSelectOptions(list) {
  if (!Array.isArray(list)) return [];
  return list.map(v => ({ value: v.name || v, label: v.name || v }));
}