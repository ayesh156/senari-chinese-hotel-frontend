import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed,
  Settings, Menu, X, ChefHat, LogOut, Globe,
  ChevronLeft, ChevronRight, Sun, Moon, Monitor,
  ReceiptText, Calculator, BarChart2, Users, LayoutGrid, Package, Database, Truck, ShoppingCart,
} from 'lucide-react'
import { useTheme } from '../utils/ThemeContext'
import { useAuthStore } from '../utils/authStore'

// ── Constants ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/pos/dashboard',        icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/pos/quick',            icon: Calculator,      label: 'Quick Invoice'    },
  { to: '/pos/invoices',         icon: ReceiptText,     label: 'Invoices'         },
  { to: '/pos/orders',           icon: ClipboardList,   label: 'Live Orders'      },
  { to: '/pos/foods',            icon: UtensilsCrossed, label: 'Foods'            },
  { to: '/pos/inventory',        icon: Package,         label: 'Inventory'        },
  { to: '/pos/master-data',      icon: Database,        label: 'Master Data'      },
  { to: '/pos/customers',        icon: Users,           label: 'Customers'        },
  { to: '/pos/suppliers',        icon: Truck,           label: 'Suppliers'        },
  { to: '/pos/purchase-orders',  icon: ShoppingCart,    label: 'Purchase Orders'  },
  { to: '/pos/tables',           icon: LayoutGrid,      label: 'Tables'           },
  { to: '/pos/reports',          icon: BarChart2,       label: 'Reports'          },
  { to: '/pos/settings',         icon: Settings,        label: 'Settings'         },
]

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const ICONS = {
    light:  { icon: Sun,     label: 'Switch to dark mode'   },
    dark:   { icon: Moon,    label: 'Switch to system mode'  },
    system: { icon: Monitor, label: 'Switch to light mode'   },
  }
  const { icon: Icon, label } = ICONS[theme]
  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="p-2 rounded-lg
                 text-gray-500 dark:text-gray-400
                 hover:text-amber-600 dark:hover:text-amber-400
                 hover:bg-gray-100 dark:hover:bg-gray-800
                 transition-colors"
    >
      <Icon size={18} />
    </button>
  )
}

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right hidden sm:block">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {now.toLocaleDateString('en-LK', {
          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        })}
      </p>
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">
        {now.toLocaleTimeString('en-LK', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })}
      </p>
    </div>
  )
}

// ── Sidebar Nav Link ──────────────────────────────────────────────────────────
/**
 * collapsed — when true, hide label and center the icon.
 * Tooltip via title attr so keyboard/screen-reader users still get the label.
 */
function SideNavLink({ to, icon: Icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-xl text-sm font-medium
         transition-all duration-200
         ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
         ${isActive
           ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
           : `text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              hover:text-gray-900 dark:hover:text-white`
         }`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggleCollapse, onClose, onLogout, staff }) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Brand header ── */}
      <div className={`h-16 flex items-center shrink-0
                       border-b border-gray-200 dark:border-gray-800
                       ${collapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>

        {/* Logo — hide text when collapsed */}
        <Link
          to="/pos/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 font-bold min-w-0"
          title={collapsed ? 'POS System' : undefined}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <ChefHat size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-base text-gray-900 dark:text-white truncate">
              POS System
            </span>
          )}
        </Link>

        {/* Collapse toggle — desktop only */}
        {!onClose && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden lg:flex items-center justify-center
                        w-6 h-6 rounded-lg shrink-0
                        text-gray-400 dark:text-gray-500
                        hover:text-gray-700 dark:hover:text-white
                        hover:bg-gray-100 dark:hover:bg-gray-800
                        transition-colors
                        ${collapsed ? 'mt-0' : ''}`}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Close button — mobile off-canvas only */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-lg
                       text-gray-400 dark:text-gray-500
                       hover:text-gray-700 dark:hover:text-white
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Nav links ── */}
      <nav className={`flex-1 py-4 flex flex-col gap-1 overflow-y-auto
                       ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600
                        uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(item => (
          <SideNavLink
            key={item.to}
            {...item}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* ── Footer: website link + user card ── */}
      <div className={`py-4 border-t border-gray-200 dark:border-gray-800 shrink-0
                       flex flex-col gap-2
                       ${collapsed ? 'px-2 items-center' : 'px-3'}`}>

        {/* View Live Website */}
        <Link
          to="/"
          title={collapsed ? 'View Live Website' : undefined}
          aria-label={collapsed ? 'View Live Website' : undefined}
          className={`flex items-center rounded-xl text-sm font-medium
                      text-gray-500 dark:text-gray-400
                      hover:bg-gray-100 dark:hover:bg-gray-800
                      hover:text-gray-900 dark:hover:text-white
                      transition-colors
                      ${collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'}`}
        >
          <Globe size={16} className="shrink-0" />
          {!collapsed && <span>View Live Website</span>}
        </Link>

        {/* Copyright — hidden when collapsed */}
        {!collapsed && (
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center px-3 pb-1 leading-snug">
            © 2026 Senari Chinese Hotel
          </p>
        )}

        {/* User card — icon-only when collapsed */}
        {collapsed ? (
          <div
            title={`${staff?.name ?? 'Admin'} — ${staff?.role ?? ''}`}
            className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center
                       text-white text-xs font-bold shrink-0 cursor-default"
          >
            {staff?.avatar ?? 'A'}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                          bg-gray-100 dark:bg-gray-800/60">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center
                            text-white text-xs font-bold shrink-0">
              {staff?.avatar ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {staff?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {staff?.role ?? 'ADMIN'}
              </p>
            </div>
            <button
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 rounded-lg
                         text-gray-400 dark:text-gray-500
                         hover:text-red-500 dark:hover:text-red-400
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function POSLayout() {
  const navigate   = useNavigate()
  const logout     = useAuthStore(s => s.logout)
  const staff      = useAuthStore(s => s.staff)

  const [sidebarOpen,        setSidebarOpen]        = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const closeMobile    = () => setSidebarOpen(false)
  const toggleCollapse = () => setIsSidebarCollapsed(v => !v)

  function handleLogout() {
    logout()
    navigate('/pos/login', { replace: true })
  }

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden
                    bg-gray-50 dark:bg-gray-950
                    text-gray-900 dark:text-gray-100">

      {/* ── Mobile backdrop ── */}
      <div
        aria-hidden="true"
        onClick={closeMobile}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden
                    transition-opacity duration-300
                    ${sidebarOpen
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                    }`}
      />

      {/* ── Sidebar ──
           Mobile: off-canvas (always w-64, slides in/out)
           Desktop: static, width transitions between w-64 and w-20
      ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col shrink-0
          bg-white dark:bg-gray-950
          border-r border-gray-200 dark:border-gray-800
          shadow-sm
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapse={toggleCollapse}
          onClose={sidebarOpen ? closeMobile : null}
          onLogout={handleLogout}
          staff={staff}
        />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Header ── */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6
                           bg-white dark:bg-gray-950
                           border-b border-gray-200 dark:border-gray-800
                           shadow-sm">

          {/* Left: hamburger (mobile) + live indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden p-2 rounded-lg
                         text-gray-500 dark:text-gray-400
                         hover:text-gray-900 dark:hover:text-white
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400
                               uppercase tracking-widest">
                Live
              </span>
            </div>
          </div>

          {/* Right: clock + theme + user badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LiveClock />
            <ThemeToggle />
            <div className="flex items-center gap-2
                            bg-gray-100 dark:bg-gray-800
                            rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center
                              text-white text-[10px] font-bold shrink-0">
                {staff?.avatar ?? 'A'}
              </div>
              <span className="text-xs font-semibold
                               text-gray-700 dark:text-gray-300
                               hidden sm:block">
                {staff?.name ?? 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
