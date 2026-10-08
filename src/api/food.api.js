/**
 * Food API service — handles all /foods endpoints.
 * Supports both JSON and FormData (for image uploads).
 */
import { apiClient } from './apiClient';

export const foodApi = {
  getAll: (params) => {
    let query = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      const str = searchParams.toString();
      if (str) query = `?${str}`;
    }
    return apiClient.get(`/foods${query}`);
  },

  getById: (id) => apiClient.get(`/foods/${id}`),

  getPopularFoods: (limit = 8) =>
    apiClient.get(`/foods/popular?limit=${limit}`),

  create: (formData) =>
    apiClient.post('/foods', formData), // FormData — no JSON content-type header needed

  update: (id, formData) =>
    apiClient.put(`/foods/${id}`, formData),

  restore: (id) =>
    apiClient.patch(`/foods/${id}/restore`),

  remove: (id) =>
    apiClient.del(`/foods/${id}`),
};
