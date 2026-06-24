/**
 * Food API service — handles all /foods endpoints.
 * Supports both JSON and FormData (for image uploads).
 */
import { apiClient } from './apiClient';

export const foodApi = {
  getAll: () => apiClient.get('/foods'),

  getById: (id) => apiClient.get(`/foods/${id}`),

  create: (formData) =>
    apiClient.post('/foods', formData), // FormData — no JSON content-type header needed

  update: (id, formData) =>
    apiClient.put(`/foods/${id}`, formData),

  remove: (id) =>
    apiClient.del(`/foods/${id}`),
};