/**
 * Unit API service — handles all /units endpoints.
 */
import { apiClient } from './apiClient';

export const unitApi = {
  getAll: () => apiClient.get('/units'),

  create: (data) => apiClient.post('/units', data),

  update: (id, data) => apiClient.put(`/units/${id}`, data),

  remove: (id) => apiClient.del(`/units/${id}`),
};