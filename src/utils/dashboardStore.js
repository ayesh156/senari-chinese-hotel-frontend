import { useEffect } from 'react'
import { create } from 'zustand'
import { dashboardApi } from '../api/dashboard.api'

const DEFAULT_SUMMARY = {
  todaySales: { revenue: 0, completedOrders: 0 },
  occupiedTables: { occupied: 0, total: 0 },
  lowStockAlerts: { count: 0, items: [] },
  pendingPayables: { totalOutstanding: 0, supplierCount: 0 },
  todaySalesTrend: [],
  popularCategories: [],
  timestamp: null,
}

export const useDashboardStore = create((set, get) => ({
  data: DEFAULT_SUMMARY,
  loading: false,
  error: null,

  /**
   * Fetch the full dashboard summary from the API.
   * Clears errors on success.
   */
  fetchDashboardSummary: async () => {
    set({ loading: true, error: null })
    try {
      const res = await dashboardApi.getSummary()
      const payload = res?.data?.data || res?.data || DEFAULT_SUMMARY
      set({ data: payload, loading: false })
    } catch (err) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to load dashboard',
        loading: false,
      })
    }
  },

  // Reset to defaults
  reset: () => set({ data: DEFAULT_SUMMARY, loading: false, error: null }),
}))

/**
 * Hook for auto-polling the dashboard on an interval.
 * @param {number} intervalMs - Polling interval in milliseconds (default 30s)
 */
export function useDashboardPolling(intervalMs = 30_000) {
  const fetchDashboardSummary = useDashboardStore(s => s.fetchDashboardSummary)

  useEffect(() => {
    // Initial fetch
    fetchDashboardSummary()

    // Polling interval
    const id = setInterval(() => {
      fetchDashboardSummary()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, fetchDashboardSummary])
}