import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Flame, ShoppingCart, Minus, Plus, Sparkles, UtensilsCrossed } from 'lucide-react'
import AnimatedSection from '../../components/ui/AnimatedSection'
import FoodCard from '../../components/ui/FoodCard'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { useCartStore } from '../../utils/store'
import { MENU_ITEMS } from '../../utils/menuData'

// ── Stat Badge ────────────────────────────────────────────────────────────────
function StatBadge({ icon: Icon, label, value, color = 'text-gray-500 dark:text-gray-400' }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-gray-800
                    rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700 flex-1">
      <Icon size={18} className={color} />
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-center">{value}</span>
    </div>
  )
}

// ── Quantity Stepper ──────────────────────────────────────────────────────────
function QuantityStepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800
                    rounded-full px-2 py-1.5 w-fit">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Decrease quantity"
        className="w-8 h-8 flex items-center justify-center rounded-full
                   text-gray-600 dark:text-gray-300
                   hover:bg-amber-500 hover:text-white transition-colors"
      >
        <Minus size={15} />
      </button>
      <span className="w-8 text-center font-bold text-gray-900 dark:text-gray-100 select-none text-base">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
        className="w-8 h-8 flex items-center justify-center rounded-full
                   text-gray-600 dark:text-gray-300
                   hover:bg-amber-500 hover:text-white transition-colors"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}

// ── Suggestions Section ───────────────────────────────────────────────────────
function Suggestions({ currentItem }) {
  // Same category first, excluding current; fallback to isNew items
  const sameCategory = MENU_ITEMS.filter(
    i => i.category === currentItem.category && i.id !== currentItem.id
  )
  const fallback = MENU_ITEMS.filter(
    i => i.id !== currentItem.id && i.isNew
  )

  // Merge: same-category first, then fill from fallback, deduplicate, cap at 3
  const merged = [...sameCategory]
  for (const item of fallback) {
    if (!merged.find(i => i.id === item.id)) merged.push(item)
    if (merged.length >= 3) break
  }
  // If still empty, just take first 3 items that aren't current
  if (merged.length === 0) {
    MENU_ITEMS.filter(i => i.id !== currentItem.id).slice(0, 3).forEach(i => merged.push(i))
  }

  if (merged.length === 0) return null

  return (
    <div className="mt-16">
      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800 mb-10" />

      <AnimatedSection delay={0.1}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold
                          uppercase tracking-widest mb-1">
              Chef's Suggestions
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              You May Also Like
            </h2>
          </div>
          <Link
            to="/menu"
            className="text-sm font-medium text-amber-600 hover:text-amber-700
                       transition-colors hidden sm:block"
          >
            View full menu →
          </Link>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {merged.map((item, index) => (
          <AnimatedSection key={item.id} delay={0.2 + index * 0.1}>
            <FoodCard {...item} />
          </AnimatedSection>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProductViewPage() {
  const { id }     = useParams()
  const addToCart  = useCartStore(s => s.addToCart)
  const toggleCart = useCartStore(s => s.toggleCart)

  const [qty, setQty] = useState(1)

  const item = MENU_ITEMS.find(i => String(i.id) === String(id))

  // 404 state
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <span className="text-6xl">🍽️</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Item Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          This menu item doesn't exist or may have been removed.
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700
                     font-medium text-sm transition-colors"
        >
          <ArrowLeft size={15} /> Back to Menu
        </Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: item.id, image: item.image, name: item.name, category: item.category, price: item.price })
    }
    if (!useCartStore.getState().isCartOpen) toggleCart()
  }

  const lineTotal = item.price * qty

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Back link */}
      <AnimatedSection delay={0} y={10}>
        <Link
          to="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-medium
                     text-gray-500 dark:text-gray-400 hover:text-amber-600
                     transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </Link>
      </AnimatedSection>

      {/* ── Main product grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* Left: Image */}
        <AnimatedSection delay={0.1}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl
                          aspect-[4/3] bg-gray-100 dark:bg-gray-800">
            <img
              src={item.image || FALLBACK_IMAGE_URL}
              alt={item.name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
              className="w-full h-full object-cover"
            />
            {item.isNew && (
              <span className="absolute top-4 left-4 flex items-center gap-1.5
                               bg-amber-500 text-white text-xs font-bold
                               px-3 py-1.5 rounded-full shadow-md shadow-amber-200">
                <Sparkles size={12} /> New
              </span>
            )}
          </div>
        </AnimatedSection>

        {/* Right: Details */}
        <AnimatedSection delay={0.2} className="flex flex-col gap-6">

          {/* Category + Name */}
          <div>
            <span className="inline-block text-xs font-semibold text-amber-600 dark:text-amber-400
                             bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full
                             border border-amber-100 dark:border-amber-800 mb-3">
              {item.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold
                           text-gray-900 dark:text-gray-100 leading-tight">
              {item.name}
            </h1>
          </div>

          {/* Price */}
          <p className="text-3xl font-bold text-amber-600">
            Rs. {Number(item.price).toLocaleString('en-LK')}
          </p>

          {/* Description */}
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-base">
            {item.description}
          </p>

          {/* Stat badges */}
          <div className="flex gap-3">
            <StatBadge icon={Clock}  label="Prep Time" value={item.prepTime} />
            <StatBadge icon={Flame}  label="Calories"  value={`${item.calories} kcal`} color="text-orange-400" />
            <StatBadge icon={UtensilsCrossed} label="Serves" value="1–2" />
          </div>

          {/* Ingredients */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500
                          uppercase tracking-widest mb-2">
              Key Ingredients
            </p>
            <div className="flex flex-wrap gap-2">
              {item.ingredients.map(ing => (
                <span key={ing}
                      className="text-xs font-medium text-gray-600 dark:text-gray-300
                                 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full
                                 border border-gray-200 dark:border-gray-700">
                  {ing}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Quantity + total */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Quantity
              </span>
              <QuantityStepper value={qty} onChange={setQty} />
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-1">
                Total
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                Rs. {lineTotal.toLocaleString('en-LK')}
              </span>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2
                       bg-amber-500 hover:bg-amber-600 active:scale-95
                       text-white font-bold text-base
                       py-4 rounded-full
                       shadow-lg shadow-amber-200 dark:shadow-amber-900/30
                       transition-all duration-150"
          >
            <ShoppingCart size={20} />
            Add {qty > 1 ? `${qty} items` : 'to Cart'} · Rs. {lineTotal.toLocaleString('en-LK')}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            Pick-up or Dine-in · Pay at the counter
          </p>

        </AnimatedSection>
      </div>

      {/* ── Suggestions ── */}
      <Suggestions currentItem={item} />

    </div>
  )
}
