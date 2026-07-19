import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, ArrowUpRight, Clock, Box, Factory,
  LayoutGrid, List, ChevronUp, ChevronDown, Utensils,
  AlertTriangle, ArrowRight, Package, Banknote,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useDashboardStore, useDashboardPolling } from '../../utils/dashboardStore'
import { useSettingsStore } from '../../utils/settingsStore'
import { fmtCurrencyDirect } from '../../utils/currency'
import ModernPagination from '../../components/ui/ModernPagination'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 8

// Stable mock trend values — computed once, not on every render

// Chart data for the AreaChart (hourly sales)

// ─────────────────────────────────────────────────────────────────────────────
// STATUS / TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   badge: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',   dot: 'bg-amber-500'  },
  PREPARING: { label: 'Preparing', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',      dot: 'bg-blue-400'   },
  READY:     { label: 'Ready',     badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', dot: 'bg-purple-400' },
  COMPLETED: { label: 'Completed', badge: 'bg-green-500/10 text-green-400 border border-green-500/20',   dot: 'bg-green-400'  },
}

const TYPE_CONFIG = {
  PICKUP:  { label: 'Pick-up', badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'   },
  DINE_IN: { label: 'Dine-in', badge: 'bg-teal-500/10 text-teal-400 border border-teal-500/20'   },
}

// ─────────────────────────────────────────────────────────────────────────────
// RECHARTS CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.')
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-gray-900 px-3 py-2 text-white shadow-xl">
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs text-amber-300">
        {currencySymbol} {payload[0].value.toLocaleString('en-LK')}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW TOGGLE  (Table ↔ Grid)
// ─────────────────────────────────────────────────────────────────────────────
function ViewToggle({ view, setView }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0">
      {[
        { id: 'table', Icon: List       },
        { id: 'grid',  Icon: LayoutGrid },
      ].map(({ id, Icon }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          aria-label={`${id} view`}
          className={`p-2 rounded-lg transition-all duration-150
                     ${view === id
                       ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                       : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                     }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, trend, trendUp, iconBg, iconColor, accentBar }) {
  return (
    <div className="group relative bg-amber-50 dark:bg-gray-800 rounded-2xl p-5
                    border border-amber-100 dark:border-gray-700
                    shadow-md dark:shadow-sm overflow-hidden
                    transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                    hover:border-amber-200 dark:hover:border-gray-600 cursor-default">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar}
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                         transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold
                            px-2 py-0.5 rounded-full shrink-0
                            ${trendUp !== false
                              ? 'text-green-500 bg-green-500/10'
                              : 'text-red-500 bg-red-500/10'
                            }`}>
            <ArrowUpRight size={12} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500
                      uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100
                      leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES OVERVIEW — Recharts AreaChart (amber brand)
// ─────────────────────────────────────────────────────────────────────────────
function SalesOverviewChart({ trend = [], completedOrders = 0, revenue = 0 }) {
  const chartData = trend.length > 0 ? trend.map(h => ({ hour: h.hour, sales: h.revenue })) : []

  const totalRevenue = trend.reduce((s, h) => s + (h.revenue || 0), 0)
  const avgOrder = completedOrders > 0
    ? Math.round(revenue / completedOrders)
    : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6
                    border border-gray-100 dark:border-gray-800 shadow-sm h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">
            Today's Sales Trend
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Hourly revenue · {completedOrders} orders today
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500">Avg. order</p>
          <p className="text-sm font-bold text-amber-500 tabular-nums">
            {fmtCurrencyDirect(avgOrder)}
          </p>
        </div>
      </div>

      <div className="h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6"
                           className="dark:stroke-gray-800" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#F59E0B"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2 pt-3
                      border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-xs text-gray-400 dark:text-gray-500">Revenue</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <TrendingUp size={12} className="text-green-500" />
          <span>{fmtCurrencyDirect(totalRevenue)} total</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// POPULAR CATEGORIES — Progress Meter Rows + Donut Ring
// ─────────────────────────────────────────────────────────────────────────────
function PopularCategories({ categories = [] }) {
  const [hovered, setHovered] = useState(null)

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6
                      border border-gray-100 dark:border-gray-800 shadow-sm h-full
                      flex items-center justify-center">
        <p className="text-sm text-gray-400">No sales data yet today</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6
                    border border-gray-100 dark:border-gray-800 shadow-sm h-full">
      <div className="mb-5">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">
          Popular Categories
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Sales distribution by category
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {categories.map((cat, i) => (
          <div key={cat.name} className="cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0
                                transition-transform duration-200
                                ${hovered === i ? 'scale-125' : ''}`}
                     style={{ backgroundColor: cat.fill || '#6b7280' }} />
                <span className={`text-sm font-medium transition-colors duration-200
                                  ${hovered === i
                                    ? 'text-gray-900 dark:text-gray-100'
                                    : 'text-gray-600 dark:text-gray-400'}`}>
                  {cat.name}
                </span>
              </div>
              <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300">
                {cat.pct}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                   style={{
                     width: `${cat.pct}%`,
                     backgroundColor: cat.fill || '#6b7280',
                     opacity: hovered === i ? 1 : 0.7,
                   }} />
            </div>
          </div>
        ))}
      </div>

      {/* Donut ring summary */}
      {categories.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full shrink-0"
              style={{
                background: `conic-gradient(${categories.map((c, i) => {
                  const pct = c.pct || 0
                  const fill = c.fill || '#6b7280'
                  const prev = categories.slice(0, i).reduce((s, x) => s + (x.pct || 0), 0)
                  return `${fill} ${prev}% ${prev + pct}%`
                }).join(', ')})`,
              }}
              aria-hidden="true">
              <div className="w-full h-full rounded-full flex items-center justify-center
                              bg-white dark:bg-gray-900 scale-[0.65]">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400
                                text-center leading-tight">
                  {categories.length}<br/>cats
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {categories.slice(0, 3).map(cat => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0"
                       style={{ backgroundColor: cat.fill || '#6b7280' }} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{cat.name}</span>
                  <span className="text-xs font-bold ml-auto pl-2 text-gray-700 dark:text-gray-300">{cat.pct}%</span>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                +{categories.length - 3} more
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      text-xs font-semibold ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                      text-xs font-medium ${cfg.badge}`}>
      {cfg.label}
    </span>
  )
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────────────────────────────────────────
// SORT HEADER CELL
// ─────────────────────────────────────────────────────────────────────────────
function SortTh({ label, colKey, sortCol, sortDir, onSort }) {
  const active = sortCol === colKey
  return (
    <th
      onClick={() => onSort(colKey)}
      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest
                 text-gray-400 dark:text-gray-500 whitespace-nowrap cursor-pointer
                 hover:text-amber-500 dark:hover:text-amber-400 select-none
                 transition-colors duration-150"
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? sortDir === 'asc'
            ? <ChevronUp   size={13} className="text-amber-500" />
            : <ChevronDown size={13} className="text-amber-500" />
          : <ChevronDown size={13} className="opacity-20" />
        }
      </div>
    </th>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER TABLE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function OrderTableView({ orders, sortCol, sortDir, onSort }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60
                         border-b border-gray-100 dark:border-gray-800">
            <SortTh label="Order"    colKey="orderNumber"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh label="Time"     colKey="createdAt"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest
                           text-gray-400 dark:text-gray-500 whitespace-nowrap">Type</th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest
                           text-gray-400 dark:text-gray-500 whitespace-nowrap">Customer</th>
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest
                           text-gray-400 dark:text-gray-500 whitespace-nowrap">Items</th>
            <SortTh label="Total"    colKey="grandTotal"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest
                           text-gray-400 dark:text-gray-500 whitespace-nowrap">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {orders.map(order => (
            <tr key={order.id}
              className="bg-white dark:bg-gray-900
                         hover:bg-amber-50/40 dark:hover:bg-gray-800/40
                         transition-colors duration-150">
              <td className="px-4 py-3 font-bold text-amber-500 whitespace-nowrap">
                {order.orderNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Clock size={12} className="shrink-0" />
                  {formatTime(order.createdAt)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TypeBadge type={order.orderType} />
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {order.customerName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{order.customerPhone}</p>
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </td>
              <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100
                             whitespace-nowrap tabular-nums">
                {fmtCurrencyDirect(order.grandTotal)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER GRID VIEW
// ─────────────────────────────────────────────────────────────────────────────
function OrderGridView({ orders }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map(order => (
        <div key={order.id}
          className="rounded-2xl border border-gray-200 dark:border-gray-700
                     bg-amber-50 dark:bg-gray-800
                     p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5
                     transition-all duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-bold text-amber-500 text-sm">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
            {order.customerName}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.customerPhone}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
          <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {fmtCurrencyDirect(order.grandTotal)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-3
                          border-t border-gray-200 dark:border-gray-700
                          text-xs text-gray-400 dark:text-gray-500">
            <Clock size={11} className="shrink-0" />
            <span>{formatTime(order.createdAt)}</span>
            <span className="ml-auto">
              <TypeBadge type={order.orderType} />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER SECTION  (header + view toggle + table/grid + pagination)
// ─────────────────────────────────────────────────────────────────────────────
function OrderSection({ title, badge, badgeColor, orders, accentDot }) {
  const [view,     setView]     = useState('table')
  const [page,     setPage]     = useState(1)
  const [sortCol,  setSortCol]  = useState('createdAt')
  const [sortDir,  setSortDir]  = useState('desc')

  // Sorting
  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      let va = a[sortCol]
      let vb = b[sortCol]
      if (sortCol === 'grandTotal') { va = Number(va); vb = Number(vb) }
      if (va < vb) return sortDir === 'asc' ? -1 :  1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [orders, sortCol, sortDir])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))
  const pageItems  = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  if (orders.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {accentDot && (
          <span className={`w-2 h-2 rounded-full ${accentDot} animate-pulse shrink-0`} />
        )}
        <h2 className="font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
          {badge}
        </span>
        <div className="ml-auto">
          <ViewToggle view={view} setView={setView} />
        </div>
      </div>

      {/* Card wrapper */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800
                      bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        {view === 'table'
          ? <OrderTableView orders={pageItems} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
          : <OrderGridView  orders={pageItems} />
        }
        <ModernPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={sorted.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOW STOCK PANEL (uses live API data via props)
// ─────────────────────────────────────────────────────────────────────────────
function LowStockPanel({ alertItems = [], onNavigate }) {
  if (alertItems.length === 0) return null

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800/40
                    bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4
                      border-b border-red-100 dark:border-red-800/30
                      bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30
                          flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              Low Stock Alerts
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {alertItems.length} item{alertItems.length !== 1 ? 's' : ''} need attention
            </p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                     bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400
                     hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shrink-0"
        >
          View All <ArrowRight size={12} />
        </button>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {alertItems.slice(0, 8).map(item => {
          const isOut = item.quantity <= 0
          const cfgCls = isOut
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          const cfgLabel = isOut ? 'Out of Stock' : 'Low Stock'
          const pct = item.minAlertLevel > 0
            ? Math.min(100, Math.round((item.quantity / item.minAlertLevel) * 100))
            : 0
          return (
            <div key={item.id}
              className="flex flex-col gap-2 p-3 rounded-xl border
                         bg-gray-50 dark:bg-gray-800/50
                         border-gray-200 dark:border-gray-700/50
                         hover:border-red-200 dark:hover:border-red-800/50
                         transition-colors duration-150">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {item.sku}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                  text-[10px] font-bold border shrink-0 ${cfgCls}`}>
                  {cfgLabel}
                </span>
              </div>
              {/* Stock bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold tabular-nums text-gray-700 dark:text-gray-300">
                    {item.quantity} {item.unit}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    min: {item.minAlertLevel}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500
                                ${isOut ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {alertItems.length > 8 && (
        <div className="px-4 pb-4 text-center">
          <button
            onClick={onNavigate}
            className="text-xs font-semibold text-red-600 dark:text-red-400
                       hover:underline transition-colors"
          >
            +{alertItems.length - 8} more items — view all in Inventory
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK LINKS PANEL (uses live API data via props)
// ─────────────────────────────────────────────────────────────────────────────
function QuickLinksPanel({ lowStockCount = 0, pendingPayables = 0, pendingCount = 0, onNavigate }) {
  const links = [
    {
      label:    'Low Stock Items',
      sub:      `${lowStockCount} item${lowStockCount !== 1 ? 's' : ''} below threshold`,
      icon:     Package,
      iconBg:   'bg-red-100 dark:bg-red-900/30',
      iconCls:  'text-red-600 dark:text-red-400',
      badge:    lowStockCount > 0 ? String(lowStockCount) : null,
      badgeCls: 'bg-red-500 text-white',
      path:     '/pos/inventory',
    },
    {
      label:    'Pending Payables',
      sub:      `${fmtCurrencyDirect(pendingPayables)} due to suppliers`,
      icon:     Banknote,
      iconBg:   'bg-purple-100 dark:bg-purple-900/30',
      iconCls:  'text-purple-600 dark:text-purple-400',
      badge:    pendingPayables > 0 ? 'Due' : null,
      badgeCls: 'bg-purple-500 text-white',
      path:     '/pos/purchase-orders',
    },
    {
      label:    'Live Orders',
      sub:      `${pendingCount} orders in queue`,
      icon:     Clock,
      iconBg:   'bg-amber-100 dark:bg-amber-900/30',
      iconCls:  'text-amber-600 dark:text-amber-400',
      badge:    pendingCount > 0 ? String(pendingCount) : null,
      badgeCls: 'bg-amber-500 text-white',
      path:     '/pos/orders',
    },
    {
      label:    'Customers with Dues',
      sub:      'View outstanding balances',
      icon:     TrendingUp,
      iconBg:   'bg-blue-100 dark:bg-blue-900/30',
      iconCls:  'text-blue-600 dark:text-blue-400',
      badge:    null,
      badgeCls: '',
      path:     '/pos/customers',
    },
  ]

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800
                    bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Quick Links</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Jump to key areas</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {links.map(link => {
          const Icon = link.icon
          return (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className="group flex items-center gap-3 p-3 rounded-xl border text-left
                         bg-gray-50 dark:bg-gray-800/50
                         border-gray-200 dark:border-gray-700/50
                         hover:border-amber-300 dark:hover:border-amber-700
                         hover:bg-amber-50/50 dark:hover:bg-amber-900/10
                         transition-all duration-150"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                               transition-transform duration-200 group-hover:scale-110 ${link.iconBg}`}>
                <Icon size={16} className={link.iconCls} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {link.label}
                  </p>
                  {link.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${link.badgeCls}`}>
                      {link.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {link.sub}
                </p>
              </div>
              <ArrowRight size={14} className="text-gray-300 dark:text-gray-600
                                               group-hover:text-amber-500 dark:group-hover:text-amber-400
                                               transition-colors shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function POSDashboardPage() {
  const navigate = useNavigate()
  const { data, loading, error, fetchDashboardSummary } = useDashboardStore()
  const showLowStockOnDashboard = useSettingsStore(s => s.showLowStockOnDashboard)

  // Auto-poll every 30 seconds
  useDashboardPolling(30_000)

  const {
    todaySales,
    occupiedTables,
    lowStockAlerts,
    pendingPayables,
    todaySalesTrend,
    popularCategories,
  } = data

  const completedOrders = todaySales?.completedOrders ?? 0
  const todayRevenue = todaySales?.revenue ?? 0
  const occupiedCount = occupiedTables?.occupied ?? 0
  const totalTables = occupiedTables?.total ?? 0
  const lowStockCount = lowStockAlerts?.count ?? 0
  const lowStockItems = lowStockAlerts?.items ?? []
  const pendingOutstanding = pendingPayables?.totalOutstanding ?? 0

  // Compute trends
  const trends = useMemo(() => ({
    sales:    completedOrders > 0 ? `+${completedOrders}` : '0',
    tables:   `+${occupiedCount}`,
    stock:    lowStockCount > 0 ? `-${lowStockCount}` : '0',
    payables: pendingOutstanding > 0 ? 'Due' : 'Clear',
  }), [completedOrders, occupiedCount, lowStockCount, pendingOutstanding])

  // Loading state
  if (loading && !data.timestamp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-7xl mx-auto">
        <RefreshCw size={32} className="text-amber-500 animate-spin" />
        <p className="text-sm font-medium text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  // Error state (only if no data at all)
  if (error && !data.timestamp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-7xl mx-auto">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-sm font-medium text-red-500">Failed to load dashboard</p>
        <p className="text-xs text-gray-400">{error}</p>
        <button
          onClick={fetchDashboardSummary}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Real-time overview of today's operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-full border border-green-500/20
                          bg-green-500/10 px-3 py-1.5 shrink-0">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-green-500">
              Live
            </span>
          </div>
          {/* Manual refresh */}
          <button
            onClick={fetchDashboardSummary}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700
                       transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards — 1 col → 2 col → 4 col ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Today's Sales"
          value={fmtCurrencyDirect(todayRevenue)}
          sub={`${completedOrders} completed orders`}
          trend={trends.sales}
          trendUp={true}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accentBar="bg-gradient-to-r from-emerald-400 to-teal-500"
        />
        <MetricCard
          icon={Utensils}
          label="Occupied Tables"
          value={`${occupiedCount} / ${totalTables}`}
          sub="Active dine-in tables right now"
          trend={`${occupiedCount} active`}
          trendUp={true}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
          accentBar="bg-gradient-to-r from-orange-400 to-red-500"
        />
        <MetricCard
          icon={Box}
          label="Low Stock Alerts"
          value={lowStockCount}
          sub="Items below safety stock level"
          trend={lowStockCount > 0 ? `${lowStockCount} items` : 'All good'}
          trendUp={lowStockCount === 0}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          accentBar="bg-gradient-to-r from-red-400 to-rose-500"
        />
        <MetricCard
          icon={Factory}
          label="Pending Payables"
          value={fmtCurrencyDirect(pendingOutstanding)}
          sub="Due to suppliers"
          trend={pendingOutstanding > 0 ? 'Due' : 'Clear'}
          trendUp={pendingOutstanding === 0}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          accentBar="bg-gradient-to-r from-purple-400 to-pink-500"
        />
      </div>

      {/* ── Analytics Split ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-8">
          <SalesOverviewChart
            trend={todaySalesTrend}
            completedOrders={completedOrders}
            revenue={todayRevenue}
          />
        </div>
        <div className="lg:col-span-4">
          <PopularCategories categories={popularCategories} />
        </div>
      </div>

      {/* ── Quick Links ── */}
      <QuickLinksPanel
        lowStockCount={lowStockCount}
        pendingPayables={pendingOutstanding}
        pendingCount={0}
        onNavigate={navigate}
      />

      {/* ── Low Stock Alerts (conditional on settings flag) ── */}
      {showLowStockOnDashboard && lowStockItems.length > 0 && (
        <LowStockPanel alertItems={lowStockItems} onNavigate={() => navigate('/pos/inventory')} />
      )}

    </div>
  )
}