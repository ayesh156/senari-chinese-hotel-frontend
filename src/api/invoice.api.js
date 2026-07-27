/**
 * Invoice API client.
 * Invoices are stored as Orders in the backend, and we have a dedicated
 * /api/invoices endpoint with search/filter and full itemized breakdown.
 */
import { apiClient } from './apiClient';

export const invoiceApi = {
  /**
   * GET /api/invoices — fetch invoices with optional filters.
   * @param {object} params - { search, dateFrom, dateTo, paymentStatus, customerId, page, limit }
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });
    const qs = query.toString();
    const url = qs ? `/api/invoices?${qs}` : '/api/invoices';
    const res = await apiClient.get(url);
    // res = { success: true, data: [...], pagination: {...} } — return full response for store
    return res;
  },

  /**
   * GET /api/invoices/:id — fetch single invoice with breakdown.
   */
  getById: async (id) => {
    const res = await apiClient.get(`/api/invoices/${id}`);
    return res;
  },

  /**
   * POST /api/invoices — create a manual invoice.
   */
  create: async (data) => {
    const res = await apiClient.post('/api/invoices', data);
    return res;
  },
};