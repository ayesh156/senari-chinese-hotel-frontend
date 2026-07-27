import { apiClient } from './apiClient';

/**
 * Fetch paginated, filtered audit logs.
 * This endpoint is ADMIN-only.
 *
 * @param {Object} params
 * @param {number} [params.page=1]      - Page number (1-based)
 * @param {number} [params.limit=25]    - Items per page (max 100)
 * @param {string} [params.from]        - ISO date string (start of range)
 * @param {string} [params.to]          - ISO date string (end of range)
 * @param {string} [params.action]      - Filter by action (CREATE, UPDATE, DELETE, etc.)
 * @param {string} [params.entity]      - Filter by entity (Order, FoodItem, User, etc.)
 * @param {number} [params.userId]      - Filter by user ID
 * @param {string} [params.search]      - Search term (userName / details / entityId)
 * @returns {Promise<Object>} { success, data: { data, total, page, limit, totalPages } }
 */
export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.action) query.set('action', params.action);
  if (params.entity) query.set('entity', params.entity);
  if (params.userId) query.set('userId', String(params.userId));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  const endpoint = `/audit-logs${qs ? `?${qs}` : ''}`;

  return apiClient.get(endpoint);
}