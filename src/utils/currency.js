/**
 * Centralized currency formatting helpers.
 * Reads the currency symbol from the Zustand settings store at render time.
 * All components should use these instead of hardcoded "Rs." strings.
 */
import { useSettingsStore } from './settingsStore'

/**
 * Hook-safe currency symbol selector.
 * Use this in React components to get the symbol dynamically.
 */
export function useCurrencySymbol() {
  return useSettingsStore(s => s.currencySymbol || 'Rs.')
}

/**
 * Format a number with the dynamic currency symbol prefix.
 * @param {number} value - Numeric value to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} e.g. "Rs. 1,234"
 */
export function fmtCurrency(value, options = {}) {
  const symbol = useSettingsStore.getState().currencySymbol || 'Rs.'
  const formatted = Number(value || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  })
  return `${symbol} ${formatted}`
}

/**
 * Direct format (no hook) for non-React contexts like PDF export helpers.
 * Gets the symbol from the store synchronously.
 */
export function fmtCurrencyDirect(value, options = {}) {
  const symbol = useSettingsStore.getState().currencySymbol || 'Rs.'
  const formatted = Number(value || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  })
  return `${symbol} ${formatted}`
}

/**
 * Format without symbol prefix for compact displays.
 */
export function fmtNumber(value, options = {}) {
  return Number(value || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    ...options,
  })
}