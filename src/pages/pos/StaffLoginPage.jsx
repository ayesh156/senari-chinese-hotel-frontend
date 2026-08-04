import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../utils/authStore';

// ── Dot Grid SVG Background ───────────────────────────────────────────────────
const DotGrid = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none select-none"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
  >
    <defs>
      <pattern
        id="dot-grid"
        x="0"
        y="0"
        width="24"
        height="24"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.04)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dot-grid)" />
  </svg>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearError = useAuthStore((s) => s.clearError);

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
    <div className="relative min-h-screen flex items-center justify-center
                    bg-slate-950 p-4 overflow-hidden">

      {/* Dot Grid Pattern Overlay */}
      <DotGrid />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full
                      bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full
                      bg-orange-500/5 blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">

        {/* ── Branding Header ───────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-4">
          {/* Logo Container */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br
                            from-amber-400/20 to-orange-600/20 blur-md" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden
                            bg-slate-900 border border-amber-500/30
                            shadow-[0_0_24px_rgba(251,191,36,0.15)]
                            flex items-center justify-center">
              <img
                src="/images/logo.jpeg"
                alt="Senari Chinese Hotel logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Senari{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500
                               bg-clip-text text-transparent">
                POS System
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Point of Sale & Restaurant Management System
            </p>
          </div>
        </div>

        {/* ── Feature Badges ─────────────────────────────────────────────── */}
        <div className="flex justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-slate-800/60 border border-slate-700/50">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span className="text-[11px] font-medium text-slate-300">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-slate-800/60 border border-slate-700/50">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[11px] font-medium text-slate-300">Fast</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-slate-800/60 border border-slate-700/50">
            <BarChart3 size={12} className="text-sky-400" />
            <span className="text-[11px] font-medium text-slate-300">Real-time</span>
          </div>
        </div>

        {/* ── Login Form ────────────────────────────────────────────────── */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-900/80 backdrop-blur-sm rounded-2xl
                     border border-slate-800/60 shadow-xl p-6 space-y-5"
        >
          <p className="text-sm font-semibold text-slate-300 tracking-wide">
            Staff Sign In
          </p>

          {/* Error message */}
          {(localError || error) && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl
                            bg-red-950/50 border border-red-800/40">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-medium leading-relaxed">
                {localError || error}
              </p>
            </div>
          )}

          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="text-[11px] font-semibold text-slate-400
                         uppercase tracking-widest mb-2 block"
            >
              Email / Username
            </label>
            <div className="relative group">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2
                           text-slate-500 group-focus-within:text-amber-400
                           transition-colors duration-200"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@senari.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm
                           bg-slate-800/50
                           border border-slate-700/60
                           text-white placeholder:text-slate-600
                           focus:outline-none focus:ring-2 focus:ring-amber-500/50
                           focus:border-amber-500/60
                           transition-all duration-200"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="text-[11px] font-semibold text-slate-400
                         uppercase tracking-widest mb-2 block"
            >
              Password
            </label>
            <div className="relative group">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2
                           text-slate-500 group-focus-within:text-amber-400
                           transition-colors duration-200"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm
                           bg-slate-800/50
                           border border-slate-700/60
                           text-white placeholder:text-slate-600
                           focus:outline-none focus:ring-2 focus:ring-amber-500/50
                           focus:border-amber-500/60
                           transition-all duration-200"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2
                           text-slate-500 hover:text-slate-300
                           transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5
                       py-3.5 rounded-xl font-bold text-sm text-white
                       bg-gradient-to-r from-amber-500 to-orange-600
                       shadow-[0_0_20px_rgba(245,158,11,0.3)]
                       hover:shadow-[0_0_28px_rgba(245,158,11,0.45)]
                       hover:from-amber-400 hover:to-orange-500
                       active:scale-[0.97]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:shadow-none disabled:active:scale-100
                       transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={17} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-slate-600 select-none">
          &copy; 2026 Senari Chinese Hotel. All rights reserved.
        </p>
      </div>
    </div>
  );
}