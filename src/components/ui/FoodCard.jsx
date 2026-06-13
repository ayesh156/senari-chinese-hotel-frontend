import { Link } from 'react-router-dom'
import { Clock, Flame, ShoppingCart, Sparkles } from 'lucide-react'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { useCartStore } from '../../utils/store'

// ── Sub-components ────────────────────────────────────────────────────────────

function NewBadge() {
  return (
    <span
      className="absolute top-3 left-3 flex items-center justify-center w-9 h-9
                 rounded-full bg-amber-500 text-white shadow-md shadow-amber-200"
      title="New item"
    >
      <Sparkles size={14} strokeWidth={2.5} />
    </span>
  )
}

function CategoryBadge({ category }) {
  return (
    <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30
                     dark:text-amber-400 px-2.5 py-0.5 rounded-full
                     border border-amber-100 dark:border-amber-800">
      {category}
    </span>
  )
}

function StatPill({ icon: Icon, value, color = 'text-gray-400 dark:text-gray-500' }) {
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon size={13} />
      {value}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * FoodCard
 * @param {number|string} id        - Unique product ID (used for /menu/:id link)
 * @param {string}  image           - URL of the food image
 * @param {string}  name            - Dish name
 * @param {string}  category        - e.g. "Main Course"
 * @param {number}  price           - Price in Sri Lankan Rupees
 * @param {number}  calories        - Calorie count
 * @param {string}  prepTime        - e.g. "15 min"
 * @param {boolean} isNew           - Show "New" badge when true
 */
export default function FoodCard({
  id,
  image,
  name,
  category,
  price,
  calories,
  prepTime,
  isNew = false,
}) {
  const addToCart = useCartStore(s => s.addToCart)

  const handleAdd = (e) => {
    // Prevent the Link wrapper from navigating when the button is clicked
    e.preventDefault()
    e.stopPropagation()
    addToCart({ id, image, name, category, price })
  }

  return (
    // Entire card is a link to the product detail page
    <Link
      to={`/menu/${id}`}
      className="group relative flex flex-col
                 bg-amber-50 dark:bg-gray-800
                 text-gray-900 dark:text-gray-100
                 border border-amber-100 dark:border-gray-700
                 rounded-3xl overflow-hidden shadow-lg
                 hover:shadow-2xl hover:-translate-y-1.5 hover:border-amber-300 dark:hover:border-amber-700
                 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-44 bg-amber-100 dark:bg-gray-700 overflow-hidden shrink-0">
        <img
          src={image || FALLBACK_IMAGE_URL}
          alt={name}
          onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isNew && <NewBadge />}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex flex-col gap-1.5">
          <CategoryBadge category={category} />
          <h3 className="font-semibold text-base leading-snug line-clamp-2">{name}</h3>
        </div>

        <div className="flex items-center gap-3">
          <StatPill icon={Clock} value={prepTime} />
          <StatPill icon={Flame} value={`${calories} kcal`} color="text-orange-400" />
        </div>

        <div className="flex-1" />

        <p className="text-lg font-bold">
          Rs. {Number(price).toLocaleString('en-LK')}
        </p>

        {/* Add to Cart — e.preventDefault + e.stopPropagation prevent Link navigation */}
        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2
                     bg-amber-500 hover:bg-amber-600 active:scale-95
                     text-white text-sm font-semibold
                     py-2.5 rounded-full
                     transition-all duration-150 shadow-md shadow-amber-300 dark:shadow-amber-900/40"
        >
          <ShoppingCart size={15} />
          Add to Cart
        </button>
      </div>
    </Link>
  )
}
