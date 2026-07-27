const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${BASE_URL}${endpoint}`;

  const mergedHeaders: Record<string, string> = { ...options.headers };
  if (body !== undefined && !(body instanceof FormData)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method,
    headers: mergedHeaders,
    signal: options.signal,
  };

  if (body !== undefined) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    let parsed: { error?: string } | null = null;
    try { parsed = JSON.parse(errorBody); } catch { /* ignore */ }
    throw new Error(parsed?.error || `API Error ${response.status}: ${errorBody || response.statusText}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return response.json() as Promise<{ success: boolean; data?: T; error?: string }>;
}

export function get<T>(endpoint: string, options?: RequestOptions): Promise<{ success: boolean; data?: T; error?: string }> {
  return request<T>(endpoint, 'GET', undefined, options);
}

export function post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<{ success: boolean; data?: T; error?: string }> {
  return request<T>(endpoint, 'POST', body, options);
}

export function put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<{ success: boolean; data?: T; error?: string }> {
  return request<T>(endpoint, 'PUT', body, options);
}

export function del<T>(endpoint: string, options?: RequestOptions): Promise<{ success: boolean; data?: T; error?: string }> {
  return request<T>(endpoint, 'DELETE', undefined, options);
}