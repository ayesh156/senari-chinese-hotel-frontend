import { useState, useMemo } from 'react'
import {
  Clock, User, ShoppingBag, ChevronDown, ChevronUp,
  ArrowRight, Search, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { MOCK_ORDERS } from '../../utils/mockOrders'
import SearchableSelect from '../../components/ui/SearchableSelect'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

const COLUMNS = [
  {
    status:       'PENDING',
    label:        'Pending',
    sub:          'Awaiting kitchen',
    headerBg:     'bg-amber-500/10',
    headerBorder: 'border-amber-500/30',
    headerText:   'text-amber-600 dark:text-amber-400',
    dotColor:     'bg-amber-500',
    countBg:      'bg-amber-500/20',
    countText:    'text-amber-600 dark:text-amber-400',
    cardBorder:   'border-amber-200 dark:border-amber-900/40',
    cardHover:    'hover:border-amber-400 dark:hover:border-amber-600',
    nextStatus:   'PREPARING',
    nextLabel:    'Start Preparing',
    nextColor:    'bg-blue-500 hover:bg-blue-600 text-white',
    pageKey:      'pending',
  },
  {
    status:       'PREPARING',
    label:        'Preparing',
    sub:          'In the kitchen',
    headerBg:     'bg-blue-500/10',
    headerBorder: 'border-blue-500/30',
    headerText:   'text-blue-600 dark:text-blue-400',
    dotColor:     'bg-blue-500',
    countBg:      'bg-blue-500/20',
    countText:    'text-blue-600 dark:text-blue-400',
    cardBorder:   'border-blue-200 dark:border-blue-900/40',
    cardHover:    'hover:border-blue-400 dark:hover:border-blue-600',
    nextStatus:   'READY',
    nextLabel:    'Mark as Ready',
    nextColor:    'bg-purple-500 hover:bg-purple-600 text-white',
    pageKey:      'preparing',
  },
  {
    status:       'READY',
    label:        'Ready',
    sub:          'Waiting for pickup',
    headerBg:     'bg-purple-500/10',
    headerBorder: 'border-purple-500/30',
    headerText:   'text-purple-600 dark:text-purple-400',
    dotColor:     'bg-purple-500',
    countBg:      'bg-purple-500/20',
    countText:    'text-purple-600 dark:text-purple-400',
    cardBorder:   'border-purple-200 dark:border-purple-900/40',
    cardHover:    'hover:border-purple-400 dark:hover:border-purple-600',
    nextStatus:   'COMPLETED',
    nextLabel:    'Complete Order',
    nextColor:    'bg-green-500 hover:bg-green-600 text-white',
    pageKey:      'ready',
  },
]

const TYPE_OPTIONS = [
  { value: 'all',     label: 'All Types' },
  { value: 'DINE_IN', label: 'Dine-in'  },
  { value: 'PICKUP',  label: 'Pick-up'  },
]

const TYPE_CONFIG = {
  PICKUP:  { label: 'Pick-up', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
  DINE_IN: { label: 'Dine-in', badge: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' },
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
}

function minutesAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)   return 'Just now'
  if (diff === 1) return '1 min ago'
  return `${diff} mins ago`
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CARD
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order, col, onAdvance }) {
  const [expanded, setExpanded] = useState(false)
  const typeCfg = TYPE_CONFIG[order.orderType] || {}

  return (
    <div className={`
      bg-amber-50 dark:bg-gray-800
      rounded-2xl border ${col.cardBorder} ${col.cardHover}
      shadow-md dark:shadow-sm
      transition-all duration-200
      hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-md
      flex flex-col overflow-hidden
    `}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-500 text-sm">{order.orderNumber}</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeCfg.badge}`}>
              {typeCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <User size={11} className="text-gray-400 shrink-0" />
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {order.customerName}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 justify-end">
            <Clock size={11} />
            <span className="text-[11px]">{formatTime(order.createdAt)}</span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
            {minutesAgo(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Items summary */}
      <div className="px-4 pb-3 border-t border-amber-100 dark:border-gray-700 pt-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between text-xs
                     text-gray-500 dark:text-gray-400
                     hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={12} />
            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-gray-700 dark:text-gray-300 ml-1">
              Rs. {order.grandTotal.toLocaleString('en-LK')}
            </span>
          </div>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {order.items.map(item => (
              <li key={item.id}
                className="flex items-center justify-between text-xs
                           text-gray-700 dark:text-gray-400">
                <span className="truncate mr-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    ×{item.quantity}
                  </span>
                  {' '}{item.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  Rs. {item.subtotal.toLocaleString('en-LK')}
                </span>
              </li>
            ))}
            {order.discountAmount > 0 && (
              <li className="flex items-center justify-between text-xs
                             text-green-600 dark:text-green-400
                             border-t border-amber-100 dark:border-gray-700 pt-1.5 mt-0.5">
                <span>Discount</span>
                <span className="tabular-nums">
                  − Rs. {order.discountAmount.toLocaleString('en-LK')}
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Advance action */}
      {col.nextStatus && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onAdvance(order.id, col.nextStatus)}
            className={`w-full flex items-center justify-center gap-1.5
                        py-2 rounded-xl text-xs font-bold
                        transition-colors duration-150 ${col.nextColor}`}
          >
            {col.nextLabel}
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN PAGINATION CONTROL
// ─────────────────────────────────────────────────────────────────────────────
function ColumnPager({ page, totalPages, onPrev, onNext, accentText }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <button
        onClick={onPrev}
        disabled={page === 1}
        aria-label="Previous page"
        className={`p-1.5 rounded-lg border transition-colors
                    ${page === 1
                      ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
      >
        <ChevronLeft size={14} />
      </button>

      <span className={`text-xs font-semibold tabular-nums ${accentText}`}>
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        aria-label="Next page"
        className={`p-1.5 rounded-lg border transition-colors
                    ${page === totalPages
                      ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KANBAN COLUMN  (with pagination)
// ─────────────────────────────────────────────────────────────────────────────
function KanbanColumn({ col, allOrders, onAdvance }) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE))
  // Clamp page if filters reduce total
  const safePage   = Math.min(page, totalPages)
  const pageOrders = allOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border
                       ${col.headerBg} ${col.headerBorder}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
          <div>
            <p className={`text-sm font-bold ${col.headerText}`}>{col.label}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-500">{col.sub}</p>
          </div>
        </div>
        <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full
                          ${col.countBg} ${col.countText}`}>
          {allOrders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {allOrders.length === 0 ? (
          <div className="bg-amber-50/60 dark:bg-gray-800/40 rounded-2xl
                          border border-dashed border-amber-200 dark:border-gray-700
                          p-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
              No orders here
            </p>
          </div>
        ) : (
          pageOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              col={col}
              onAdvance={onAdvance}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <ColumnPager
        page={safePage}
        totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        accentText={col.headerText}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveOrdersPage() {
  const [orders, setOrders] = useState(
    MOCK_ORDERS.filter(o => o.status !== 'COMPLETED')
  )
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // ── Advance order status ──────────────────────────────────────────────────
  function handleAdvance(orderId, nextStatus) {
    if (nextStatus === 'COMPLETED') {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
      )
    }
  }

  // ── Filtered orders (search + type) ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(o => {
      const matchSearch = !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      const matchType = typeFilter === 'all' || o.orderType === typeFilter
      return matchSearch && matchType
    })
  }, [orders, search, typeFilter])

  const byStatus = (status) => filtered.filter(o => o.status === status)

  const hasFilters = search || typeFilter !== 'all'

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            Live Order Queue
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Monitor and advance orders through the kitchen pipeline
          </p>
        </div>
        <div className="flex items-center gap-2
                        bg-amber-500/10 border border-amber-500/20
                        px-3 py-1.5 rounded-full shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400
                           uppercase tracking-widest">
            {orders.length} active
          </span>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-3 sm:p-4 rounded-2xl border
                      bg-white dark:bg-gray-800/30
                      border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1
                          bg-gray-50 dark:bg-gray-800/50
                          border-gray-200 dark:border-gray-700/50">
            <Search size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by order ID or customer name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                         text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                           transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type filter — SearchableSelect */}
          <SearchableSelect
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            searchPlaceholder="Search type…"
            triggerClassName="w-full sm:w-40"
          />

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all') }}
              className="flex items-center justify-center gap-1.5 px-3 py-2
                         rounded-xl text-xs font-semibold
                         bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Active filter summary */}
        {hasFilters && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
            Showing {filtered.length} of {orders.length} active orders
          </p>
        )}
      </div>

      {/* ── Kanban board ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            col={col}
            allOrders={byStatus(col.status)}
            onAdvance={handleAdvance}
          />
        ))}
      </div>

      {/* ── Footer note ── */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-600 pb-2">
        Completed orders are removed from the board and recorded in the Dashboard.
      </p>
    </div>
  )
}
