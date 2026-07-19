import { apiClient } from './apiClient';

export const analyticsApi = {
  getDashboard: (qs = '') => apiClient.get(`/analytics/dashboard${qs ? '?' + qs : ''}`),
  getSummary: (qs = '') => apiClient.get(`/analytics/dashboard/summary${qs ? '?' + qs : ''}`),
  getRevenueChart: (qs = '') => apiClient.get(`/analytics/dashboard/revenue-chart${qs ? '?' + qs : ''}`),
  getTopCategories: (qs = '') => apiClient.get(`/analytics/dashboard/top-categories${qs ? '?' + qs : ''}`),
  getFoodRankings: (qs = '') => apiClient.get(`/analytics/dashboard/food-rankings${qs ? '?' + qs : ''}`),
  getDetailed: (qs = '') => apiClient.get(`/analytics/detailed${qs ? '?' + qs : ''}`),
  getHourlyTraffic: (qs = '') => apiClient.get(`/analytics/detailed/hourly-traffic${qs ? '?' + qs : ''}`),
  getInventoryEfficiency: (qs = '') => apiClient.get(`/analytics/detailed/inventory-efficiency${qs ? '?' + qs : ''}`),
  getPaymentDistribution: (qs = '') => apiClient.get(`/analytics/detailed/payment-distribution${qs ? '?' + qs : ''}`),
  getMostProfitableFoods: (qs = '') => apiClient.get(`/analytics/detailed/most-profitable-foods${qs ? '?' + qs : ''}`),
};
