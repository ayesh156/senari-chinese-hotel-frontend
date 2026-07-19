import { apiClient } from './apiClient';

export const dashboardApi = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getTodaySales: () => apiClient.get('/dashboard/sales'),
  getOccupiedTables: () => apiClient.get('/dashboard/tables'),
  getLowStockAlerts: () => apiClient.get('/dashboard/low-stock'),
  getPendingPayables: () => apiClient.get('/dashboard/payables'),
  getSalesTrend: () => apiClient.get('/dashboard/sales-trend'),
  getPopularCategories: () => apiClient.get('/dashboard/popular-categories'),
};