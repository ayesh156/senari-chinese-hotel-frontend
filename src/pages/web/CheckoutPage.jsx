import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, CalendarDays, Clock, ShoppingBag, ChevronRight, Tag } from 'lucide-react'
import { useCartStore, selectSubtotal } from '../../utils/store'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import ModernSelect from '../../components/ui/ModernSelect'

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: '%  Percentage' },
  { value: 'fixed',      label: 'Rs. Fixed Amount' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Returns today's date as YYYY-MM-DD for the min attribute */
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// ── Order Type Toggle ─────────────────────────────────────────────────────────
function OrderTypeToggle({ value, onChange }) {
  const options = [
    { id: 'PICKUP',  label: 'Pick-up',  desc: 'Collect at the counter' },
    { id: 'DINE_IN', label: 'Dine-in',  desc: 'Pre-order, pay on arrival' },
  ]
  return (
    /* Stack vertically on mobile, side-by-side on sm+ */
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 text-sm
                      font-semibold transition-all duration-150
                      ${value === opt.id
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
        >
          <span className="text-base font-bold">{opt.label}</span>
          <span className="text-xs font-normal opacity-75">{opt.desc}</span>
        </button>
      ))}
    </div>
  )
}

// ── Form Field ────────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        {Icon && <Icon size={14} className="text-amber-500" />}
        {label}
      </label>
      {children}
    </div>
  )
}

// Base input class — shared by all inputs including date/time
const inputClass = [
  'w-full px-4 py-2.5 rounded-xl border',
  'border-gray-200 dark:border-gray-700',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
  'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent',
  // Makes native date/time picker chrome match dark mode
  'dark:[color-scheme:dark]',
  'transition text-sm',
].join(' ')

// ── Order Summary Item ────────────────────────────────────────────────────────
function SummaryItem({ item }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        <img
          src={item.image || FALLBACK_IMAGE_URL}
          alt={item.name}
          onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">× {item.quantity}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
        Rs. {(item.price * item.quantity).toLocaleString('en-LK')}
      </p>
    </li>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate  = useNavigate()
  const cartItems = useCartStore(s => s.cartItems)
  const clearCart = useCartStore(s => s.clearCart)
  const subtotal  = useCartStore(selectSubtotal)

  const [form, setForm] = useState({
    name:         '',
    phone:        '',
    orderType:    'PICKUP',
    arrivalDate:  '',
    arrivalTime:  '',
  })
  const [errors,        setErrors]        = useState({})
  const [discountType,  setDiscountType]  = useState('percentage')
  const [discountValue, setDiscountValue] = useState(0)

  // ── Discount calculations ─────────────────────────────────────────────────
  const rawDiscount   = discountType === 'percentage'
    ? (subtotal * discountValue) / 100
    : discountValue
  const discountAmount = Math.min(rawDiscount, subtotal)   // can't exceed subtotal
  const grandTotal     = Math.max(0, subtotal - discountAmount)

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) navigate('/', { replace: true })
  }, [cartItems, navigate])

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Full name is required.'
    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone.trim()))
      e.phone = 'Enter a valid phone number.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`
    clearCart()
    navigate('/order-success', {
      state: {
        orderId,
        orderType:      form.orderType,
        name:           form.name,
        arrivalDate:    form.arrivalDate,
        arrivalTime:    form.arrivalTime,
        discountAmount: discountAmount > 0 ? discountAmount : null,
        discountType:   discountAmount > 0 ? discountType   : null,
        grandTotal,
      },
    })
  }

  if (cartItems.length === 0) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 overflow-x-hidden">

      {/* Page title */}
      <div className="mb-8">
        <p className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-1">
          Almost there
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Confirm Your Pre-Order
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          No delivery — Pick-up or Dine-in only. Payment at the counter.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left: Form ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Order type */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                            rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Order Type</h2>
              <OrderTypeToggle value={form.orderType} onChange={v => set('orderType', v)} />
            </div>

            {/* Customer details */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                            rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Your Details</h2>

              <Field label="Full Name" icon={User}>
                <input
                  type="text"
                  placeholder="e.g. Kamal Perera"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={inputClass}
                />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
              </Field>

              <Field label="Phone Number" icon={Phone}>
                <input
                  type="tel"
                  placeholder="e.g. 077 123 4567"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className={inputClass}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
              </Field>

              {/* ── Discount input — in the spacious left form column ── */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300
                                  flex items-center gap-1.5">
                  <Tag size={14} className="text-amber-500" />
                  Discount / Promo
                  <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(optional)</span>
                </label>

                {/* sm:col-span-1 = type selector, sm:col-span-2 = value input */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  {/* Type selector — fixed width on desktop */}
                  <div className="w-full sm:w-44 shrink-0">
                    <ModernSelect
                      options={DISCOUNT_TYPE_OPTIONS}
                      value={discountType}
                      onChange={setDiscountType}
                      className="w-full"
                    />
                  </div>
                  {/* Divider visible on desktop */}
                  <div className="hidden sm:flex items-center text-gray-300 dark:text-gray-600 select-none font-light text-lg">
                    |
                  </div>
                  {/* Value input — takes remaining space */}
                  <div className="flex-1">
                    <input
                      type="number"
                      min={0}
                      max={discountType === 'percentage' ? 100 : undefined}
                      step={discountType === 'percentage' ? 1 : 50}
                      value={discountValue === 0 ? '' : discountValue}
                      onChange={e => setDiscountValue(Math.max(0, Number(e.target.value)))}
                      placeholder={discountType === 'percentage' ? 'Enter % e.g. 10' : 'Enter amount e.g. 200'}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Live saving preview */}
                {discountAmount > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Saving Rs. {discountAmount.toLocaleString('en-LK')}
                    {discountType === 'percentage' && ` (${discountValue}%)`}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" />
                  Expected Arrival
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date picker */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <CalendarDays size={12} className="text-amber-400" />
                      Date
                    </label>
                    <input
                      type="date"
                      min={todayISO()}
                      value={form.arrivalDate}
                      onChange={e => set('arrivalDate', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  {/* Time picker */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={12} className="text-amber-400" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={form.arrivalTime}
                      onChange={e => set('arrivalTime', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Helps us have your order ready when you arrive.
                </p>
              </div>
            </div>

            {/* Pay at counter notice */}
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20
                            border border-amber-200 dark:border-amber-800
                            rounded-2xl px-4 py-3">
              <ShoppingBag size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Pay at Counter.</span> No online payment required.
                Simply arrive at the restaurant and settle your bill at the counter.
              </p>
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-white dark:bg-gray-900
                            border border-gray-100 dark:border-gray-800
                            rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Order Summary</h2>

              <ul>
                {cartItems.map(item => <SummaryItem key={item.id} item={item} />)}
              </ul>

              {/* ── Totals ── */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {/* Subtotal */}
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString('en-LK')}</span>
                </div>

                {/* Discount row — only shown when a discount is applied */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-red-500 dark:text-red-400">
                      Discount
                      {discountType === 'percentage' && ` (${discountValue}%)`}
                    </span>
                    <span className="text-red-500 dark:text-red-400">
                      − Rs. {discountAmount.toLocaleString('en-LK')}
                    </span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100
                                text-base pt-1 border-t border-gray-100 dark:border-gray-800">
                  <span>Grand Total</span>
                  <span className="text-amber-600">
                    Rs. {grandTotal.toLocaleString('en-LK')}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2
                           bg-amber-500 hover:bg-amber-600 active:scale-95
                           text-white font-semibold text-base
                           py-3.5 rounded-full
                           shadow-md shadow-amber-200 dark:shadow-amber-900/30
                           transition-all duration-150 mt-2"
              >
                Confirm Pre-Order
                <ChevronRight size={18} />
              </button>
              <p className="text-xs text-center text-gray-400 dark:text-gray-600">
                Pay at the counter when you arrive
              </p>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
