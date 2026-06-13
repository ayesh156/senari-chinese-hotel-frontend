/**
 * POS system settings — persisted to localStorage until backend is ready.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const DEFAULT_REMINDER_TEMPLATE =
  `Dear {name}, you have a pending due of Rs. {dueAmount} at Senari Chinese Hotel. ` +
  `Please settle it at your earliest convenience. Thank you! — Senari Chinese Hotel`

export const DEFAULT_SETTINGS = {
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
}

export const useSettingsStore = create(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (partial) => set(s => ({ ...s, ...partial })),

      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name:    'pos-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
