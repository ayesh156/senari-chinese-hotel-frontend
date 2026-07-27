/**
 * Order API service — handles all /orders endpoints.
 */
import { apiClient } from './apiClient';

export const orderApi = {
  getAll: () => apiClient.get('/orders'),

  getLive: () => apiClient.get('/orders/live'),

  getById: (id) => apiClient.get(`/orders/${id}`),

  create: (data) => apiClient.post('/orders', data),

  update: (id, data) => apiClient.put(`/orders/${id}`, data),

  updateStatus: (id, status) =>
    apiClient.put(`/orders/${id}/status`, { status }),

  remove: (id) => apiClient.del(`/orders/${id}`),
};