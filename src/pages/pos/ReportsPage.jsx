import { useMemo } from 'react'
import {
  DollarSign, TrendingUp, Package, AlertTriangle,
  BarChart2, ArrowUpRight, ArrowDownRight, UtensilsCrossed,
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useTheme } from '../../utils/ThemeContext'
import { INVENTORY_ITEMS } from '../../utils/inventoryData'
import {
  getReportKPIs,
  REVENUE_LAST_7_DAYS,
  TOP_CATEGORY_PIE,
  TOP_SELLING_FOODS,
  LEAST_SELLING_FOODS,
  PROFIT_MARGIN,
} from '../../utils/reportAnalytics'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRs = (n) => `Rs. ${Math.round(n).toLocaleString('en-LK')}`

function useChartTheme() {
  const { theme } = useTheme()
  const isDark = useMemo(() => {
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [theme])

  return useMemo(() => ({
    isDark,
    grid: isDark ? '#374151' : '#e5e7eb',
    axis: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    tooltipText: isDark ? '#f9fafb' : '#111827',
  }), [isDark])
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, trend, trendUp, variant = 'amber' }) {
  const variants = {
    green:  { iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400', accent: 'from-green-400 to-emerald-500' },
    amber:  { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', accent: 'from-amber-400 to-orange-500' },
    blue:   { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', accent: 'from-blue-400 to-indigo-500' },
    red:    { iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400', accent: 'from-red-400 to-rose-500' },
  }
  const v = variants[variant] ?? variants.amber

  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5
                    border border-gray-100 dark:border-gray-800 shadow-sm
                    hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.accent}
                       opacity-80`} />
      <div className="flex items-start justify-between gap-2">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}>
          <Icon size={20} className={v.iconColor} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0
                            ${trendUp ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Chart tooltip ───────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter, chartTheme }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-xl border text-sm"
      style={{
        background: chartTheme.tooltipBg,
        borderColor: chartTheme.tooltipBorder,
        color: chartTheme.tooltipText,
      }}
    >
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="tabular-nums" style={{ color: entry.color ?? entry.payload?.fill }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

// ── Revenue Area Chart ──────────────────────────────────────────────────────────
function RevenueAreaChart({ data, chartTheme }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5
                    border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
            <BarChart2 size={18} className="text-amber-500" />
            Revenue — Last 7 Days
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Daily sales performance</p>
        </div>
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
          {fmtRs(data.reduce((s, d) => s + d.revenue, 0))} total
        </p>
      </div>
      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: chartTheme.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={payload?.[0]?.payload?.fullLabel ?? label}
                  formatter={v => fmtRs(v)}
                  chartTheme={chartTheme}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ea580c' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Category Pie Chart ──────────────────────────────────────────────────────────
function CategoryPieChart({ data, chartTheme }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5
                    border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px]">
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-amber-500" />
          Top Food Categories
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Top 5 by revenue share</p>
      </div>
      <div className="h-52 sm:h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={payload?.[0]?.name}
                  formatter={v => fmtRs(v)}
                  chartTheme={chartTheme}
                />
              )}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: chartTheme.axis, fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {data.map(cat => (
          <span key={cat.name}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg
                       bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.fill }} />
            {cat.name} · {cat.pct}%
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Food rank list ──────────────────────────────────────────────────────────────
function FoodRankList({ title, subtitle, items, variant, maxQty }) {
  const isLow = variant === 'low'

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden h-full
                    ${isLow
                      ? 'bg-gradient-to-br from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 border-orange-200 dark:border-orange-900/40'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                    }`}>
      <div className={`px-4 sm:px-5 py-4 border-b
                      ${isLow
                        ? 'border-orange-200/60 dark:border-orange-900/40'
                        : 'border-gray-100 dark:border-gray-800'
                      }`}>
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item, idx) => {
          const barPct = maxQty > 0 ? Math.max(8, (item.qty / maxQty) * 100) : 8
          return (
            <li key={item.id ?? item.name}
              className="px-4 sm:px-5 py-3.5 flex items-center gap-3
                         hover:bg-white/60 dark:hover:bg-gray-800/40 transition-colors">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0
                                ${isLow
                                  ? 'bg-orange-200/80 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                                  : idx === 0
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                }`}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.category}</p>
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500
                                ${isLow ? 'bg-orange-400' : 'bg-amber-500'}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{item.qty} sold</p>
                <p className="text-xs text-gray-400 tabular-nums">{fmtRs(item.revenue)}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const chartTheme = useChartTheme()
  const kpis = useMemo(() => getReportKPIs(), [])

  const maxQty = Math.max(
    ...TOP_SELLING_FOODS.map(i => i.qty),
    ...LEAST_SELLING_FOODS.map(i => i.qty),
    1,
  )

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto">

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Revenue, profit, inventory value, and menu performance
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={fmtRs(kpis.todayRevenue)}
          sub="From today's hourly sales"
          trend="+12%"
          trendUp
          variant="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Profit"
          value={fmtRs(kpis.totalProfit)}
          sub={`~${Math.round(PROFIT_MARGIN * 100)}% margin on weekly revenue`}
          trend="+8%"
          trendUp
          variant="amber"
        />
        <StatCard
          icon={Package}
          label="Total Stock Value"
          value={fmtRs(kpis.totalStockValue)}
          sub={`${INVENTORY_ITEMS.length} ingredients tracked`}
          variant="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Payables"
          value={fmtRs(kpis.pendingPayables)}
          sub={`${kpis.supplierPayableCount} suppliers with balance due`}
          trend={kpis.pendingPayables > 0 ? 'Due' : undefined}
          trendUp={false}
          variant="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-7">
          <RevenueAreaChart data={REVENUE_LAST_7_DAYS} chartTheme={chartTheme} />
        </div>
        <div className="lg:col-span-5">
          <CategoryPieChart data={TOP_CATEGORY_PIE} chartTheme={chartTheme} />
        </div>
      </div>

      {/* Food lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <FoodRankList
          title="Top Selling Foods"
          subtitle="Best performers — last 7 days (order data)"
          items={TOP_SELLING_FOODS}
          variant="top"
          maxQty={maxQty}
        />
        <FoodRankList
          title="Least Selling Foods"
          subtitle="Menu optimization candidates — consider promos or removal"
          items={LEAST_SELLING_FOODS}
          variant="low"
          maxQty={maxQty}
        />
      </div>
    </div>
  )
}
