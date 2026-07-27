import { create } from 'zustand';
import { analyticsApi } from '../api/analytics.api';

export const useReportStore = create((set, get) => ({
  dashboard: null,
  loading: false,
  error: null,
  // Filter state
  filterType: 'week', // 'day' | 'week' | 'month' | 'year' | 'range'
  startDate: null,
  endDate: null,

  setFilterType: (type) => set({ filterType: type }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),

  getPeriodText: () => {
    const { filterType, startDate, endDate } = get()
    const now = new Date()
    switch (filterType) {
      case 'day':
        return `Period: Today (${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})`
      case 'week':
        return 'Period: This Week'
      case 'month':
        if (startDate) {
          const [y, m] = startDate.split('-').map(Number)
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          return `Period: ${months[m - 1]} ${y}`
        }
        return 'Period: This Month'
      case 'year':
        return `Period: ${startDate || now.getFullYear()}`
      case 'range':
        if (startDate && endDate) return `Period: ${startDate} to ${endDate}`
        return 'Period: Custom Range'
      default:
        return 'Period: Selected Range'
    }
  },

  buildQueryString: () => {
    const { filterType, startDate, endDate } = get();
    const params = new URLSearchParams();
    params.set('filterType', filterType);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params.toString();
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const qs = get().buildQueryString();
      const [jsonRes, detailedRes] = await Promise.all([
        analyticsApi.getDashboard(qs),
        analyticsApi.getDetailed(qs),
      ]);
      if (jsonRes.success && jsonRes.data) {
        set({
          dashboard: {
            ...jsonRes.data,
            detailed: detailedRes.success ? detailedRes.data : null,
          },
          loading: false,
        });
        return jsonRes.data;
      }
      set({ loading: false, error: 'Invalid dashboard response' });
      return null;
    } catch (e) {
      set({ error: e.message || 'Failed to load dashboard', loading: false });
      return null;
    }
  },
}));

// Selector hooks
export const useDashboardSummary = () => {
  const dashboard = useReportStore((s) => s.dashboard);
  return dashboard?.summary ?? null;
};

export const useRevenueChart = () => {
  const dashboard = useReportStore((s) => s.dashboard);
  return dashboard?.revenueChart ?? [];
};

export const useTopCategories = () => {
  const dashboard = useReportStore((s) => s.dashboard);
  return dashboard?.topCategories ?? [];
};

export const useFoodRankings = () => {
  const dashboard = useReportStore((s) => s.dashboard);
  return dashboard?.foodRankings ?? null;
};

export const useDetailedAnalytics = () => {
  const dashboard = useReportStore((s) => s.dashboard);
  return dashboard?.detailed ?? null;
};

export const useHourlyTraffic = () => {
  const detailed = useDetailedAnalytics();
  return detailed?.hourlyTraffic ?? [];
};

export const useInventoryEfficiency = () => {
  const detailed = useDetailedAnalytics();
  return detailed?.inventoryEfficiency ?? null;
};

export const usePaymentDistribution = () => {
  const detailed = useDetailedAnalytics();
  return detailed?.paymentDistribution ?? [];
};

export const useProfitableFoods = () => {
  const detailed = useDetailedAnalytics();
  return detailed?.profitableFoods ?? null;
};