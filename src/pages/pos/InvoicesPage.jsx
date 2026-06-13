import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Eye, Printer, X, Plus, Trash2, AlertTriangle,
  CheckCircle2, XCircle,
  SlidersHorizontal, ChevronDown, List, LayoutGrid,
} from 'lucide-react'
import { MOCK_ORDERS } from '../../utils/mockOrders'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'
import { printThermalReceipt } from '../../components/ui/ThermalReceipt'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

const DATE_OPTIONS = [
  { value: 'all',       label: 'All Time'      },
  { value: 'today',     label: 'Today'         },
  { value: 'yesterday', label: 'Yesterday'     },
  { value: '7days',     label: 'Last 7 Days'   },
  { value: '30days',    label: 'Last 30 Days'  },
]

const PAYMENT_OPTIONS = [
  { value: 'all',    label: 'All Payments' },
  { value: 'PAID',   label: 'Paid'         },
  { value: 'UNPAID', label: 'Unpaid'       },
]

const TYPE_OPTIONS = [
  { value: 'all',     label: 'All Types' },
  { value: 'DINE_IN', label: 'Dine-in'  },
  { value: 'PICKUP',  label: 'Pick-up'  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function invNum(orderId) { return `INV-${String(orderId).padStart(3, '0')}` }

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
  }
}

function isInDateRange(iso, range) {
  const now  = new Date()
  const date = new Date(iso)
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (range === 'all')       return true
  if (range === 'today')     return date >= startOf(now)
  if (range === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    return date >= startOf(y) && date < startOf(now)
  }
  if (range === '7days')  { const d = new Date(now); d.setDate(d.getDate() - 7);  return date >= d }
  if (range === '30days') { const d = new Date(now); d.setDate(d.getDate() - 30); return date >= d }
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT BADGE
// ─────────────────────────────────────────────────────────────────────────────
function PaymentBadge({ status }) {
  return status === 'PAID' ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                     bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
      <CheckCircle2 size={11} /> Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                     bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
      <XCircle size={11} /> Unpaid
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ order, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]
                    flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900
                      border-gray-200 dark:border-gray-700/50">
        {/* Gradient danger header */}
        <div className="p-6 border-b
                        bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10
                        border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                            bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Invoice</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This action cannot be undone. The invoice will be permanently removed.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white
                        bg-gray-100 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700/50">
            {invNum(order.id)} — {order.customerName} · Rs.{' '}
            {order.grandTotal.toLocaleString('en-LK')}
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500
                       hover:from-red-700 hover:to-red-600
                       transition-all flex items-center justify-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                       bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE PREVIEW MODAL — Thermal Receipt Style
// ─────────────────────────────────────────────────────────────────────────────
const DASH  = '─'.repeat(32)
const DOTTED = '·'.repeat(32)

function fmtMoney(n) {
  return `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
}

function ReceiptRow({ label, value, bold, large, accent, neg }) {
  return (
    <div className={`flex justify-between items-baseline gap-2
                     ${large ? 'mt-1 pt-2 border-t-2 border-gray-900 dark:border-gray-100' : ''}`}>
      <span className={`font-mono text-xs shrink-0
                        ${large  ? 'text-sm font-black text-gray-900 dark:text-gray-100' :
                          bold   ? 'font-bold text-gray-700 dark:text-gray-300' :
                          accent ? 'text-gray-500 dark:text-gray-400' :
                                   'text-gray-500 dark:text-gray-400'}`}>
        {label}
      </span>
      <span className={`font-mono text-xs tabular-nums text-right
                        ${large  ? 'text-sm font-black text-gray-900 dark:text-gray-100' :
                          bold   ? 'font-bold text-gray-700 dark:text-gray-300' :
                          neg    ? 'text-gray-600 dark:text-gray-400' :
                                   'text-gray-700 dark:text-gray-300'}`}>
        {value}
      </span>
    </div>
  )
}

function Divider({ dotted }) {
  return (
    <p className={`font-mono text-[10px] leading-none select-none overflow-hidden
                   ${dotted ? 'text-gray-400 dark:text-gray-600' : 'text-gray-300 dark:text-gray-700'}`}>
      {dotted ? DOTTED : DASH}
    </p>
  )
}

function InvoiceModal({ order, onClose }) {
  const { date, time } = formatDateTime(order.createdAt)

  function handlePrint() {
    printThermalReceipt({
      invoiceNumber : invNum(order.id),
      orderType     : order.orderType === 'DINE_IN' ? 'Dine-in' : 'Pick-up',
      tableNumber   : order.tableNumber ?? '',
      customerName  : order.customerName,
      cashierName   : 'Admin',
      items         : order.items.map(i => ({
        name  : i.name,
        qty   : i.quantity,
        price : i.unitPrice,
      })),
      subtotal      : order.subtotal,
      discount      : order.discountAmount ?? 0,
      total         : order.grandTotal,
      paymentMethod : order.paymentMethod ?? order.paymentStatus,
      issuedAt      : new Date(order.createdAt),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl
                      border border-gray-200 dark:border-gray-800
                      w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Modal chrome header ── */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0
                        border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Printer size={15} className="text-amber-500" />
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Receipt Preview
            </span>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable receipt body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-4 py-5">

          {/* Receipt paper card */}
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-md
                          border border-gray-100 dark:border-gray-800
                          px-5 py-5 flex flex-col gap-2
                          font-mono">

            {/* ── HEADER ── */}
            <div className="text-center mb-1">
              <p className="text-base font-black tracking-widest uppercase text-gray-900 dark:text-gray-100">
                SENARI CHINESE
              </p>
              <p className="text-base font-black tracking-widest uppercase text-gray-900 dark:text-gray-100">
                HOTEL
              </p>
              <p className="text-[10px] tracking-[3px] uppercase text-gray-500 dark:text-gray-400 mt-0.5">
                Authentic Chinese Cuisine
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
                Senari Chinese Hotel, Sri Lanka{'\n'}Tel: +94 41 234 5678
              </p>
            </div>

            <Divider />

            {/* ── META ── */}
            <div className="flex flex-col gap-0.5">
              <ReceiptRow label="Invoice :" value={invNum(order.id)}          bold />
              <ReceiptRow label="Date    :" value={date}                       />
              <ReceiptRow label="Time    :" value={time}                       />
              <ReceiptRow label="Type    :" value={order.orderType === 'DINE_IN' ? 'Dine-in' : 'Pick-up'} />
              {order.customerName && (
                <ReceiptRow label="Customer:" value={order.customerName}       />
              )}
              {order.customerPhone && (
                <ReceiptRow label="Phone   :" value={order.customerPhone}      />
              )}
              <ReceiptRow label="Cashier :" value="Admin"                      />
            </div>

            <Divider />

            {/* ── ITEMS HEADER ── */}
            <p className="text-center text-[10px] font-bold tracking-[3px] uppercase
                          text-gray-500 dark:text-gray-400">
              ORDER ITEMS
            </p>

            <Divider dotted />

            {/* ── ITEM ROWS ── */}
            <div className="flex flex-col gap-1.5">
              {order.items.map(item => (
                <div key={item.id}>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </p>
                  <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{item.quantity} × {fmtMoney(item.unitPrice)}</span>
                    <span className="tabular-nums">{fmtMoney(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Divider dotted />

            {/* ── TOTALS ── */}
            <div className="flex flex-col gap-0.5">
              <ReceiptRow label="Subtotal" value={fmtMoney(order.subtotal)} />
              {(order.discountAmount ?? 0) > 0 && (
                <ReceiptRow
                  label="Discount"
                  value={`- ${fmtMoney(order.discountAmount)}`}
                  neg
                />
              )}
              <ReceiptRow
                label="TOTAL"
                value={fmtMoney(order.grandTotal)}
                large
              />
            </div>

            <Divider />

            {/* ── PAYMENT ── */}
            <div className="flex flex-col gap-0.5">
              <ReceiptRow
                label="Payment"
                value={order.paymentMethod ?? order.paymentStatus}
                bold
              />
              <ReceiptRow
                label="Status"
                value={order.paymentStatus === 'PAID' ? '✓ PAID' : 'UNPAID'}
                bold
              />
            </div>

            <Divider />

            {/* ── FOOTER ── */}
            <div className="text-center mt-1 flex flex-col gap-0.5">
              <p className="text-xs font-black tracking-widest uppercase text-gray-900 dark:text-gray-100">
                THANK YOU!
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Please come again</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Pick-up &amp; Dine-in only · Pay at Counter
              </p>
              <p className="text-[10px] tracking-widest text-gray-400 dark:text-gray-500 mt-0.5">
                www.senarichinese.lk
              </p>
            </div>

          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                       bg-gradient-to-r from-amber-500 to-orange-500
                       text-white rounded-xl font-semibold text-sm
                       hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20"
          >
            <Printer size={15} /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const navigate = useNavigate()

  // Local orders list — starts from mock data
  const [orders,              setOrders]              = useState(MOCK_ORDERS)
  const [search,              setSearch]              = useState('')
  const [dateFilter,          setDateFilter]          = useState('all')
  const [paymentFilter,       setPaymentFilter]       = useState('all')
  const [typeFilter,          setTypeFilter]          = useState('all')
  const [page,                setPage]                = useState(1)
  const [activeInvoice,       setActiveInvoice]       = useState(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [delOrder,            setDelOrder]            = useState(null)
  const [viewMode,            setViewMode]            = useState('table')

  // ── Auto-switch to grid on mobile (< 768px) ──────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setViewMode(e.matches ? 'grid' : 'table')
    if (mq.matches) setViewMode('grid')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Delete — remove by id, clamp page
  function handleDeleteInvoice(id) {
    setOrders(prev => prev.filter(o => o.id !== id))
    setDelOrder(null)
    resetPage()
  }

  // ── Filtered + sorted invoices (newest first) ─────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter(o => {
        const matchSearch  = !q ||
          invNum(o.id).toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
        const matchDate    = isInDateRange(o.createdAt, dateFilter)
        const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter
        const matchType    = typeFilter === 'all' || o.orderType === typeFilter
        return matchSearch && matchDate && matchPayment && matchType
      })
  }, [orders, search, dateFilter, paymentFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetPage() { setPage(1) }

  const hasAdvancedFilters = dateFilter !== 'all' || typeFilter !== 'all'
  const hasAnyFilter       = search || dateFilter !== 'all' || paymentFilter !== 'all' || typeFilter !== 'all'

  function clearAll() {
    setSearch(''); setDateFilter('all'); setPaymentFilter('all')
    setTypeFilter('all'); resetPage()
  }

  // Summary stats
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((s, o) => s + o.grandTotal, 0)
  const paidCount   = orders.filter(o => o.paymentStatus === 'PAID').length
  const unpaidCount = orders.filter(o => o.paymentStatus === 'UNPAID').length

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {orders.length} total · {paidCount} paid · {unpaidCount} unpaid
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Revenue summary pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl
                          bg-amber-500/10 border border-amber-500/20 shrink-0">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Total Revenue:
            </span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
              Rs. {totalRevenue.toLocaleString('en-LK')}
            </span>
          </div>
          {/* Add Invoice button — navigates to Quick POS */}
          <button
            onClick={() => navigate('/pos/quick')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                       bg-gradient-to-r from-orange-500 to-red-500 text-white
                       hover:opacity-90 transition-opacity shadow-md shadow-orange-500/20 shrink-0"
          >
            <Plus size={16} /> Add Invoice
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-3 sm:p-4 rounded-2xl border
                      bg-white dark:bg-gray-800/30
                      border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-col gap-3">

          {/* ── Row 1: Search + 2 primary filters + More Options toggle ── */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Search — grows to fill available space */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px]
                            bg-gray-50 dark:bg-gray-800/50
                            border-gray-200 dark:border-gray-700/50">
              <Search size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by Invoice ID, Order ID, or Customer…"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                           text-gray-900 dark:text-white
                           placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {search && (
                <button onClick={() => { setSearch(''); resetPage() }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Primary filter 1: Payment Status */}
            <SearchableSelect
              options={PAYMENT_OPTIONS}
              value={paymentFilter}
              onChange={v => { setPaymentFilter(v); resetPage() }}
              placeholder="All Payments"
              searchPlaceholder="Search status…"
              triggerClassName="w-40"
            />

            {/* Primary filter 2: Date Range */}
            <SearchableSelect
              options={DATE_OPTIONS}
              value={dateFilter}
              onChange={v => { setDateFilter(v); resetPage() }}
              placeholder="All Time"
              searchPlaceholder="Search range…"
              triggerClassName="w-36"
            />

            {/* More Options toggle */}
            <button
              onClick={() => setShowAdvancedFilters(v => !v)}
              aria-expanded={showAdvancedFilters}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                          border transition-all duration-150 shrink-0
                          ${showAdvancedFilters || hasAdvancedFilters
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
                          }`}
            >
              <SlidersHorizontal size={13} />
              More Options
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Clear all */}
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700
                           transition-colors shrink-0"
              >
                <X size={12} /> Clear
              </button>
            )}

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 ml-auto">
              {[{ id: 'table', Icon: List }, { id: 'grid', Icon: LayoutGrid }].map(({ id, Icon }) => (
                <button key={id} onClick={() => setViewMode(id)} aria-label={`${id} view`}
                  className={`p-2 rounded-lg transition-all duration-150
                             ${viewMode === id
                               ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                               : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                             }`}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Row 2: Advanced filters (animated expand) ── */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out
                        ${showAdvancedFilters ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                More filters:
              </span>

              {/* Advanced filter: Order Type */}
              <SearchableSelect
                options={TYPE_OPTIONS}
                value={typeFilter}
                onChange={v => { setTypeFilter(v); resetPage() }}
                placeholder="All Types"
                searchPlaceholder="Search type…"
                triggerClassName="w-36"
              />
            </div>
          </div>

          {/* Active filter summary */}
          {hasAnyFilter && (
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Showing {filtered.length} of {orders.length} invoices
            </p>
          )}
        </div>
      </div>

      {/* ── Data table / Grid ── */}
      <div className="rounded-2xl border overflow-hidden
                      bg-white dark:bg-gray-900
                      border-gray-200 dark:border-gray-800">

        {viewMode === 'grid' ? (
          /* ── Card Grid ── */
          <>
            {pageItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No invoices match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {pageItems.map(order => {
                  const { date, time } = formatDateTime(order.createdAt)
                  return (
                    <div key={order.id}
                      className="group flex flex-col rounded-2xl border overflow-hidden
                                 bg-white dark:bg-gray-900
                                 border-gray-200 dark:border-gray-800
                                 shadow-sm hover:shadow-lg hover:-translate-y-0.5
                                 transition-all duration-200">
                      {/* Accent strip */}
                      <div className={`h-1.5 shrink-0 ${order.paymentStatus === 'PAID'
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
                      {/* Body */}
                      <div className="flex flex-col gap-2.5 p-3.5 flex-1">
                        {/* Invoice ID + type */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-amber-500 text-sm leading-tight">
                              {invNum(order.id)}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {order.orderNumber}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                            text-[10px] font-semibold border shrink-0
                                            ${order.orderType === 'DINE_IN'
                                              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                            }`}>
                            {order.orderType === 'DINE_IN' ? 'Dine-in' : 'Pick-up'}
                          </span>
                        </div>
                        {/* Customer */}
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {order.customerName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{order.customerPhone}</p>
                        </div>
                        {/* Date + Total */}
                        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{date}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{time}</p>
                          </div>
                          <p className="text-base font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                            Rs. {order.grandTotal.toLocaleString('en-LK')}
                          </p>
                        </div>
                        <PaymentBadge status={order.paymentStatus} />
                      </div>
                      {/* Actions */}
                      <div className="flex border-t border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800">
                        <button onClick={() => setActiveInvoice(order)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                     text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400
                                     hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => setDelOrder(order)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                     text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400
                                     hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* ── Table View ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800/60
                               border-gray-200 dark:border-gray-700/50">
                  {['Invoice', 'Date & Time', 'Customer', 'Type', 'Total', 'Payment', 'Actions'].map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold
                                 text-gray-400 dark:text-gray-500
                                 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
                        No invoices match your filters
                      </p>
                    </td>
                  </tr>
                ) : pageItems.map(order => {
                  const { date, time } = formatDateTime(order.createdAt)
                  return (
                    <tr key={order.id}
                      className="bg-white dark:bg-gray-900
                                 hover:bg-amber-50/50 dark:hover:bg-gray-800/30
                                 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <p className="font-bold text-amber-500 whitespace-nowrap">{invNum(order.id)}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-600">{order.orderNumber}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{date}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{order.customerName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                          ${order.orderType === 'DINE_IN'
                                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                          }`}>
                          {order.orderType === 'DINE_IN' ? 'Dine-in' : 'Pick-up'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                        Rs. {order.grandTotal.toLocaleString('en-LK')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveInvoice(order)}
                            aria-label={`View invoice ${invNum(order.id)}`}
                            title="View / Print"
                            className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500
                                       hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10">
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setDelOrder(order)}
                            aria-label={`Delete invoice ${invNum(order.id)}`}
                            title="Delete"
                            className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500
                                       hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <ModernPagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={PAGE_SIZE}
          onPageChange={p => setPage(p)}
        />
        {totalPages <= 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {filtered.length} of {orders.length} invoices
            </p>
          </div>
        )}
      </div>

      {/* ── Invoice Preview Modal ── */}
      {activeInvoice && (
        <InvoiceModal
          order={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {delOrder && (
        <DeleteModal
          order={delOrder}
          onConfirm={() => handleDeleteInvoice(delOrder.id)}
          onCancel={() => setDelOrder(null)}
        />
      )}
    </div>
  )
}
