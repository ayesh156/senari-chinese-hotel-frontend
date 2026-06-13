/**
 * Mock order data for POS Dashboard development.
 * Replace with real API calls once backend is connected.
 * 30 orders — enough to test Kanban column pagination (8 per page)
 * and Invoices table pagination (10 per page → 3 pages).
 */
import { MENU_ITEMS } from './menuData'

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad  = (n) => String(n).padStart(3, '0')
const mins = (m) => new Date(Date.now() - m * 60 * 1000).toISOString()

function makeOrder(id, customerName, customerPhone, orderType, status, paymentStatus, itemIds, discountAmount = 0, minutesAgo = 5) {
  const items = itemIds.map(({ productId, qty }) => {
    const product = MENU_ITEMS.find(p => p.id === productId)
    return {
      id:        productId * 100 + id,
      productId,
      name:      product.name,
      image:     product.image,
      category:  product.category,
      quantity:  qty,
      unitPrice: product.price,
      subtotal:  product.price * qty,
    }
  })
  const subtotal   = items.reduce((s, i) => s + i.subtotal, 0)
  const grandTotal = Math.max(0, subtotal - discountAmount)
  return {
    id,
    orderNumber: `ORD-${pad(id)}`,
    customerName,
    customerPhone,
    orderType,
    status,
    paymentStatus,
    subtotal,
    discountAmount,
    grandTotal,
    createdAt: mins(minutesAgo),
    items,
  }
}

// ── Mock Orders (30 total) ────────────────────────────────────────────────────
export const MOCK_INVENTORY = [
  { id: 1, name: 'Rice', stock: 150, unit: 'kg', lowStockThreshold: 50 },
  { id: 2, name: 'Chicken', stock: 75, unit: 'kg', lowStockThreshold: 20 },
  { id: 3, name: 'Prawns', stock: 30, unit: 'kg', lowStockThreshold: 10 },
  { id: 4, name: 'Noodles', stock: 200, unit: 'packs', lowStockThreshold: 75 },
  { id: 5, name: 'Vegetables', stock: 100, unit: 'kg', lowStockThreshold: 30 },
  { id: 6, name: 'Soy Sauce', stock: 50, unit: 'bottles', lowStockThreshold: 15 },
  { id: 7, name: 'Chilli Paste', stock: 40, unit: 'jars', lowStockThreshold: 10 },
  { id: 8, name: 'Soft Drinks', stock: 300, unit: 'bottles', lowStockThreshold: 100 },
]

export const MOCK_SUPPLIERS = [
  { id: 1, name: 'Grand Foods Inc.', contact: '0112345678', pendingPayables: 75000, lastOrder: '2023-10-20' },
  { id: 2, name: 'Lanka Staples Co.', contact: '0119876543', pendingPayables: 0, lastOrder: '2023-11-01' },
  { id: 3, name: 'Fresh Produce (Pvt) Ltd', contact: '0771231234', pendingPayables: 120000, lastOrder: '2023-10-28' },
  { id: 4, name: 'Beverage Distributors', contact: '0714567890', pendingPayables: 30000, lastOrder: '2023-10-15' },
]

// Derived selectors for new KPI cards
export const lowStockItemsCount = MOCK_INVENTORY.filter(item => item.stock <= item.lowStockThreshold).length
export const totalPendingSupplierPayables = MOCK_SUPPLIERS.reduce((sum, supplier) => sum + supplier.pendingPayables, 0)

export const MOCK_TABLES = [
  { id: 1, name: "Table 01", capacity: 4, isOccupied: true,  currentOrder: "ORD-002" },
  { id: 2, name: "Table 02", capacity: 2, isOccupied: false, currentOrder: null },
  { id: 3, name: "Table 03", capacity: 6, isOccupied: true,  currentOrder: "ORD-004" },
  { id: 4, name: "Table 04", capacity: 4, isOccupied: false, currentOrder: null },
  { id: 5, name: "Table 05", capacity: 2, isOccupied: true,  currentOrder: "ORD-010" },
  { id: 6, name: "Table 06", capacity: 8, isOccupied: false, currentOrder: null },
]

export const totalTables = MOCK_TABLES.length
export const occupiedTables = MOCK_TABLES.filter(table => table.isOccupied).length

export const MOCK_ORDERS = [
  // ── PENDING (9) ──────────────────────────────────────────────────────────
  makeOrder( 1, 'Kamal Perera',       '077 123 4567', 'PICKUP',  'PENDING',   'UNPAID', [{ productId: 1, qty: 2 }, { productId: 7, qty: 1 }], 0,   3),
  makeOrder( 2, 'Nimal Silva',        '071 987 6543', 'DINE_IN', 'PENDING',   'UNPAID', [{ productId: 3, qty: 1 }, { productId: 2, qty: 1 }], 150, 7),
  makeOrder( 4, 'Ruwan Jayawardena',  '070 444 9876', 'DINE_IN', 'PENDING',   'UNPAID', [{ productId: 5, qty: 1 }], 0, 2),
  makeOrder( 9, 'Tharushi Perera',    '076 111 2233', 'PICKUP',  'PENDING',   'UNPAID', [{ productId: 2, qty: 2 }, { productId: 6, qty: 1 }], 0,   1),
  makeOrder(10, 'Malith Bandara',     '077 334 5566', 'DINE_IN', 'PENDING',   'UNPAID', [{ productId: 4, qty: 1 }, { productId: 7, qty: 2 }], 100, 4),
  makeOrder(11, 'Sachini Rajapaksa',  '071 556 7788', 'PICKUP',  'PENDING',   'UNPAID', [{ productId: 1, qty: 1 }, { productId: 3, qty: 1 }], 0,   6),
  makeOrder(12, 'Dinesh Kumara',      '078 778 9900', 'DINE_IN', 'PENDING',   'UNPAID', [{ productId: 5, qty: 2 }], 200, 9),
  makeOrder(13, 'Amali Senanayake',   '075 990 1122', 'PICKUP',  'PENDING',   'UNPAID', [{ productId: 8, qty: 1 }, { productId: 6, qty: 1 }], 0,   5),
  makeOrder(14, 'Roshan Wijesinghe',  '070 112 3344', 'DINE_IN', 'PENDING',   'UNPAID', [{ productId: 2, qty: 1 }, { productId: 4, qty: 1 }], 0,   8),

  // ── PREPARING (7) ────────────────────────────────────────────────────────
  makeOrder( 3, 'Sanduni Fernando',   '076 555 1234', 'PICKUP',  'PREPARING', 'UNPAID', [{ productId: 4, qty: 1 }, { productId: 6, qty: 2 }], 0,   12),
  makeOrder(15, 'Kavinda Dissanayake','077 223 4455', 'DINE_IN', 'PREPARING', 'UNPAID', [{ productId: 3, qty: 2 }], 0,   15),
  makeOrder(16, 'Ishara Madushani',   '071 445 6677', 'PICKUP',  'PREPARING', 'UNPAID', [{ productId: 1, qty: 1 }, { productId: 8, qty: 1 }], 50,  20),
  makeOrder(17, 'Nuwan Priyantha',    '076 667 8899', 'DINE_IN', 'PREPARING', 'UNPAID', [{ productId: 5, qty: 1 }, { productId: 7, qty: 1 }], 0,   22),
  makeOrder(18, 'Chamodi Rathnayake', '078 889 0011', 'PICKUP',  'PREPARING', 'UNPAID', [{ productId: 2, qty: 2 }, { productId: 6, qty: 1 }], 100, 25),
  makeOrder(19, 'Lasith Malinga',     '070 001 2233', 'DINE_IN', 'PREPARING', 'UNPAID', [{ productId: 4, qty: 1 }], 0,   28),
  makeOrder(20, 'Hiruni Jayasekara',  '075 223 4455', 'PICKUP',  'PREPARING', 'UNPAID', [{ productId: 3, qty: 1 }, { productId: 7, qty: 2 }], 0,   30),

  // ── READY (4) ────────────────────────────────────────────────────────────
  makeOrder( 5, 'Priya Wickramasinghe','078 222 3344', 'PICKUP', 'READY',     'UNPAID', [{ productId: 2, qty: 3 }, { productId: 7, qty: 2 }], 200, 18),
  makeOrder(21, 'Saman Kumara',       '077 445 6677', 'DINE_IN', 'READY',     'UNPAID', [{ productId: 1, qty: 2 }, { productId: 5, qty: 1 }], 0,   35),
  makeOrder(22, 'Dilrukshi Perera',   '071 667 8899', 'PICKUP',  'READY',     'UNPAID', [{ productId: 6, qty: 2 }], 0,   40),
  makeOrder(23, 'Asiri Bandara',      '076 889 0011', 'DINE_IN', 'READY',     'UNPAID', [{ productId: 8, qty: 1 }, { productId: 3, qty: 1 }], 50,  42),

  // ── COMPLETED (10) — enough for Invoices 10-per-page → 2+ pages ──────────
  makeOrder( 6, 'Chamara Bandara',    '075 666 7788', 'DINE_IN', 'COMPLETED', 'PAID',   [{ productId: 1, qty: 1 }, { productId: 3, qty: 1 }, { productId: 7, qty: 1 }], 0,   45),
  makeOrder( 7, 'Dilani Rathnayake',  '077 888 2211', 'PICKUP',  'COMPLETED', 'PAID',   [{ productId: 4, qty: 2 }], 100, 60),
  makeOrder( 8, 'Asanka Gunawardena', '071 333 5566', 'DINE_IN', 'COMPLETED', 'PAID',   [{ productId: 6, qty: 1 }, { productId: 5, qty: 1 }, { productId: 2, qty: 1 }], 0,   90),
  makeOrder(24, 'Thilini Jayawardena','077 112 3344', 'PICKUP',  'COMPLETED', 'PAID',   [{ productId: 1, qty: 1 }, { productId: 8, qty: 1 }], 0,   120),
  makeOrder(25, 'Buddhika Perera',    '071 334 5566', 'DINE_IN', 'COMPLETED', 'PAID',   [{ productId: 3, qty: 2 }, { productId: 7, qty: 1 }], 150, 150),
  makeOrder(26, 'Nadeesha Silva',     '076 556 7788', 'PICKUP',  'COMPLETED', 'PAID',   [{ productId: 5, qty: 1 }], 0,   180),
  makeOrder(27, 'Kasun Rajapaksa',    '078 778 9900', 'DINE_IN', 'COMPLETED', 'PAID',   [{ productId: 2, qty: 2 }, { productId: 6, qty: 1 }], 100, 210),
  makeOrder(28, 'Anusha Fernando',    '070 990 1122', 'PICKUP',  'COMPLETED', 'PAID',   [{ productId: 4, qty: 1 }, { productId: 7, qty: 2 }], 0,   240),
  makeOrder(29, 'Ranjith Kumara',     '075 112 3344', 'DINE_IN', 'COMPLETED', 'PAID',   [{ productId: 1, qty: 3 }], 200, 270),
  makeOrder(30, 'Sewwandi Bandara',   '077 334 5566', 'PICKUP',  'COMPLETED', 'PAID',   [{ productId: 3, qty: 1 }, { productId: 5, qty: 1 }, { productId: 8, qty: 1 }], 0, 300),
]

// ── Derived selectors ─────────────────────────────────────────────────────────
export const todayRevenue   = MOCK_ORDERS.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.grandTotal, 0)
export const pendingCount   = MOCK_ORDERS.filter(o => o.status === 'PENDING').length
export const preparingCount = MOCK_ORDERS.filter(o => o.status === 'PREPARING').length
export const readyCount     = MOCK_ORDERS.filter(o => o.status === 'READY').length
export const completedCount = MOCK_ORDERS.filter(o => o.status === 'COMPLETED').length
export const dineInActive   = MOCK_ORDERS.filter(o => o.orderType === 'DINE_IN' && o.status !== 'COMPLETED').length
