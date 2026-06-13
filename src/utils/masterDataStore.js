/**
 * Centralized lookup data for POS (categories, units).
 * Stores FULL objects from the backend API.
 */
import { create } from 'zustand'
import { get, post, put, del } from '../lib/api'

export const useMasterDataStore = create((set, get) => ({
  // ── State (stores FULL objects: [{ id, name, type, createdAt }, ...]) ──
  foodCategories: [],
  inventoryCategories: [],
  units: [],
  loading: false,
  error: null,

  // ── fetchAll ─────────────────────────────────────────────────────────
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

      // 1. Fetch Food Categories
      const foodRaw = await fetch(`${baseUrl}/categories?type=FOOD`)
      const foodJson = await foodRaw.json()
      const foodList = Array.isArray(foodJson.data) ? foodJson.data : (Array.isArray(foodJson) ? foodJson : [])

      // 2. Fetch Inventory Categories
      const invRaw = await fetch(`${baseUrl}/categories?type=INVENTORY`)
      const invJson = await invRaw.json()
      const invList = Array.isArray(invJson.data) ? invJson.data : (Array.isArray(invJson) ? invJson : [])

      // 3. Fetch Units
      const unitRaw = await fetch(`${baseUrl}/units`)
      const unitJson = await unitRaw.json()
      const unitList = Array.isArray(unitJson.data) ? unitJson.data : (Array.isArray(unitJson) ? unitJson : [])

      console.log('[masterDataStore] Native fetchAll:', {
        foodCount: foodList.length,
        invCount: invList.length,
        unitCount: unitList.length,
        foodSample: foodList[0],
      })

      // FORCE INJECT INTO ZUSTAND
      set({
        foodCategories: foodList,
        inventoryCategories: invList,
        units: unitList,
        loading: false,
        error: null,
      })

      console.log('[masterDataStore] State after set:', {
        foodLen: get().foodCategories.length,
        invLen: get().inventoryCategories.length,
      })
    } catch (e) {
      console.error('[masterDataStore] Native fetchAll ERROR:', e.message)
      set({ error: e.message, loading: false })
    }
  },

  // ── CRUD: Food Categories ────────────────────────────────────────────
  addFoodCategory: async (name) => {
    try {
      await post('/categories', { name, type: 'FOOD' })
      await get().fetchAll()
      return true
    } catch (e) {
      console.error('[masterDataStore] addFoodCategory ERROR:', e.message)
      return false
    }
  },

  renameFoodCategory: async (oldName, newName) => {
    try {
      const category = get().foodCategories.find(c => c.name === oldName)
      if (!category) return false
      await put(`/categories/${category.id}`, { name: newName })
      await get().fetchAll()
      return true
    } catch (e) {
      console.error('[masterDataStore] renameFoodCategory ERROR:', e.message)
      return false
    }
  },

  deleteFoodCategory: async (name) => {
    try {
      const category = get().foodCategories.find(c => c.name === name)
      if (!category) return
      await del(`/categories/${category.id}`)
      await get().fetchAll()
    } catch (e) {
      console.error('[masterDataStore] deleteFoodCategory ERROR:', e.message)
    }
  },

  // ── CRUD: Inventory Categories ───────────────────────────────────────
  addInventoryCategory: async (name) => {
    try {
      await post('/categories', { name, type: 'INVENTORY' })
      await get().fetchAll()
      return true
    } catch (e) {
      console.error('[masterDataStore] addInventoryCategory ERROR:', e.message)
      return false
    }
  },

  renameInventoryCategory: async (oldName, newName) => {
    try {
      const category = get().inventoryCategories.find(c => c.name === oldName)
      if (!category) return false
      await put(`/categories/${category.id}`, { name: newName })
      await get().fetchAll()
      return true
    } catch (e) {
      console.error('[masterDataStore] renameInventoryCategory ERROR:', e.message)
      return false
    }
  },

  deleteInventoryCategory: async (name) => {
    try {
      const category = get().inventoryCategories.find(c => c.name === name)
      if (!category) return
      await del(`/categories/${category.id}`)
      await get().fetchAll()
    } catch (e) {
      console.error('[masterDataStore] deleteInventoryCategory ERROR:', e.message)
    }
  },

  // ── CRUD: Units ──────────────────────────────────────────────────────
  addUnit: async (name) => {
    try {
      const abbreviation = name.toLowerCase().replace(/\s+/g, '')
      await post('/units', { name, abbreviation })
      await get().fetchAll()
      return true
    } catch (e) {
      console.error('[masterDataStore] addUnit ERROR:', e.message)
      return false
    }
  },

  renameUnit: async (oldName, newName) => {
    try {
      const unit = get().units.find(u => u.name === oldName)
      if (!unit) return false
      const abbreviation = newName.toLowerCase().replace(/\s+/g, '')
      await put(`/units/${unit.id}`, { name: newName, abbreviation })
      await get().fetchAll()
      return true
    } catch (e) {
      console.error('[masterDataStore] renameUnit ERROR:', e.message)
      return false
    }
  },

  deleteUnit: async (name) => {
    try {
      const unit = get().units.find(u => u.name === name)
      if (!unit) return
      await del(`/units/${unit.id}`)
      await get().fetchAll()
    } catch (e) {
      console.error('[masterDataStore] deleteUnit ERROR:', e.message)
    }
  },
}))

/** Food filter dropdown: All + categories */
export function buildFoodCategoryFilterOptions(categories) {
  if (!Array.isArray(categories)) return [{ value: 'All', label: 'All Categories' }]
  return [
    { value: 'All', label: 'All Categories' },
    ...categories.map(c => ({ value: c.name, label: c.name })),
  ]
}

export function buildSelectOptions(list) {
  if (!Array.isArray(list)) return []
  return list.map(v => ({ value: v.name || v, label: v.name || v }))
}