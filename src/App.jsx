import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './utils/ThemeContext';
import { useSettingsStore } from './utils/settingsStore';
import { useAuthStore } from './utils/authStore';
import router from './routes';
import GlobalToast from './components/ui/GlobalToast';

export default function App() {
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const logout = useAuthStore((s) => s.logout);

  // Boot-time: fetch settings + restore auth session
  useEffect(() => {
    fetchSettings();
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for token-expired events from apiClient
  useEffect(() => {
    const handleTokenExpired = () => {
      logout();
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, [logout]);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <GlobalToast />
    </ThemeProvider>
  );
}