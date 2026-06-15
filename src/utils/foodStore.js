/**
 * Zustand store for Food Items CRUD.
 * Uses native fetch (not api.ts wrapper) to ensure bulletproof data extraction.
 */
import { create } from 'zustand'

export const useFoodStore = create((set, get) => ({
  // ── State ──
  foods: [],
  loading: false,
  error: null,

  // ── fetchAll ─────────────────────────────────────────────────────────
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const rawRes = await fetch(`${baseUrl}/foods`)
      const jsonRes = await rawRes.json()

      // Bulletproof extraction — same pattern as masterDataStore
      const foodsArray = Array.isArray(jsonRes.data)
        ? jsonRes.data
        : (Array.isArray(jsonRes) ? jsonRes : [])

      set({ foods: foodsArray, loading: false, error: null })
      console.log(`[foodStore] fetchAll → ${foodsArray.length} items`)
    } catch (e) {
      console.error('[foodStore] fetchAll ERROR:', e.message)
      set({ error: e.message, loading: false })
    }
  },

  // ── create ───────────────────────────────────────────────────────────
  create: async (data) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/foods`, {
        method: 'POST',
        body: data,
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchAll()
        return true
      }
      console.error('[foodStore] create failed:', json.error)
      return false
    } catch (e) {
      console.error('[foodStore] create ERROR:', e.message)
      return false
    }
  },

  // ── update ───────────────────────────────────────────────────────────
  update: async (id, data) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const isFormData = data instanceof FormData
      const res = await fetch(`${baseUrl}/foods/${id}`, {
        method: 'PUT',
        body: isFormData ? data : JSON.stringify(data),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        await get().fetchAll()
        return true
      }
      console.error('[foodStore] update failed:', json.error)
      return false
    } catch (e) {
      console.error('[foodStore] update ERROR:', e.message)
      return false
    }
  },

  // ── remove ───────────────────────────────────────────────────────────
  remove: async (id) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${baseUrl}/foods/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await get().fetchAll()
        return true
      }
      console.error('[foodStore] remove failed:', json.error)
      return false
    } catch (e) {
      console.error('[foodStore] remove ERROR:', e.message)
      return false
    }
  },
}))