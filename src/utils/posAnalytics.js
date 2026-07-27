/**
 * Mock analytics data for the POS Dashboard.
 * Replace with real API aggregations once backend is connected.
 */

// ── Hourly Sales (today, 8 AM – 9 PM) ────────────────────────────────────────
export const HOURLY_SALES = [
  { hour: '8 AM',  revenue: 1200, orders: 3  },
  { hour: '9 AM',  revenue: 2450, orders: 6  },
  { hour: '10 AM', revenue: 1800, orders: 4  },
  { hour: '11 AM', revenue: 3600, orders: 9  },
  { hour: '12 PM', revenue: 6800, orders: 17 },
  { hour: '1 PM',  revenue: 7200, orders: 18 },
  { hour: '2 PM',  revenue: 4500, orders: 11 },
  { hour: '3 PM',  revenue: 2100, orders: 5  },
  { hour: '4 PM',  revenue: 1950, orders: 5  },
  { hour: '5 PM',  revenue: 3300, orders: 8  },
  { hour: '6 PM',  revenue: 5400, orders: 13 },
  { hour: '7 PM',  revenue: 6100, orders: 15 },
  { hour: '8 PM',  revenue: 4800, orders: 12 },
  { hour: '9 PM',  revenue: 2200, orders: 6  },
]

// ── Category Distribution ─────────────────────────────────────────────────────
export const CATEGORY_STATS = [
  { name: 'Rice Dishes',  pct: 38, color: 'bg-amber-500',  textColor: 'text-amber-500'  },
  { name: 'Mains',        pct: 26, color: 'bg-blue-500',   textColor: 'text-blue-500'   },
  { name: 'Street Food',  pct: 18, color: 'bg-purple-500', textColor: 'text-purple-500' },
  { name: 'Noodles',      pct: 12, color: 'bg-teal-500',   textColor: 'text-teal-500'   },
  { name: 'Desserts',     pct:  6, color: 'bg-pink-500',   textColor: 'text-pink-500'   },
]

// ── Weekly Revenue (Mon–Sun) ──────────────────────────────────────────────────
export const WEEKLY_REVENUE = [
  { day: 'Mon', revenue: 18400 },
  { day: 'Tue', revenue: 22100 },
  { day: 'Wed', revenue: 19800 },
  { day: 'Thu', revenue: 25600 },
  { day: 'Fri', revenue: 31200 },
  { day: 'Sat', revenue: 38900 },
  { day: 'Sun', revenue: 35400 },
]

// ── Peak hour (derived) ───────────────────────────────────────────────────────
export const peakHour = HOURLY_SALES.reduce((a, b) => a.revenue > b.revenue ? a : b)
export const maxHourlyRevenue = Math.max(...HOURLY_SALES.map(h => h.revenue))
export const totalTodayRevenue = HOURLY_SALES.reduce((s, h) => s + h.revenue, 0)
export const totalTodayOrders  = HOURLY_SALES.reduce((s, h) => s + h.orders, 0)
