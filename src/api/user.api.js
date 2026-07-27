/**
 * User Management API client.
 * Handles CRUD operations for system users (Admin only) and self-profile updates.
 */
import { apiClient } from './apiClient';

export const userApi = {
  /**
   * GET /api/users — List all users (Admin/Manager)
   */
  getAll: () => apiClient.get('/users'),

  /**
   * GET /api/users/:id — Get a single user by ID (Admin)
   */
  getById: (id) => apiClient.get(`/users/${id}`),

  /**
   * POST /api/users — Create a new user (Admin)
   */
  create: (data) => apiClient.post('/users', data),

  /**
   * PUT /api/users/:id — Update user profile (Admin)
   */
  update: (id, data) => apiClient.put(`/users/${id}`, data),

  /**
   * PUT /api/users/:id/password — Admin force-reset user password
   */
  resetPassword: (id, newPassword) => apiClient.put(`/users/${id}/password`, { newPassword }),

  /**
   * PUT /api/users/me/profile — Self-update name/password (requires currentPassword)
   */
  selfUpdate: (data) => apiClient.put('/users/me/profile', data),

  /**
   * PATCH /api/users/:id/status — Toggle user active/deactivated (Admin)
   */
  toggleStatus: (id) => apiClient.patch(`/users/${id}/status`),

  /**
   * DELETE /api/users/:id — Delete a user account (Admin)
   */
  delete: (id) => apiClient.del(`/users/${id}`),
};