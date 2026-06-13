import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search, X, Plus, Pencil, Trash2, Eye,
  Truck, AlertTriangle, CheckCircle2, Clock,
  ShoppingCart, Package, ChevronDown, ChevronUp,
  Banknote, FileText, TrendingUp, List, LayoutGrid,
} from 'lucide-react'
import { MOCK_PURCHASE_ORDERS, PO_STATUS, PO_STATUS_LABELS } from '../../utils/mockPurchaseOrders'
import { MOCK_SUPPLIERS } from '../../utils/mockSuppliers'
import { INVENTORY_ITEMS } from '../../utils/inventoryData'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

const STATUS_OPTIONS = [
  { value: 'all',            label: 'All Statuses'  },
  { value: PO_STATUS.PAID,   label: 'Paid'          },
  { value: PO_STATUS.UNPAID, label: 'Unpaid'        },
  { value: PO_STATUS.PARTIAL,label: 'Partial'       },
]

const SUPPLIER_OPTIONS = (suppliers) => [
  { value: 'all', label: 'All Suppliers' },
  ...suppliers.map(s => ({ value: String(s.id), label: s.name })),
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRs = (n) => `Rs. ${Number(n).toLocaleString('en-LK')}`

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  [PO_STATUS.PAID]:    { icon: CheckCircle2, cls: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'  },
  [PO_STATUS.UNPAID]:  { icon: AlertTriangle, cls: 'bg-red-500/10   text-red-600   dark:text-red-400   border-red-500/20'   },
  [PO_STATUS.PARTIAL]: { icon: Clock,         cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG[PO_STATUS.UNPAID]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      text-xs font-semibold border whitespace-nowrap ${cfg.cls}`}>
      <Icon size={11} /> {PO_STATUS_LABELS[status]}
    </span>
  )
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ po, onClose }) {
  const balance = po.subtotal - po.paidAmount
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                      max-h-[90vh] flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative overflow-hidden shrink-0
                        bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600">
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">{po.poNumber}</h2>
              <p className="text-white/70 text-xs mt-0.5 truncate">{po.supplierName}</p>
            </div>
            <StatusBadge status={po.paymentStatus} />
            <button onClick={onClose} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30
                         flex items-center justify-center text-white shrink-0 ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Received</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatDateTime(po.receivedAt)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Supplier</span>
              <span className="font-semibold text-gray-900 dark:text-white">{po.supplierName}</span>
            </div>
          </div>
          {/* Items table */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/50">
                  {['Item', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold
                                           text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {po.items.map((item, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-900">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{item.itemName}</td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      {item.qty} {item.unit}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      {fmtRs(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                      {fmtRs(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Totals */}
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{fmtRs(po.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Paid</span>
              <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">{fmtRs(po.paidAmount)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-1.5">
                <span className="font-bold text-red-600 dark:text-red-400">Balance Due</span>
                <span className="font-extrabold text-red-600 dark:text-red-400 tabular-nums">{fmtRs(balance)}</span>
              </div>
            )}
          </div>
          {po.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-800 pt-3">
              Note: {po.notes}
            </p>
          )}
        </div>
        <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm border transition-colors
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ po, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]
                    flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10 border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                            bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Purchase Order</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            This will permanently remove the purchase order record. Inventory quantities will not be reversed.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700/50">
            {po.poNumber} · {po.supplierName} · {fmtRs(po.subtotal)}
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                       flex items-center justify-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
          <button onClick={onCancel}
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

// ── PO Form Modal ─────────────────────────────────────────────────────────────
// Step 1: Supplier + date + notes
// Step 2: Add items (inventory items, qty, unit price)
// Step 3: Review + payment status
function POFormModal({ suppliers, inventoryItems, nextPoNumber, onSave, onCancel }) {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [step1Err, setStep1Err] = useState('')

  // Step 2 state — line items
  const [lines, setLines] = useState([])
  const [lineItemId, setLineItemId] = useState('')
  const [lineQty, setLineQty] = useState('')
  const [linePrice, setLinePrice] = useState('')
  const [lineErr, setLineErr] = useState('')

  // Step 3 state
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(PO_STATUS.UNPAID)

  const supplierOptions = suppliers.map(s => ({ value: String(s.id), label: s.name }))
  const inventoryOptions = inventoryItems.map(i => ({
    value: String(i.id),
    label: `${i.itemName} (${i.unit})`,
  }))

  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const selectedSupplier = suppliers.find(s => String(s.id) === supplierId)

  // Auto-fill unit price when inventory item is selected
  function handleLineItemChange(id) {
    setLineItemId(id)
    const item = inventoryItems.find(i => String(i.id) === id)
    if (item) setLinePrice(String(item.unitPrice))
    setLineErr('')
  }

  function addLine() {
    if (!lineItemId) { setLineErr('Select an inventory item'); return }
    const qty = parseFloat(lineQty)
    const price = parseFloat(linePrice)
    if (!qty || qty <= 0) { setLineErr('Enter a valid quantity'); return }
    if (!price || price < 0) { setLineErr('Enter a valid unit price'); return }
    const item = inventoryItems.find(i => String(i.id) === lineItemId)
    if (lines.find(l => l.inventoryItemId === item.id)) {
      setLineErr('Item already added — edit the existing line'); return
    }
    setLines(prev => [...prev, {
      inventoryItemId: item.id,
      itemName: item.itemName,
      qty, unit: item.unit,
      unitPrice: price,
      total: Math.round(qty * price),
    }])
    setLineItemId(''); setLineQty(''); setLinePrice(''); setLineErr('')
  }

  function removeLine(id) {
    setLines(prev => prev.filter(l => l.inventoryItemId !== id))
  }

  function updateLine(id, field, val) {
    setLines(prev => prev.map(l => {
      if (l.inventoryItemId !== id) return l
      const updated = { ...l, [field]: val }
      updated.total = Math.round((parseFloat(updated.qty) || 0) * (parseFloat(updated.unitPrice) || 0))
      return updated
    }))
  }

  // Derive payment status from paid amount
  function handlePaidChange(val) {
    setPaidAmount(val)
    const paid = parseFloat(val) || 0
    if (paid <= 0) setPaymentStatus(PO_STATUS.UNPAID)
    else if (paid >= subtotal) setPaymentStatus(PO_STATUS.PAID)
    else setPaymentStatus(PO_STATUS.PARTIAL)
  }

  function handleSubmit() {
    const paid = parseFloat(paidAmount) || 0
    onSave({
      supplierId: parseInt(supplierId, 10),
      supplierName: selectedSupplier?.name ?? '',
      items: lines,
      subtotal,
      paidAmount: Math.min(paid, subtotal),
      paymentStatus,
      notes: notes.trim(),
    })
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800 border
     text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600
     focus:outline-none focus:ring-2 transition-colors
     ${err ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'}`

  const STEPS = ['Supplier', 'Items', 'Review']

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onCancel}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl border
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                      max-h-[92vh] flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative overflow-hidden shrink-0
                        bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">New Purchase Order</h2>
              <p className="text-white/70 text-xs mt-0.5">{nextPoNumber}</p>
            </div>
            <button onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30
                         flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex px-4 sm:px-5 pb-3 gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                                 ${step > i + 1 ? 'bg-white text-amber-600'
                                   : step === i + 1 ? 'bg-white/30 text-white ring-2 ring-white/60'
                                   : 'bg-white/10 text-white/40'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] font-semibold truncate
                                  ${step === i + 1 ? 'text-white' : 'text-white/50'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/20 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 min-h-0">

          {/* ── Step 1: Supplier ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Supplier <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={supplierOptions}
                  value={supplierId}
                  onChange={v => { setSupplierId(v); setStep1Err('') }}
                  placeholder="Select supplier…"
                  searchPlaceholder="Search suppliers…"
                />
                {step1Err && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10}/>{step1Err}</p>}
              </div>
              {selectedSupplier && (
                <div className="flex items-center gap-3 p-3 rounded-xl border
                                bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {selectedSupplier.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{selectedSupplier.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedSupplier.phone} · {selectedSupplier.category}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Notes (optional)
                </label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Weekly delivery, urgent restock…"
                  className={`${inputCls(false)} resize-none`} />
              </div>
            </div>
          )}

          {/* ── Step 2: Items ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Add item row */}
              <div className="p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700
                              bg-amber-50/50 dark:bg-amber-900/10 flex flex-col gap-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Add Item</p>
                <SearchableSelect
                  options={inventoryOptions}
                  value={lineItemId}
                  onChange={handleLineItemChange}
                  placeholder="Select inventory item…"
                  searchPlaceholder="Search items…"
                  clearable
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Quantity</label>
                    <input type="number" min="0" step="any" value={lineQty}
                      onChange={e => { setLineQty(e.target.value); setLineErr('') }}
                      placeholder="0" className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Unit Price (Rs.)</label>
                    <input type="number" min="0" step="any" value={linePrice}
                      onChange={e => { setLinePrice(e.target.value); setLineErr('') }}
                      placeholder="0.00" className={inputCls(false)} />
                  </div>
                </div>
                {lineErr && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={10}/>{lineErr}</p>}
                <button onClick={addLine}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold
                             bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                  <Plus size={15} /> Add to Order
                </button>
              </div>

              {/* Lines list */}
              {lines.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                  <Package size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No items added yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {lines.map(line => (
                    <div key={line.inventoryItemId}
                      className="flex items-center gap-2 p-3 rounded-xl border
                                 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{line.itemName}</p>
                        <p className="text-xs text-gray-400">{line.unit}</p>
                      </div>
                      <input type="number" min="0.1" step="any" value={line.qty}
                        onChange={e => updateLine(line.inventoryItemId, 'qty', e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg text-xs text-center tabular-nums
                                   bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                   text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400/40" />
                      <span className="text-xs text-gray-400">×</span>
                      <input type="number" min="0" step="any" value={line.unitPrice}
                        onChange={e => updateLine(line.inventoryItemId, 'unitPrice', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-lg text-xs text-right tabular-nums
                                   bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                   text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-400/40" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums w-20 text-right shrink-0">
                        {fmtRs(line.total)}
                      </span>
                      <button onClick={() => removeLine(line.inventoryItemId)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-2 rounded-xl
                                  bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Subtotal</span>
                    <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{fmtRs(subtotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Review & Payment ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              {/* Summary card */}
              <div className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedSupplier?.name}</p>
                  <span className="text-xs text-gray-400">{lines.length} item{lines.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {lines.map(l => (
                    <div key={l.inventoryItemId} className="flex justify-between">
                      <span>{l.itemName} × {l.qty} {l.unit}</span>
                      <span className="tabular-nums font-medium text-gray-700 dark:text-gray-300">{fmtRs(l.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{fmtRs(subtotal)}</span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Amount Paid Now (Rs.)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">Rs.</span>
                    <input type="number" min="0" max={subtotal} step="1" value={paidAmount}
                      onChange={e => handlePaidChange(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold
                                 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40" />
                  </div>
                  <button onClick={() => handlePaidChange(String(subtotal))}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold border
                               bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400
                               border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0">
                    Pay Full
                  </button>
                </div>
              </div>

              {/* Payment status preview */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border
                              ${paymentStatus === PO_STATUS.PAID
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : paymentStatus === PO_STATUS.PARTIAL
                                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              }`}>
                <span className={`text-xs font-bold uppercase tracking-wide
                                  ${paymentStatus === PO_STATUS.PAID ? 'text-green-700 dark:text-green-400'
                                    : paymentStatus === PO_STATUS.PARTIAL ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-red-700 dark:text-red-400'}`}>
                  {PO_STATUS_LABELS[paymentStatus]}
                </span>
                {paymentStatus !== PO_STATUS.PAID && (
                  <span className={`text-sm font-extrabold tabular-nums
                                    ${paymentStatus === PO_STATUS.PARTIAL ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                    Balance: {fmtRs(subtotal - (parseFloat(paidAmount) || 0))}
                  </span>
                )}
              </div>

              {notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">Note: {notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-800
                        bg-white dark:bg-gray-900 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                         bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => {
              if (step === 1) {
                if (!supplierId) { setStep1Err('Please select a supplier'); return }
              }
              if (step === 2 && lines.length === 0) { setLineErr('Add at least one item'); return }
              setStep(s => s + 1)
            }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         font-semibold text-sm text-white
                         bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 shadow-md hover:opacity-90">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={lines.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         font-semibold text-sm text-white disabled:opacity-40
                         bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 shadow-md hover:opacity-90">
              <CheckCircle2 size={15} /> Save Purchase Order
            </button>
          )}
          <button onClick={onCancel}
            className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                       bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true)
  setTimeout(() => { setVisible(false); setTimeout(onDone, 300) }, 3200)
  return visible ? (
    <div role="status" aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
                 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl
                 bg-green-600 text-white text-sm font-semibold
                 animate-[slideUp_0.25s_ease-out]"
      style={{ minWidth: '260px', maxWidth: '90vw' }}>
      <CheckCircle2 size={18} className="shrink-0" />
      <span>{message}</span>
    </div>
  ) : null
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const [orders, setOrders]           = useState(MOCK_PURCHASE_ORDERS)
  const [suppliers, setSuppliers]     = useState(MOCK_SUPPLIERS)
  const [inventory, setInventory]     = useState(INVENTORY_ITEMS)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage]               = useState(1)
  const [showForm, setShowForm]       = useState(false)
  const [viewTarget, setViewTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast]             = useState(null)
  const [viewMode, setViewMode]       = useState('table')

  // ── Auto-switch to grid on mobile (< 768px) ──────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setViewMode(e.matches ? 'grid' : 'table')
    if (mq.matches) setViewMode('grid')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const showToast = useCallback(msg => setToast(msg), [])

  const nextId = useMemo(() => Math.max(...orders.map(o => o.id), 0) + 1, [orders])
  const nextPoNumber = `PO-${String(nextId).padStart(4, '0')}`

  function resetPage() { setPage(1) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(o => {
      const matchSearch = !q ||
        o.poNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.items.some(i => i.itemName.toLowerCase().includes(q))
      const matchStatus = statusFilter === 'all' || o.paymentStatus === statusFilter
      const matchSupplier = supplierFilter === 'all' || String(o.supplierId) === supplierFilter
      return matchSearch && matchStatus && matchSupplier
    }).sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
  }, [orders, search, statusFilter, supplierFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalSpend   = orders.reduce((s, o) => s + o.subtotal, 0)
  const totalUnpaid  = orders.reduce((s, o) => s + (o.subtotal - o.paidAmount), 0)
  const unpaidCount  = orders.filter(o => o.paymentStatus !== PO_STATUS.PAID).length
  const hasFilter    = search || statusFilter !== 'all' || supplierFilter !== 'all'

  function handleSave({ supplierId, supplierName, items, subtotal, paidAmount, paymentStatus, notes }) {
    const now = new Date().toISOString()
    const newPO = {
      id: nextId,
      poNumber: nextPoNumber,
      supplierId, supplierName, items, subtotal, paidAmount, paymentStatus,
      receivedAt: now, notes,
    }
    setOrders(prev => [newPO, ...prev])

    // Update supplier: totalPurchases + payableAmount
    const balance = subtotal - paidAmount
    setSuppliers(prev => prev.map(s =>
      s.id === supplierId
        ? { ...s, totalPurchases: s.totalPurchases + subtotal, payableAmount: s.payableAmount + balance }
        : s
    ))

    // Update inventory: increase quantityInStock for each received item
    setInventory(prev => {
      const updated = [...prev]
      items.forEach(line => {
        const idx = updated.findIndex(i => i.id === line.inventoryItemId)
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], quantityInStock: updated[idx].quantityInStock + line.qty }
        }
      })
      return updated
    })

    setShowForm(false)
    resetPage()
    showToast(`${nextPoNumber} saved — inventory updated`)
  }

  function handleDelete(id) {
    setOrders(prev => prev.filter(o => o.id !== id))
    setDeleteTarget(null)
    resetPage()
    showToast('Purchase order deleted')
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {orders.length} orders · {unpaidCount} with outstanding balance
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shrink-0
                     bg-gradient-to-r from-amber-500 to-orange-500 text-white
                     hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20 w-full sm:w-auto">
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2
                        bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{orders.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2
                        bg-gradient-to-br from-amber-50 to-orange-50
                        dark:from-amber-500/10 dark:to-orange-500/10
                        border-amber-200 dark:border-amber-500/30">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-amber-700 dark:text-amber-400 tabular-nums truncate">{fmtRs(totalSpend)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Total Spend</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2
                        bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <Banknote size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-red-600 dark:text-red-400 tabular-nums truncate">{fmtRs(totalUnpaid)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Outstanding Balance</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3 sm:p-4 rounded-2xl border bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[180px]
                          bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Search PO#, supplier, item…" value={search}
              onChange={e => { setSearch(e.target.value); resetPage() }}
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                         text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            {search && (
              <button onClick={() => { setSearch(''); resetPage() }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            )}
          </div>
          <SearchableSelect options={STATUS_OPTIONS} value={statusFilter}
            onChange={v => { setStatusFilter(v); resetPage() }}
            placeholder="All Statuses" searchPlaceholder="Filter…"
            triggerClassName="w-36" />
          <SearchableSelect options={SUPPLIER_OPTIONS(suppliers)} value={supplierFilter}
            onChange={v => { setSupplierFilter(v); resetPage() }}
            placeholder="All Suppliers" searchPlaceholder="Search…"
            triggerClassName="w-44" />
          {hasFilter && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setSupplierFilter('all'); resetPage() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0
                         bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
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
            Showing {filtered.length} of {orders.length} orders
          </p>
        )}
      </div>

      {/* ── Data table / Card grid ── */}
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">

        {viewMode === 'grid' ? (
          /* ── Card Grid ── */
          <>
            {pageItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Package size={32} className="text-gray-300 dark:text-gray-700" />
                <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No purchase orders match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {pageItems.map(po => {
                  const balance = po.subtotal - po.paidAmount
                  return (
                    <div key={po.id}
                      className="group flex flex-col rounded-2xl border overflow-hidden
                                 bg-white dark:bg-gray-900
                                 border-gray-200 dark:border-gray-800
                                 shadow-sm hover:shadow-lg hover:-translate-y-0.5
                                 transition-all duration-200">
                      {/* Accent strip */}
                      <div className={`h-1.5 shrink-0 ${
                        po.paymentStatus === PO_STATUS.PAID
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : po.paymentStatus === PO_STATUS.PARTIAL
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-red-400 to-rose-500'
                      }`} />
                      {/* Body */}
                      <div className="flex flex-col gap-2.5 p-3.5 flex-1">
                        {/* PO # + status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-amber-500 text-sm leading-tight">{po.poNumber}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                              {formatDate(po.receivedAt)}
                            </p>
                          </div>
                          <StatusBadge status={po.paymentStatus} />
                        </div>
                        {/* Supplier */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {po.supplierName.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {po.supplierName}
                          </p>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
                            <p className="font-extrabold text-gray-900 dark:text-white tabular-nums">{fmtRs(po.subtotal)}</p>
                          </div>
                          <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-xl
                                          ${balance > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">
                              {balance > 0 ? 'Balance' : 'Paid'}
                            </p>
                            <p className={`font-extrabold tabular-nums
                                          ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {balance > 0 ? fmtRs(balance) : fmtRs(po.paidAmount)}
                            </p>
                          </div>
                        </div>
                        {/* Items count */}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                          {po.notes ? ` · ${po.notes}` : ''}
                        </p>
                      </div>
                      {/* Footer actions */}
                      <div className="flex border-t border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800">
                        <button onClick={() => setViewTarget(po)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                     text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                                     hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => setDeleteTarget(po)}
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
            )}
          </>
        ) : (
          /* ── Table View ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50">
                  {['PO #', 'Date', 'Supplier', 'Items', 'Total', 'Paid', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center">
                      <Package size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No purchase orders match your filters</p>
                    </td>
                  </tr>
                ) : pageItems.map(po => (
                  <tr key={po.id}
                    className="bg-white dark:bg-gray-900 hover:bg-amber-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 dark:text-white">{po.poNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                      {formatDate(po.receivedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {po.supplierName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{po.supplierName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 tabular-nums">
                      {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                      {fmtRs(po.subtotal)}
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      <span className={`font-semibold ${po.paidAmount >= po.subtotal ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {fmtRs(po.paidAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={po.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewTarget(po)} title="View"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(po)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ModernPagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <POFormModal
          suppliers={suppliers}
          inventoryItems={inventory}
          nextPoNumber={nextPoNumber}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
      {viewTarget && <ViewModal po={viewTarget} onClose={() => setViewTarget(null)} />}
      {deleteTarget && (
        <DeleteModal
          po={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
