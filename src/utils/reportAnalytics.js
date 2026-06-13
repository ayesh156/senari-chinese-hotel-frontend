/**
 * Mock analytics for the Advanced Reports dashboard.
 * Derived from menu, orders, inventory, and supplier domains.
 * Replace with API aggregations when backend is ready.
 */

import { MENU_ITEMS } from './menuData'
import { INVENTORY_ITEMS, getTotalInventoryValue } from './inventoryData'
import { MOCK_SUPPLIERS } from './mockSuppliers'
import { MOCK_ORDERS } from './mockOrders'
import { totalTodayRevenue } from './posAnalytics'

// ── Constants ─────────────────────────────────────────────────────────────────
export const PROFIT_MARGIN = 0.38
const AVG_COST_RATIO = 0.42

// ── Food sales from mock orders ───────────────────────────────────────────────
function buildFoodSalesFromOrders() {
  const map = {}
  MENU_ITEMS.forEach(item => {
    map[item.name] = {
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      qty: 0,
      revenue: 0,
    }
  })

  MOCK_ORDERS.forEach(order => {
    order.items.forEach(line => {
      const key = line.name
      if (!map[key]) {
        map[key] = {
          id: line.id,
          name: line.name,
          category: line.category ?? 'Other',
          price: line.unitPrice ?? line.price ?? 0,
          qty: 0,
          revenue: 0,
        }
      }
      map[key].qty += line.quantity
      map[key].revenue += line.subtotal ?? line.quantity * (line.unitPrice ?? line.price ?? 0)
    })
  })

  return Object.values(map)
}

const FOOD_SALES = buildFoodSalesFromOrders()

// ── Revenue last 7 days ───────────────────────────────────────────────────────
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const REVENUE_LAST_7_DAYS = [
  { day: 'Mon', date: '19 May', revenue: 18400 },
  { day: 'Tue', date: '20 May', revenue: 22100 },
  { day: 'Wed', date: '21 May', revenue: 19800 },
  { day: 'Thu', date: '22 May', revenue: 25600 },
  { day: 'Fri', date: '23 May', revenue: 31200 },
  { day: 'Sat', date: '24 May', revenue: 38900 },
  { day: 'Sun', date: '25 May', revenue: 35400 },
].map((d, i) => ({
  ...d,
  label: `${d.day}`,
  fullLabel: `${DAY_LABELS[i]} · ${d.date}`,
}))

// ── Category sales for pie (top 5 by revenue share) ───────────────────────────
function buildCategoryPieData() {
  const byCat = {}
  FOOD_SALES.forEach(item => {
    if (!byCat[item.category]) {
      byCat[item.category] = { name: item.category, value: 0, revenue: 0 }
    }
    byCat[item.category].value += item.qty
    byCat[item.category].revenue += item.revenue
  })

  const sorted = Object.values(byCat)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const total = sorted.reduce((s, c) => s + c.revenue, 0) || 1

  const PIE_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#ec4899']

  return sorted.map((cat, i) => ({
    ...cat,
    pct: Math.round((cat.revenue / total) * 100),
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))
}

export const TOP_CATEGORY_PIE = buildCategoryPieData()

// ── Top / least selling foods ─────────────────────────────────────────────────
const sortedByQty = [...FOOD_SALES].sort((a, b) => b.qty - a.qty)

export const TOP_SELLING_FOODS = sortedByQty
  .filter(i => i.qty > 0)
  .slice(0, 5)

export const LEAST_SELLING_FOODS = [...FOOD_SALES]
  .sort((a, b) => a.qty - b.qty)
  .slice(0, 5)

// ── KPI aggregates ────────────────────────────────────────────────────────────
export function getReportKPIs() {
  const todayRevenue = totalTodayRevenue
  const weekRevenue = REVENUE_LAST_7_DAYS.reduce((s, d) => s + d.revenue, 0)
  const estimatedCogs = weekRevenue * AVG_COST_RATIO
  const totalProfit = Math.round(weekRevenue * PROFIT_MARGIN)
  const stockValue = getTotalInventoryValue(INVENTORY_ITEMS)
  const pendingPayables = MOCK_SUPPLIERS.reduce((s, sup) => s + sup.payableAmount, 0)
  const supplierPayableCount = MOCK_SUPPLIERS.filter(s => s.payableAmount > 0).length

  return {
    todayRevenue,
    totalProfit,
    totalStockValue: stockValue,
    pendingPayables,
    supplierPayableCount,
    weekRevenue,
    estimatedCogs,
    topFoodMaxQty: TOP_SELLING_FOODS[0]?.qty ?? 1,
  }
}

export const REPORT_KPI_DEFAULTS = getReportKPIs()

// Re-export for charts that need week total
export const maxWeeklyRevenue = Math.max(...REVENUE_LAST_7_DAYS.map(d => d.revenue))
