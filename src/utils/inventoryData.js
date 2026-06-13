/**
 * Mock raw-ingredient inventory for the POS Inventory module.
 * Replace with API data when backend is ready.
 */

/** @deprecated Use `useMasterDataStore` — inventory categories are managed in Master Data. */
export const INVENTORY_CATEGORIES = [
  'Meat', 'Seafood', 'Vegetables', 'Groceries', 'Dairy', 'Spices', 'Oils',
]

export const ADJUSTMENT_REASONS = [
  { value: 'New Delivery',              label: 'New Delivery' },
  { value: 'Daily Usage',             label: 'Daily Usage' },
  { value: 'Damage/Waste',            label: 'Damage / Waste' },
  { value: 'Inventory Count Correction', label: 'Inventory Count Correction' },
  { value: 'Other',                   label: 'Other (specify)' },
]

export const INVENTORY_ITEMS = [
  { id:  1, itemName: 'Basmati Rice',       sku: 'GRN-001', category: 'Groceries',   quantityInStock: 45,  unit: 'kg',      minAlertLevel: 20, unitPrice: 350  },
  { id:  2, itemName: 'Chicken Breast',    sku: 'MT-001',  category: 'Meat',        quantityInStock: 8,   unit: 'kg',      minAlertLevel: 15, unitPrice: 1200 },
  { id:  3, itemName: 'Yellow Onions',     sku: 'VEG-001', category: 'Vegetables',  quantityInStock: 0,   unit: 'kg',      minAlertLevel: 10, unitPrice: 180  },
  { id:  4, itemName: 'Cooking Oil',       sku: 'OIL-001', category: 'Oils',        quantityInStock: 12,  unit: 'liters',  minAlertLevel: 5,  unitPrice: 650  },
  { id:  5, itemName: 'Mixed Spice Blend', sku: 'SPC-001', category: 'Spices',      quantityInStock: 3,   unit: 'packets', minAlertLevel: 10, unitPrice: 450  },
  { id:  6, itemName: 'Fresh Ginger',      sku: 'VEG-002', category: 'Vegetables',  quantityInStock: 5,   unit: 'kg',      minAlertLevel: 8,  unitPrice: 400  },
  { id:  7, itemName: 'Eggs',              sku: 'DRY-001', category: 'Dairy',       quantityInStock: 0,   unit: 'trays',   minAlertLevel: 20, unitPrice: 850  },
  { id:  8, itemName: 'Soy Sauce',         sku: 'GRN-002', category: 'Groceries',   quantityInStock: 24,  unit: 'bottles', minAlertLevel: 10, unitPrice: 320  },
  { id:  9, itemName: 'Prawns',            sku: 'SF-001',  category: 'Seafood',     quantityInStock: 6,   unit: 'kg',      minAlertLevel: 10, unitPrice: 2800 },
  { id: 10, itemName: 'Spring Onions',     sku: 'VEG-003', category: 'Vegetables',  quantityInStock: 15,  unit: 'bunches', minAlertLevel: 5,  unitPrice: 120  },
  { id: 11, itemName: 'Garlic',            sku: 'VEG-004', category: 'Vegetables',  quantityInStock: 4,   unit: 'kg',      minAlertLevel: 8,  unitPrice: 500  },
  { id: 12, itemName: 'Coconut Milk',      sku: 'GRN-003', category: 'Groceries',   quantityInStock: 0,   unit: 'cans',    minAlertLevel: 12, unitPrice: 280  },
  { id: 13, itemName: 'Red Chili Powder',  sku: 'SPC-002', category: 'Spices',      quantityInStock: 18,  unit: 'kg',      minAlertLevel: 5,  unitPrice: 900  },
  { id: 14, itemName: 'Beef Mince',        sku: 'MT-002',  category: 'Meat',        quantityInStock: 2,   unit: 'kg',      minAlertLevel: 8,  unitPrice: 1500 },
  { id: 15, itemName: 'Carrots',           sku: 'VEG-005', category: 'Vegetables',  quantityInStock: 22,  unit: 'kg',      minAlertLevel: 10, unitPrice: 220  },
  { id: 16, itemName: 'Firm Tofu',         sku: 'GRN-004', category: 'Groceries',   quantityInStock: 0,   unit: 'blocks',  minAlertLevel: 6,  unitPrice: 350  },
  { id: 17, itemName: 'Fish Sauce',        sku: 'GRN-005', category: 'Groceries',   quantityInStock: 9,   unit: 'liters',  minAlertLevel: 4,  unitPrice: 480  },
  { id: 18, itemName: 'Bell Peppers',      sku: 'VEG-006', category: 'Vegetables',  quantityInStock: 7,   unit: 'kg',      minAlertLevel: 10, unitPrice: 650  },
]

export const STOCK_STATUS = {
  IN:  'in',
  LOW: 'low',
  OUT: 'out',
}

/** Derive display status from quantity and minimum alert threshold. */
export function getStockStatus({ quantityInStock, minAlertLevel }) {
  if (quantityInStock <= 0) return STOCK_STATUS.OUT
  if (quantityInStock <= minAlertLevel) return STOCK_STATUS.LOW
  return STOCK_STATUS.IN
}

export const STOCK_STATUS_LABELS = {
  [STOCK_STATUS.IN]:  'In Stock',
  [STOCK_STATUS.LOW]: 'Low Stock',
  [STOCK_STATUS.OUT]: 'Out of Stock',
}

/** Live stock value: quantity × unit price. */
export function getStockValue(item) {
  return item.quantityInStock * item.unitPrice
}

/** Sum stock value across all items. */
export function getTotalInventoryValue(items) {
  return items.reduce((sum, item) => sum + getStockValue(item), 0)
}
