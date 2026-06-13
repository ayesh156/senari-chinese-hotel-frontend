import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, X, Plus, Pencil, Trash2,
  Truck, AlertTriangle, CheckCircle2, Banknote,
  TrendingUp, Package, List, LayoutGrid,
} from 'lucide-react'
import { MOCK_SUPPLIERS, SUPPLIER_CATEGORIES } from '../../utils/mockSuppliers'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'

// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

const PAYABLE_FILTER_OPTIONS = [
  { value: 'all',      label: 'All Suppliers'    },
  { value: 'payable',  label: 'With Payables'    },
  { value: 'settled',  label: 'Fully Settled'    },
]

const CATEGORY_OPTIONS = SUPPLIER_CATEGORIES.map(c => ({ value: c, label: c }))

const CAT_COLORS = {
  Vegetables: 'bg-green-500/10  text-green-600  dark:text-green-400  border-green-500/20',
  Meat:       'bg-red-500/10    text-red-600    dark:text-red-400    border-red-500/20',
  Seafood:    'bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20',
  Groceries:  'bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20',
  Spices:     'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Dairy:      'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Oils:       'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Packaging:  'bg-gray-500/10   text-gray-600   dark:text-gray-400   border-gray-500/20',
}

function CategoryPill({ category }) {
  const cls = CAT_COLORS[category] ??
    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {category}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function SupplierFormModal({ initialData, onSave, onCancel }) {
  const isEdit = Boolean(initialData?.id)

  const [name,     setName]     = useState(initialData?.name     ?? '')
  const [phone,    setPhone]    = useState(initialData?.phone    ?? '')
  const [email,    setEmail]    = useState(initialData?.email    ?? '')
  const [address,  setAddress]  = useState(initialData?.address  ?? '')
  const [category, setCategory] = useState(initialData?.category ?? SUPPLIER_CATEGORIES[0])
  const [errors,   setErrors]   = useState({})

  function validate() {
    const e = {}
    if (!name.trim())  e.name  = 'Supplier name is required.'
    if (!phone.trim()) e.phone = 'Phone number is required.'
    if (!category)     e.category = 'Category is required.'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email address.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      name:    name.trim(),
      phone:   phone.trim(),
      email:   email.trim(),
      address: address.trim(),
      category,
    })
  }

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm
     bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100
     placeholder:text-gray-400 dark:placeholder:text-gray-600
     focus:outline-none focus:ring-2 transition-colors
     ${hasErr
       ? 'border-red-400 focus:ring-red-400/30'
       : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
     }`

  const FieldLabel = ({ children }) => (
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
      {children}
    </label>
  )

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onCancel}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl border
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                      max-h-[90vh] flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className={`relative overflow-hidden shrink-0 sticky top-0 z-10
                         ${isEdit
                           ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-teal-600'
                           : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                         }`}>
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <Truck size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {isEdit ? `Edit — ${initialData.name}` : 'Add New Supplier'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {isEdit ? 'Update supplier details' : 'Register a vendor for purchases'}
              </p>
            </div>
            <button type="button" onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel>Supplier Name <span className="text-red-400">*</span></FieldLabel>
                <input type="text" value={name} autoFocus
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                  placeholder="e.g. Perera Groceries" className={inputCls(!!errors.name)} />
                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10} />{errors.name}</p>}
              </div>
              <div>
                <FieldLabel>Phone <span className="text-red-400">*</span></FieldLabel>
                <input type="tel" value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                  placeholder="077 123 4567" className={inputCls(!!errors.phone)} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <FieldLabel>Category <span className="text-red-400">*</span></FieldLabel>
                <SearchableSelect options={CATEGORY_OPTIONS} value={category}
                  onChange={v => { setCategory(v); setErrors(p => ({ ...p, category: '' })) }}
                  placeholder="Select…" searchPlaceholder="Search…" />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                  placeholder="supplier@example.com" className={inputCls(!!errors.email)} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Address</FieldLabel>
                <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Full address…" className={`${inputCls(false)} resize-none`} />
              </div>
            </div>
          </div>

          <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900 flex gap-3 sticky bottom-0 z-10">
            <button type="submit"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md hover:opacity-90
                         ${isEdit
                           ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20'
                           : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20'
                         }`}>
              {isEdit ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Add Supplier</>}
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

function DeleteModal({ supplier, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10 border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Supplier</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            This action cannot be undone. The supplier record will be permanently removed.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700/50">
            {supplier.name} · {supplier.phone}
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button type="button" onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                       flex items-center justify-center gap-2">
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

function SettlePaymentModal({ supplier, onConfirm, onCancel }) {
  const maxPayable = supplier.payableAmount
  const [amount, setAmount] = useState(String(maxPayable))
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 50)
  }, [])

  const parsed = parseFloat(amount) || 0
  const isPartial = parsed > 0 && parsed < maxPayable
  const remaining = Math.max(0, maxPayable - parsed)

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount.trim() || parsed <= 0) { setError('Enter a payment amount greater than 0.'); return }
    if (parsed > maxPayable) {
      setError(`Cannot exceed payable of Rs. ${maxPayable.toLocaleString('en-LK')}.`)
      return
    }
    onConfirm(parsed)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                      max-h-[90vh] flex flex-col">
        <div className="p-5 border-b shrink-0 bg-gradient-to-r from-green-50 to-emerald-50
                        dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-700/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-500/20">
              <Banknote size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settle Payment</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{supplier.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl
                            bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Payable to Supplier
              </span>
              <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">
                Rs. {maxPayable.toLocaleString('en-LK')}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Payment Amount
                </label>
                <button type="button" onClick={() => { setAmount(String(maxPayable)); setError('') }}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400
                             bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                  Pay Full
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 pointer-events-none">Rs.</span>
                <input ref={inputRef} type="number" min="1" max={maxPayable} step="1" value={amount}
                  onChange={e => { setAmount(e.target.value); setError('') }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold
                             bg-white dark:bg-gray-800 border text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2
                             ${error ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-green-400/40'}`}
                />
              </div>
              {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}
            </div>

            {parsed > 0 && parsed <= maxPayable && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border
                              ${isPartial
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              }`}>
                <span className={`text-xs font-bold uppercase tracking-wide
                                  ${isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isPartial ? 'Remaining Payable' : 'Fully Paid ✓'}
                </span>
                <span className={`text-sm font-extrabold tabular-nums
                                  ${isPartial ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isPartial ? `Rs. ${remaining.toLocaleString('en-LK')}` : 'Rs. 0'}
                </span>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white
                         bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/20
                         flex items-center justify-center gap-2 hover:opacity-90">
              <CheckCircle2 size={15} /> Confirm Payment
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
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS)
  const [search, setSearch] = useState('')
  const [payableFilter, setPayableFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formTarget, setFormTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [settleTarget, setSettleTarget] = useState(null)
  const [viewMode, setViewMode] = useState('table')

  // ── Auto-switch to grid on mobile (< 768px) ──────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setViewMode(e.matches ? 'grid' : 'table')
    if (mq.matches) setViewMode('grid')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const nextId = useMemo(() => Math.max(...suppliers.map(s => s.id), 0) + 1, [suppliers])

  function resetPage() { setPage(1) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers.filter(s => {
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      const matchPayable =
        payableFilter === 'all' ? true :
        payableFilter === 'payable' ? s.payableAmount > 0 :
        s.payableAmount === 0
      return matchSearch && matchPayable
    })
  }, [suppliers, search, payableFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalPayable = suppliers.reduce((sum, s) => sum + s.payableAmount, 0)
  const withPayableCount = suppliers.filter(s => s.payableAmount > 0).length
  const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)
  const hasAnyFilter = search || payableFilter !== 'all'

  function handleSave({ name, phone, email, address, category }) {
    if (formTarget?.id) {
      setSuppliers(prev => prev.map(s =>
        s.id === formTarget.id ? { ...s, name, phone, email, address, category } : s
      ))
    } else {
      setSuppliers(prev => [{
        id: nextId, name, phone, email, address, category,
        totalPurchases: 0, payableAmount: 0,
      }, ...prev])
      resetPage()
    }
    setFormTarget(null)
  }

  function handleDelete(id) {
    setSuppliers(prev => prev.filter(s => s.id !== id))
    setDeleteTarget(null)
    resetPage()
  }

  function handleSettle(id, paymentAmount) {
    setSuppliers(prev => prev.map(s =>
      s.id === id ? { ...s, payableAmount: Math.max(0, s.payableAmount - paymentAmount) } : s
    ))
    setSettleTarget(null)
  }

  function clearAll() {
    setSearch('')
    setPayableFilter('all')
    resetPage()
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {suppliers.length} vendors · {withPayableCount} with outstanding payables
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {totalPayable > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0
                            bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Total Payable:</span>
              <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">
                Rs. {totalPayable.toLocaleString('en-LK')}
              </span>
            </div>
          )}
          <button type="button" onClick={() => setFormTarget({})}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shrink-0
                       bg-gradient-to-r from-amber-500 to-orange-500 text-white
                       hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20 w-full sm:w-auto">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2
                        bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Truck size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{suppliers.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Suppliers</p>
          </div>
        </div>
        <button type="button"
          onClick={() => { setPayableFilter(payableFilter === 'payable' ? 'all' : 'payable'); resetPage() }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98]
                      ${payableFilter === 'payable'
                        ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/20'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                      }`}>
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{withPayableCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">With Payables</p>
          </div>
        </button>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2
                        bg-gradient-to-br from-amber-50 to-orange-50
                        dark:from-amber-500/10 dark:to-orange-500/10
                        border-amber-200 dark:border-amber-500/30">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-extrabold text-amber-700 dark:text-amber-400 tabular-nums truncate">
              Rs. {totalPurchases.toLocaleString('en-LK')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Total Purchases</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3 sm:p-4 rounded-2xl border bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px]
                          bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input type="text" placeholder="Search by name…" value={search}
              onChange={e => { setSearch(e.target.value); resetPage() }}
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                         text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); resetPage() }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            )}
          </div>
          <SearchableSelect
            options={PAYABLE_FILTER_OPTIONS}
            value={payableFilter}
            onChange={v => { setPayableFilter(v); resetPage() }}
            placeholder="All Suppliers"
            searchPlaceholder="Filter…"
            triggerClassName="w-44"
          />
          {hasAnyFilter && (
            <button type="button" onClick={clearAll}
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
        {hasAnyFilter && (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            Showing {filtered.length} of {suppliers.length} suppliers
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
                <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No suppliers match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {pageItems.map(supplier => {
                  const hasPayable = supplier.payableAmount > 0
                  const initials = supplier.name.charAt(0).toUpperCase()
                  return (
                    <div key={supplier.id}
                      className="group flex flex-col rounded-2xl border overflow-hidden
                                 bg-white dark:bg-gray-900
                                 border-gray-200 dark:border-gray-800
                                 shadow-sm hover:shadow-lg hover:-translate-y-0.5
                                 transition-all duration-200">
                      {/* Accent strip */}
                      <div className={`h-1.5 shrink-0 ${hasPayable
                        ? 'bg-gradient-to-r from-red-400 to-rose-500'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
                      {/* Body */}
                      <div className="flex flex-col gap-3 p-4 flex-1">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500
                                          flex items-center justify-center text-white text-base font-extrabold
                                          shadow-sm border-2 border-amber-200 dark:border-amber-700 shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm leading-tight">
                              {supplier.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {supplier.phone}
                            </p>
                          </div>
                        </div>
                        {/* Category */}
                        <CategoryPill category={supplier.category} />
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                            <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Purchases</p>
                            <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100 tabular-nums truncate">
                              Rs. {supplier.totalPurchases >= 1000
                                ? `${(supplier.totalPurchases / 1000).toFixed(1)}k`
                                : supplier.totalPurchases.toLocaleString('en-LK')}
                            </p>
                          </div>
                          <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-xl
                                          ${hasPayable ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                            <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Payable</p>
                            <p className={`text-xs font-extrabold tabular-nums truncate
                                          ${hasPayable ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'}`}>
                              {hasPayable
                                ? `Rs. ${supplier.payableAmount >= 1000
                                    ? `${(supplier.payableAmount / 1000).toFixed(1)}k`
                                    : supplier.payableAmount.toLocaleString('en-LK')}`
                                : '—'}
                            </p>
                          </div>
                        </div>
                        {/* Payable alert */}
                        {hasPayable && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl
                                          bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={11} className="text-red-500 shrink-0" />
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">Outstanding</span>
                            </div>
                            <span className="text-xs font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                              Rs. {supplier.payableAmount.toLocaleString('en-LK')}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Footer actions */}
                      <div className="shrink-0 px-3 py-3 border-t border-gray-100 dark:border-gray-800
                                      bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-1.5 flex-wrap">
                        <button type="button" onClick={() => setFormTarget(supplier)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                                     text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20
                                     hover:bg-blue-100 dark:hover:bg-blue-900/40
                                     border border-blue-200 dark:border-blue-800 transition-colors">
                          <Pencil size={11} /> Edit
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(supplier)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                                     text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20
                                     hover:bg-red-100 dark:hover:bg-red-900/40
                                     border border-red-200 dark:border-red-800 transition-colors">
                          <Trash2 size={11} /> Delete
                        </button>
                        {hasPayable && (
                          <button type="button" onClick={() => setSettleTarget(supplier)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                                       text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20
                                       hover:bg-green-100 dark:hover:bg-green-900/40
                                       border border-green-200 dark:border-green-800 transition-colors">
                            <Banknote size={11} /> Settle
                          </button>
                        )}
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
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50">
                  {['Supplier', 'Category', 'Phone', 'Total Purchases', 'Payable', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <Package size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No suppliers match your filters</p>
                    </td>
                  </tr>
                ) : pageItems.map(supplier => {
                  const hasPayable = supplier.payableAmount > 0
                  return (
                    <tr key={supplier.id}
                      className="bg-white dark:bg-gray-900 hover:bg-amber-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{supplier.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CategoryPill category={supplier.category} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                        {supplier.phone}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                        Rs. {supplier.totalPurchases.toLocaleString('en-LK')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {hasPayable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums
                                           bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <AlertTriangle size={10} />
                            Rs. {supplier.payableAmount.toLocaleString('en-LK')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                           bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                            <CheckCircle2 size={10} /> Paid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          <button type="button" onClick={() => setFormTarget(supplier)} aria-label={`Edit ${supplier.name}`}
                            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                            <Pencil size={15} />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(supplier)} aria-label={`Delete ${supplier.name}`}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                            <Trash2 size={15} />
                          </button>
                          {hasPayable && (
                            <button type="button" onClick={() => setSettleTarget(supplier)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold
                                         text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20
                                         border border-green-200 dark:border-green-800 hover:bg-green-100">
                              <Banknote size={12} /> Settle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
              {filtered.length} of {suppliers.length} suppliers
            </p>
          </div>
        )}
      </div>

      {formTarget !== null && (
        <SupplierFormModal
          initialData={formTarget?.id ? formTarget : null}
          onSave={handleSave}
          onCancel={() => setFormTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          supplier={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {settleTarget && (
        <SettlePaymentModal
          supplier={settleTarget}
          onConfirm={amount => handleSettle(settleTarget.id, amount)}
          onCancel={() => setSettleTarget(null)}
        />
      )}
    </div>
  )
}
