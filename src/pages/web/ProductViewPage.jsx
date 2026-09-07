import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Flame, ShoppingCart, Minus, Plus, Sparkles, UtensilsCrossed, Loader2 } from 'lucide-react'
import AnimatedSection from '../../components/ui/AnimatedSection'
import FoodCard from '../../components/ui/FoodCard'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { useCartStore } from '../../utils/store'
import { foodApi } from '../../api/food.api'
import { fmtCurrencyDirect } from '../../utils/currency'


// ── Loading Skeleton ──────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div className="aspect-[4/3] rounded-3xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex flex-col gap-6">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex gap-3">
            <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

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
function Suggestions({ currentId, currentCategoryId }) {
  const [allFoods, setAllFoods] = useState([])

  useEffect(() => {
    foodApi.getAll().then(json => {
      const items = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
      setAllFoods(items)
    }).catch(() => {})
  }, [])

  const suggestions = useMemo(() => {
    const sameCat = allFoods.filter(i => i.categoryId === currentCategoryId && i.id !== currentId)
    const fallback = allFoods.filter(i => i.id !== currentId && i.isNew)

    // Merge: same-category first, then fill from fallback, deduplicate, cap at 3
    const merged = [...sameCat]
    for (const item of fallback) {
      if (!merged.find(i => i.id === item.id)) merged.push(item)
      if (merged.length >= 3) break
    }
    // If still empty, just take first 3 items that aren't current
    if (merged.length === 0) {
      allFoods.filter(i => i.id !== currentId).slice(0, 3).forEach(i => merged.push(i))
    }
    return merged.slice(0, 3)
  }, [allFoods, currentId, currentCategoryId])

  if (suggestions.length === 0) return null

  return (
    <div className="mt-16">
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
        {suggestions.map((item, index) => (
          <AnimatedSection key={item.id} delay={0.2 + index * 0.1}>
            <FoodCard
              id={item.id}
              image={item.image}
              name={item.name}
              category={item.category?.name || item.category || ''}
              price={Number(item.price)}
              calories={item.calories || 450}
              prepTime={`${item.prepTimeMinutes || 15} min`}
              isNew={item.isNew || false}
              isFeatured={item.isFeatured || false}
            />
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
  const [food, setFood] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [isZoomed, setIsZoomed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Sync selected primary image on item load
  useEffect(() => {
    if (food) {
      setActiveImage(food.image || (Array.isArray(food.images) ? food.images[0] : null))
    }
  }, [food])

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    foodApi.getById(id)
      .then(json => {
        if (cancelled) return
        if (json?.data) {
          setFood(json.data)
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        console.error('[ProductViewPage] Fetch error:', err)
        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  const handleAddToCart = () => {
    if (!food) return
    const categoryName = food.category?.name || food.category || ''
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: food.id,
        image: food.image,
        name: food.name,
        category: categoryName,
        price: Number(food.price),
      })
    }
    if (!useCartStore.getState().isCartOpen) toggleCart()
  }

  const lineTotal = food ? Number(food.price) * qty : 0

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return <ProductSkeleton />

  // ── 404 state ──────────────────────────────────────────────────────────────
  if (notFound || !food) {
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

  const categoryName = food.category?.name || food.category || ''
  const ingredients = Array.isArray(food.ingredients) ? food.ingredients : []

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

        {/* Left: Interactive Image Viewer with Mouse Hover Zoom & Thumbnails */}
        <AnimatedSection delay={0.1} className="flex flex-col gap-4">
          {(() => {
            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
            const toUrl = (p) => (!p ? FALLBACK_IMAGE_URL : (p.startsWith('http://') || p.startsWith('https://') ? p : `${baseUrl}${p.startsWith('/') ? '' : '/'}${p}`))
            
            // Build full image list from item.images Json catalog + primary item.image
            const rawGallery = Array.isArray(food.images) && food.images.length > 0
              ? food.images
              : (food.image ? [food.image] : [])
            
            const currentDisplay = toUrl(activeImage || food.image)

            return (
              <>
                {/* Main Large Showcase with Smooth Cursor-following Zoom */}
                <div
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                  className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-gray-900/90 flex items-center justify-center cursor-crosshair group"
                >
                  <img
                    src={currentDisplay}
                    alt={food.name}
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isZoomed ? 'scale(2.1)' : 'scale(1)',
                    }}
                    className="w-full h-full object-contain transition-transform duration-150 ease-out pointer-events-none"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
                  />

                  {food.isNew && (
                    <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md shadow-amber-200 pointer-events-none">
                      <Sparkles size={12} /> New
                    </span>
                  )}

                  {!isZoomed && rawGallery.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] text-white/90 pointer-events-none">
                      Hover to zoom · {rawGallery.length} photos
                    </div>
                  )}
                </div>

                {/* Thumbnail Carousel for Other Catalog Images */}
                {rawGallery.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 hide-scrollbar">
                    {rawGallery.map((imgItem, idx) => {
                      const thumbUrl = toUrl(imgItem)
                      const isSelected = (activeImage || food.image) === imgItem
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(imgItem)}
                          className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-200 bg-gray-900/80 ${
                            isSelected
                              ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105 shadow-md'
                              : 'border-gray-200 dark:border-gray-800 opacity-70 hover:opacity-100 hover:border-amber-400'
                          }`}
                        >
                          <img
                            src={thumbUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )
          })()}
        </AnimatedSection>

        {/* Right: Details */}
        <AnimatedSection delay={0.2} className="flex flex-col gap-6">

          {/* Category + Name */}
          <div>
            <span className="inline-block text-xs font-semibold text-amber-600 dark:text-amber-400
                             bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full
                             border border-amber-100 dark:border-amber-800 mb-3">
              {categoryName}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold
                           text-gray-900 dark:text-gray-100 leading-tight">
              {food.name}
            </h1>
          </div>

          {/* Price */}
          <p className="text-3xl font-bold text-amber-600">
            {fmtCurrencyDirect(food.price)}
          </p>

          {/* Description */}
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-base">
            {food.description}
          </p>

          {/* Stat badges */}
          <div className="flex gap-3">
            <StatBadge icon={Clock}  label="Prep Time" value={`${food.prepTimeMinutes || 15} min`} />
            <StatBadge icon={Flame}  label="Calories"  value={`${food.calories || 450} kcal`} color="text-orange-400" />
            <StatBadge icon={UtensilsCrossed} label="Serves" value={food.serves || '1-2 persons'} />
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500
                            uppercase tracking-widest mb-2">
                Key Ingredients
              </p>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing, i) => (
                  <span key={i}
                        className="text-xs font-medium text-gray-600 dark:text-gray-300
                                   bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full
                                   border border-gray-200 dark:border-gray-700">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

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
                {fmtCurrencyDirect(lineTotal)}
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
            Add {qty > 1 ? `${qty} items` : 'to Cart'} · {fmtCurrencyDirect(lineTotal)}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-600">
            Pick-up or Dine-in · Pay at the counter
          </p>

        </AnimatedSection>
      </div>

      {/* ── Suggestions ── */}
      <Suggestions currentId={food.id} currentCategoryId={food.categoryId} />

    </div>
  )
}