import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, MapPin, UtensilsCrossed, Home, CalendarDays, Clock } from 'lucide-react'

// ── Helper — format date string to readable form ──────────────────────────────
function formatDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-LK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Helper — format 24h time to 12h ──────────────────────────────────────────
function formatTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100
                       flex items-center gap-1.5 text-right">
        {Icon && <Icon size={14} className="text-amber-500 shrink-0" />}
        {value}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrderSuccessPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  // Guard: direct URL access without order state → redirect home
  useEffect(() => {
    if (!state?.orderId) navigate('/', { replace: true })
  }, [state, navigate])

  if (!state?.orderId) return null

  const { orderId, orderType, name, arrivalDate, arrivalTime, discountAmount, discountType, grandTotal } = state
  const isPickup      = orderType === 'PICKUP'
  const formattedDate = formatDate(arrivalDate)
  const formattedTime = formatTime(arrivalTime)

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center flex flex-col items-center gap-6">

        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20
                        flex items-center justify-center">
          <CheckCircle2 size={44} className="text-green-500" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Order Received!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
            Thank you{name ? `, ${name}` : ''}. We've got your pre-order.
          </p>
        </div>

        {/* Order detail card */}
        <div className="w-full bg-white dark:bg-gray-900
                        border border-gray-100 dark:border-gray-800
                        rounded-3xl px-6 py-5 flex flex-col gap-3.5 shadow-sm text-left">

          <InfoRow
            label="Order ID"
            value={<span className="text-amber-600 font-extrabold tracking-wide text-base">#{orderId}</span>}
          />

          <div className="border-t border-gray-100 dark:border-gray-800" />

          <InfoRow
            label="Order Type"
            icon={isPickup ? MapPin : UtensilsCrossed}
            value={isPickup ? 'Pick-up' : 'Dine-in'}
          />

          <InfoRow
            label="Payment"
            value="Pay at Counter"
          />

          {/* Arrival date — only if provided */}
          {formattedDate && (
            <InfoRow
              label="Expected Date"
              icon={CalendarDays}
              value={formattedDate}
            />
          )}

          {/* Arrival time — only if provided */}
          {formattedTime && (
            <InfoRow
              label="Expected Time"
              icon={Clock}
              value={formattedTime}
            />
          )}

          {/* Discount — only if applied */}
          {discountAmount > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <InfoRow
                label={`Discount${discountType === 'percentage' ? '' : ' (Fixed)'}`}
                value={
                  <span className="text-green-600 dark:text-green-400">
                    − Rs. {Number(discountAmount).toLocaleString('en-LK')}
                  </span>
                }
              />
              <InfoRow
                label="Grand Total"
                value={
                  <span className="text-amber-600 font-extrabold text-base">
                    Rs. {Number(grandTotal).toLocaleString('en-LK')}
                  </span>
                }
              />
            </>
          )}
        </div>

        {/* Message */}
        <div className="w-full bg-amber-50 dark:bg-amber-900/20
                        border border-amber-200 dark:border-amber-800
                        rounded-2xl px-5 py-4 text-sm text-amber-800 dark:text-amber-300 leading-relaxed text-left">
          Your order has been received. Please{' '}
          <span className="font-semibold">pay at the counter when you arrive</span>.
          Our team will have your order ready for you.
        </div>

        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2
                     bg-amber-500 hover:bg-amber-600 active:scale-95
                     text-white font-semibold px-8 py-3
                     rounded-full shadow-md shadow-amber-200 dark:shadow-amber-900/30
                     transition-all duration-150"
        >
          <Home size={17} />
          Back to Home
        </Link>

        <p className="text-xs text-gray-400 dark:text-gray-600">
          Keep your order ID handy — the cashier may ask for it.
        </p>

      </div>
    </div>
  )
}
