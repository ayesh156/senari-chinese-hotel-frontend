import { createBrowserRouter, Navigate } from 'react-router-dom'

import MainWebLayout    from '../layouts/MainWebLayout'
import POSLayout        from '../layouts/POSLayout'
import ProtectedRoute   from '../components/ui/ProtectedRoute'

import HomePage         from '../pages/web/HomePage'
import MenuPage         from '../pages/web/MenuPage'
import ProductViewPage  from '../pages/web/ProductViewPage'
import AboutPage        from '../pages/web/AboutPage'
import ContactPage      from '../pages/web/ContactPage'
import CheckoutPage     from '../pages/web/CheckoutPage'
import OrderSuccessPage from '../pages/web/OrderSuccessPage'
import POSDashboardPage    from '../pages/pos/POSDashboardPage'
import LiveOrdersPage      from '../pages/pos/LiveOrdersPage'
import FoodsListPage       from '../pages/pos/FoodsListPage'
import FoodFormPage        from '../pages/pos/FoodFormPage'
import InvoicesPage        from '../pages/pos/InvoicesPage'
import SettingsPage        from '../pages/pos/SettingsPage'
import QuickPOSPage        from '../pages/pos/QuickPOSPage'
import ReportsPage         from '../pages/pos/ReportsPage'
import CustomersPage       from '../pages/pos/CustomersPage'
import StaffLoginPage      from '../pages/pos/StaffLoginPage'
import TableManagementPage from '../pages/pos/TableManagementPage'
import InventoryPage          from '../pages/pos/InventoryPage'
import MasterDataPage         from '../pages/pos/MasterDataPage'
import SuppliersPage          from '../pages/pos/SuppliersPage'
import PurchaseOrdersPage     from '../pages/pos/PurchaseOrdersPage'

// Simple fallback shown when a route is not found or throws
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-500">
      <span className="text-6xl">🍽️</span>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">404 — Page Not Found</h1>
      <p className="text-sm">The page you're looking for doesn't exist.</p>
      <a href="/" className="mt-2 text-amber-600 hover:underline text-sm font-medium">← Back to Home</a>
    </div>
  )
}

const router = createBrowserRouter([
  // ── Customer Web App ──────────────────────────────────────
  {
    path: '/',
    element: <MainWebLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true,           element: <HomePage /> },
      { path: 'menu',          element: <MenuPage /> },
      { path: 'menu/:id',      element: <ProductViewPage /> },
      { path: 'about',         element: <AboutPage /> },
      { path: 'contact',       element: <ContactPage /> },
      { path: 'cart',          element: <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cart — coming soon</div> },
      { path: 'checkout',      element: <CheckoutPage /> },
      { path: 'order-success', element: <OrderSuccessPage /> },
    ],
  },

  // ── Admin POS System ──────────────────────────────────────
  {
    path: '/pos',
    element: <ProtectedRoute><POSLayout /></ProtectedRoute>,
    children: [
      { index: true,            element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',      element: <POSDashboardPage /> },
      { path: 'orders',         element: <LiveOrdersPage /> },
      { path: 'invoices',       element: <InvoicesPage /> },
      { path: 'foods',          element: <FoodsListPage /> },
      { path: 'foods/add',      element: <FoodFormPage /> },
      { path: 'foods/edit/:id', element: <FoodFormPage /> },
      { path: 'inventory',      element: <InventoryPage /> },
      { path: 'master-data',    element: <MasterDataPage /> },
      { path: 'reports',        element: <ReportsPage /> },
      { path: 'customers',      element: <CustomersPage /> },
      { path: 'suppliers',      element: <SuppliersPage /> },
      { path: 'purchase-orders', element: <PurchaseOrdersPage /> },
      { path: 'tables',         element: <TableManagementPage /> },
      { path: 'settings',       element: <SettingsPage /> },
    ],
  },

  // ── Quick POS Register (full-screen, no POSLayout wrapper) ────────────────
  {
    path: '/pos/quick',
    element: <ProtectedRoute><QuickPOSPage /></ProtectedRoute>,
    errorElement: <div className="p-8 text-center text-gray-500">Something went wrong.</div>,
  },

  // ── POS Login (public) ────────────────────────────────────────────────────
  {
    path: '/pos/login',
    element: <StaffLoginPage />,
  },
])

export default router
