/**
 * ProtectedRoute.jsx
 *
 * Wraps any POS route. If no staff member is logged in, redirects to /pos/login
 * and preserves the intended destination so the user lands there after login.
 * Shows a loading spinner while the auth session is being restored on mount.
 */
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../../utils/authStore';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const location = useLocation();

  // Restore auth session on mount (checks stored tokens)
  useEffect(() => {
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While restoring session, show a full-page loading spinner
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Pass the attempted path so login can redirect back after success
    return <Navigate to="/pos/login" state={{ from: location }} replace />;
  }

  return children;
}