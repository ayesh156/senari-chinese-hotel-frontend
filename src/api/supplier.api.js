import { apiClient } from './apiClient';

export const supplierApi = {
  getAll: () => apiClient.get('/suppliers'),
  getById: (id) => apiClient.get(`/suppliers/${id}`),
  getPayments: (id) => apiClient.get(`/suppliers/${id}/payments`),
  getReminders: (id) => apiClient.get(`/suppliers/${id}/reminders`),
  create: (data) => apiClient.post('/suppliers', data),
  update: (id, data) => apiClient.put(`/suppliers/${id}`, data),
  remove: (id) => apiClient.del(`/suppliers/${id}`),
  settle: (id, amount) => apiClient.post(`/suppliers/${id}/settle`, { amount }),
  sendReminder: (id, message) => apiClient.post(`/suppliers/${id}/remind`, { message }),
};