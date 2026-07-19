import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, LogIn, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../utils/authStore';

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearError = useAuthStore((s) => s.clearError);

  // Where to go after successful login (default: POS dashboard)
  const from = location.state?.from?.pathname ?? '/pos/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Clear error when inputs change
  useEffect(() => {
    if (localError) setLocalError('');
    if (error) clearError();
  }, [email, password]); // eslint-disable-line react-hooks/exhaustive-deps

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isSubmitting, navigate, from]);

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();

      if (!email.trim() || !password.trim()) {
        setLocalError('Please enter your email and password.');
        return;
      }

      setIsSubmitting(true);
      setLocalError('');

      const result = await login(email.trim(), password);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setLocalError(result.error || 'Login failed. Please try again.');
      }

      setIsSubmitting(false);
    },
    [email, password, login, navigate, from]
  );

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gray-50 dark:bg-gray-950 p-4">

      {/* Card */}
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center
                          w-16 h-16 rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/30 mb-4">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            POS System
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Senari Chinese Hotel
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-gray-900 rounded-2xl border
                     border-gray-200 dark:border-gray-800 shadow-sm p-5"
        >
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
            Staff Sign In
          </p>

          {/* Error message */}
          {(localError || error) && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl
                            bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {localError || error}
              </p>
            </div>
          )}

          {/* Email field */}
          <div className="mb-4">
            <label htmlFor="email" className="text-xs font-bold text-gray-500 dark:text-gray-400
                                              uppercase tracking-widest mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@senari.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                           bg-gray-50 dark:bg-gray-800
                           border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-600
                           focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                           transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="mb-5">
            <label htmlFor="password" className="text-xs font-bold text-gray-500 dark:text-gray-400
                                                 uppercase tracking-widest mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-gray-400 dark:text-gray-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                           bg-gray-50 dark:bg-gray-800
                           border border-gray-200 dark:border-gray-700
                           text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-600
                           focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                           transition-colors"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-400 dark:text-gray-500
                           hover:text-gray-600 dark:hover:text-gray-300
                           transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2
                       py-3 rounded-2xl font-bold text-sm
                       bg-gradient-to-r from-amber-500 to-orange-500 text-white
                       shadow-lg shadow-amber-500/30
                       hover:opacity-90 active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600">
          © 2026 Senari Chinese Hotel
        </p>
      </div>
    </div>
  );
}