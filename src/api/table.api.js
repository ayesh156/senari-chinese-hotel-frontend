import { apiClient } from './apiClient';

export const tableApi = {
  getAll: () => apiClient.get('/tables'),
  getById: (id) => apiClient.get(`/tables/${id}`),
  create: (data) => apiClient.post('/tables', data),
  updateStatus: (id, statusPayload) => apiClient.patch(`/tables/${id}/status`, statusPayload),
  remove: (id) => apiClient.del(`/tables/${id}`),
};