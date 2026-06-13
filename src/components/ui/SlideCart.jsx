import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore, selectCartCount, selectSubtotal } from '../../utils/store'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'

// ── Cart Item Row ─────────────────────────────────────────────────────────────
function CartItem({ item }) {
  const { removeFromCart, updateQuantity } = useCartStore()

  return (
    <li className="flex gap-3 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {/* Image */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        <img
          src={item.image || FALLBACK_IMAGE_URL}
          alt={item.name}
          onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {item.name}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {item.category}
        </p>
        <p className="text-sm font-bold text-amber-600 mt-1">
          Rs. {Number(item.price).toLocaleString('en-LK')}
        </p>
      </div>

      {/* Quantity controls + delete */}
      <div className="flex flex-col items-end justify-between shrink-0">
        {/* Delete */}
        <button
          onClick={() => removeFromCart(item.id)}
          aria-label={`Remove ${item.name}`}
          className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500
                     dark:hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>

        {/* +/- stepper */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-1 py-0.5">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
            className="w-6 h-6 flex items-center justify-center rounded-full
                       text-gray-600 dark:text-gray-300
                       hover:bg-amber-500 hover:text-white transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="w-5 text-center text-sm font-semibold
                           text-gray-900 dark:text-gray-100 select-none">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
            className="w-6 h-6 flex items-center justify-center rounded-full
                       text-gray-600 dark:text-gray-300
                       hover:bg-amber-500 hover:text-white transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </li>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20
                      flex items-center justify-center">
        <ShoppingBag size={28} className="text-amber-400" />
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-300">Your cart is empty</p>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        Add some delicious items from our menu!
      </p>
    </div>
  )
}

// ── SlideCart ─────────────────────────────────────────────────────────────────
export default function SlideCart() {
  const { isCartOpen, toggleCart, cartItems, clearCart } = useCartStore()
  const count    = useCartStore(selectCartCount)
  const subtotal = useCartStore(selectSubtotal)
  const navigate = useNavigate()

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') toggleCart() }
    if (isCartOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isCartOpen, toggleCart])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isCartOpen])

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={toggleCart}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
                    transition-opacity duration-300
                    ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── Panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-[min(100vw,24rem)]
                    flex flex-col
                    bg-white dark:bg-gray-900
                    border-l border-gray-200 dark:border-gray-800
                    shadow-2xl
                    transition-transform duration-300 ease-in-out
                    ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-amber-500" />
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
              Your Cart
            </h2>
            {count > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold
                               w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 dark:text-gray-500
                           hover:text-red-500 dark:hover:text-red-400
                           transition-colors font-medium"
              >
                Clear all
              </button>
            )}
            <button
              onClick={toggleCart}
              aria-label="Close cart"
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500
                         hover:text-gray-700 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Items list ── */}
        <div className="flex-1 overflow-y-auto px-5">
          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <ul>
              {cartItems.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer — only when cart has items ── */}
        {cartItems.length > 0 && (
          <div className="shrink-0 px-5 py-5 border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900">
            {/* Subtotal row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Subtotal ({count} {count === 1 ? 'item' : 'items'})
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Rs. {subtotal.toLocaleString('en-LK')}
              </span>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => { toggleCart(); navigate('/checkout') }}
              className="w-full flex items-center justify-center gap-2
                         bg-amber-500 hover:bg-amber-600 active:scale-95
                         text-white font-semibold text-base
                         py-3.5 rounded-full
                         shadow-md shadow-amber-200 dark:shadow-amber-900/30
                         transition-all duration-150"
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>

            <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-3">
              Pick-up or Dine-in · Pay at the counter
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
