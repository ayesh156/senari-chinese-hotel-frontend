/**
 * Category API service — handles all /categories endpoints.
 */
import { apiClient } from './apiClient';

export const categoryApi = {
  getAll: (type) => {
    const query = type ? `?type=${type}` : '';
    return apiClient.get(`/categories${query}`);
  },

  create: (data) => apiClient.post('/categories', data),

  update: (id, data) => apiClient.put(`/categories/${id}`, data),

  remove: (id) => apiClient.del(`/categories/${id}`),
};