import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Minus, Trash2, ShoppingCart, X,
  UtensilsCrossed, Printer, CheckCircle2,
  AlertCircle, Tag, Users, Banknote, ChevronLeft,
  Search, UserCircle2, Keyboard,
} from 'lucide-react'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { useFoodStore } from '../../utils/foodStore'
import { printThermalReceipt } from '../../components/ui/ThermalReceipt'
import { useSettingsStore } from '../../utils/settingsStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Constants ─────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 15

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('en-LK')

/** Generate a sequential invoice number, persisted in sessionStorage */
function nextInvoiceNumber() {
  const key = 'pos-quick-invoice-seq'
  const seq = parseInt(sessionStorage.getItem(key) ?? '0', 10) + 1
  sessionStorage.setItem(key, String(seq))
  return `QR-${String(seq).padStart(4, '0')}`
}

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  const isSuccess = type === 'success'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-3
        px-5 py-3.5 rounded-2xl shadow-2xl
        text-white text-sm font-semibold
        animate-[slideUp_0.25s_ease-out]
        ${isSuccess ? 'bg-green-600' : 'bg-red-600'}
      `}
      style={{ minWidth: '260px', maxWidth: '90vw' }}
    >
      {isSuccess
        ? <CheckCircle2 size={18} className="shrink-0" />
        : <AlertCircle   size={18} className="shrink-0" />
      }
      <span>{message}</span>
    </div>
  )
}

// ── Keyboard Shortcuts Help Modal ────────────────────────────────────────────
const SHORTCUTS = [
  { key: 'F1',  description: 'Show / hide this keyboard shortcuts guide' },
  { key: 'F4',  description: 'Focus the item search bar'                 },
  { key: 'F8',  description: 'Focus the discount input'                  },
  { key: 'F9',  description: 'Focus the customer cash input'             },
  { key: 'F10', description: 'Toggle order type (Dine-in ↔ Takeaway)'   },
  { key: 'F11', description: 'Toggle discount type (% ↔ Rs.)'           },
  { key: 'F12', description: 'Process payment and print receipt'         },
  { key: 'Esc', description: 'Close this dialog'                         },
]

function KeyboardShortcutsModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden
                      bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-700/50">
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3 px-5 py-4">
            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <Keyboard size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-white/60 text-xs mt-0.5">Quick Invoice — F-key reference</p>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors shrink-0">
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-1.5">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
              <kbd className="shrink-0 inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm font-mono">{key}</kbd>
              <span className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{description}</span>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors">
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Category Emoji Map ────────────────────────────────────────────────────────
const CAT_EMOJI = {
  'Rice':       '🍚',
  'Noodles':    '🍜',
  'Kottu':      '🥘',
  'Devilled':   '🌶️',
  'Fried':      '🍟',
  'Soup':       '🍲',
  'Salad':      '🥗',
  'Dessert':    '🍮',
  'Drinks':     '🥤',
  'Snacks':     '🥪',
  'Seafood':    '🦐',
  'Chicken':    '🍗',
  'Beef':       '🥩',
  'Vegetarian': '🥦',
}

// ── Category Sidebar ──────────────────────────────────────────────────────────
function CategorySidebar({ categories, selected, onSelect }) {
  const allCategories = ['All', ...categories]
  return (
    <aside className="hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-3 shrink-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ width: '140px', minWidth: '120px', maxWidth: '160px' }}>
      <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.15em] px-3 mb-2">Categories</p>
      <div className="flex flex-col gap-0.5 px-2">
        {allCategories.map((cat) => {
          const isActive = selected === cat
          const emoji = CAT_EMOJI[cat] ?? '🍴'
          return (
            <button key={cat} onClick={() => onSelect(cat)}
              className={`group relative w-full flex items-center gap-2.5 pl-3 pr-2 py-2.5 rounded-xl text-left text-[12px] font-semibold leading-tight transition-all duration-150 active:scale-[0.97] ${isActive ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/50" />}
              <span className={`text-base leading-none shrink-0 transition-transform duration-150 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{emoji}</span>
              <span className="truncate">{cat}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

// ── Mobile Category Scroll Bar ────────────────────────────────────────────────
function MobileCategoryBar({ categories, selected, onSelect }) {
  const allCategories = ['All', ...categories]
  return (
    <div className="md:hidden flex gap-1.5 overflow-x-auto px-3 py-2 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {allCategories.map((cat) => {
        const isActive = selected === cat
        const emoji = CAT_EMOJI[cat] ?? '🍴'
        return (
          <button key={cat} onClick={() => onSelect(cat)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 whitespace-nowrap active:scale-95 ${isActive ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <span className="text-sm leading-none">{emoji}</span>
            {cat}
          </button>
        )
      })}
    </div>
  )
}

// ── Quick Search Bar ──────────────────────────────────────────────────────────
const CUSTOMER_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in Customer' },
  { value: 'c-001',   label: 'Amal Perera'       },
  { value: 'c-002',   label: 'Nimal Silva'        },
  { value: 'c-003',   label: 'Kamala Fernando'    },
  { value: 'c-004',   label: 'Ruwan Jayawardena'  },
  { value: 'c-005',   label: 'Dilani Wickrama'    },
]

function QuickSearchBar({ searchQuery, onSearchChange, categoryFilter, onCategoryFilter, customer, onCustomerChange, searchRef, categoryFilterOptions }) {
  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex-1 relative min-w-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search foods…"
          className="w-full pl-8 pr-8 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all" />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={13} />
          </button>
        )}
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded pointer-events-none select-none hidden sm:block"
          style={{ display: searchQuery ? 'none' : undefined }}>F4</span>
      </div>
      <div className="shrink-0 w-36 hidden sm:block">
        <SearchableSelect options={categoryFilterOptions} value={categoryFilter} onChange={onCategoryFilter} placeholder="Category" searchPlaceholder="Filter…" clearable triggerClassName="py-2 text-xs rounded-xl" />
      </div>
      <div className="shrink-0 w-40 hidden md:block">
        <SearchableSelect options={CUSTOMER_OPTIONS} value={customer} onChange={onCustomerChange} placeholder="Customer" searchPlaceholder="Search customer…" clearable triggerClassName="py-2 text-xs rounded-xl" />
      </div>
      <button className="md:hidden shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Select customer">
        <UserCircle2 size={16} />
      </button>
    </div>
  )
}

// ── Menu Item Card ────────────────────────────────────────────────────────────
function MenuCard({ item, qty, onAdd, onIncrease, onDecrease }) {
  const imgSrc = item.image?.startsWith('/')
    ? `${API_BASE}${item.image}`
    : (item.image || FALLBACK_IMAGE_URL)

  return (
    <button onClick={onAdd}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img src={imgSrc} alt={item.name} onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        {item.isNew && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
        )}
        {qty > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{qty}</div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{item.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-1 font-bold">Rs. {fmt(item.price)}</p>
      </div>
      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
        <Plus size={14} />
      </div>
    </button>
  )
}

// ── Cart Item Row ─────────────────────────────────────────────────────────────
function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <li className="group flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-gray-800/70 last:border-0">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 shadow-sm">
        <img src={item.image || FALLBACK_IMAGE_URL} alt={item.name} onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{item.name}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">Rs. {fmt(item.price)} × {item.quantity}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">Rs. {fmt(item.price * item.quantity)}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onDecrease() }} aria-label={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 active:scale-90 ${item.quantity === 1 ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-amber-500 hover:text-white'}`}>
            {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
          </button>
          <span className="w-6 text-center text-[13px] font-bold text-gray-900 dark:text-gray-100 select-none tabular-nums">{item.quantity}</span>
          <button onClick={(e) => { e.stopPropagation(); onIncrease() }} aria-label="Increase quantity"
            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-amber-500 hover:text-white transition-all duration-150 active:scale-90">
            <Plus size={11} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove() }} aria-label="Remove item"
            className="w-6 h-6 rounded-md flex items-center justify-center ml-0.5 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-150 active:scale-90">
            <X size={11} />
          </button>
        </div>
      </div>
    </li>
  )
}

// ── Order Details Strip ───────────────────────────────────────────────────────
function OrderDetailsStrip({ orderType, onOrderType, customerRef, discount, discountType, onDiscount, onDiscountType, discountInputRef, customerCash, onCustomerCash, customerCashInputRef, total, maxDiscountPercent }) {
  const givenCash = parseFloat(customerCash) || 0
  const change = givenCash - total
  const hasChange = givenCash > 0 && change >= 0
  const isShort = givenCash > 0 && change < 0
  const rawDiscount = parseFloat(discount) || 0
  const isOverCap = discountType === '%' && maxDiscountPercent > 0 && rawDiscount > maxDiscountPercent

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Order Type</p>
          <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">F10</span>
        </div>
        <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {['Dine-in', 'Takeaway'].map((type) => (
            <button key={type} onClick={() => onOrderType(type)}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 ${orderType === type ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{type}</button>
          ))}
        </div>
      </div>
      {orderType === 'Takeaway' && (
        <label className="block">
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1"><Users size={9} />Customer Name</span>
          <input ref={customerRef} type="text" placeholder="Walk-in customer" maxLength={32}
            className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all" />
        </label>
      )}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"><Tag size={9} />Discount</p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">F11</span>
            <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">F8</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
            {['%', 'Rs.'].map((t) => (
              <button key={t} onClick={() => { onDiscountType(t); onDiscount('') }}
                className={`px-2.5 py-2 text-xs font-bold transition-colors ${discountType === t ? 'bg-amber-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{t}</button>
            ))}
          </div>
          <input ref={discountInputRef} type="number" inputMode="decimal" min="0" max={discountType === '%' ? '100' : undefined}
            placeholder={discountType === '%' ? '0 – 100' : '0.00'} value={discount} onChange={(e) => onDiscount(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all" />
        </div>
        {isOverCap && <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1"><Tag size={9} />Max discount is {maxDiscountPercent}%</p>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"><Banknote size={9} />Customer Cash</p>
          <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">F9</span>
        </div>
        <input ref={customerCashInputRef} type="number" inputMode="decimal" min="0" placeholder="0.00" value={customerCash} onChange={(e) => onCustomerCash(e.target.value)}
          className={`w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${hasChange ? 'border-emerald-400 dark:border-emerald-500 focus:border-emerald-400 focus:ring-emerald-400/20' : isShort ? 'border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-amber-400/20'}`} />
        {givenCash > 0 && (
          <div className={`mt-1.5 flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold ${hasChange ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
            <span>{hasChange ? 'Change' : 'Short by'}</span>
            <span className="tabular-nums">Rs. {fmt(Math.abs(change))}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Persistent Cart Panel ─────────────────────────────────────────────────────
function CartPanel({ cartItems, onIncrease, onDecrease, onRemove, onClear, onPay, isPaying, orderType, onOrderType, customerRef, discount, discountType, onDiscount, onDiscountType, discountInputRef, customerCash, onCustomerCash, customerCashInputRef, ctaLabel, taxRate, serviceCharge, maxDiscountPercent }) {
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const count = cartItems.reduce((s, i) => s + i.quantity, 0)
  const rawDiscount = parseFloat(discount) || 0
  const discountAmt = discountType === '%' ? Math.min(subtotal, Math.round(subtotal * rawDiscount / 100)) : Math.min(subtotal, rawDiscount)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = taxRate > 0 ? Math.round(afterDiscount * taxRate / 100) : 0
  const serviceAmt = serviceCharge > 0 ? Math.round(afterDiscount * serviceCharge / 100) : 0
  const total = Math.max(0, afterDiscount + taxAmt + serviceAmt)

  return (
    <aside className="flex flex-col w-full h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center"><ShoppingCart size={16} className="text-amber-500" /></div>
          <h2 className="font-extrabold text-gray-900 dark:text-gray-100 text-[15px] tracking-tight">Order Ticket</h2>
          {count > 0 && <span className="bg-amber-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center tabular-nums">{count}</span>}
        </div>
        {cartItems.length > 0 && (
          <button onClick={onClear} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">Clear all</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"><ShoppingCart size={24} className="text-amber-300 dark:text-amber-600" /></div>
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Ticket is empty</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Tap any item to add it here</p>
            </div>
          </div>
        ) : (
          <ul className="pt-1 pb-2">
            {cartItems.map((item) => (
              <CartRow key={item.id} item={item} onIncrease={() => onIncrease(item.id)} onDecrease={() => onDecrease(item.id)} onRemove={() => onRemove(item.id)} />
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-3 pb-4 space-y-3">
        <OrderDetailsStrip orderType={orderType} onOrderType={onOrderType} customerRef={customerRef}
          discount={discount} discountType={discountType} onDiscount={onDiscount} onDiscountType={onDiscountType} discountInputRef={discountInputRef}
          customerCash={customerCash} onCustomerCash={onCustomerCash} customerCashInputRef={customerCashInputRef} total={total} maxDiscountPercent={maxDiscountPercent} />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">Subtotal<span className="ml-1 text-gray-300 dark:text-gray-600">({count} {count === 1 ? 'item' : 'items'})</span></span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">Rs. {fmt(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Tag size={10} />Discount{discountType === '%' ? ` (${rawDiscount}%)` : ''}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">− Rs. {fmt(discountAmt)}</span>
            </div>
          )}
          {taxAmt > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">Tax ({taxRate}%)</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">+ Rs. {fmt(taxAmt)}</span>
            </div>
          )}
          {serviceAmt > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">Service ({serviceCharge}%)</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">+ Rs. {fmt(serviceAmt)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Grand Total</span>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">Rs. {fmt(total)}</span>
            </div>
          </div>
        </div>
        <button onClick={onPay} disabled={cartItems.length === 0 || isPaying}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-extrabold text-[15px] tracking-wide py-4 rounded-2xl shadow-lg shadow-amber-500/40 transition-all duration-150">
          {isPaying ? (
            <><svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Processing…</>
          ) : (
            <><Printer size={19} />{ctaLabel}<span className="ml-1 text-[11px] font-bold opacity-70 bg-white/20 px-1.5 py-0.5 rounded-md">F12</span></>
          )}
        </button>
      </div>
    </aside>
  )
}

// ── Mobile Cart Drawer ────────────────────────────────────────────────────────
function MobileCartDrawer({ open, onClose, ...cartProps }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <div role="dialog" aria-modal="true" aria-label="Cart"
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-y-0' : 'translate-y-full'} max-h-[85vh]`}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" /></div>
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Order Ticket</h2>
          <button onClick={onClose} aria-label="Close cart" className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <CartPanel {...cartProps} onPay={() => { cartProps.onPay(); onClose() }} />
        </div>
      </div>
    </>
  )
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ cartCount, onCartOpen, onBack, title, onShowShortcuts }) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Back to Dashboard"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium mr-1">
          <ChevronLeft size={18} /><span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center"><UtensilsCrossed size={14} className="text-white" /></div>
        <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onShowShortcuts} aria-label="Keyboard shortcuts (F1)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold">
          <Keyboard size={15} /><span className="hidden md:inline">Shortcuts</span>
          <span className="text-[9px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">F1</span>
        </button>
        <button onClick={onCartOpen} className="md:hidden relative p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30 active:scale-95 transition-transform" aria-label="Open cart">
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
        </button>
      </div>
    </header>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuickPOSPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── Settings store ────────────────────────────────────────────────────────
  const { defaultOrderType, defaultDiscountType, maxDiscountPercent, defaultTaxRate, defaultServiceCharge, applyTaxOnReceipt, applyServiceChargeOnReceipt } = useSettingsStore()
  const effectiveTaxRate = applyTaxOnReceipt ? (defaultTaxRate ?? 0) : 0
  const effectiveServiceRate = applyServiceChargeOnReceipt ? (defaultServiceCharge ?? 0) : 0

  // ── Food store ────────────────────────────────────────────────────────────
  const { foods, fetchAll } = useFoodStore()
  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive unique category names from live food items ─────────────────────
  const categoryNames = useMemo(() => {
    const names = new Set()
    foods.forEach(f => { if (f.category?.name) names.add(f.category.name) })
    return Array.from(names).sort()
  }, [foods])

  // ── Category filter options for the search bar ────────────────────────────
  const categoryFilterOptions = useMemo(() => {
    return [{ value: '', label: 'All Categories' }, ...categoryNames.map(c => ({ value: c, label: c }))]
  }, [categoryNames])

  // ── Edit mode — detect order passed via router state ──────────────────────
  const editOrder = location.state?.editOrder ?? null
  const isEditMode = editOrder !== null
  const editInvoiceNum = isEditMode ? `INV-${String(editOrder.id).padStart(3, '0')}` : null

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cartItems, setCartItems] = useState([])
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [toast, setToast] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [orderType, setOrderType] = useState(defaultOrderType ?? 'Dine-in')
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState(defaultDiscountType === 'fixed' ? 'Rs.' : '%')
  const [customerCash, setCustomerCash] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('walk-in')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Refs
  const customerRef = useRef(null)
  const discountInputRef = useRef(null)
  const customerCashInputRef = useRef(null)
  const searchRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])
  const dismissToast = useCallback(() => setToast(null), [])

  // ── F-key keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'F1': e.preventDefault(); setShowShortcuts(prev => !prev); break
        case 'F4': e.preventDefault(); searchRef.current?.focus(); break
        case 'F8': e.preventDefault(); discountInputRef.current?.focus(); break
        case 'F9': e.preventDefault(); customerCashInputRef.current?.focus(); break
        case 'F10': e.preventDefault(); setOrderType(prev => prev === 'Dine-in' ? 'Takeaway' : 'Dine-in'); break
        case 'F11': e.preventDefault(); setDiscountType(prev => prev === '%' ? 'Rs.' : '%'); setDiscount(''); break
        default: break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Filtered items from live store, sorted newest first ───────────────────
  const filteredItems = useMemo(() => {
    let items = selectedCategory === 'All'
      ? foods
      : foods.filter((i) => (i.category?.name || '') === selectedCategory)

    if (categoryFilter) {
      items = items.filter((i) => (i.category?.name || '') === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      items = items.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category?.name || '').toLowerCase().includes(q)
      )
    }

    // Sort descending by ID (newest = highest ID first)
    return [...items].sort((a, b) => (b.id || 0) - (a.id || 0))
  }, [foods, selectedCategory, categoryFilter, searchQuery])

  useEffect(() => { setCurrentPage(1) }, [selectedCategory, categoryFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const getQty = (id) => cartItems.find((i) => i.id === id)?.quantity ?? 0

  const addItem = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const increaseQty = (id) => setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
  const decreaseQty = (id) => setCartItems((prev) => {
    const item = prev.find((i) => i.id === id)
    if (!item) return prev
    if (item.quantity <= 1) return prev.filter((i) => i.id !== id)
    return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
  })
  const removeItem = (id) => setCartItems((prev) => prev.filter((i) => i.id !== id))
  const clearCart = () => setCartItems([])
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  // ── Pay / Print handler ───────────────────────────────────────────────────
  const handlePayRef = useRef(null)

  const handlePay = useCallback(async () => {
    if (cartItems.length === 0 || isPaying) return
    setIsPaying(true)
    const invoiceNumber = isEditMode ? editInvoiceNum : nextInvoiceNumber()
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const rawDiscount = parseFloat(discount) || 0
    const cappedRaw = discountType === '%' ? Math.min(rawDiscount, maxDiscountPercent ?? 100) : rawDiscount
    const discountAmt = discountType === '%' ? Math.min(subtotal, Math.round(subtotal * cappedRaw / 100)) : Math.min(subtotal, cappedRaw)
    const afterDiscount = subtotal - discountAmt
    const taxAmt = effectiveTaxRate > 0 ? Math.round(afterDiscount * effectiveTaxRate / 100) : 0
    const serviceAmt = effectiveServiceRate > 0 ? Math.round(afterDiscount * effectiveServiceRate / 100) : 0
    const total = Math.max(0, afterDiscount + taxAmt + serviceAmt)
    const customerName = customerRef.current?.value?.trim() ?? ''

    const receiptData = {
      invoiceNumber, orderType, tableNumber: '', customerName: orderType === 'Takeaway' ? customerName : '',
      cashierName: 'Admin', items: cartItems.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
      subtotal, discount: discountAmt, taxRate: effectiveTaxRate, serviceCharge: effectiveServiceRate, total, paymentMethod: 'Cash', issuedAt: new Date(),
    }

    const snapshot = [...cartItems]
    clearCart()
    setMobileCartOpen(false)
    setDiscount('')
    setCustomerCash('')
    if (customerRef.current) customerRef.current.value = ''

    try {
      await printThermalReceipt(receiptData)
      showToast(isEditMode ? 'Invoice updated successfully' : 'Invoice generated successfully', 'success')
      if (isEditMode) setTimeout(() => navigate('/pos/invoices'), 1200)
    } catch (err) {
      setCartItems(snapshot)
      showToast('Popup blocked. Please allow popups and try again.', 'error')
    } finally {
      setIsPaying(false)
    }
  }, [cartItems, isPaying, discount, discountType, orderType, clearCart, showToast, isEditMode, editInvoiceNum, navigate, effectiveTaxRate, effectiveServiceRate, maxDiscountPercent])

  handlePayRef.current = handlePay

  useEffect(() => {
    const handler = (e) => { if (e.key === 'F12') { e.preventDefault(); handlePayRef.current?.() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pageTitle = isEditMode ? `Edit Invoice ${editInvoiceNum}` : 'Quick Invoice'
  const ctaLabel = isEditMode ? 'UPDATE & PRINT' : 'PAY & PRINT'

  const cartProps = {
    cartItems, onIncrease: increaseQty, onDecrease: decreaseQty, onRemove: removeItem, onClear: clearCart, isPaying,
    orderType, onOrderType: setOrderType, customerRef,
    discount, discountType, onDiscount: setDiscount, onDiscountType: setDiscountType, discountInputRef,
    customerCash, onCustomerCash: setCustomerCash, customerCashInputRef,
    ctaLabel, taxRate: effectiveTaxRate, serviceCharge: effectiveServiceRate, maxDiscountPercent, onPay: handlePay,
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <TopBar cartCount={cartCount} onCartOpen={() => setMobileCartOpen(true)} onBack={() => navigate(isEditMode ? '/pos/invoices' : '/pos')} title={pageTitle} onShowShortcuts={() => setShowShortcuts(true)} />
      <MobileCategoryBar categories={categoryNames} selected={selectedCategory} onSelect={setSelectedCategory} />
      <div className="flex-1 flex overflow-hidden">
        <CategorySidebar categories={categoryNames} selected={selectedCategory} onSelect={setSelectedCategory} />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <QuickSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} categoryFilter={categoryFilter}
            onCategoryFilter={(val) => { setCategoryFilter(val); setSelectedCategory('All') }}
            customer={selectedCustomer} onCustomerChange={setSelectedCustomer} searchRef={searchRef}
            categoryFilterOptions={categoryFilterOptions} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <UtensilsCrossed size={40} className="opacity-30" />
                <p className="text-sm font-medium">No items in this category</p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {paginatedItems.map((item) => (
                  <MenuCard key={item.id} item={item} qty={getQty(item.id)} onAdd={() => addItem(item)} onIncrease={() => increaseQty(item.id)} onDecrease={() => decreaseQty(item.id)} />
                ))}
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <ModernPagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredItems.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
            </div>
          )}
        </main>
        <div className="hidden md:flex shrink-0 w-80"><CartPanel {...cartProps} /></div>
      </div>
      <MobileCartDrawer open={mobileCartOpen} onClose={() => setMobileCartOpen(false)} {...cartProps} />
      {toast && <Toast message={toast.message} type={toast.type} onDone={dismissToast} />}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}