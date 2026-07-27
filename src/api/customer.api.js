/**
 * Customer API service — handles all /customers endpoints.
 */
import { apiClient } from './apiClient';

export const customerApi = {
  getAll: () => apiClient.get('/customers'),

  getById: (id) => apiClient.get(`/customers/${id}`),

  getPayments: (id) => apiClient.get(`/customers/${id}/payments`),

  getReminders: (id) => apiClient.get(`/customers/${id}/reminders`),

  create: (data) => apiClient.post('/customers', data),

  update: (id, data) => apiClient.put(`/customers/${id}`, data),

  remove: (id) => apiClient.del(`/customers/${id}`),

  settle: (id, amount) => apiClient.post(`/customers/${id}/settle`, { amount }),

  sendReminder: (id, message) => apiClient.post(`/customers/${id}/remind`, { message }),
};