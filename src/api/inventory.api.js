/**
 * Inventory API service — handles all /inventory endpoints.
 */
import { apiClient } from './apiClient';

export const inventoryApi = {
  getAll: () => apiClient.get('/inventory'),

  getById: (id) => apiClient.get(`/inventory/${id}`),

  getHistory: (id) => apiClient.get(`/inventory/${id}/history`),

  create: (data) => apiClient.post('/inventory', data),

  update: (id, data) => apiClient.put(`/inventory/${id}`, data),

  /** Dedicated endpoint for atomic stock adjustment + ledger entry */
  adjustStock: (id, data) => apiClient.put(`/inventory/${id}/adjust`, data),

  remove: (id) => apiClient.del(`/inventory/${id}`),
};