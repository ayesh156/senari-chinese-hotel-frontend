import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search, X, Pencil, PackagePlus, Trash2,
  CheckCircle2, AlertTriangle, XCircle,
  Archive, Plus, Minus, Banknote,
  List, LayoutGrid, ChevronUp, ChevronDown,
} from 'lucide-react'
import {
  INVENTORY_ITEMS,
  ADJUSTMENT_REASONS,
  getStockStatus,
  getStockValue,
  getTotalInventoryValue,
  STOCK_STATUS,
  STOCK_STATUS_LABELS,
} from '../../utils/inventoryData'
import { useMasterDataStore, buildSelectOptions } from '../../utils/masterDataStore'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'

// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: STOCK_STATUS.LOW, label: 'Low Stock' },
  { value: STOCK_STATUS.OUT, label: 'Out of Stock' },
]

const REASON_OPTIONS = ADJUSTMENT_REASONS.map(r => ({ value: r.value, label: r.label }))

const EMPTY_ITEM = {
  itemName: '',
  sku: '',
  category: '',
  quantityInStock: '0',
  unit: '',
  minAlertLevel: '10',
  unitPrice: '',
}

const CAT_COLORS = {
  Meat:       'bg-red-500/10    text-red-600    dark:text-red-400    border-red-500/20',
  Seafood:    'bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20',
  Vegetables: 'bg-green-500/10  text-green-600  dark:text-green-400  border-green-500/20',
  Groceries:  'bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20',
  Dairy:      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Spices:     'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Oils:       'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
}

const STATUS_BADGE = {
  [STOCK_STATUS.IN]: {
    label: STOCK_STATUS_LABELS[STOCK_STATUS.IN],
    icon: CheckCircle2,
    cls: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  [STOCK_STATUS.LOW]: {
    label: STOCK_STATUS_LABELS[STOCK_STATUS.LOW],
    icon: AlertTriangle,
    cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  [STOCK_STATUS.OUT]: {
    label: STOCK_STATUS_LABELS[STOCK_STATUS.OUT],
    icon: XCircle,
    cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
function formatQty(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function formatCurrency(n) {
  return `Rs. ${Math.round(n).toLocaleString('en-LK')}`
}

function CategoryPill({ category }) {
  const cls = CAT_COLORS[category] ??
    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-medium border ${cls}`}>
      {category}
    </span>
  )
}

function StatusBadge({ item }) {
  const status = getStockStatus(item)
  const cfg = STATUS_BADGE[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      text-xs font-semibold border whitespace-nowrap ${cfg.cls}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
                 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl
                 bg-green-600 text-white text-sm font-semibold
                 animate-[slideUp_0.25s_ease-out]"
      style={{ minWidth: '260px', maxWidth: '90vw' }}
    >
      <CheckCircle2 size={18} className="shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmationModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]
                    flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b
                        bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10
                        border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                            bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Item</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            This will permanently remove the ingredient from your inventory records.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white
                        bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            {item.itemName} · {item.sku}
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button type="button" onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                       transition-all flex items-center justify-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                       bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function InventoryFormModal({ initialItem, categoryOptions, unitOptions, onSave, onCancel }) {
  const isEdit = Boolean(initialItem?.id)

  const [form, setForm] = useState(() => ({
    itemName:        initialItem?.itemName        ?? EMPTY_ITEM.itemName,
    sku:             initialItem?.sku             ?? EMPTY_ITEM.sku,
    category:        initialItem?.category        ?? EMPTY_ITEM.category,
    quantityInStock: String(initialItem?.quantityInStock ?? EMPTY_ITEM.quantityInStock),
    unit:            initialItem?.unit            ?? EMPTY_ITEM.unit,
    minAlertLevel:   String(initialItem?.minAlertLevel ?? EMPTY_ITEM.minAlertLevel),
    unitPrice:       initialItem?.unitPrice != null ? String(initialItem.unitPrice) : EMPTY_ITEM.unitPrice,
  }))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEdit) {
      setForm(f => ({
        ...f,
        category: f.category || categoryOptions[0]?.value || '',
        unit:     f.unit     || unitOptions[0]?.value     || '',
      }))
    }
  }, [isEdit, categoryOptions, unitOptions])

  const set = key => val => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm
     bg-white dark:bg-gray-800 border text-gray-900 dark:text-white
     placeholder:text-gray-400 dark:placeholder:text-gray-500
     focus:outline-none focus:ring-2 transition-colors
     ${hasErr
       ? 'border-red-400 focus:ring-red-400/30'
       : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
     }`

  function validate() {
    const e = {}
    if (!form.itemName.trim()) e.itemName = 'Item name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.unit.trim()) e.unit = 'Unit is required'
    const qty = parseFloat(form.quantityInStock)
    const min = parseFloat(form.minAlertLevel)
    const price = parseFloat(form.unitPrice)
    if (Number.isNaN(qty) || qty < 0) e.quantityInStock = 'Enter a valid quantity'
    if (Number.isNaN(min) || min < 0) e.minAlertLevel = 'Enter a valid alert level'
    if (Number.isNaN(price) || price < 0) e.unitPrice = 'Enter a valid unit price'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      itemName:        form.itemName.trim(),
      sku:             form.sku.trim(),
      category:        form.category,
      quantityInStock: parseFloat(form.quantityInStock),
      unit:            form.unit.trim(),
      minAlertLevel:   parseFloat(form.minAlertLevel),
      unitPrice:       parseFloat(form.unitPrice),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onCancel}>
      <div
        className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border
                   bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                   max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative overflow-hidden shrink-0 sticky top-0 z-10
                        bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              {isEdit ? <Pencil size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {isEdit ? 'Edit Item' : 'Add New Item'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5 truncate">
                {isEdit ? initialItem.sku : 'Register a raw ingredient'}
              </p>
            </div>
            <button type="button" onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30
                         flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                Item Name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.itemName} onChange={e => set('itemName')(e.target.value)}
                autoFocus className={inputCls(!!errors.itemName)} />
              {errors.itemName && <p className="text-xs text-red-500 mt-1">{errors.itemName}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  SKU <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.sku} onChange={e => set('sku')(e.target.value)}
                  className={inputCls(!!errors.sku)} />
                {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={categoryOptions}
                  value={form.category}
                  onChange={set('category')}
                  placeholder="Select…"
                  searchPlaceholder="Search…"
                />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Quantity <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" step="any" value={form.quantityInStock}
                  onChange={e => set('quantityInStock')(e.target.value)}
                  className={inputCls(!!errors.quantityInStock)} />
                {errors.quantityInStock && <p className="text-xs text-red-500 mt-1">{errors.quantityInStock}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Unit <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={unitOptions}
                  value={form.unit}
                  onChange={set('unit')}
                  placeholder="Select unit…"
                  searchPlaceholder="Search units…"
                />
                {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Unit Price <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" step="any" value={form.unitPrice}
                  onChange={e => set('unitPrice')(e.target.value)}
                  placeholder="Rs." className={inputCls(!!errors.unitPrice)} />
                {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Min Alert <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" step="any" value={form.minAlertLevel}
                  onChange={e => set('minAlertLevel')(e.target.value)}
                  className={inputCls(!!errors.minAlertLevel)} />
                {errors.minAlertLevel && <p className="text-xs text-red-500 mt-1">{errors.minAlertLevel}</p>}
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex gap-3 shrink-0 sticky bottom-0 z-10
                          border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900">
            <button type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         font-semibold text-sm text-white
                         bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 shadow-md hover:opacity-90">
              {isEdit ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Add Item</>}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                         bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function AdjustStockModal({ item, onApply, onCancel }) {
  const [mode, setMode] = useState('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [error, setError] = useState('')
  const [reasonError, setReasonError] = useState('')

  const parsed = parseFloat(amount)
  const current = item.quantityInStock
  const preview = mode === 'add'
    ? current + (Number.isNaN(parsed) ? 0 : parsed)
    : current - (Number.isNaN(parsed) ? 0 : parsed)

  function resolveReason() {
    if (!reason) return ''
    if (reason === 'Other') return otherReason.trim()
    return reason
  }

  function handleSubmit(e) {
    e.preventDefault()
    const resolvedReason = resolveReason()
    if (!reason) {
      setReasonError('Select a reason for this adjustment')
      return
    }
    if (reason === 'Other' && !otherReason.trim()) {
      setReasonError('Please specify the reason')
      return
    }
    setReasonError('')
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError('Enter a positive amount')
      return
    }
    const next = mode === 'add' ? current + parsed : current - parsed
    if (next < 0) {
      setError(`Cannot remove more than ${formatQty(current)} ${item.unit}`)
      return
    }
    onApply(next, resolvedReason)
  }

  const inputCls =
    `w-full px-3 py-2.5 rounded-xl text-sm text-center tabular-nums
     bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
     text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40`

  const textInputCls =
    `w-full px-3 py-2.5 rounded-xl text-sm
     bg-white dark:bg-gray-800 border text-gray-900 dark:text-white
     focus:outline-none focus:ring-2 focus:ring-amber-400/40
     border-gray-200 dark:border-gray-700
     ${reasonError ? 'border-red-400' : ''}`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onCancel}>
      <div
        className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border
                   bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                   max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative overflow-hidden shrink-0 sticky top-0 z-10
                        bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600">
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <PackagePlus size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">Adjust Stock</h2>
              <p className="text-white/70 text-xs mt-0.5 truncate">{item.itemName}</p>
            </div>
            <button type="button" onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30
                         flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          <div className="p-4 rounded-xl border text-center
                          bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current stock</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatQty(current)} <span className="text-base font-medium text-gray-500">{item.unit}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Value: {formatCurrency(getStockValue(item))} · Alert at ≤ {formatQty(item.minAlertLevel)} {item.unit}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <SearchableSelect
              options={REASON_OPTIONS}
              value={reason}
              onChange={v => { setReason(v); setReasonError('') }}
              placeholder="Select reason…"
              searchPlaceholder="Search reasons…"
            />
            {reason === 'Other' && (
              <input
                type="text"
                value={otherReason}
                onChange={e => { setOtherReason(e.target.value); setReasonError('') }}
                placeholder="Describe the reason…"
                className={`${textInputCls} mt-2`}
              />
            )}
            {reasonError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={10} /> {reasonError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'add', label: 'Add Stock', icon: Plus },
              { id: 'remove', label: 'Remove', icon: Minus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setMode(id); setError('') }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all
                           ${mode === id
                             ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                             : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                           }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5 text-center">
              Amount ({item.unit})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              placeholder="0"
              className={inputCls}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5 text-center flex items-center justify-center gap-1">
                <AlertTriangle size={10} /> {error}
              </p>
            )}
          </div>

          {!Number.isNaN(parsed) && parsed > 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              New balance:{' '}
              <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                {formatQty(Math.max(0, preview))} {item.unit}
              </span>
              {' '}· Value:{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(Math.max(0, preview) * item.unitPrice)}
              </span>
            </p>
          )}

          </div>
          <div className="flex gap-3 p-4 sm:p-5 pt-2 shrink-0 sticky bottom-0 z-10
                          border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900">
            <button type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         font-semibold text-sm text-white
                         bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 shadow-md hover:opacity-90">
              <PackagePlus size={15} /> Apply
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                         bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const inventoryCategories = useMasterDataStore(s => s.inventoryCategories)
  const units = useMasterDataStore(s => s.units)
  const categoryOptions = useMemo(
    () => buildSelectOptions(inventoryCategories),
    [inventoryCategories],
  )
  const unitOptions = useMemo(() => buildSelectOptions(units), [units])

  const [items, setItems] = useState(INVENTORY_ITEMS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formTarget, setFormTarget] = useState(null)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [sortKey, setSortKey] = useState('itemName')

  // ── Auto-switch to grid on mobile (< 768px) ──────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setViewMode(e.matches ? 'grid' : 'table')
    if (mq.matches) setViewMode('grid')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  const [sortDir, setSortDir] = useState('asc')

  const showToast = useCallback((message) => setToast(message), [])
  const dismissToast = useCallback(() => setToast(null), [])

  const nextId = useMemo(
    () => (items.length ? Math.max(...items.map(i => i.id)) : 0) + 1,
    [items],
  )

  const statusCounts = useMemo(() => {
    const counts = { [STOCK_STATUS.IN]: 0, [STOCK_STATUS.LOW]: 0, [STOCK_STATUS.OUT]: 0 }
    items.forEach(i => { counts[getStockStatus(i)]++ })
    return counts
  }, [items])

  const totalInventoryValue = useMemo(() => getTotalInventoryValue(items), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter(i => {
        const matchSearch = !q || i.itemName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        const status = getStockStatus(i)
        const matchStatus = statusFilter === 'all' || status === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey]
        if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ?  1 : -1
        return 0
      })
  }, [items, search, statusFilter, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="text-amber-500" />
      : <ChevronDown size={12} className="text-amber-500" />
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetPage() { setPage(1) }

  function handleSaveForm(updates) {
    if (formTarget?.id) {
      setItems(prev => prev.map(i => i.id === formTarget.id ? { ...i, ...updates } : i))
      showToast(`"${updates.itemName}" updated`)
    } else {
      setItems(prev => [...prev, { id: nextId, ...updates }])
      showToast(`"${updates.itemName}" added to inventory`)
    }
    setFormTarget(null)
  }

  function handleDelete(id) {
    const name = deleteTarget?.itemName
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleteTarget(null)
    showToast(name ? `"${name}" removed from inventory` : 'Item removed')
    resetPage()
  }

  function handleAdjustStock(id, newQty, reason) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantityInStock: newQty } : i))
    setAdjustTarget(null)
    showToast(`Stock adjusted for ${reason}`)
  }

  const hasFilter = search || statusFilter !== 'all'

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {items.length} ingredients · {formatCurrency(totalInventoryValue)} total value
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormTarget({})}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shrink-0
                     bg-gradient-to-r from-amber-500 to-orange-500 text-white
                     hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20 w-full sm:w-auto"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* ── Summary pills ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { status: STOCK_STATUS.IN,  count: statusCounts[STOCK_STATUS.IN]  },
          { status: STOCK_STATUS.LOW, count: statusCounts[STOCK_STATUS.LOW] },
          { status: STOCK_STATUS.OUT, count: statusCounts[STOCK_STATUS.OUT] },
        ].map(({ status, count }) => {
          const cfg = STATUS_BADGE[status]
          const Icon = cfg.icon
          const isActive = statusFilter === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => { setStatusFilter(isActive ? 'all' : status); resetPage() }}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2
                         transition-all duration-150 active:scale-[0.98] min-w-0
                         ${isActive
                           ? `${cfg.cls} border-current ring-2 ring-amber-500/30`
                           : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                         }`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0
                              ${status === STOCK_STATUS.IN ? 'bg-green-500' : status === STOCK_STATUS.LOW ? 'bg-amber-500' : 'bg-red-500'}`}>
                <Icon size={14} className="text-white sm:hidden" />
                <Icon size={16} className="text-white hidden sm:block" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">
                  {count}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{cfg.label}</p>
              </div>
            </button>
          )
        })}

        <div className="col-span-2 lg:col-span-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2
                        bg-gradient-to-br from-amber-50 to-orange-50
                        dark:from-amber-500/10 dark:to-orange-500/10
                        border-amber-200 dark:border-amber-500/30 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-500">
            <Banknote size={16} className="text-white" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-base sm:text-lg font-extrabold text-amber-700 dark:text-amber-400 leading-tight tabular-nums truncate">
              {formatCurrency(totalInventoryValue)}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
              Total Inventory Value
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-3 sm:p-4 rounded-2xl border
                      bg-white dark:bg-gray-800/30
                      border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px]
                          bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            <Search size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage() }}
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                         text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); resetPage() }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          <SearchableSelect
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={v => { setStatusFilter(v); resetPage() }}
            placeholder="All Stock"
            searchPlaceholder="Filter status…"
            triggerClassName="w-40 sm:w-44"
          />

          {hasFilter && (
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter('all'); resetPage() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <X size={12} /> Clear
            </button>
          )}

          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 ml-auto">
            {[{ id: 'table', Icon: List }, { id: 'grid', Icon: LayoutGrid }].map(({ id, Icon }) => (
              <button key={id} onClick={() => setViewMode(id)} aria-label={`${id} view`}
                className={`p-2 rounded-lg transition-all duration-150
                           ${viewMode === id
                             ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                             : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {hasFilter && (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            Showing {filtered.length} of {items.length} items
          </p>
        )}
      </div>

      {/* ── Data table / Card grid ── */}
      <div className="rounded-2xl border overflow-hidden
                      bg-white dark:bg-gray-900
                      border-gray-200 dark:border-gray-800">

        {viewMode === 'grid' ? (
          /* ── Card Grid ── */
          pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Archive size={32} className="text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No items match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {pageItems.map(item => {
                const status = getStockStatus(item)
                const cfg = STATUS_BADGE[status]
                const Icon = cfg.icon
                return (
                  <div key={item.id}
                    className="group flex flex-col rounded-2xl border overflow-hidden
                               bg-white dark:bg-gray-800/50
                               border-gray-200 dark:border-gray-700
                               shadow-sm hover:shadow-lg hover:-translate-y-0.5
                               transition-all duration-200">
                    <div className={`px-4 py-3 flex items-center justify-between
                                    ${status === STOCK_STATUS.IN ? 'bg-green-50 dark:bg-green-900/20' :
                                      status === STOCK_STATUS.LOW ? 'bg-amber-50 dark:bg-amber-900/20' :
                                      'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.itemName}</p>
                        <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">{item.sku}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ml-2
                                      ${status === STOCK_STATUS.IN ? 'bg-green-500' :
                                        status === STOCK_STATUS.LOW ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <Icon size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-3 flex-1">
                      <CategoryPill category={item.category} />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-400 dark:text-gray-500">Stock</p>
                          <p className="font-bold text-gray-900 dark:text-white tabular-nums">
                            {formatQty(item.quantityInStock)} <span className="font-normal text-gray-500">{item.unit}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 dark:text-gray-500">Value</p>
                          <p className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            {formatCurrency(getStockValue(item))}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       text-xs font-semibold border self-start ${cfg.cls}`}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </div>
                    <div className="flex border-t border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
                      <button onClick={() => setAdjustTarget(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                   text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                                   hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                        <PackagePlus size={13} /> Adjust
                      </button>
                      <button onClick={() => setFormTarget(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                   text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400
                                   hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                   text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
        /* ── Table View ── */
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Stock Level
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Stock Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 pr-5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Archive size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                    <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
                      No items match your filters
                    </p>
                  </td>
                </tr>
              ) : (
                pageItems.map(item => (
                  <tr key={item.id}
                    className="transition-colors bg-white dark:bg-gray-900
                               hover:bg-amber-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                        {item.sku} · {formatCurrency(item.unitPrice)}/{item.unit}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryPill category={item.category} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatQty(item.quantityInStock)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="font-bold tabular-nums text-amber-700 dark:text-amber-400">
                        {formatCurrency(getStockValue(item))}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge item={item} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setAdjustTarget(item)}
                          aria-label={`Adjust stock for ${item.itemName}`}
                          title="Adjust Stock"
                          className="p-2 rounded-xl transition-colors
                                     text-gray-400 dark:text-gray-500
                                     hover:text-blue-600 dark:hover:text-blue-400
                                     hover:bg-blue-50 dark:hover:bg-blue-500/10"
                        >
                          <PackagePlus size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormTarget(item)}
                          aria-label={`Edit ${item.itemName}`}
                          title="Edit"
                          className="p-2 rounded-xl transition-colors
                                     text-gray-400 dark:text-gray-500
                                     hover:text-amber-600 dark:hover:text-amber-400
                                     hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Delete ${item.itemName}`}
                          title="Delete"
                          className="p-2 rounded-xl transition-colors
                                     text-gray-400 dark:text-gray-500
                                     hover:text-red-600 dark:hover:text-red-400
                                     hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        <ModernPagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={PAGE_SIZE}
          onPageChange={p => setPage(p)}
        />

        {totalPages <= 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {filtered.length} of {items.length} items · Stock value = qty × unit price
            </p>
          </div>
        )}
      </div>

      {formTarget !== null && (
        <InventoryFormModal
          initialItem={formTarget}
          categoryOptions={categoryOptions}
          unitOptions={unitOptions}
          onSave={handleSaveForm}
          onCancel={() => setFormTarget(null)}
        />
      )}

      {adjustTarget && (
        <AdjustStockModal
          item={adjustTarget}
          onApply={(qty, reason) => handleAdjustStock(adjustTarget.id, qty, reason)}
          onCancel={() => setAdjustTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmationModal
          item={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <Toast message={toast} onDone={dismissToast} />}
    </div>
  )
}
