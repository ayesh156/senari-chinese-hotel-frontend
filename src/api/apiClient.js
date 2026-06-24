/**
 * Base API client with centralized error handling.
 * Wraps fetch with base URL, JSON parsing, and standard error extraction.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, method = 'GET', body = undefined, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = { ...options.headers };
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
    signal: options.signal,
  };

  if (body !== undefined) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let message;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.error || `API Error ${response.status}`;
    } catch {
      message = errorText || `API Error ${response.status}`;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return { success: true };

  return response.json();
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, 'GET', undefined, options),
  post: (endpoint, body, options) => request(endpoint, 'POST', body, options),
  put: (endpoint, body, options) => request(endpoint, 'PUT', body, options),
  del: (endpoint, options) => request(endpoint, 'DELETE', undefined, options),
};