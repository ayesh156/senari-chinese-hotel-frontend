import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Clock, Bike } from 'lucide-react'
import FoodCard from '../../components/ui/FoodCard'
import AnimatedSection from '../../components/ui/AnimatedSection'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { foodApi } from '../../api/food.api'

// ── Loading Skeleton ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col bg-amber-50 dark:bg-gray-800 border border-amber-100 dark:border-gray-700
                    rounded-3xl overflow-hidden shadow-lg animate-pulse">
      <div className="h-44 bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex gap-3">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-2" />
      </div>
    </div>
  )
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="bg-amber-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-24
                      flex flex-col md:flex-row items-center gap-8 md:gap-16">

        {/* Text side */}
        <AnimatedSection className="flex-1 text-center md:text-left" delay={0}>
          <span className="inline-flex items-center gap-1.5 text-amber-600 text-sm font-semibold
                           bg-amber-100 px-3 py-1 rounded-full mb-5">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            Sri Lanka's Favourite Flavours
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold
                         text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
            Senari Restaurant:{' '}
            <span className="text-amber-500">Authentic Chinese</span>{' '}
            Cuisine, Direct to Your Table
          </h1>

          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm md:text-base lg:text-lg
                        max-w-lg mx-auto md:mx-0 leading-relaxed">
            From sizzling Kottu to fragrant Rice & Curry — every dish is
            freshly prepared with traditional recipes and delivered hot, right
            to your table.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center gap-2
                         bg-amber-500 hover:bg-amber-600 active:scale-95
                         text-white font-semibold px-6 py-3 sm:px-7 sm:py-3.5
                         rounded-full shadow-md shadow-amber-200
                         transition-all duration-150 text-sm sm:text-base"
            >
              Order Now <ArrowRight size={17} />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2
                         bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95
                         text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 sm:px-7 sm:py-3.5
                         rounded-full border border-gray-200 dark:border-gray-700
                         transition-all duration-150 text-sm sm:text-base"
            >
              Our Story
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3
                          text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-amber-500" /> 25 – 35 min delivery
            </span>
            <span className="flex items-center gap-1.5">
              <Bike size={15} className="text-amber-500" /> Free delivery over Rss. 1,500
            </span>
          </div>
        </AnimatedSection>

        {/* Image side */}
        <AnimatedSection className="flex-1 w-full max-w-sm md:max-w-none" delay={0.15}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
              alt="Delicious Sri Lankan food spread"
              onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm
                            rounded-2xl px-4 py-2.5 shadow-lg">
              <p className="text-xs text-gray-400 font-medium">Avg. delivery time</p>
              <p className="text-lg font-bold text-amber-600 leading-tight">25 – 35 min</p>
            </div>
          </div>
        </AnimatedSection>

      </div>
    </section>
  )
}

// ── Popular Items Section ─────────────────────────────────────────────────────
function PopularItemsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPopular() {
      try {
        setLoading(true)
        setError(null)
        const res = await foodApi.getPopularFoods(8)
        if (!cancelled) {
          setItems(res.data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load popular items')
          setItems([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchPopular()

    return () => { cancelled = true }
  }, [])

  return (
    <section className="max-w-6xl mx-auto px-4 py-14">

      {/* Section header */}
      <AnimatedSection>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-1">
              Most Loved
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Popular Items
            </h2>
          </div>
          <Link
            to="/menu"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium
                       text-amber-600 hover:text-amber-700 transition-colors"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>
      </AnimatedSection>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>Unable to load popular items right now.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Dynamic cards */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => {
            // Map database fields to FoodCard props
            const cardProps = {
              id: item.id,
              image: item.image,
              name: item.name,
              category: item.category?.name || 'General',
              price: Number(item.price),
              calories: item.calories,
              prepTime: `${item.prepTimeMinutes} min`,
              isNew: item.isNew,
              isFeatured: item.isFeatured,
            }
            return (
              <AnimatedSection key={item.id} delay={index * 0.1}>
                <FoodCard {...cardProps} />
              </AnimatedSection>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>No popular items available yet.</p>
          <p className="text-sm mt-1">Check back after some orders are placed!</p>
        </div>
      )}

      {/* Mobile "View all" */}
      <AnimatedSection className="mt-8 text-center sm:hidden" delay={0.4}>
        <Link
          to="/menu"
          className="inline-flex items-center gap-1 text-sm font-medium
                     text-amber-600 hover:text-amber-700 transition-colors"
        >
          View full menu <ArrowRight size={15} />
        </Link>
      </AnimatedSection>

    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularItemsSection />
    </>
  )
}