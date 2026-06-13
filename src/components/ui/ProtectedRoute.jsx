/**
 * ProtectedRoute.jsx
 *
 * Wraps any POS route. If no staff member is logged in, redirects to /pos/login
 * and preserves the intended destination so the user lands there after login.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated } from '../../utils/authStore'

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location        = useLocation()

  if (!isAuthenticated) {
    // Pass the attempted path so login can redirect back after success
    return <Navigate to="/pos/login" state={{ from: location }} replace />
  }

  return children
}
