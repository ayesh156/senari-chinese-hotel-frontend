import { useState, useMemo } from 'react'
import {
  X, ChevronRight, ChevronLeft, Check,
  Search, Plus, Minus, Trash2,
  User, Phone, UtensilsCrossed, Hash,
  CreditCard, Banknote, CheckCircle2, XCircle,
  ReceiptText, Tag,
} from 'lucide-react'
import { MENU_ITEMS } from '../../utils/menuData'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Details'  },
  { id: 2, label: 'Items'    },
  { id: 3, label: 'Review'   },
]

const INITIAL_DETAILS = {
  customerName:  '',
  customerPhone: '',
  orderType:     'DINE_IN',
  tableNumber:   '',
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP PROGRESS HEADER
// ─────────────────────────────────────────────────────────────────────────────
function StepHeader({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-4
                    border-b border-gray-100 dark:border-gray-800 shrink-0">
      {STEPS.map((step, idx) => {
        const done   = current > step.id
        const active = current === step.id
        return (
          <div key={step.id} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                               text-xs font-bold transition-all duration-200
                               ${done   ? 'bg-green-500 text-white'
                               : active ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
                               :          'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                {done ? <Check size={14} /> : step.id}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap
                                ${active ? 'text-orange-500' : done ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-4 rounded-full transition-colors duration-300
                               ${current > step.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED INPUT
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors
                       bg-gray-50 dark:bg-gray-800/50
                       ${error
                         ? 'border-red-400 dark:border-red-500'
                         : 'border-gray-200 dark:border-gray-700 focus-within:border-orange-400 dark:focus-within:border-orange-500'
                       }`}>
        {Icon && <Icon size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />}
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                 text-gray-900 dark:text-white
                 placeholder:text-gray-400 dark:placeholder:text-gray-500"
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Customer & Order Details
// ─────────────────────────────────────────────────────────────────────────────
function Step1({ details, setDetails, errors }) {
  function set(key, val) { setDetails(prev => ({ ...prev, [key]: val })) }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Enter the customer's details and choose how they're ordering.
      </p>

      {/* Customer Name */}
      <Field label="Customer Name" icon={User} error={errors.customerName}>
        <TextInput
          value={details.customerName}
          onChange={e => set('customerName', e.target.value)}
          placeholder="e.g. Kamal Perera"
        />
      </Field>

      {/* Phone */}
      <Field label="Phone Number" icon={Phone} error={errors.customerPhone}>
        <TextInput
          value={details.customerPhone}
          onChange={e => set('customerPhone', e.target.value)}
          placeholder="e.g. 077 123 4567"
          type="tel"
        />
      </Field>

      {/* Order Type toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Order Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'DINE_IN', label: 'Dine-in',  icon: UtensilsCrossed },
            { value: 'PICKUP',  label: 'Pick-up',   icon: Hash },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('orderType', value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                          border text-sm font-semibold transition-all duration-150
                          ${details.orderType === value
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md shadow-orange-500/20'
                            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                          }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Number — only for Dine-in */}
      {details.orderType === 'DINE_IN' && (
        <Field label="Table Number" icon={Hash} error={errors.tableNumber}>
          <TextInput
            value={details.tableNumber}
            onChange={e => set('tableNumber', e.target.value)}
            placeholder="e.g. T-04"
          />
        </Field>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Add Items
// ─────────────────────────────────────────────────────────────────────────────
function Step2({ cartItems, setCartItems, errors }) {
  const [itemSearch, setItemSearch] = useState('')

  const suggestions = useMemo(() => {
    const q = itemSearch.trim().toLowerCase()
    if (!q) return []
    return MENU_ITEMS.filter(m =>
      m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [itemSearch])

  function addItem(menuItem) {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === menuItem.id)
      if (existing) {
        return prev.map(i => i.productId === menuItem.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
          : i
        )
      }
      return [...prev, {
        productId: menuItem.id,
        name:      menuItem.name,
        category:  menuItem.category,
        unitPrice: menuItem.price,
        quantity:  1,
        subtotal:  menuItem.price,
      }]
    })
    setItemSearch('')
  }

  function changeQty(productId, delta) {
    setCartItems(prev => prev
      .map(i => i.productId === productId
        ? { ...i, quantity: i.quantity + delta, subtotal: (i.quantity + delta) * i.unitPrice }
        : i
      )
      .filter(i => i.quantity > 0)
    )
  }

  function removeItem(productId) {
    setCartItems(prev => prev.filter(i => i.productId !== productId))
  }

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Search and add menu items. Adjust quantities with the steppers.
      </p>

      {/* Item search */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border
                        bg-gray-50 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700
                        focus-within:border-orange-400 dark:focus-within:border-orange-500 transition-colors">
          <Search size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
          <input
            type="text"
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
            placeholder="Search menu items to add…"
            className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                       text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {itemSearch && (
            <button onClick={() => setItemSearch('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10
                          bg-white dark:bg-gray-900 rounded-xl border shadow-xl
                          border-gray-200 dark:border-gray-700 overflow-hidden">
            {suggestions.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item)}
                className="w-full flex items-center justify-between px-4 py-2.5
                           hover:bg-orange-50 dark:hover:bg-orange-500/10
                           transition-colors text-left border-b last:border-0
                           border-gray-100 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.category}</p>
                </div>
                <span className="text-sm font-bold text-orange-500 tabular-nums shrink-0 ml-3">
                  Rs. {item.price.toLocaleString('en-LK')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart items */}
      {errors.cartItems && (
        <p className="text-xs text-red-500">{errors.cartItems}</p>
      )}

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed
                        border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600">
          <UtensilsCrossed size={24} className="mb-2 opacity-40" />
          <p className="text-sm font-medium">No items added yet</p>
          <p className="text-xs mt-0.5">Search above to add menu items</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cartItems.map(item => (
            <div key={item.productId}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                         bg-gray-50 dark:bg-gray-800/50
                         border border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Rs. {item.unitPrice.toLocaleString('en-LK')} each
                </p>
              </div>
              {/* Qty stepper */}
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => changeQty(item.productId, -1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                             bg-gray-200 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-500/20
                             text-gray-600 dark:text-gray-300 transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-7 text-center text-sm font-bold tabular-nums
                                 text-gray-900 dark:text-white">
                  {item.quantity}
                </span>
                <button type="button" onClick={() => changeQty(item.productId, 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center
                             bg-gray-200 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-500/20
                             text-gray-600 dark:text-gray-300 transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              {/* Line total */}
              <span className="text-sm font-bold text-orange-500 tabular-nums w-24 text-right shrink-0">
                Rs. {item.subtotal.toLocaleString('en-LK')}
              </span>
              {/* Remove */}
              <button type="button" onClick={() => removeItem(item.productId)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500
                           hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Running subtotal */}
          <div className="flex justify-between items-center px-3 py-2
                          rounded-xl bg-orange-50 dark:bg-orange-500/10
                          border border-orange-200 dark:border-orange-500/20 mt-1">
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
            <span className="text-sm font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
              Rs. {subtotal.toLocaleString('en-LK')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Review & Payment
// ─────────────────────────────────────────────────────────────────────────────
function Step3({ details, cartItems, payment, setPayment }) {
  const subtotal      = cartItems.reduce((s, i) => s + i.subtotal, 0)
  const rawDiscount   = Number(payment.discountAmount) || 0
  const discountAmt   = Math.min(rawDiscount, subtotal)
  const grandTotal    = Math.max(0, subtotal - discountAmt)

  function setP(key, val) { setPayment(prev => ({ ...prev, [key]: val })) }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Review the order, apply any discount, then confirm payment.
      </p>

      {/* Order summary card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b
                        border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <ReceiptText size={14} className="text-orange-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Order Summary
          </span>
        </div>

        {/* Customer meta */}
        <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs
                        border-b border-gray-100 dark:border-gray-800">
          {[
            ['Customer', details.customerName],
            ['Phone',    details.customerPhone],
            ['Type',     details.orderType === 'DINE_IN' ? 'Dine-in' : 'Pick-up'],
            ...(details.orderType === 'DINE_IN' && details.tableNumber
              ? [['Table', details.tableNumber]] : []),
          ].map(([label, val]) => (
            <div key={label} className="flex gap-1">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">{label}:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{val}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {cartItems.map(item => (
            <div key={item.productId}
              className="flex items-center justify-between px-4 py-2 text-xs">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {item.name} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                Rs. {item.subtotal.toLocaleString('en-LK')}
              </span>
            </div>
          ))}
        </div>

        {/* Totals block */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/40 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="tabular-nums">Rs. {subtotal.toLocaleString('en-LK')}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span className="tabular-nums">− Rs. {discountAmt.toLocaleString('en-LK')}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold
                          text-orange-600 dark:text-orange-400 pt-1.5
                          border-t border-dashed border-orange-200 dark:border-orange-800">
            <span>Grand Total</span>
            <span className="tabular-nums">Rs. {grandTotal.toLocaleString('en-LK')}</span>
          </div>
        </div>
      </div>

      {/* Discount input */}
      <Field label="Discount (Rs.)" icon={Tag}>
        <TextInput
          type="number"
          value={payment.discountAmount}
          onChange={e => setP('discountAmount', e.target.value)}
          placeholder="0"
        />
      </Field>

      {/* Payment Method */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'CASH', label: 'Cash',  icon: Banknote   },
            { value: 'CARD', label: 'Card',  icon: CreditCard },
          ].map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => setP('method', value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                          border text-sm font-semibold transition-all duration-150
                          ${payment.method === value
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md shadow-orange-500/20'
                            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                          }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Payment Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'PAID',   label: 'Paid',   icon: CheckCircle2, color: 'from-green-500 to-emerald-500 shadow-green-500/20' },
            { value: 'UNPAID', label: 'Unpaid', icon: XCircle,      color: 'from-red-500 to-rose-500 shadow-red-500/20'        },
          ].map(({ value, label, icon: Icon, color }) => (
            <button key={value} type="button" onClick={() => setP('status', value)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                          border text-sm font-semibold transition-all duration-150
                          ${payment.status === value
                            ? `bg-gradient-to-r ${color} text-white border-transparent shadow-md`
                            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                          }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// Props
//   nextId       — used only when creating (initialOrder is null)
//   initialOrder — when set, the wizard pre-fills and acts as an editor
//   onSave(order)— called with the final order object (create or update)
// ─────────────────────────────────────────────────────────────────────────────
export default function InvoiceFormModal({ onClose, onSave, nextId, initialOrder = null }) {
  const isEdit = Boolean(initialOrder)

  // ── Derive initial state from existing order when editing ─────────────────
  const [step, setStep] = useState(1)

  const [details, setDetails] = useState(() => isEdit ? {
    customerName:  initialOrder.customerName,
    customerPhone: initialOrder.customerPhone,
    orderType:     initialOrder.orderType,
    tableNumber:   initialOrder.tableNumber ?? '',
  } : INITIAL_DETAILS)

  const [cartItems, setCartItems] = useState(() => isEdit
    ? initialOrder.items.map(i => ({
        productId: i.productId,
        name:      i.name,
        category:  i.category,
        unitPrice: i.unitPrice,
        quantity:  i.quantity,
        subtotal:  i.subtotal,
      }))
    : []
  )

  const [payment, setPayment] = useState(() => isEdit ? {
    method:         initialOrder.paymentMethod ?? 'CASH',
    status:         initialOrder.paymentStatus,
    discountAmount: initialOrder.discountAmount > 0 ? String(initialOrder.discountAmount) : '',
  } : { method: 'CASH', status: 'PAID', discountAmount: '' })

  const [errors, setErrors] = useState({})

  // ── Validation per step ───────────────────────────────────────────────────
  function validateStep1() {
    const e = {}
    if (!details.customerName.trim())  e.customerName  = 'Customer name is required'
    if (!details.customerPhone.trim()) e.customerPhone = 'Phone number is required'
    if (details.orderType === 'DINE_IN' && !details.tableNumber.trim())
      e.tableNumber = 'Table number is required for dine-in'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e = {}
    if (cartItems.length === 0) e.cartItems = 'Add at least one item to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setErrors({})
    setStep(s => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep(s => s - 1)
  }

  // ── Save / Update ─────────────────────────────────────────────────────────
  function handleSave() {
    const subtotal    = cartItems.reduce((s, i) => s + i.subtotal, 0)
    const rawDiscount = Number(payment.discountAmount) || 0
    const discount    = Math.min(rawDiscount, subtotal)
    const grandTotal  = Math.max(0, subtotal - discount)
    const pad         = (n) => String(n).padStart(3, '0')

    const id          = isEdit ? initialOrder.id : nextId
    const savedOrder  = {
      id,
      orderNumber:    isEdit ? initialOrder.orderNumber : `ORD-${pad(id)}`,
      customerName:   details.customerName.trim(),
      customerPhone:  details.customerPhone.trim(),
      orderType:      details.orderType,
      tableNumber:    details.tableNumber.trim() || null,
      status:         'COMPLETED',
      paymentStatus:  payment.status,
      paymentMethod:  payment.method,
      subtotal,
      discountAmount: discount,
      grandTotal,
      createdAt:      isEdit ? initialOrder.createdAt : new Date().toISOString(),
      items:          cartItems.map((i, idx) => ({
        id:        i.productId * 100 + id + idx,
        productId: i.productId,
        name:      i.name,
        category:  i.category,
        quantity:  i.quantity,
        unitPrice: i.unitPrice,
        subtotal:  i.subtotal,
      })),
    }
    onSave(savedOrder)
    onClose()
  }

  // ── Step titles ───────────────────────────────────────────────────────────
  const STEP_TITLES = {
    1: 'Customer & Order Details',
    2: 'Add Items',
    3: 'Review & Payment',
  }

  return (
    /* Backdrop — z-[60] so it sits above the InvoiceModal (z-50) */
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60]
                    flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border
                      border-gray-200 dark:border-gray-700/50
                      w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0
                        border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base">
              {isEdit ? `Edit Invoice INV-${String(initialOrder.id).padStart(3,'0')}` : 'New Invoice'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {STEP_TITLES[step]}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Step progress ── */}
        <StepHeader current={step} />

        {/* ── Step content (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 1 && (
            <Step1 details={details} setDetails={setDetails} errors={errors} />
          )}
          {step === 2 && (
            <Step2 cartItems={cartItems} setCartItems={setCartItems} errors={errors} />
          )}
          {step === 3 && (
            <Step3
              details={details}
              cartItems={cartItems}
              payment={payment}
              setPayment={setPayment}
            />
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0
                        flex items-center gap-3">
          {/* Back / Cancel */}
          {step === 1 ? (
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
              Cancel
            </button>
          ) : (
            <button onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm
                         border transition-colors
                         bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
              <ChevronLeft size={15} /> Back
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Next / Save */}
          {step < 3 ? (
            <button onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-orange-500 to-red-500 text-white
                         hover:opacity-90 transition-opacity shadow-md shadow-orange-500/20">
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-green-500 to-emerald-500 text-white
                         hover:opacity-90 transition-opacity shadow-md shadow-green-500/20">
              <Check size={15} /> {isEdit ? 'Update Invoice' : 'Save Invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
