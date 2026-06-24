import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, Search, X } from 'lucide-react';
import SearchableSelect from '../../components/ui/SearchableSelect';
import ModernPagination from '../../components/ui/ModernPagination';
import ReceiptModal from '../../components/pos/ReceiptModal';
import MenuCard from '../../components/pos/MenuCard';
import CartPanel from '../../components/pos/CartPanel';
import MobileCartDrawer from '../../components/pos/MobileCartDrawer';
import { toast } from 'react-toastify';
import { useFoodStore } from '../../utils/foodStore';
import { useCartStore } from '../../utils/cartStore';
import { useSettingsStore } from '../../utils/settingsStore';
import { useCustomerStore } from '../../utils/customerStore';
import { useFilteredFoods } from '../../hooks/useFilteredFoods';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { orderApi } from '../../api/order.api';

const ITEMS_PER_PAGE = 15;

function nextInvoiceNumber() {
  const key = 'pos-quick-invoice-seq';
  const seq = parseInt(sessionStorage.getItem(key) ?? '0', 10) + 1;
  sessionStorage.setItem(key, String(seq));
  return `QR-${String(seq).padStart(4, '0')}`;
}

export default function QuickPOSPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultOrderType, maxDiscountPercent } = useSettingsStore();
  const { foods, fetchAll: fetchFoods } = useFoodStore();
  const customers = useCustomerStore(s => s.customers);
  const fetchCustomers = useCustomerStore(s => s.fetchAll);

  useEffect(() => { fetchFoods(); fetchCustomers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive category names from foods ──────────────────────────────────
  const categoryNames = useMemo(() => {
    const names = new Set();
    foods.forEach(f => { if (f.category?.name) names.add(f.category.name); });
    return Array.from(names).sort();
  }, [foods]);

  const categoryFilterOptions = useMemo(() => {
    return [{ value: '', label: 'All Categories' }, ...categoryNames.map(c => ({ value: c, label: c }))];
  }, [categoryNames]);

  // ── Edit mode from URL query param ────────────────────────────────────
  const editOrder = location.state?.editOrder ?? null;
  const isEditMode = editOrder !== null;

  // ── Compute customer options from real store data ─────────────────────
  const customerOptions = useMemo(() => {
    const options = [{ value: 'walk-in', label: 'Walk-in Customer', id: null }];
    customers.forEach(c => {
      options.push({ value: String(c.id), label: `${c.name} (${c.phone})`, id: c.id });
    });
    return options;
  }, [customers]);

  // ── Cart store selectors ──────────────────────────────────────────────
  const cartItems = useCartStore(s => s.cartItems);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const cartOrderType = useCartStore(s => s.orderType);
  const cartDiscount = useCartStore(s => s.discount);
  const cartDiscountType = useCartStore(s => s.discountType);
  const cartCustomerCash = useCartStore(s => s.customerCash);
  const cartIsPaying = useCartStore(s => s.isPaying);
  const {
    addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart,
    setOrderType, setDiscount, setDiscountType, setCustomerCash, setCustomerName,
    hydrateFromOrder, submitOrder, updateOrder,
  } = useCartStore();

  // ── Local state ───────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [editId, setEditId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const discountInputRef = useRef(null);
  const customerCashInputRef = useRef(null);
  const searchRef = useRef(null);
  // ── Edit mode hydration from URL param ───────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eid = params.get('editId');
    if (eid) {
      setEditId(eid);
      setIsUpdating(true);
      orderApi.getById(eid)
        .then(json => {
          if (json.success && json.data) {
            const order = json.data;
            hydrateFromOrder(order);
            // Prepopulate the customer dropdown with the order's customerId
            if (order.customerId) {
              setSelectedCustomer(String(order.customerId));
            }
          }
        })
        .catch(err => console.error('[QuickPOS] Edit fetch error:', err));
    }
  }, [location.search, hydrateFromOrder]);

  // ── Filtered foods ────────────────────────────────────────────────────
  const filteredItems = useFilteredFoods({ foods, selectedCategory, categoryFilter, searchQuery });

  useEffect(() => { setCurrentPage(1); }, [selectedCategory, categoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const getQty = (id) => cartItems.find((i) => i.id === id)?.quantity ?? 0;

  const editInvoiceNum = isEditMode ? `INV-${String(editOrder.id).padStart(3, '0')}` : null;

  // ── Handle Pay / Submit ──────────────────────────────────────────────
  const handlePayRef = useRef(null);
  const handlePay = useCallback(async () => {
    if (cartItems.length === 0) return;

    // Resolve selected customer
    const selectedOpt = customerOptions.find(o => o.value === selectedCustomer);
    const customerId = selectedOpt?.id || null;
    const customerName = selectedOpt?.label?.split(' (')[0] || 'Walk-in Customer';

    setCustomerName(customerName);

    let result;
    if (isUpdating) {
      result = await updateOrder({
        orderId: editId,
        orderType: cartOrderType,
        customerName,
        customerId,
        amountPaid: cartCustomerCash,
      });
    } else {
      result = await submitOrder({
        orderType: cartOrderType,
        customerName,
        customerId,
        amountPaid: cartCustomerCash,
      });
    }

    if (result) {
      setMobileCartOpen(false);
      setCompletedOrder(result);
      // Re-fetch customers so stats (totalOrders, totalSpent, dueAmount) update instantly
      fetchCustomers();
      if (isEditMode) setTimeout(() => navigate('/pos/invoices'), 1200);
    } else {
      toast.error('Failed to submit order');
    }
  }, [cartItems, cartOrderType, submitOrder, updateOrder, isEditMode, editInvoiceNum, navigate, selectedCustomer, setCustomerName, cartCustomerCash, isUpdating, editId, customerOptions, fetchCustomers]);
  handlePayRef.current = handlePay;

  // ── Keyboard shortcuts ───────────────────────────────────────────────
  useKeyboardShortcuts({
    searchRef, discountInputRef, customerCashInputRef,
    setOrderType, setDiscountType, setDiscount, handlePayRef,
  });

  const pageTitle = isUpdating ? 'Update Invoice' : (isEditMode ? `Edit ${editInvoiceNum}` : 'Quick Invoice');
  const ctaLabel = isUpdating ? 'UPDATE INVOICE' : (isEditMode ? 'UPDATE' : 'PAY & PRINT');

  const cartProps = {
    cartItems, onIncrease: increaseQuantity, onDecrease: decreaseQuantity,
    onRemove: removeFromCart, onClear: clearCart, isPaying: cartIsPaying,
    orderType: cartOrderType, onOrderType: setOrderType,
    selectedCustomer, onCustomerChange: setSelectedCustomer,
    discount: cartDiscount, discountType: cartDiscountType,
    onDiscount: setDiscount, onDiscountType: setDiscountType, discountInputRef,
    customerCash: cartCustomerCash, onCustomerCash: setCustomerCash, customerCashInputRef,
    ctaLabel, maxDiscountPercent, onPay: handlePay, customerOptions,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title + mobile cart FAB */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          {pageTitle}
        </h1>
        <button onClick={() => setMobileCartOpen(true)}
          className="md:hidden relative p-2 rounded-xl bg-amber-500 text-white shadow-md active:scale-95">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search + category dropdown */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex-1 relative min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input ref={searchRef} type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods…"
            className="w-full pl-8 pr-8 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="shrink-0 w-44">
          <SearchableSelect options={categoryFilterOptions} value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val); setSelectedCategory('All'); }}
            placeholder="All Categories" clearable triggerClassName="py-2 text-xs rounded-xl" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-3">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <UtensilsCrossed size={40} className="opacity-30" />
                <p className="text-sm font-medium">No items found</p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {paginatedItems.map((item) => (
                  <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={() => addToCart(item)} />
                ))}
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <ModernPagination
                currentPage={currentPage} totalPages={totalPages}
                totalItems={filteredItems.length} itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
        <div className="hidden md:flex shrink-0">
          <CartPanel {...cartProps} />
        </div>
      </div>

      <MobileCartDrawer open={mobileCartOpen} onClose={() => setMobileCartOpen(false)} {...cartProps} />
      <ReceiptModal isOpen={!!completedOrder} order={completedOrder} onClose={() => setCompletedOrder(null)} />
    </div>
  );
}