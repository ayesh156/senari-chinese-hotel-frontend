/**
 * CSV / Excel Export Engine for Reports
 *
 * Converts analytics store datasets into downloadable CSV/Excel files.
 * Uses native Blob/stream APIs — no external dependencies required.
 * Respects dynamic currency symbol from settingsStore and active date filter.
 */
import { useSettingsStore } from './settingsStore'

/**
 * Get the dynamic currency symbol synchronously (for non-hook contexts).
 */
function getCurrencySymbol() {
  try {
    return useSettingsStore.getState().currencySymbol || 'Rs.'
  } catch {
    return 'Rs.'
  }
}

/**
 * Escape a CSV field value properly (handles commas, quotes, newlines).
 */
function esc(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Format a number as currency string for CSV (plain number without symbol).
 */
function fmtNum(value) {
  const n = Number(value || 0)
  return n.toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a number with currency symbol for display.
 */
function fmtCurrency(value) {
  const symbol = getCurrencySymbol()
  return `${symbol} ${fmtNum(value)}`
}

/**
 * Safely format a date value to YYYY-MM-DD string.
 * Handles ISO strings, timestamps, Date objects, and raw strings.
 * Uses ="YYYY-MM-DD" format so Excel treats it as clean text,
 * preventing automatic date parsing and ###### overflow.
 */
function fmtDate(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    const yyyyMMdd = d.toISOString().split('T')[0] // YYYY-MM-DD
    // Wrap in ="..." to force Excel to treat as text, preventing date parsing
    return `="${yyyyMMdd}"`
  } catch {
    return String(value)
  }
}

/**
 * Convert an array of objects to CSV string.
 * @param {Array<Object>} data — Array of row objects
 * @param {Array<{key: string, label: string, formatter?: Function}>} columns — Column definitions
 * @returns {string} CSV content
 */
function objectsToCSV(data, columns) {
  if (!data || data.length === 0) return ''

  // Header row
  const header = columns.map(col => esc(col.label)).join(',')

  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const raw = row[col.key]
      if (col.formatter) return esc(col.formatter(raw, row))
      return esc(raw)
    }).join(',')
  })

  return [header, ...rows].join('\r\n')
}

/**
 * Trigger a browser file download using a Blob.
 */
function downloadBlob(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export the full dashboard summary (KPI data) to CSV.
 */
export function exportSummaryToCSV(summary, periodText) {
  const symbol = getCurrencySymbol()
  const rows = []
  if (summary) {
    rows.push(
      { metric: "Today's Revenue", value: `${symbol} ${fmtNum(summary.todayRevenue)}` },
      { metric: 'Period Revenue Total', value: `${symbol} ${fmtNum(summary.weekRevenue)}` },
      { metric: 'Total Profit', value: `${symbol} ${fmtNum(summary.totalProfit)}` },
      { metric: 'Profit Margin', value: `${summary.profitMargin || 0}%` },
      { metric: 'Revenue Trend', value: `${summary.revenueTrendPct >= 0 ? '+' : ''}${summary.revenueTrendPct || 0}%` },
      { metric: 'Total Stock Value', value: `${symbol} ${fmtNum(summary.totalStockValue)}` },
      { metric: 'Pending Payables', value: `${symbol} ${fmtNum(summary.pendingPayables)}` },
      { metric: 'Suppliers with Balance', value: String(summary.supplierPayableCount || 0) },
    )
  }
  const columns = [
    { key: 'metric', label: 'Metric' },
    { key: 'value', label: 'Value' },
  ]
  const csv = objectsToCSV(rows, columns)
  const period = periodText ? periodText.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) : 'selected_period'
  downloadBlob(csv, `senari_summary_${period}.csv`)
}

/**
 * Export food rankings (top/least selling) to CSV.
 */
export function exportFoodRankingsToCSV(topSelling, leastSelling, periodText) {
  const sections = []

  // Top selling
  if (topSelling && topSelling.length > 0) {
    const topColumns = [
      { key: 'rank', label: 'Rank', formatter: (_, row, idx) => idx + 1 },
      { key: 'name', label: 'Menu Item' },
      { key: 'category', label: 'Category' },
      { key: 'qty', label: 'Qty Sold' },
      { key: 'revenue', label: 'Revenue ($)', formatter: (v) => fmtCurrency(v) },
    ]
    sections.push('--- TOP SELLING FOODS ---')
    sections.push(objectsToCSV(topSelling.map((item, idx) => ({ ...item, rank: idx + 1 })), topColumns))
  }

  // Least selling
  if (leastSelling && leastSelling.length > 0) {
    const leastColumns = [
      { key: 'rank', label: 'Rank', formatter: (_, row, idx) => idx + 1 },
      { key: 'name', label: 'Menu Item' },
      { key: 'category', label: 'Category' },
      { key: 'qty', label: 'Qty Sold' },
      { key: 'revenue', label: 'Revenue ($)', formatter: (v) => fmtCurrency(v) },
    ]
    sections.push('--- MENU OPTIMIZATION CANDIDATES (LEAST SELLING) ---')
    sections.push(objectsToCSV(leastSelling.map((item, idx) => ({ ...item, rank: idx + 1 })), leastColumns))
  }

  if (sections.length === 0) return
  const period = periodText ? periodText.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) : 'selected_period'
  downloadBlob(sections.join('\r\n\r\n'), `senari_food_rankings_${period}.csv`)
}

/**
 * Export profitable foods data to CSV.
 */
export function exportProfitableFoodsToCSV(profitableFoods, periodText) {
  const items = profitableFoods?.mostProfitable || []
  if (items.length === 0) return

  const columns = [
    { key: 'name', label: 'Menu Item' },
    { key: 'category', label: 'Category' },
    { key: 'qty', label: 'Qty Sold' },
    { key: 'unitPrice', label: 'Unit Price ($)', formatter: (v) => fmtCurrency(v) },
    { key: 'costPerUnit', label: 'Cost/Dish ($)', formatter: (v) => fmtCurrency(v) },
    { key: 'profitPerUnit', label: 'Profit/Dish ($)', formatter: (v) => fmtCurrency(v) },
    { key: 'marginPct', label: 'Margin %', formatter: (v) => `${v || 0}%` },
  ]
  const csv = objectsToCSV(items, columns)
  const period = periodText ? periodText.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) : 'selected_period'
  downloadBlob(csv, `senari_profitable_foods_${period}.csv`)
}

/**
 * Export revenue chart data to CSV.
 */
export function exportRevenueChartToCSV(revenueChart, periodText) {
  if (!revenueChart || revenueChart.length === 0) return

  const columns = [
    { key: 'label', label: 'Day' },
    { key: 'date', label: 'Date', formatter: (v) => fmtDate(v) },
    { key: 'revenue', label: 'Revenue ($)', formatter: (v) => fmtCurrency(v) },
    { key: 'orderCount', label: 'Order Count' },
  ]
  const csv = objectsToCSV(revenueChart, columns)
  const period = periodText ? periodText.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) : 'selected_period'
  downloadBlob(csv, `senari_revenue_chart_${period}.csv`)
}

/**
 * Export hourly traffic data to CSV.
 */
export function exportHourlyTrafficToCSV(hourlyTraffic, periodText) {
  if (!hourlyTraffic || hourlyTraffic.length === 0) return

  const columns = [
    { key: 'label', label: 'Hour' },
    { key: 'count', label: 'Order Count' },
    { key: 'revenue', label: 'Revenue ($)', formatter: (v) => fmtCurrency(v) },
  ]
  const csv = objectsToCSV(hourlyTraffic, columns)
  const period = periodText ? periodText.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) : 'selected_period'
  downloadBlob(csv, `senari_hourly_traffic_${period}.csv`)
}

/**
 * Export payment distribution data to CSV.
 */
export function exportPaymentDistributionToCSV(paymentDistribution, periodText) {
  if (!paymentDistribution || paymentDistribution.length === 0) return

  const columns = [
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'revenue', label: 'Revenue ($)', formatter: (v) => fmtCurrency(v) },
    { key: 'pct', label: 'Percentage %', formatter: (v) => `${v || 0}%` },
    { key: 'orderCount', label: 'Order Count' },
  ]
  const csv = objectsToCSV(paymentDistribution, columns)
  const period = periodText ? periodText.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40) : 'selected_period'
  downloadBlob(csv, `senari_payment_distribution_${period}.csv`)
}

/**
 * Export all report datasets as a single combined CSV file.
 * This is the main "Export Full Report CSV" entry point.
 */
export function exportFullReportToCSV({
  summary,
  revenueChart,
  topSelling,
  leastSelling,
  profitableFoods,
  hourlyTraffic,
  paymentDistribution,
  periodText,
}) {
  const sections = []
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)

  // Title
  sections.push(`SENARI CHINESE HOTEL - Business Intelligence Report`)
  sections.push(`Generated: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`)
  sections.push(periodText || 'Period: Selected Range')
  sections.push('')

  // 1. Summary KPIs
  if (summary) {
    sections.push('--- KEY PERFORMANCE INDICATORS ---')
    const kpiColumns = [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
    ]
    const symbol = getCurrencySymbol()
    const kpiRows = [
      { metric: "Today's Revenue", value: `${symbol} ${fmtNum(summary.todayRevenue)}` },
      { metric: 'Period Revenue Total', value: `${symbol} ${fmtNum(summary.weekRevenue)}` },
      { metric: 'Total Profit', value: `${symbol} ${fmtNum(summary.totalProfit)}` },
      { metric: 'Profit Margin', value: `${summary.profitMargin || 0}%` },
      { metric: 'Revenue Trend', value: `${summary.revenueTrendPct >= 0 ? '+' : ''}${summary.revenueTrendPct || 0}%` },
      { metric: 'Total Stock Value', value: `${symbol} ${fmtNum(summary.totalStockValue)}` },
      { metric: 'Pending Payables', value: `${symbol} ${fmtNum(summary.pendingPayables)}` },
      { metric: 'Suppliers with Balance', value: String(summary.supplierPayableCount || 0) },
    ]
    sections.push(objectsToCSV(kpiRows, kpiColumns))
    sections.push('')
  }

  // 2. Revenue Chart
  if (revenueChart && revenueChart.length > 0) {
    sections.push('--- DAILY REVENUE ---')
    const revColumns = [
      { key: 'label', label: 'Day' },
      { key: 'date', label: 'Date', formatter: (v) => fmtDate(v) },
      { key: 'revenue', label: 'Revenue' },
      { key: 'orderCount', label: 'Order Count' },
    ]
    sections.push(objectsToCSV(revenueChart, revColumns))
    sections.push('')
  }

  // 3. Top Selling Foods
  if (topSelling && topSelling.length > 0) {
    sections.push('--- TOP SELLING FOODS ---')
    const topColumns = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Menu Item' },
      { key: 'category', label: 'Category' },
      { key: 'qty', label: 'Qty Sold' },
      { key: 'revenue', label: 'Revenue' },
    ]
    sections.push(objectsToCSV(topSelling.map((item, idx) => ({ ...item, rank: idx + 1 })), topColumns))
    sections.push('')
  }

  // 4. Least Selling Foods
  if (leastSelling && leastSelling.length > 0) {
    sections.push('--- MENU OPTIMIZATION CANDIDATES ---')
    const leastColumns = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Menu Item' },
      { key: 'category', label: 'Category' },
      { key: 'qty', label: 'Qty Sold' },
      { key: 'revenue', label: 'Revenue' },
    ]
    sections.push(objectsToCSV(leastSelling.map((item, idx) => ({ ...item, rank: idx + 1 })), leastColumns))
    sections.push('')
  }

  // 5. Profitable Foods
  if (profitableFoods?.mostProfitable?.length > 0) {
    sections.push('--- MOST PROFITABLE FOODS ---')
    const profitColumns = [
      { key: 'name', label: 'Menu Item' },
      { key: 'category', label: 'Category' },
      { key: 'qty', label: 'Qty Sold' },
      { key: 'unitPrice', label: 'Unit Price' },
      { key: 'costPerUnit', label: 'Cost/Dish' },
      { key: 'profitPerUnit', label: 'Profit/Dish' },
      { key: 'marginPct', label: 'Margin %' },
    ]
    sections.push(objectsToCSV(profitableFoods.mostProfitable, profitColumns))
    sections.push('')
  }

  // 6. Hourly Traffic
  if (hourlyTraffic && hourlyTraffic.length > 0) {
    sections.push('--- HOURLY TRAFFIC ---')
    const htColumns = [
      { key: 'label', label: 'Hour' },
      { key: 'count', label: 'Order Count' },
      { key: 'revenue', label: 'Revenue' },
    ]
    sections.push(objectsToCSV(hourlyTraffic, htColumns))
    sections.push('')
  }

  // 7. Payment Distribution
  if (paymentDistribution && paymentDistribution.length > 0) {
    sections.push('--- PAYMENT DISTRIBUTION ---')
    const pdColumns = [
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'pct', label: 'Percentage %' },
      { key: 'orderCount', label: 'Order Count' },
    ]
    sections.push(objectsToCSV(paymentDistribution, pdColumns))
    sections.push('')
  }

  // Footer
  sections.push('--- END OF REPORT ---')
  sections.push('Generated by Senari POS System')
  sections.push(`Exported: ${new Date().toISOString()}`)

  const content = sections.join('\r\n')
  downloadBlob(content, `senari_full_report_${timestamp}.csv`)
}