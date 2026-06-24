import { apiClient } from './apiClient';

export const purchaseOrderApi = {
  getAll: () => apiClient.get('/purchase-orders'),
  getById: (id) => apiClient.get(`/purchase-orders/${id}`),
  create: (data) => apiClient.post('/purchase-orders', data),
  update: (id, data) => apiClient.put(`/purchase-orders/${id}`, data),
  remove: (id) => apiClient.del(`/purchase-orders/${id}`),
  settle: (id, amount, paymentMethod, notes) => apiClient.post(`/purchase-orders/${id}/settle`, { amount, paymentMethod, notes }),
};