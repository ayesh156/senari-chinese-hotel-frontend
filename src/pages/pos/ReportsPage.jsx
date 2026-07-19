import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSettingsStore } from '../../utils/settingsStore'
import { fmtCurrencyDirect } from '../../utils/currency'
import {
  DollarSign, TrendingUp, Package, AlertTriangle,
  BarChart2, ArrowUpRight, ArrowDownRight, UtensilsCrossed,
  RefreshCw, Clock, CreditCard, TrendingUp as TrendingIcon,
  PieChart as PieChartIcon, Hash, Download, FileText,
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useTheme } from '../../utils/ThemeContext'
import { useReportStore, useDashboardSummary, useRevenueChart, useTopCategories, useFoodRankings, useHourlyTraffic, usePaymentDistribution, useProfitableFoods, useInventoryEfficiency } from '../../utils/reportStore'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRs = (n) => {
  const val = Number(n || 0)
  // Use dynamic currency symbol from store
  const symbol = useSettingsStore.getState().currencySymbol || 'Rs.'
  return `${symbol} ${Math.round(val).toLocaleString('en-LK')}`
}

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
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.accent} opacity-80`} />
      <div className="flex items-start justify-between gap-2">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}>
          <Icon size={20} className={v.iconColor} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${trendUp ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Chart tooltip ───────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter, chartTheme }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl border text-sm" style={{ background: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, color: chartTheme.tooltipText }}>
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
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
            <BarChart2 size={18} className="text-amber-500" /> Revenue
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Daily sales performance</p>
        </div>
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
          {fmtRs(data.reduce((s, d) => s + (d.revenue || 0), 0))} total
        </p>
      </div>
      <div className="h-56 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chartTheme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: chartTheme.axis, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
            <Tooltip content={({ active, payload, label }) => (<ChartTooltip active={active} payload={payload} label={payload?.[0]?.payload?.fullLabel ?? label} formatter={v => fmtRs(v)} chartTheme={chartTheme} />)} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#ea580c' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Category Pie Chart ──────────────────────────────────────────────────────────
function CategoryPieChart({ data, chartTheme }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px]">
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2"><UtensilsCrossed size={18} className="text-amber-500" /> Top Categories</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Top 5 by revenue share</p>
      </div>
      <div className="h-52 sm:h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="78%" paddingAngle={3} stroke="none">
              {data.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
            </Pie>
            <Tooltip content={({ active, payload }) => (<ChartTooltip active={active} payload={payload} label={payload?.[0]?.name} formatter={v => fmtRs(v)} chartTheme={chartTheme} />)} />
            <Legend verticalAlign="bottom" height={36} formatter={(value) => (<span style={{ color: chartTheme.axis, fontSize: 11 }}>{value}</span>)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {data.map(cat => (
          <span key={cat.name} className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.fill }} /> {cat.name} · {cat.pct}%
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
    <div className={`rounded-2xl border shadow-sm overflow-hidden h-full ${isLow ? 'bg-gradient-to-br from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 border-orange-200 dark:border-orange-900/40' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
      <div className={`px-4 sm:px-5 py-4 border-b ${isLow ? 'border-orange-200/60 dark:border-orange-900/40' : 'border-gray-100 dark:border-gray-800'}`}>
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {(items || []).map((item, idx) => {
          const qty = Number(item.qty || 0)
          const barPct = maxQty > 0 ? Math.max(8, (qty / maxQty) * 100) : 8
          return (
            <li key={item.id ?? item.name} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-white/60 dark:hover:bg-gray-800/40 transition-colors">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${isLow ? 'bg-orange-200/80 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' : idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.category}</p>
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-orange-400' : 'bg-amber-500'}`} style={{ width: `${barPct}%` }} /></div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{qty} sold</p>
                <p className="text-xs text-gray-400 tabular-nums">{fmtRs(item.revenue)}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Hourly Traffic ─────────────────────────────────────────────────────────────
function HourlyTrafficChart({ data, chartTheme }) {
  const peakHour = useMemo(() => {
    if (!data?.length) return null
    return data.reduce((a, b) => ((a.count || 0) > (b.count || 0) ? a : b))
  }, [data])
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px]">
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2"><Clock size={18} className="text-amber-500" /> Peak Hours</h2>
        {peakHour && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Peak: <strong>{peakHour.label}</strong> ({peakHour.count} orders)</p>}
      </div>
      <div className="h-52 sm:h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={(data || []).filter(d => (d.count || 0) > 0)} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chartTheme.axis, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: chartTheme.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip content={({ active, payload, label }) => (<ChartTooltip active={active} payload={payload} label={label} formatter={v => `${v} orders`} chartTheme={chartTheme} />)} />
            <Bar dataKey="count" name="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Payment Distribution ──────────────────────────────────────────────────────
function PaymentDistributionBars({ data }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px]">
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2"><CreditCard size={18} className="text-amber-500" /> Payment Methods</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Revenue distribution</p>
      </div>
      <div className="flex flex-col gap-4">
        {(data || []).map(method => (
          <div key={method.paymentMethod} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span className="text-base">{method.icon}</span><span className="font-semibold text-gray-900 dark:text-gray-100">{method.paymentMethod}</span></div>
              <div className="flex items-center gap-3"><span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{fmtRs(method.revenue)}</span><span className="text-xs font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{method.pct || 0}%</span></div>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${method.pct || 0}%`, background: method.color || '#6b7280' }} /></div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="flex items-center justify-center h-40"><p className="text-sm text-gray-400">No payment data available</p></div>}
      </div>
    </div>
  )
}

// ── Profitable Foods Table ────────────────────────────────────────────────────
function ProfitableFoodsTable({ data }) {
  const items = data || []
  if (items.length === 0) {
    return <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px] flex items-center justify-center"><p className="text-sm text-gray-400">No profitability data available</p></div>
  }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2"><TrendingIcon size={18} className="text-amber-500" /> Most Profitable Foods</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Profit per dish vs ingredient cost estimate</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
            {['Dish', 'Category', 'Sold', 'Unit Price', 'Cost/Dish', 'Profit/Dish', 'Margin'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-amber-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{item.name}</td>
                <td className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500">{item.category}</td>
                <td className="px-3 py-3 text-gray-900 dark:text-gray-100 tabular-nums">{Number(item.qty || 0)}</td>
                <td className="px-3 py-3 tabular-nums font-medium text-gray-900 dark:text-gray-100">{fmtRs(item.unitPrice)}</td>
                <td className="px-3 py-3 tabular-nums text-gray-500 dark:text-gray-400">{fmtRs(item.costPerUnit)}</td>
                <td className={`px-3 py-3 tabular-nums font-bold ${(item.profitPerUnit || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{fmtRs(item.profitPerUnit)}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${(item.marginPct || 0) >= 50 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : (item.marginPct || 0) >= 30 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{item.marginPct || 0}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── PDF Export Helper (Creative Portrait — Elegant, Compact) ──────────────────
async function exportToPDF(summary, revenueChart, topSelling, leastSelling, profitableFoods, periodText) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  // Portrait orientation — narrower width, requires creative layout
  const pdfOrientation = useSettingsStore.getState().pdfOrientation?.toLowerCase() === 'landscape' ? 'landscape' : 'portrait'
  const showTimestamp = useSettingsStore.getState().showGenerationTimestamp !== false
  const orientation = pdfOrientation === 'landscape' ? 'l' : 'p'
  const doc = new jsPDF(orientation, 'pt', 'a4')
  const PAGE_W = doc.internal.pageSize.getWidth()   // 595pt
  const PAGE_H = doc.internal.pageSize.getHeight()  // 842pt
  const M = 35
  const CONTENT_W = PAGE_W - M * 2                   // 525pt
  const TABLE_MARGIN = { left: M, right: M }
  const now = new Date()

  // ── Elegant Header (white background, clean typography) ─────────
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SENARI CHINESE HOTEL', M, 40)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Business Intelligence & Performance Report', M, 55)

  // Right-aligned meta
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  if (showTimestamp) doc.text(`Generated: ${dateStr}`, PAGE_W - M, 40, { align: 'right' })
  doc.text(periodText || 'Period: Selected Range', PAGE_W - M, 51, { align: 'right' })

  // Subtle 1px gray separator line
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(M, 68, PAGE_W - M, 68)

  // ── KPI Grid: 2×2 Layout (creative for portrait space) ──────────
  const kpis = [
    { label: "Today's Revenue", value: fmtRs(summary?.todayRevenue) },
    { label: 'Total Profit', value: fmtRs(summary?.totalProfit) },
    { label: 'Stock Value', value: fmtRs(summary?.totalStockValue) },
    { label: 'Pending Payables', value: fmtRs(summary?.pendingPayables) },
  ]

  const kpiStartY = 92
  const kpiLeftW = CONTENT_W * 0.48  // Left column
  const kpiRightW = CONTENT_W * 0.48 // Right column
  const kpiGap = CONTENT_W * 0.04

  // Row 1
  const row1Y = kpiStartY
  // KPI 0 — Left
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(kpis[0].label, M, row1Y)
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(kpis[0].value, M, row1Y + 16)

  // KPI 1 — Right
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(kpis[1].label, M + kpiLeftW + kpiGap, row1Y)
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(kpis[1].value, M + kpiLeftW + kpiGap, row1Y + 16)

  // Row 2
  const row2Y = row1Y + 36
  // KPI 2 — Left
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(kpis[2].label, M, row2Y)
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(kpis[2].value, M, row2Y + 16)

  // KPI 3 — Right
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(kpis[3].label, M + kpiLeftW + kpiGap, row2Y)
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(kpis[3].value, M + kpiLeftW + kpiGap, row2Y + 16)

  // ── Portrait-Safe Global AutoTable Config ───────────────────────
  const PORTRAIT_STYLES = {
    font: 'helvetica',
    fontSize: 8,
    cellPadding: 5,
    overflow: 'linebreak',
    textColor: [40, 40, 40],
    lineColor: [226, 232, 240],
    lineWidth: 0.3,
  }
  const PORTRAIT_HEAD_STYLES = {
    fillColor: [248, 250, 252], // Very light slate/blue tint
    textColor: [15, 23, 42],
    fontStyle: 'bold',
    lineWidth: 0.5,
    lineColor: [226, 232, 240],
    fontSize: 8,
  }
  const PORTRAIT_ALT_STYLES = { fillColor: [252, 252, 252] }

  // ── Section: Top Selling Foods ──────────────────────────────────
  let yPos = row2Y + 40

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Top Performing Menu Items', M, yPos)
  yPos += 7
  doc.setTextColor(140, 140, 140)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Best-selling dishes ranked by quantity sold', M, yPos)
  yPos += 14

  if (topSelling?.length > 0) {
    autoTable(doc, {
      head: [['Rank', 'Menu Item', 'Category', 'Qty Sold', 'Revenue']],
      body: topSelling.map((item, i) => [String(i + 1), item.name, item.category || '', String(item.qty || 0), fmtRs(item.revenue)]),
      startY: yPos,
      theme: 'plain',
      margin: TABLE_MARGIN,
      tableWidth: 'auto',
      styles: PORTRAIT_STYLES,
      headStyles: PORTRAIT_HEAD_STYLES,
      alternateRowStyles: PORTRAIT_ALT_STYLES,
      columnStyles: {
        0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'wrap' },
        2: { cellWidth: 90 },
        3: { cellWidth: 50, halign: 'right' },
        4: { cellWidth: 80, halign: 'right', fontStyle: 'bold' },
      },
    })
    yPos = doc.lastAutoTable.finalY + 16
  }

  // ── Section: Least Selling / Menu Candidates ────────────────────
  if (leastSelling?.length > 0) {
    if (yPos > PAGE_H - 120) { doc.addPage(); yPos = 40 }

    doc.setTextColor(40, 40, 40)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Menu Optimization Candidates', M, yPos)
    yPos += 7
    doc.setTextColor(140, 140, 140)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Lowest-performing items — consider promotion, recipe update, or removal', M, yPos)
    yPos += 14

    autoTable(doc, {
      head: [['Rank', 'Menu Item', 'Qty Sold', 'Revenue']],
      body: leastSelling.map((item, i) => [String(i + 1), item.name, String(item.qty || 0), fmtRs(item.revenue)]),
      startY: yPos,
      theme: 'plain',
      margin: TABLE_MARGIN,
      tableWidth: 'auto',
      styles: PORTRAIT_STYLES,
      headStyles: PORTRAIT_HEAD_STYLES,
      alternateRowStyles: PORTRAIT_ALT_STYLES,
      columnStyles: {
        0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'wrap' },
        2: { cellWidth: 50, halign: 'right' },
        3: { cellWidth: 80, halign: 'right', fontStyle: 'bold' },
      },
    })
    yPos = doc.lastAutoTable.finalY + 16
  }

  // ── Section: Most Profitable Foods ──────────────────────────────
  const profitableItems = profitableFoods?.mostProfitable || []
  if (profitableItems.length > 0) {
    if (yPos > PAGE_H - 120) { doc.addPage(); yPos = 40 }

    doc.setTextColor(40, 40, 40)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Most Profitable Menu Items', M, yPos)
    yPos += 7
    doc.setTextColor(140, 140, 140)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Highest profit contribution per dish (revenue minus estimated ingredient cost)', M, yPos)
    yPos += 14

    autoTable(doc, {
      head: [['Menu Item', 'Unit Price', 'Cost', 'Profit / Dish', 'Margin %']],
      body: profitableItems.map(item => [
        item.name,
        fmtRs(item.unitPrice),
        fmtRs(item.costPerUnit),
        fmtRs(item.profitPerUnit),
        `${item.marginPct || 0}%`,
      ]),
      startY: yPos,
      theme: 'plain',
      margin: TABLE_MARGIN,
      tableWidth: 'auto',
      styles: { ...PORTRAIT_STYLES, fontSize: 7.5 }, // Slightly smaller for 5 columns
      headStyles: PORTRAIT_HEAD_STYLES,
      alternateRowStyles: PORTRAIT_ALT_STYLES,
      columnStyles: {
        0: { cellWidth: 'wrap' },
        1: { cellWidth: 75, halign: 'right' },
        2: { cellWidth: 65, halign: 'right' },
        3: { cellWidth: 80, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 55, halign: 'center', fontStyle: 'bold' },
      },
    })
    yPos = doc.lastAutoTable.finalY + 10
  }

  // ── Footer (every page) ────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Subtle footer separator
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(M, PAGE_H - 40, PAGE_W - M, PAGE_H - 40)

    doc.setTextColor(160, 160, 160)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Generated by Senari POS System', M, PAGE_H - 26)
    doc.text(`Page ${i} of ${totalPages}`, PAGE_W - M, PAGE_H - 26, { align: 'right' })
    doc.text('SENARI CHINESE HOTEL — Confidential', PAGE_W / 2, PAGE_H - 16, { align: 'center' })
  }

  doc.save('senari-management-report.pdf')
}

// ── Custom Calendar Date Picker (No Native Browser Picker) ───────────────────
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatDateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function CustomDatePicker({ label, value, onChange, otherDate, onApply, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)
  const parsed = parseDate(value)
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : new Date().getMonth())

  // Close on outside click
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Reset view when opening
  useEffect(() => {
    if (isOpen && parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    } else if (isOpen && !parsed) {
      setViewYear(new Date().getFullYear())
      setViewMonth(new Date().getMonth())
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const today = new Date()
  const todayStr = formatDateString(today)
  const otherParsed = parseDate(otherDate)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  function handleDayClick(day) {
    const selected = new Date(viewYear, viewMonth, day)
    const dateStr = formatDateString(selected)
    onChange(dateStr)

    // If both dates are now set, close and auto-apply
    const newStart = label === 'Start' ? dateStr : otherDate
    const newEnd = label === 'End' ? dateStr : otherDate
    if (newStart && newEnd) {
      setIsOpen(false)
      setTimeout(() => onApply(), 50)
    }
  }

  function isInRange(day) {
    if (!parsed && !otherParsed) return false
    const d = new Date(viewYear, viewMonth, day).getTime()
    if (parsed && otherParsed) {
      const s = Math.min(parsed.getTime(), otherParsed.getTime())
      const e = Math.max(parsed.getTime(), otherParsed.getTime())
      return d >= s && d <= e
    }
    return false
  }

  const displayLabel = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : `Select ${label} Date`

  return (
    <div ref={ref} className={`relative flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#131c2e] border border-slate-700/60 transition-all duration-200 hover:border-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30"
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>{displayLabel}</span>
        <svg className="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
        </svg>
      </button>
      {isOpen && (
        <>
          {/* Mobile backdrop overlay — hidden on md: and above */}
          <div
            className="fixed inset-0 bg-black/60 z-[99] md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Container: fixed centered on mobile, absolute contextual on md:+ */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] m-0 md:absolute md:top-full md:left-0 md:right-auto md:transform-none md:mt-2 w-[280px] bg-[#19243a] border border-slate-700/80 rounded-2xl shadow-2xl p-4">
            {/* Month/Year Header with Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-700/50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs sm:text-sm font-semibold text-white">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-700/50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 w-full mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">{wd}</div>
              ))}
            </div>

            {/* Days Grid — fluid aspect-square cells */}
            <div className="grid grid-cols-7 gap-1 w-full">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = dateStr === value
                const isToday = dateStr === todayStr
                const inRange = isInRange(day)
                const isEnd = dateStr === otherDate

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square w-full flex items-center justify-center rounded-lg text-xs sm:text-sm transition-all duration-100 ${
                      isSelected || isEnd
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isToday
                          ? 'border border-amber-500/50 text-amber-400 font-medium'
                          : inRange
                            ? 'bg-amber-500/15 text-amber-400 font-medium'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  const d = formatDateString(new Date())
                  onChange(d)
                  if (otherDate) {
                    setIsOpen(false)
                    setTimeout(() => onApply(), 50)
                  }
                }}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50"
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false) }}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Custom Month Picker (Replaces native <input type="month">) ───────────────
const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getCurrentYear() {
  return new Date().getFullYear()
}

function getCurrentMonth() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatMonthDisplay(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return `${MONTH_ABBREVIATIONS[m - 1] || ''} ${y}`
}

function CustomMonthPicker({ label, value, onChange, onApply, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  // Parse selected year-month; fallback to current
  const parsed = value ? value.split('-').map(Number) : null
  const [viewYear, setViewYear] = useState(parsed ? parsed[0] : getCurrentYear())
  const currentMonthStr = getCurrentMonth()

  // Close on outside click
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleMonthClick(monthIndex) {
    const monthStr = String(monthIndex + 1).padStart(2, '0')
    const newVal = `${viewYear}-${monthStr}`
    onChange(newVal)
    setIsOpen(false)
    setTimeout(() => onApply(), 50)
  }

  function prevYear() {
    setViewYear(viewYear - 1)
  }

  function nextYear() {
    setViewYear(viewYear + 1)
  }

  const displayLabel = value ? formatMonthDisplay(value) : 'Select Month'

  return (
    <div ref={ref} className={`relative flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#131c2e] border border-slate-700/60 transition-all duration-200 hover:border-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30"
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>{displayLabel}</span>
        <svg className="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
        </svg>
      </button>
      {isOpen && (
        <>
          {/* Mobile backdrop overlay — hidden on md: and above */}
          <div
            className="fixed inset-0 bg-black/60 z-[99] md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover: fixed centered on mobile, absolute contextual on md:+ */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] m-0 md:absolute md:top-full md:left-0 md:right-auto md:transform-none md:mt-2 w-[260px] bg-[#19243a] border border-slate-700/80 rounded-2xl shadow-2xl p-4">
            {/* Year Header with Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevYear} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-700/50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs sm:text-sm font-semibold text-white">{viewYear}</span>
              <button type="button" onClick={nextYear} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-700/50 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 3x4 Month Grid */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {MONTH_ABBREVIATIONS.map((monthName, idx) => {
                const monthStr = String(idx + 1).padStart(2, '0')
                const dateStr = `${viewYear}-${monthStr}`
                const isSelected = dateStr === value
                const isCurrent = dateStr === currentMonthStr

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMonthClick(idx)}
                    className={`rounded-xl py-2.5 text-center cursor-pointer font-medium transition-all text-sm ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isCurrent && !isSelected
                          ? 'border border-amber-500/50 text-amber-400 font-medium'
                          : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {monthName}
                  </button>
                )
              })}
            </div>

            {/* "This Month" shortcut */}
            <div className="flex items-center justify-center mt-3 pt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                  setViewYear(now.getFullYear())
                  onChange(ym)
                  setIsOpen(false)
                  setTimeout(() => onApply(), 50)
                }}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
              >
                This Month
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Premium Headless Dropdown Component ──────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'range', label: 'Custom Range' },
]

function getYearOptions() {
  const current = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => String(current - 3 + i))
}

function CustomDropdown({ label, value, options, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const currentOption = options.find(o => (o.value ?? o) === value)
  const displayLabel = currentOption?.label ?? currentOption ?? value

  return (
    <div ref={ref} className={`relative flex flex-col gap-1 ${className}`}>
      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#131c2e] border border-slate-700/60 transition-all duration-200 hover:border-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30"
      >
        <span>{displayLabel}</span>
        <svg className={`w-4 h-4 ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 top-full bg-[#19243a] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
          {options.map((opt) => {
            const optValue = opt.value ?? opt
            const optLabel = opt.label ?? opt
            const isSelected = optValue === value
            return (
              <div
                key={optValue}
                onClick={() => {
                  setIsOpen(false)
                  onChange(optValue)
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-400 font-semibold'
                    : 'text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 font-medium'
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterBar({ filterType, startDate, endDate, onFilterTypeChange, onStartDateChange, onEndDateChange, onApply }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* Period — Custom Headless Dropdown */}
        <CustomDropdown
          label="Period"
          value={filterType}
          options={PERIOD_OPTIONS}
          onChange={(val) => {
            onFilterTypeChange(val)
            if (val !== 'range') {
              setTimeout(() => onApply(), 0)
            }
          }}
          className="min-w-[160px]"
        />

        {/* Conditional: Custom Range Date Pickers (No native inputs) */}
        {filterType === 'range' && (
          <>
            <CustomDatePicker
              label="Start"
              value={startDate}
              onChange={onStartDateChange}
              otherDate={endDate}
              onApply={onApply}
              className="min-w-[150px]"
            />
            <CustomDatePicker
              label="End"
              value={endDate}
              onChange={onEndDateChange}
              otherDate={startDate}
              onApply={onApply}
              className="min-w-[150px]"
            />
          </>
        )}

        {/* Conditional: Month — Custom Month Picker (no native browser defaults) */}
        {filterType === 'month' && (
          <CustomMonthPicker
            label="Month"
            value={startDate || ''}
            onChange={(val) => {
              onStartDateChange(val)
              onEndDateChange(val)
            }}
            onApply={onApply}
            className="min-w-[160px]"
          />
        )}

        {/* Year — Custom Headless Dropdown (No native <select>) */}
        {filterType === 'year' && (
          <CustomDropdown
            label="Year"
            value={String(startDate || new Date().getFullYear())}
            options={getYearOptions().map(y => ({ value: String(y), label: String(y) }))}
            onChange={(val) => {
              onStartDateChange(val)
              onEndDateChange(val)
              setTimeout(() => onApply(), 0)
            }}
            className="min-w-[120px]"
          />
        )}
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const chartTheme = useChartTheme()
  const { dashboard, loading, fetchDashboard, filterType, startDate, endDate, setFilterType, setStartDate, setEndDate } = useReportStore()
  const summary = useDashboardSummary()
  const revenueChart = useRevenueChart()
  const topCategories = useTopCategories()
  const foodRankings = useFoodRankings()
  const hourlyTraffic = useHourlyTraffic()
  const paymentDistribution = usePaymentDistribution()
  const profitableFoods = useProfitableFoods()
  const inventoryEfficiency = useInventoryEfficiency()

  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      fetchDashboard().catch(e => setError(e?.message || 'Failed to load dashboard'))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    fetchDashboard().catch(e => setError(e?.message || 'Failed to refresh'))
  }, [fetchDashboard])

  const handleApplyFilter = useCallback(() => {
    fetchDashboard().catch(e => setError(e?.message || 'Failed to load'))
  }, [fetchDashboard])

  const handleExportPDF = useCallback(async () => {
    setExporting(true)
    try {
      const topSelling = foodRankings?.topSelling || []
      const leastSelling = foodRankings?.leastSelling || []
      const periodText = useReportStore.getState().getPeriodText()
      await exportToPDF(summary, revenueChart, topSelling, leastSelling, profitableFoods, periodText)
    } catch (e) {
      console.error('PDF export failed:', e)
    }
    setExporting(false)
  }, [summary, revenueChart, foodRankings, profitableFoods])

  const maxQty = useMemo(() => {
    const tops = foodRankings?.topSelling ?? []
    const leasts = foodRankings?.leastSelling ?? []
    return Math.max(1, ...tops.map(i => Number(i.qty) || 0), ...leasts.map(i => Number(i.qty) || 0))
  }, [foodRankings])

  const topSelling = foodRankings?.topSelling ?? []
  const leastSelling = foodRankings?.leastSelling ?? []

  const revenueTrend = summary?.revenueTrendPct != null ? `${summary.revenueTrendPct >= 0 ? '+' : ''}${summary.revenueTrendPct}%` : null
  const revenueTrendUp = (summary?.revenueTrendPct ?? 0) >= 0
  const profitTrend = summary?.profitMargin != null ? `${summary.profitMargin >= 0 ? '+' : ''}${summary.profitMargin}%` : null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-7xl mx-auto">
        <AlertTriangle size={48} className="text-red-400" />
        <p className="text-sm font-medium text-red-500">Failed to load dashboard</p>
        <p className="text-xs text-gray-400">{error}</p>
        <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"><RefreshCw size={14} /> Retry</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{loading ? 'Loading...' : 'Business Intelligence Dashboard'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} disabled={loading || exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
            <FileText size={13} /> {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar filterType={filterType} startDate={startDate} endDate={endDate} onFilterTypeChange={setFilterType} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onApply={handleApplyFilter} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={summary ? fmtRs(summary.todayRevenue) : '—'} sub={summary ? `Period total: ${fmtRs(summary.weekRevenue)}` : 'Loading...'} trend={revenueTrend} trendUp={revenueTrendUp} variant="green" />
        <StatCard icon={TrendingUp} label="Total Profit" value={summary ? fmtRs(summary.totalProfit) : '—'} sub={summary ? `~${summary.profitMargin}% margin` : 'Calculating...'} trend={profitTrend} trendUp={revenueTrendUp} variant="amber" />
        <StatCard icon={Package} label="Total Stock Value" value={summary ? fmtRs(summary.totalStockValue) : '—'} sub="Inventory valuation" variant="blue" />
        <StatCard icon={AlertTriangle} label="Pending Payables" value={summary ? fmtRs(summary.pendingPayables) : '—'} sub={summary ? `${summary.supplierPayableCount} suppliers with balance due` : '—'} trend={summary?.pendingPayables > 0 ? 'Due' : undefined} trendUp={false} variant="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-7">
          {revenueChart.length > 0 ? <RevenueAreaChart data={revenueChart} chartTheme={chartTheme} /> : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px] flex items-center justify-center"><p className="text-sm text-gray-400">No revenue data available</p></div>
          )}
        </div>
        <div className="lg:col-span-5">
          {topCategories.length > 0 ? <CategoryPieChart data={topCategories.slice(0, 5)} chartTheme={chartTheme} /> : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm h-full min-h-[320px] flex items-center justify-center"><p className="text-sm text-gray-400">No category data available</p></div>
          )}
        </div>
      </div>

      {/* Food lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <FoodRankList title="Top Selling Foods" subtitle="Best performers — last 7 days" items={topSelling} variant="top" maxQty={maxQty} />
        <FoodRankList title="Least Selling Foods" subtitle="Menu optimization candidates" items={leastSelling} variant="low" maxQty={maxQty} />
      </div>

      {/* Hourly Traffic + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <HourlyTrafficChart data={hourlyTraffic} chartTheme={chartTheme} />
        <PaymentDistributionBars data={paymentDistribution} />
      </div>

      {/* Most Profitable Foods */}
      <ProfitableFoodsTable data={profitableFoods?.mostProfitable ?? []} />

      {/* Inventory Efficiency */}
      {inventoryEfficiency && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={Hash} label="Inventory Turnover" value={inventoryEfficiency.inventoryTurnover != null ? Number(inventoryEfficiency.inventoryTurnover).toFixed(1) + 'x' : '0.0x'} sub="Annualized turnover ratio" variant="blue" />
          <StatCard icon={Package} label="Weekly COGS" value={fmtRs(inventoryEfficiency.weeklyCogs)} sub="Estimated cost of goods sold" variant="amber" />
          <StatCard icon={AlertTriangle} label="Stale Items" value={String(inventoryEfficiency.staleItemCount || 0)} sub="Items without movement 30+ days" variant={(inventoryEfficiency.staleItemCount || 0) > 0 ? 'red' : 'green'} />
        </div>
      )}
    </div>
  )
}