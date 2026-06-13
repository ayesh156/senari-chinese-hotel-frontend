/**
 * Mock purchase order data for the POS Purchase Orders module.
 * Replace with API when backend is ready.
 */

export const PO_STATUS = {
  PAID:    'PAID',
  UNPAID:  'UNPAID',
  PARTIAL: 'PARTIAL',
}

export const PO_STATUS_LABELS = {
  [PO_STATUS.PAID]:    'Paid',
  [PO_STATUS.UNPAID]:  'Unpaid',
  [PO_STATUS.PARTIAL]: 'Partial',
}

export const MOCK_PURCHASE_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-0001',
    supplierId: 2,
    supplierName: 'Sena Poultry',
    items: [
      { inventoryItemId: 2,  itemName: 'Chicken Breast',  qty: 20,  unit: 'kg',      unitPrice: 1200, total: 24000 },
      { inventoryItemId: 14, itemName: 'Beef Mince',       qty: 10,  unit: 'kg',      unitPrice: 1500, total: 15000 },
    ],
    subtotal: 39000,
    paidAmount: 39000,
    paymentStatus: PO_STATUS.PAID,
    receivedAt: '2026-05-20T09:30:00',
    notes: 'Weekly meat delivery',
  },
  {
    id: 2,
    poNumber: 'PO-0002',
    supplierId: 1,
    supplierName: 'Perera Groceries',
    items: [
      { inventoryItemId: 1,  itemName: 'Basmati Rice',    qty: 50,  unit: 'kg',      unitPrice: 350,  total: 17500 },
      { inventoryItemId: 8,  itemName: 'Soy Sauce',       qty: 12,  unit: 'bottles', unitPrice: 320,  total: 3840  },
      { inventoryItemId: 17, itemName: 'Fish Sauce',      qty: 6,   unit: 'liters',  unitPrice: 480,  total: 2880  },
    ],
    subtotal: 24220,
    paidAmount: 0,
    paymentStatus: PO_STATUS.UNPAID,
    receivedAt: '2026-05-22T11:00:00',
    notes: '',
  },
  {
    id: 3,
    poNumber: 'PO-0003',
    supplierId: 5,
    supplierName: 'Ocean Fresh Seafood',
    items: [
      { inventoryItemId: 9,  itemName: 'Prawns',          qty: 15,  unit: 'kg',      unitPrice: 2800, total: 42000 },
    ],
    subtotal: 42000,
    paidAmount: 20000,
    paymentStatus: PO_STATUS.PARTIAL,
    receivedAt: '2026-05-23T08:15:00',
    notes: 'Fresh morning delivery',
  },
  {
    id: 4,
    poNumber: 'PO-0004',
    supplierId: 3,
    supplierName: 'Green Valley Farms',
    items: [
      { inventoryItemId: 3,  itemName: 'Yellow Onions',   qty: 30,  unit: 'kg',      unitPrice: 180,  total: 5400  },
      { inventoryItemId: 6,  itemName: 'Fresh Ginger',    qty: 10,  unit: 'kg',      unitPrice: 400,  total: 4000  },
      { inventoryItemId: 10, itemName: 'Spring Onions',   qty: 20,  unit: 'bunches', unitPrice: 120,  total: 2400  },
      { inventoryItemId: 15, itemName: 'Carrots',         qty: 25,  unit: 'kg',      unitPrice: 220,  total: 5500  },
    ],
    subtotal: 17300,
    paidAmount: 17300,
    paymentStatus: PO_STATUS.PAID,
    receivedAt: '2026-05-24T07:45:00',
    notes: '',
  },
  {
    id: 5,
    poNumber: 'PO-0005',
    supplierId: 4,
    supplierName: 'Ceylon Spice Traders',
    items: [
      { inventoryItemId: 5,  itemName: 'Mixed Spice Blend', qty: 15, unit: 'packets', unitPrice: 450, total: 6750 },
      { inventoryItemId: 13, itemName: 'Red Chili Powder',  qty: 10, unit: 'kg',      unitPrice: 900, total: 9000 },
    ],
    subtotal: 15750,
    paidAmount: 0,
    paymentStatus: PO_STATUS.UNPAID,
    receivedAt: '2026-05-25T10:00:00',
    notes: 'Monthly spice restock',
  },
  {
    id: 6,
    poNumber: 'PO-0006',
    supplierId: 6,
    supplierName: 'Lanka Dairy Co-op',
    items: [
      { inventoryItemId: 7,  itemName: 'Eggs',            qty: 30,  unit: 'trays',   unitPrice: 850,  total: 25500 },
    ],
    subtotal: 25500,
    paidAmount: 25500,
    paymentStatus: PO_STATUS.PAID,
    receivedAt: '2026-05-25T14:30:00',
    notes: '',
  },
  {
    id: 7,
    poNumber: 'PO-0007',
    supplierId: 7,
    supplierName: 'Golden Oil Distributors',
    items: [
      { inventoryItemId: 4,  itemName: 'Cooking Oil',     qty: 20,  unit: 'liters',  unitPrice: 650,  total: 13000 },
    ],
    subtotal: 13000,
    paidAmount: 1000,
    paymentStatus: PO_STATUS.PARTIAL,
    receivedAt: '2026-05-26T09:00:00',
    notes: '',
  },
]
