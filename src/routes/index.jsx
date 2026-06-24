import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainWebLayout    from '../layouts/MainWebLayout';
import POSLayout        from '../layouts/POSLayout';
import ProtectedRoute   from '../components/ui/ProtectedRoute';
import LoadingSpinner   from '../components/ui/LoadingSpinner';

/**
 * Suspense wrapper for lazy-loaded route elements.
 * Ensures every code-split page has a loading fallback.
 */
function Lazy({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

// ── Page-level code splitting via React.lazy() ────────────────────────────
const HomePage         = lazy(() => import('../pages/web/HomePage'));
const MenuPage         = lazy(() => import('../pages/web/MenuPage'));
const ProductViewPage  = lazy(() => import('../pages/web/ProductViewPage'));
const AboutPage        = lazy(() => import('../pages/web/AboutPage'));
const ContactPage      = lazy(() => import('../pages/web/ContactPage'));
const CheckoutPage     = lazy(() => import('../pages/web/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('../pages/web/OrderSuccessPage'));

const POSDashboardPage    = lazy(() => import('../pages/pos/POSDashboardPage'));
const LiveOrdersPage      = lazy(() => import('../pages/pos/LiveOrdersPage'));
const FoodsListPage       = lazy(() => import('../pages/pos/FoodsListPage'));
const FoodFormPage        = lazy(() => import('../pages/pos/FoodFormPage'));
const InvoicesPage        = lazy(() => import('../pages/pos/InvoicesPage'));
const QuickPOSPage        = lazy(() => import('../pages/pos/QuickPOSPage'));
const InventoryPage       = lazy(() => import('../pages/pos/InventoryPage'));
const SuppliersPage       = lazy(() => import('../pages/pos/SuppliersPage'));
const MasterDataPage      = lazy(() => import('../pages/pos/MasterDataPage'));
const ReportsPage         = lazy(() => import('../pages/pos/ReportsPage'));
const CustomersPage       = lazy(() => import('../pages/pos/CustomersPage'));
const PurchaseOrdersPage  = lazy(() => import('../pages/pos/PurchaseOrdersPage'));
const TableManagementPage = lazy(() => import('../pages/pos/TableManagementPage'));
const SettingsPage        = lazy(() => import('../pages/pos/SettingsPage'));
const StaffLoginPage      = lazy(() => import('../pages/pos/StaffLoginPage'));

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-500">
      <span className="text-6xl">🍽️</span>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">404 — Page Not Found</h1>
      <p className="text-sm">The page you're looking for doesn't exist.</p>
      <a href="/" className="mt-2 text-amber-600 hover:underline text-sm font-medium">← Back to Home</a>
    </div>
  );
}

const router = createBrowserRouter([
  // ── Customer Web App ──────────────────────────────────────
  {
    path: '/',
    element: <MainWebLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true,           element: <Lazy><HomePage /></Lazy> },
      { path: 'menu',          element: <Lazy><MenuPage /></Lazy> },
      { path: 'menu/:id',      element: <Lazy><ProductViewPage /></Lazy> },
      { path: 'about',         element: <Lazy><AboutPage /></Lazy> },
      { path: 'contact',       element: <Lazy><ContactPage /></Lazy> },
      { path: 'cart',          element: <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cart — coming soon</div> },
      { path: 'checkout',      element: <Lazy><CheckoutPage /></Lazy> },
      { path: 'order-success', element: <Lazy><OrderSuccessPage /></Lazy> },
    ],
  },

  // ── Admin POS System (includes Quick POS) ─────────────────
  {
    path: '/pos',
    element: <ProtectedRoute><POSLayout /></ProtectedRoute>,
    children: [
      { index: true,            element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',      element: <Lazy><POSDashboardPage /></Lazy> },
      { path: 'orders',         element: <Lazy><LiveOrdersPage /></Lazy> },
      { path: 'invoices',       element: <Lazy><InvoicesPage /></Lazy> },
      { path: 'foods',          element: <Lazy><FoodsListPage /></Lazy> },
      { path: 'foods/add',      element: <Lazy><FoodFormPage /></Lazy> },
      { path: 'foods/edit/:id', element: <Lazy><FoodFormPage /></Lazy> },
      { path: 'quick',          element: <Lazy><QuickPOSPage /></Lazy> },
      { path: 'inventory',      element: <Lazy><InventoryPage /></Lazy> },
      { path: 'suppliers',      element: <Lazy><SuppliersPage /></Lazy> },
      { path: 'master-data',    element: <Lazy><MasterDataPage /></Lazy> },
      { path: 'reports',        element: <Lazy><ReportsPage /></Lazy> },
      { path: 'customers',      element: <Lazy><CustomersPage /></Lazy> },
      { path: 'purchase-orders', element: <Lazy><PurchaseOrdersPage /></Lazy> },
      { path: 'tables',         element: <Lazy><TableManagementPage /></Lazy> },
      { path: 'settings',       element: <Lazy><SettingsPage /></Lazy> },
    ],
  },

  // ── POS Login (public) ────────────────────────────────────
  {
    path: '/pos/login',
    element: <Lazy><StaffLoginPage /></Lazy>,
  },
]);

export default router;