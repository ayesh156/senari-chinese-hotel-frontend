import { useState, useEffect, useMemo } from 'react'
import { X, DollarSign, TrendingUp, ShoppingBag, Clock, FileText, Download, CreditCard, UtensilsCrossed } from 'lucide-react'
import { useSettingsStore } from '../../utils/settingsStore'
import { fmtCurrencyDirect } from '../../utils/currency'
import { useReportStore, useDashboardSummary, useFoodRankings, usePaymentDistribution } from '../../utils/reportStore'
import { useDashboardStore } from '../../utils/dashboardStore'
import { exportFullReportToCSV } from '../../utils/exportToCSV'

// ── Helper ──────────────────────────────────────────────────────────────────
const fmtRs = (n) => fmtCurrencyDirect(n)
const fmtNum = (n) => Number(n || 0).toLocaleString('en-LK')

// ── Payment Method Colors ───────────────────────────────────────────────────
const PAYMENT_COLORS = {
  Cash: '#10b981',
  Card: '#3b82f6',
  Online: '#8b5cf6',
  Other: '#6b7280',
}

// ── KPI Tile (compact) ──────────────────────────────────────────────────────
function KPITile({ icon: Icon, label, value, sub, color = 'amber' }) {
  const colorMap = {
    amber: 'from-amber-400 to-orange-500',
    green: 'from-green-400 to-emerald-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-pink-500',
  }
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${colorMap[color] || colorMap.amber}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="shrink-0">
          <Icon size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      <p className="mt-2 text-lg font-extrabold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{value}</p>
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Top 3 Selling Items ─────────────────────────────────────────────────────
function TopSellingItems({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No sales data yet today</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {items.slice(0, 3).map((item, idx) => (
        <div key={item.id ?? item.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
            idx === 0
              ? 'bg-amber-500 text-white'
              : idx === 1
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{item.category || ''}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{fmtNum(item.qty)} sold</p>
            <p className="text-xs text-gray-400 tabular-nums">{fmtRs(item.revenue)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Payment Breakdown ──────────────────────────────────────────────────────
function PaymentBreakdown({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No payment data available</p>
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((method) => (
        <div key={method.paymentMethod} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{method.icon}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{method.paymentMethod}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 tabular-nums">{fmtRs(method.revenue)}</span>
              <span className="text-[10px] text-gray-400 w-7 text-right">{method.pct || 0}%</span>
            </div>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${method.pct || 0}%`,
                background: method.color || PAYMENT_COLORS[method.paymentMethod] || '#6b7280',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Today's Date Formatter ────────────────────────────────────────────────
function getTodayDateStr() {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Main Modal ────────────────────────────────────────────────────────────
export default function DailySalesSummaryModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const summary = useDashboardSummary()
  const foodRankings = useFoodRankings()
  const paymentDistribution = usePaymentDistribution()
  const { data: dashData, fetchDashboardSummary } = useDashboardStore()
  const fetchDashboard = useReportStore(s => s.fetchDashboard)

  // Fetch fresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)
      Promise.all([
        fetchDashboardSummary(),
        fetchDashboard(),
      ]).catch((e) => {
        setError(e?.message || 'Failed to load summary data')
      }).finally(() => {
        setLoading(false)
      })
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute averages
  const todayRevenue = dashData?.todaySales?.revenue ?? summary?.todayRevenue ?? 0
  const completedOrders = dashData?.todaySales?.completedOrders ?? 0
  const avgTicketSize = completedOrders > 0 ? Math.round(todayRevenue / completedOrders) : 0

  // Today's profit estimate (from summary's calculated profit)
  const todayProfit = summary?.totalProfit ?? 0

  const topSellingItems = foodRankings?.topSelling ?? []

  const handleDownloadPDF = () => {
    onClose()
    // Trigger the PDF export by navigating to reports with a query param?
    // Instead, we'll just open the reports page
    window.open('/pos/reports', '_blank')
  }

  const handleExportCSV = () => {
    const periodText = 'Period: Today'
    const topSelling = foodRankings?.topSelling || []
    const leastSelling = foodRankings?.leastSelling || []
    exportFullReportToCSV({
      summary,
      revenueChart: [],
      topSelling,
      leastSelling,
      profitableFoods: null,
      hourlyTraffic: [],
      paymentDistribution,
      periodText,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">Today's Summary</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{getTodayDateStr()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading summary...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm font-medium text-red-500">Failed to load data</p>
              <p className="text-xs text-gray-400">{error}</p>
              <button
                onClick={() => { setLoading(true); setError(null); Promise.all([fetchDashboardSummary(), fetchDashboard()]).catch(e => setError(e?.message)).finally(() => setLoading(false)) }}
                className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* ── KPI Grid ── */}
              <div className="grid grid-cols-2 gap-3">
                <KPITile
                  icon={DollarSign}
                  label="Today's Revenue"
                  value={fmtRs(todayRevenue)}
                  sub={`${fmtNum(completedOrders)} orders`}
                  color="green"
                />
                <KPITile
                  icon={TrendingUp}
                  label="Today's Profit"
                  value={fmtRs(todayProfit)}
                  sub={`~${summary?.profitMargin || 0}% margin`}
                  color="amber"
                />
                <KPITile
                  icon={ShoppingBag}
                  label="Total Orders"
                  value={fmtNum(completedOrders)}
                  sub="Completed today"
                  color="blue"
                />
                <KPITile
                  icon={Clock}
                  label="Avg. Ticket"
                  value={fmtRs(avgTicketSize)}
                  sub="Per order"
                  color="purple"
                />
              </div>

              {/* ── Top 3 Selling Items ── */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <UtensilsCrossed size={14} className="text-amber-500" />
                  Top 3 Selling Items
                </h3>
                <TopSellingItems items={topSellingItems} />
              </div>

              {/* ── Payment Breakdown ── */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <CreditCard size={14} className="text-amber-500" />
                  Payment Breakdown
                </h3>
                <PaymentBreakdown data={paymentDistribution} />
              </div>
            </div>
          )}
        </div>

        {/* ── Action Footer ── */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
          >
            <FileText size={14} />
            PDF Summary
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={onClose}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}