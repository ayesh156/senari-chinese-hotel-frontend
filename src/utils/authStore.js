/**
 * authStore.js
 *
 * Zustand store for POS authentication state.
 * Manages JWT access/refresh tokens and user data.
 * Persists tokens in sessionStorage (cleared on tab close).
 * Interfaces with the backend API for login/logout/refresh.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '../api/apiClient';

// ── Token management helpers ─────────────────────────────────────────────────
const TOKEN_KEYS = {
  accessToken: 'pos-access-token',
  refreshToken: 'pos-refresh-token',
};

function storeToken(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* noop */ }
}

function getStoredToken(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function removeToken(key) {
  try { sessionStorage.removeItem(key); } catch { /* noop */ }
}

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectIsAuthenticated = (s) => s.isAuthenticated;
export const selectUser = (s) => s.user;
export const selectRole = (s) => s.user?.role ?? null;
export const selectIsAdmin = (s) => s.user?.role === 'ADMIN';
export const selectIsCashier = (s) => s.user?.role === 'CASHIER';

// ── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──
      user: null,           // { id, name, email, role }
      isAuthenticated: false,
      isLoading: true,      // true while restoring session on mount
      error: null,          // login error message

      // ── Token accessors (stored in sessionStorage) ──
      getAccessToken: () => getStoredToken(TOKEN_KEYS.accessToken),
      getRefreshToken: () => getStoredToken(TOKEN_KEYS.refreshToken),

      // ── Login with email + password ──
      login: async (email, password) => {
        set({ error: null, isLoading: true });
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { data } = response;

          if (response.success && data.accessToken) {
            storeToken(TOKEN_KEYS.accessToken, data.accessToken);
            if (data.refreshToken) {
              storeToken(TOKEN_KEYS.refreshToken, data.refreshToken);
            }

            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true, user: data.user };
          }

          throw new Error('Login failed: No token received');
        } catch (err) {
          const message = err.message || 'Login failed. Please check your credentials.';
          set({ user: null, isAuthenticated: false, isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // ── Logout ──
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch {
          // Best-effort — clear locally even if server call fails
        }

        removeToken(TOKEN_KEYS.accessToken);
        removeToken(TOKEN_KEYS.refreshToken);
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      // ── Refresh the access token ──
      refreshSession: async () => {
        const refreshToken = getStoredToken(TOKEN_KEYS.refreshToken);
        if (!refreshToken) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }

        try {
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { data } = response;

          if (response.success && data.accessToken) {
            storeToken(TOKEN_KEYS.accessToken, data.accessToken);
            if (data.refreshToken) {
              storeToken(TOKEN_KEYS.refreshToken, data.refreshToken);
            }

            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          // Refresh failed — clean up
          removeToken(TOKEN_KEYS.accessToken);
          removeToken(TOKEN_KEYS.refreshToken);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        } catch {
          removeToken(TOKEN_KEYS.accessToken);
          removeToken(TOKEN_KEYS.refreshToken);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },

      // ── Restore session on app boot ──
      restoreSession: async () => {
        const accessToken = getStoredToken(TOKEN_KEYS.accessToken);

        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        // If token is still valid, try /auth/me to validate
        if (!isTokenExpired(accessToken)) {
          try {
            const response = await apiClient.get('/auth/me');
            if (response.success && response.data?.user) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          } catch {
            // Token invalid server-side — try refresh
          }
        }

        // Token expired or invalid — try refresh
        const refreshed = await get().refreshSession();
        if (!refreshed) {
          set({ isLoading: false });
        }
      },

      // ── Clear error ──
      clearError: () => set({ error: null }),
    }),
    {
      name: 'pos-auth',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist user object and isAuthenticated (tokens are in sessionStorage separately)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);