/**
 * POS system settings — persisted to database via backend API with localStorage fallback.
 * The store auto-fetches from backend on app boot via App.jsx's fetchSettings() call.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { settingsApi } from '../api/settings.api'

export const DEFAULT_REMINDER_TEMPLATE =
  `Dear {name}, you have a pending due of Rs. {dueAmount} at Senari Chinese Hotel. ` +
  `Please settle it at your earliest convenience. Thank you! — Senari Chinese Hotel`

export const DEFAULT_SETTINGS = {
  // POS operational (local-only — not persisted to system_settings table)
  defaultTaxRate:              5,
  defaultServiceCharge:        10,
  applyTaxOnReceipt:           true,
  applyServiceChargeOnReceipt: true,
  defaultOrderType:            'Dine-in',
  defaultDiscountType:         'percent',
  maxDiscountPercent:          25,
  inventoryLowStockAlerts:     true,
  enablePaymentReminders:      true,
  showLowStockOnDashboard:     true,
  reminderMessageTemplate:     DEFAULT_REMINDER_TEMPLATE,

  // Backend-persisted system settings (singleton row in system_settings table)
  hotelName:              'Senari Chinese Hotel',
  reportTagline:          'Business Intelligence & Performance Report',
  confidentialityNotice:  'SENARI CHINESE HOTEL — Confidential',
  currencySymbol:         'Rs.',
  compactTableView:       false,
  darkMode:               true,
  playOrderSound:         true,
  autoAcceptOrders:       false,
  lowStockThreshold:      6,
  pdfOrientation:         'portrait',
  showGenerationTimestamp: true,
}

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      // Backend loading / error states
      backendLoading: false,
      backendError: null,

      // ── Local-only update (for UI toggles before save) ────────────
      updateSettings: (partial) => set(s => ({ ...s, ...partial })),

      // ── Fetch from backend (overrides local defaults) ──────────────
      fetchSettings: async () => {
        set({ backendLoading: true, backendError: null })
        try {
          const res = await settingsApi.get()
          const backend = res?.data?.data || res?.data || {}
          set(s => ({
            ...s,
            ...backend,
            backendLoading: false,
          }))
        } catch (err) {
          set({
            backendError: err?.response?.data?.message || err?.message || 'Failed to load settings',
            backendLoading: false,
          })
        }
      },

      // ── Save to backend (persists all system-setting fields) ───────
      saveSettingsToBackend: async () => {
        set({ backendLoading: true, backendError: null })
        try {
          const state = get()
          const payload = {
            hotelName:             state.hotelName,
            reportTagline:         state.reportTagline,
            confidentialityNotice: state.confidentialityNotice,
            currencySymbol:        state.currencySymbol,
            compactTableView:      state.compactTableView,
            darkMode:              state.darkMode,
            playOrderSound:        state.playOrderSound,
            autoAcceptOrders:      state.autoAcceptOrders,
            lowStockThreshold:     state.lowStockThreshold,
            pdfOrientation:        state.pdfOrientation,
            showGenerationTimestamp: state.showGenerationTimestamp,
          }
          const res = await settingsApi.update(payload)
          const backend = res?.data?.data || res?.data || {}
          set(s => ({
            ...s,
            ...backend,
            backendLoading: false,
          }))
          return true
        } catch (err) {
          set({
            backendError: err?.response?.data?.message || err?.message || 'Failed to save settings',
            backendLoading: false,
          })
          return false
        }
      },

      // ── Reset to local defaults ────────────────────────────────────
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name:    'pos-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)