/**
 * authStore.js
 *
 * Lightweight auth state for the POS system.
 * Uses sessionStorage so the session clears when the browser tab is closed.
 *
 * Credentials (frontend-only demo — replace with real API auth when backend is ready):
 *   ADMIN    PIN: 1234
 *   CASHIER  PIN: 5678
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Staff accounts (demo — no real secrets here) ──────────────────────────────
export const STAFF_ACCOUNTS = [
  { id: 1, name: 'Admin',        role: 'ADMIN',   pin: '1234', avatar: 'A' },
  { id: 2, name: 'Cashier',      role: 'CASHIER', pin: '5678', avatar: 'C' },
  { id: 3, name: 'Nimal Silva',  role: 'CASHIER', pin: '9012', avatar: 'N' },
]

export const useAuthStore = create(
  persist(
    (set) => ({
      staff: null,          // { id, name, role, avatar } — null = logged out

      login:  (staffMember) => set({ staff: staffMember }),
      logout: ()            => set({ staff: null }),
    }),
    {
      name:    'pos-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the staff object, not the actions
      partialState: (state) => ({ staff: state.staff }),
    }
  )
)

/** Selector — true when a staff member is logged in */
export const selectIsAuthenticated = (s) => s.staff !== null
