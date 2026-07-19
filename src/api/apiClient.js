/**
 * Base API client with centralized error handling and auth token injection.
 * Wraps fetch with base URL, JSON parsing, standard error extraction,
 * and automatic Bearer token attachment for authenticated requests.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helpers ────────────────────────────────────────────────────────────
const TOKEN_KEY = 'pos-access-token';

function getAccessToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

// ── Error class ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Core request function ────────────────────────────────────────────────────
async function request(endpoint, method = 'GET', body = undefined, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = { ...options.headers };

  // Attach authorization token if available
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

  let response;
  try {
    response = await fetch(url, config);
  } catch (fetchError) {
    // Network error (e.g., server not running)
    throw new ApiError(
      'Network error: Unable to reach the server. Please check your connection.',
      0
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  // Try to parse JSON response
  let parsed;
  try {
    parsed = await response.json();
  } catch {
    parsed = { error: `API Error ${response.status}` };
  }

  if (!response.ok) {
    // If token expired, emit an event so auth store can handle it
    if (response.status === 401 && parsed.code === 'TOKEN_EXPIRED') {
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    }

    const message = parsed.error || `API Error ${response.status}`;
    throw new ApiError(message, response.status, parsed.code);
  }

  return parsed;
}

// ── Public API client ────────────────────────────────────────────────────────
export const apiClient = {
  get: (endpoint, options) => request(endpoint, 'GET', undefined, options),
  post: (endpoint, body, options) => request(endpoint, 'POST', body, options),
  put: (endpoint, body, options) => request(endpoint, 'PUT', body, options),
  patch: (endpoint, body, options) => request(endpoint, 'PATCH', body, options),
  del: (endpoint, options) => request(endpoint, 'DELETE', undefined, options),
};