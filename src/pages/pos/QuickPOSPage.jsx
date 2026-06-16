import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Minus, Trash2, ShoppingCart, X,
  UtensilsCrossed, CheckCircle2,
  AlertCircle, Tag, Users, Banknote, ChevronLeft,
  Search, UserCircle2, Keyboard, Utensils, Printer,
} from 'lucide-react'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'
import ReceiptModal from '../../components/pos/ReceiptModal'
import { useFoodStore } from '../../utils/foodStore'
import { useCartStore } from '../../utils/cartStore'
import { useSettingsStore } from '../../utils/settingsStore'

// Strip trailing /api if present — static files are at server root, not /api
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
const ITEMS_PER_PAGE = 15
const fmt = (n) => Number(n).toLocaleString('en-LK')

// ── Bulletproof image URL ─────────────────────────────────────────────────────
const getFullImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${cleanPath}`
}

function nextInvoiceNumber() {
  const key = 'pos-quick-invoice-seq'
  const seq = parseInt(sessionStorage.getItem(key) ?? '0', 10) + 1
  sessionStorage.setItem(key, String(seq))
  return `QR-${String(seq).padStart(4, '0')}`
}

const CUSTOMER_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in Customer' },
  { value: 'c-001', label: 'Amal Perera' },
  { value: 'c-002', label: 'Nimal Silva' },
  { value: 'c-003', label: 'Kamala Fernando' },
  { value: 'c-004', label: 'Ruwan Jayawardena' },
  { value: 'c-005', label: 'Dilani Wickrama' },
]

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div role="status" aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold animate-[slideUp_0.25s_ease-out] ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      style={{ minWidth: '260px', maxWidth: '90vw' }}>
      {type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
      <span>{message}</span>
    </div>
  )
}

// ── Image-safe component ─────────────────────────────────────────────────────
function MenuCardImage({ image }) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !!image && !imgError

  if (!hasImage) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <Utensils size={32} className="text-gray-400" />
      </div>
    )
  }
  return (
    <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img src={getFullImageUrl(image)} alt="" onError={() => setImgError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
    </div>
  )
}

// ── Horizontal Category Pills ─────────────────────────────────────────────────
function CategoryBar({ categories, selected, onSelect }) {
  const allCategories = ['All', ...categories]
  return (
    <div className="flex gap-1.5 overflow-x-auto px-1 py-2 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {allCategories.map((cat) => {
        const isActive = selected === cat
        return (
          <button key={cat} onClick={() => onSelect(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95
              ${isActive ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {cat}
          </button>
        )
      })}
    </div>
  )
}

// ── Quick Search Bar (without customer selector) ──────────────────────────────
function QuickSearchBar({ searchQuery, onSearchChange, categoryFilter, onCategoryFilter, searchRef, categoryFilterOptions }) {
  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex-1 relative min-w-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search foods…"
          className="w-full pl-8 pr-8 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all" />
        {searchQuery && <button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><X size={13} /></button>}
      </div>
      <div className="shrink-0 w-36 hidden sm:block">
        <SearchableSelect options={categoryFilterOptions} value={categoryFilter} onChange={onCategoryFilter} placeholder="Category" clearable triggerClassName="py-2 text-xs rounded-xl" />
      </div>
    </div>
  )
}

// ── Menu Item Card ────────────────────────────────────────────────────────────
function MenuCard({ item, qty, onAdd }) {
  return (
    <button onClick={onAdd}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
      <MenuCardImage image={item.image} />
      {item.isNew && <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>}
      {qty > 0 && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{qty}</div>}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{item.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-1 font-bold">Rs. {fmt(item.price)}</p>
      </div>
      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"><Plus size={14} /></div>
    </button>
  )
}

// ── Cart Item Row ─────────────────────────────────────────────────────────────
function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <li className="group flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-gray-800/70 last:border-0">
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
        {item.image ? (
          <img src={getFullImageUrl(item.image)} alt=""
            onError={(e) => { e.target.style.display = 'none' }}
            className="w-full h-full object-cover rounded-lg" />
        ) : (
          <Utensils size={14} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{item.name}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">Rs. {fmt(item.price)} × {item.quantity}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">Rs. {fmt(item.price * item.quantity)}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => onDecrease()} aria-label={item.quantity === 1 ? 'Remove' : 'Decrease'}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all active:scale-90 ${item.quantity === 1 ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-amber-500 hover:text-white'}`}>
            {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
          </button>
          <span className="w-6 text-center text-[13px] font-bold text-gray-900 dark:text-gray-100 select-none tabular-nums">{item.quantity}</span>
          <button onClick={() => onIncrease()} className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-amber-500 hover:text-white transition-all active:scale-90"><Plus size={11} /></button>
        </div>
      </div>
    </li>
  )
}

// ── Cart Panel (desktop right sidebar with customer + order details) ──────────
function CartPanel({ cartItems, onIncrease, onDecrease, onRemove, onClear, onPay, isPaying,
  orderType, onOrderType, selectedCustomer, onCustomerChange,
  discount, discountType, onDiscount, onDiscountType, discountInputRef,
  customerCash, onCustomerCash, customerCashInputRef,
  ctaLabel, taxRate, serviceCharge, maxDiscountPercent }) {
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const count = cartItems.reduce((s, i) => s + i.quantity, 0)
  const rawDiscount = parseFloat(discount) || 0
  const discountAmt = discountType === '%' ? Math.min(subtotal, Math.round(subtotal * rawDiscount / 100)) : Math.min(subtotal, rawDiscount)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = taxRate > 0 ? Math.round(afterDiscount * taxRate / 100) : 0
  const serviceAmt = serviceCharge > 0 ? Math.round(afterDiscount * serviceCharge / 100) : 0
  const total = Math.max(0, afterDiscount + taxAmt + serviceAmt)
  const givenCash = parseFloat(customerCash) || 0
  const change = givenCash - total
  const hasChange = givenCash > 0 && change >= 0
  const isShort = givenCash > 0 && change < 0

  return (
    <aside className="flex flex-col w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center"><ShoppingCart size={16} className="text-amber-500" /></div>
          <h2 className="font-extrabold text-gray-900 dark:text-gray-100 text-[15px]">Ticket</h2>
          {count > 0 && <span className="bg-amber-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">{count}</span>}
        </div>
        {cartItems.length > 0 && <button onClick={onClear} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors">Clear</button>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"><ShoppingCart size={24} className="text-amber-300 dark:text-amber-600" /></div>
            <div><p className="text-sm font-bold text-gray-500 dark:text-gray-400">Ticket is empty</p><p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Tap any item to add it here</p></div>
          </div>
        ) : (
          <ul className="pt-1 pb-2">{cartItems.map((item) => <CartRow key={item.id} item={item} onIncrease={() => onIncrease(item.id)} onDecrease={() => onDecrease(item.id)} onRemove={() => onRemove(item.id)} />)}</ul>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-3 pb-4 space-y-3">
        <div className="space-y-2">
          {/* Customer selector moved inside cart panel */}
          <div className="w-full">
            <SearchableSelect
              options={CUSTOMER_OPTIONS}
              value={selectedCustomer}
              onChange={onCustomerChange}
              placeholder="Customer"
              searchPlaceholder="Search customer…"
              clearable
              triggerClassName="py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {['Dine-in', 'Takeaway'].map((t) => (
              <button key={t} onClick={() => onOrderType(t)}
                className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold transition-all ${orderType === t ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              {['%', 'Rs.'].map((t) => (
                <button key={t} onClick={() => { onDiscountType(t); onDiscount('') }}
                  className={`px-2.5 py-2 text-xs font-bold transition-colors ${discountType === t ? 'bg-amber-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}>{t}</button>
              ))}
            </div>
            <input ref={discountInputRef} type="number" min="0" placeholder={discountType === '%' ? '0–100' : '0.00'} value={discount} onChange={(e) => onDiscount(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all" />
          </div>
          <input ref={customerCashInputRef} type="number" min="0" placeholder="Cash received" value={customerCash} onChange={(e) => onCustomerCash(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${hasChange ? 'border-emerald-400 dark:border-emerald-500' : isShort ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-amber-400'}`} />
          {givenCash > 0 && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${hasChange ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
              {hasChange ? 'Change' : 'Short by'}: Rs. {fmt(Math.abs(change))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between"><span className="text-xs text-gray-400">Subtotal</span><span className="text-xs font-semibold text-gray-600">Rs. {fmt(subtotal)}</span></div>
          {discountAmt > 0 && <div className="flex justify-between"><span className="text-xs font-medium text-emerald-600">Discount</span><span className="text-xs font-semibold text-emerald-600">− Rs. {fmt(discountAmt)}</span></div>}
          {taxAmt > 0 && <div className="flex justify-between"><span className="text-xs text-gray-400">Tax ({taxRate}%)</span><span className="text-xs font-semibold text-gray-600">+ Rs. {fmt(taxAmt)}</span></div>}
          {serviceAmt > 0 && <div className="flex justify-between"><span className="text-xs text-gray-400">Service ({serviceCharge}%)</span><span className="text-xs font-semibold text-gray-600">+ Rs. {fmt(serviceAmt)}</span></div>}
          <div className="border-t border-dashed border-gray-200 pt-2">
            <div className="flex justify-between"><span className="text-sm font-bold text-gray-900">Total</span><span className="text-xl font-extrabold text-amber-600 tabular-nums">Rs. {fmt(total)}</span></div>
          </div>
        </div>

        <button onClick={onPay} disabled={cartItems.length === 0 || isPaying}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[15px] py-4 rounded-2xl shadow-lg shadow-amber-500/40 transition-all">
          {isPaying ? (
            <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Processing…</>
          ) : <><Printer size={19} />{ctaLabel}</>}
        </button>
      </div>
    </aside>
  )
}

// ── Mobile Cart Drawer ────────────────────────────────────────────────────────
function MobileCartDrawer({ open, onClose, ...cartProps }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose() }; if (open) document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [open, onClose])
  return (
    <>
      <div aria-hidden="true" onClick={onClose} className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div role="dialog" className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'} max-h-[85vh]`}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" /></div>
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
          <h2 className="font-bold text-gray-900 text-lg">Order Ticket</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-hidden"><CartPanel {...cartProps} onPay={() => { cartProps.onPay(); onClose() }} /></div>
      </div>
    </>
  )
}

// ── Main Page (wrapped in POSLayout) ──────────────────────────────────────────
export default function QuickPOSPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { defaultOrderType, maxDiscountPercent } = useSettingsStore()

  const { foods, fetchAll } = useFoodStore()
  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const categoryNames = useMemo(() => {
    const names = new Set()
    foods.forEach(f => { if (f.category?.name) names.add(f.category.name) })
    return Array.from(names).sort()
  }, [foods])

  const categoryFilterOptions = useMemo(() => {
    return [{ value: '', label: 'All Categories' }, ...categoryNames.map(c => ({ value: c, label: c }))]
  }, [categoryNames])

  const editOrder = location.state?.editOrder ?? null
  const isEditMode = editOrder !== null
  const editInvoiceNum = isEditMode ? `INV-${String(editOrder.id).padStart(3, '0')}` : null

  // ── Cart store ────────────────────────────────────────────────────────────
  const cartItems = useCartStore(s => s.cartItems)
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems])
  const cartOrderType = useCartStore(s => s.orderType)
  const cartDiscount = useCartStore(s => s.discount)
  const cartDiscountType = useCartStore(s => s.discountType)
  const cartCustomerCash = useCartStore(s => s.customerCash)
  const cartIsPaying = useCartStore(s => s.isPaying)
  const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart,
    setOrderType, setDiscount, setDiscountType, setCustomerCash, setCustomerName, submitOrder } = useCartStore()

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [completedOrder, setCompletedOrder] = useState(null)

  const discountInputRef = useRef(null)
  const customerCashInputRef = useRef(null)
  const searchRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])
  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'F4': e.preventDefault(); searchRef.current?.focus(); break
        case 'F8': e.preventDefault(); discountInputRef.current?.focus(); break
        case 'F9': e.preventDefault(); customerCashInputRef.current?.focus(); break
        case 'F10': e.preventDefault(); setOrderType(v => v === 'Dine-in' ? 'Takeaway' : 'Dine-in'); break
        case 'F11': e.preventDefault(); setDiscountType(v => v === '%' ? 'Rs.' : '%'); setDiscount(''); break
        default: break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredItems = useMemo(() => {
    let items = selectedCategory === 'All' ? foods : foods.filter((i) => (i.category?.name || '') === selectedCategory)
    if (categoryFilter) items = items.filter((i) => (i.category?.name || '') === categoryFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.category?.name || '').toLowerCase().includes(q))
    }
    return [...items].sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [foods, selectedCategory, categoryFilter, searchQuery])

  useEffect(() => { setCurrentPage(1) }, [selectedCategory, categoryFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const getQty = (id) => cartItems.find((i) => i.id === id)?.quantity ?? 0

  const handlePayRef = useRef(null)
  const handlePay = useCallback(async () => {
    if (cartItems.length === 0) return
    const invoiceNumber = isEditMode ? editInvoiceNum : nextInvoiceNumber()
    // Use selectedCustomer instead of customerRef
    const customerName = selectedCustomer === 'walk-in'
      ? 'Walk-in Customer'
      : (CUSTOMER_OPTIONS.find(o => o.value === selectedCustomer)?.label || selectedCustomer)
    setCustomerName(customerName)

    const result = await submitOrder({
      orderType: cartOrderType,
      invoiceNumber,
      customerName,
    })

    if (result) {
      setMobileCartOpen(false)
      setCompletedOrder(result) // save for receipt preview
      if (isEditMode) setTimeout(() => navigate('/pos/invoices'), 1200)
    } else {
      showToast('Failed to submit order', 'error')
    }
  }, [cartItems, cartOrderType, submitOrder, showToast, isEditMode, editInvoiceNum, navigate, selectedCustomer, setCustomerName])
  handlePayRef.current = handlePay

  useEffect(() => {
    const handler = (e) => { if (e.key === 'F12') { e.preventDefault(); handlePayRef.current?.() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pageTitle = isEditMode ? `Edit ${editInvoiceNum}` : 'Quick Invoice'
  const ctaLabel = isEditMode ? 'UPDATE' : 'PAY & PRINT'

  const cartProps = {
    cartItems, onIncrease: increaseQuantity, onDecrease: decreaseQuantity, onRemove: removeFromCart, onClear: clearCart, isPaying: cartIsPaying,
    orderType: cartOrderType, onOrderType: setOrderType,
    selectedCustomer, onCustomerChange: setSelectedCustomer,
    discount: cartDiscount, discountType: cartDiscountType, onDiscount: setDiscount, onDiscountType: setDiscountType, discountInputRef,
    customerCash: cartCustomerCash, onCustomerCash: setCustomerCash, customerCashInputRef,
    ctaLabel, taxRate: 0, serviceCharge: 0, maxDiscountPercent, onPay: handlePay,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title + mobile cart FAB */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{pageTitle}</h1>
        <button onClick={() => setMobileCartOpen(true)} className="md:hidden relative p-2 rounded-xl bg-amber-500 text-white shadow-md active:scale-95">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
        </button>
      </div>

      <QuickSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} categoryFilter={categoryFilter}
        onCategoryFilter={(val) => { setCategoryFilter(val); setSelectedCategory('All') }}
        searchRef={searchRef}
        categoryFilterOptions={categoryFilterOptions} />

      <CategoryBar categories={categoryNames} selected={selectedCategory} onSelect={setSelectedCategory} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-3">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400"><UtensilsCrossed size={40} className="opacity-30" /><p className="text-sm font-medium">No items found</p></div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {paginatedItems.map((item) => <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={() => addToCart(item)} />)}
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <ModernPagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredItems.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>

        <div className="hidden md:flex shrink-0"><CartPanel {...cartProps} /></div>
      </div>

      <MobileCartDrawer open={mobileCartOpen} onClose={() => setMobileCartOpen(false)} {...cartProps} />
      {toast && <Toast {...toast} onDone={dismissToast} />}
      
      {/* Receipt Preview Modal on successful payment */}
      <ReceiptModal isOpen={!!completedOrder} order={completedOrder} onClose={() => setCompletedOrder(null)} />
    </div>
  )
}