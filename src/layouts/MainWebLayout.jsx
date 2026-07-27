import { useState, useEffect } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import { ShoppingCart, UtensilsCrossed, Menu, X, Sun, Moon, Monitor, LayoutDashboard } from 'lucide-react'
import { useTheme } from '../utils/ThemeContext'
import { useCartStore, selectCartCount } from '../utils/store'
import SlideCart from '../components/ui/SlideCart'
import FloatingActionButtons from '../components/ui/FloatingActionButtons'

const NAV_LINKS = [
  { to: '/',        label: 'Home'    },
  { to: '/menu',    label: 'Menu'    },
  { to: '/about',   label: 'About'   },
  { to: '/contact', label: 'Contact' },
]

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const ICONS = {
    light:  { icon: Sun,     label: 'Switch to dark mode'  },
    dark:   { icon: Moon,    label: 'Switch to system mode' },
    system: { icon: Monitor, label: 'Switch to light mode'  },
  }
  const { icon: Icon, label } = ICONS[theme]
  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="p-2 rounded-lg text-gray-600 dark:text-gray-300
                 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-800
                 transition-colors"
    >
      <Icon size={20} />
    </button>
  )
}

// ── Cart Button ───────────────────────────────────────────────────────────────
function CartButton({ onClose }) {
  const toggleCart = useCartStore(s => s.toggleCart)
  const count      = useCartStore(selectCartCount)
  return (
    <button
      onClick={() => { onClose(); toggleCart() }}
      aria-label={`Cart — ${count} item${count !== 1 ? 's' : ''}`}
      className="relative p-2 text-gray-600 dark:text-gray-300
                 hover:text-amber-600 transition-colors"
    >
      <ShoppingCart size={22} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white
                         text-[10px] w-4 h-4 rounded-full flex items-center
                         justify-center leading-none font-bold">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

// ── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose }) {
  const count = useCartStore(selectCartCount)

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
                    transition-opacity duration-300
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel — slides in from the left */}
      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 w-72
                    flex flex-col
                    bg-white dark:bg-gray-950
                    border-r border-gray-200 dark:border-gray-800
                    shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16
                        border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 font-bold text-lg text-amber-600"
          >
            <UtensilsCrossed size={20} />
            Senari Chinese
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500
                       hover:text-gray-700 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-amber-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* ── Admin section divider ── */}
          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600
                          uppercase tracking-widest px-4 mb-1.5">
              Admin
            </p>

            {/* POS Admin link */}
            <Link
              to="/pos"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                         bg-amber-500/10 text-amber-600 dark:text-amber-400
                         hover:bg-amber-500/20 dark:hover:bg-amber-500/20
                         transition-colors"
            >
              <LayoutDashboard size={16} className="shrink-0" />
              POS Admin
              <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white
                               px-1.5 py-0.5 rounded-md leading-none">
                ADMIN
              </span>
            </Link>
          </div>

          {/* ── Cart row ── */}
          <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { onClose(); useCartStore.getState().toggleCart() }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                         text-gray-600 dark:text-gray-300
                         hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-amber-600
                         transition-colors"
            >
              <ShoppingCart size={16} />
              Cart
              {count > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px]
                                 w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
            © 2026 NebulaInfinite Software Solutions
          </p>
        </div>
      </aside>
    </>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const close = () => setDrawerOpen(false)

  return (
    <>
      <nav className="sticky top-0 z-30
                      bg-white dark:bg-gray-950
                      border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            onClick={close}
            className="flex items-center gap-2 font-bold text-lg sm:text-xl text-amber-600 shrink-0"
          >
            <UtensilsCrossed size={20} />
            <span className="hidden xs:inline sm:inline">Senari Chinese</span>
            <span className="xs:hidden sm:hidden text-base">Senari Chinese</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-amber-600'
                      : 'text-gray-600 dark:text-gray-300 hover:text-amber-600'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* POS Admin link — desktop only, subtle */}
            <Link
              to="/pos"
              aria-label="Go to POS Admin"
              title="Go to POS Admin"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                         text-xs font-semibold text-gray-400 dark:text-gray-500
                         hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         transition-colors mr-1"
            >
              <LayoutDashboard size={14} />
              <span>POS</span>
            </Link>
            <ThemeToggle />
            <CartButton onClose={close} />
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300
                         hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-800
                         transition-colors"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Left-side mobile drawer — rendered outside nav to avoid z-index stacking */}
      <MobileDrawer open={drawerOpen} onClose={close} />
    </>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 text-xs sm:text-sm py-5 sm:py-6 text-center
                       border-t border-gray-800">
      © 2026 NebulaInfinite Software Solutions. All rights reserved.
    </footer>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function MainWebLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900
                    text-gray-900 dark:text-gray-100 transition-colors duration-200
                    overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SlideCart />
      {/* FABs sit at z-40 — below SlideCart (z-50) so they don't overlap the open cart panel */}
      <FloatingActionButtons />
    </div>
  )
}
