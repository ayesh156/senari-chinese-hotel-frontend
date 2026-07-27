import { apiClient } from './apiClient';

export const settingsApi = {
  get: () => apiClient.get('/settings'),
  update: (data) => apiClient.put('/settings', data),
};