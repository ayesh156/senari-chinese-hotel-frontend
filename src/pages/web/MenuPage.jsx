import { useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutGrid, List, ShoppingCart, Clock, Flame,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  SlidersHorizontal, X, RotateCcw, Sparkles, Leaf,
} from 'lucide-react'
import { useState } from 'react'
import AnimatedSection from '../../components/ui/AnimatedSection'
import ModernSelect from '../../components/ui/ModernSelect'
import FoodCard from '../../components/ui/FoodCard'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { useCartStore } from '../../utils/store'
import { MENU_ITEMS, CATEGORIES } from '../../utils/menuData'

const ITEMS_PER_PAGE = 6
const MAX_PRICE      = Math.max(...MENU_ITEMS.map(i => i.price), 2000) // never below 2000
const HEALTHY_CAL    = 500

const SORT_OPTIONS = [
  { value: 'default',    label: 'Featured'           },
  { value: 'price-low',  label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'calories',   label: 'Healthiest First'   },
]

// ── URL param helpers ─────────────────────────────────────────────────────────
// toNum: returns fallback when value is null, empty, or NaN
const toNum  = (v, fallback) => {
  if (v === null || v === '') return fallback
  const n = Number(v)
  return isNaN(n) ? fallback : n
}
const toBool = (v) => v === 'true'

// ── Category Filter Bar ───────────────────────────────────────────────────────
function CategoryFilters({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar md:flex-wrap md:overflow-visible">
      {CATEGORIES.map(cat => (
        <button key={cat} onClick={() => onChange(cat)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold
                      transition-all duration-150 whitespace-nowrap
                      ${active === cat
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-gray-700 hover:text-amber-600'
                      }`}>
          {cat}
        </button>
      ))}
    </div>
  )
}

// ── Filter Sidebar Content ────────────────────────────────────────────────────
function FilterSidebarContent({ priceRange, onPrice, newOnly, onNew, healthyOnly, onHealthy, onReset }) {
  const activeCount = (priceRange < MAX_PRICE ? 1 : 0) + (newOnly ? 1 : 0) + (healthyOnly ? 1 : 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Filters</h3>
        {activeCount > 0 && (
          <button onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
            <RotateCcw size={12} /> Reset all
            <span className="bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ml-0.5">
              {activeCount}
            </span>
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Max Price</p>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30
                           px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800">
            Under Rs. {Number(priceRange).toLocaleString('en-LK')}
          </span>
        </div>
        <input type="range" min={0} max={MAX_PRICE} step={50}
          value={priceRange} onChange={e => onPrice(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
                     accent-amber-500 dark:[color-scheme:dark]
                     bg-gray-200 dark:bg-gray-700" />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Rs. 0</span><span>Rs. {MAX_PRICE.toLocaleString('en-LK')}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Quick Filters */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Filters</p>
        {[
          { value: newOnly,     toggle: onNew,     icon: Sparkles, color: 'text-amber-500', label: 'New Items Only' },
          { value: healthyOnly, toggle: onHealthy, icon: Leaf,     color: 'text-green-500', label: `Healthy (<${HEALTHY_CAL} kcal)` },
        ].map(({ value, toggle, icon: Icon, color, label }) => (
          <label key={label} className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => toggle(!value)}
              className={`w-10 h-6 rounded-full transition-colors duration-200 relative shrink-0
                          ${value ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow
                                transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <Icon size={14} className={color} />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{label}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Mobile Filter Drawer ──────────────────────────────────────────────────────
function MobileFilterDrawer({ open, onClose, ...filterProps }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div aria-hidden="true" onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col
                         bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl
                         transform transition-transform duration-300 ease-in-out
                         ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-14
                        border-b border-gray-100 dark:border-gray-800 shrink-0">
          <span className="font-bold text-gray-900 dark:text-gray-100">Filter Menu</span>
          <button onClick={onClose} aria-label="Close filters"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterSidebarContent {...filterProps} />
        </div>
      </aside>
    </>
  )
}

// ── Control Bar ───────────────────────────────────────────────────────────────
function ControlBar({ search, onSearch, sortBy, onSort, viewType, onView, onOpenFilters }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1 flex gap-2">
        <button onClick={onOpenFilters} aria-label="Open filters"
          className="lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border
                     border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                     text-gray-600 dark:text-gray-300 hover:text-amber-600 text-sm font-medium transition-colors">
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
        </button>
        <div className="relative flex-1">
          <Search size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input type="search" placeholder="Search dishes…" value={search}
            onChange={e => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                       text-sm transition" />
        </div>
      </div>
      <ModernSelect
        options={SORT_OPTIONS}
        value={sortBy}
        onChange={onSort}
      />
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0 self-center sm:self-auto">
        {[['grid', LayoutGrid], ['list', List]].map(([type, Icon]) => (
          <button key={type} onClick={() => onView(type)} aria-label={`${type} view`}
            className={`p-2 rounded-lg transition-colors ${
              viewType === type
                ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <Icon size={17} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── List View Item ────────────────────────────────────────────────────────────
function ListItem({ item }) {
  const addToCart = useCartStore(s => s.addToCart)
  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation()
    addToCart({ id: item.id, image: item.image, name: item.name, category: item.category, price: item.price })
  }
  return (
    <Link to={`/menu/${item.id}`}
      className="group flex items-center gap-4 bg-white dark:bg-gray-900
                 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 sm:p-4
                 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        <img src={item.image || FALLBACK_IMAGE_URL} alt={item.name}
          onError={e => { e.target.src = FALLBACK_IMAGE_URL }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400
                         bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full
                         border border-amber-100 dark:border-amber-800">{item.category}</span>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-1.5 text-sm sm:text-base leading-snug line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1 hidden sm:block">{item.description}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock size={11} /> {item.prepTime}
          </span>
          <span className="flex items-center gap-1 text-xs text-orange-400">
            <Flame size={11} /> {item.calories} kcal
          </span>
          {item.isNew && <span className="text-xs font-bold text-amber-600 dark:text-amber-400">✦ New</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
          Rs. {Number(item.price).toLocaleString('en-LK')}
        </p>
        <button onClick={handleAdd}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95
                     text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full
                     transition-all duration-150 shadow-sm shadow-amber-200 whitespace-nowrap">
          <ShoppingCart size={13} />
          <span className="hidden sm:inline">Add to Cart</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </Link>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null

  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btnBase = `w-9 h-9 flex items-center justify-center rounded-xl border text-sm
                   transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed`
  const navBtn  = `${btnBase} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                   text-gray-500 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600`

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      {/* First page */}
      <button onClick={() => onChange(1)} disabled={current === 1}
        aria-label="First page" className={navBtn}>
        <ChevronsLeft size={16} />
      </button>
      {/* Prev */}
      <button onClick={() => onChange(current - 1)} disabled={current === 1}
        aria-label="Previous page" className={navBtn}>
        <ChevronLeft size={16} />
      </button>

      {/* Page bubbles */}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-sm
                                          text-gray-400 dark:text-gray-500 select-none">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            aria-label={`Page ${p}`} aria-current={p === current ? 'page' : undefined}
            className={`${btnBase} font-semibold ${
              p === current
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200 dark:shadow-amber-900/30 scale-105'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-amber-400 hover:text-amber-600'
            }`}>
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button onClick={() => onChange(current + 1)} disabled={current === total}
        aria-label="Next page" className={navBtn}>
        <ChevronRight size={16} />
      </button>
      {/* Last page */}
      <button onClick={() => onChange(total)} disabled={current === total}
        aria-label="Last page" className={navBtn}>
        <ChevronsRight size={16} />
      </button>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onReset }) {
  return (
    <AnimatedSection>
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <span className="text-5xl">🍽️</span>
        <p className="font-semibold text-gray-700 dark:text-gray-300">No items found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your filters or search term.</p>
        <button onClick={onReset}
          className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
          Clear all filters
        </button>
      </div>
    </AnimatedSection>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — URL-synced state via useSearchParams
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // ── Read state from URL params ────────────────────────────────────────────
  const activeCategory = searchParams.get('category') || 'All'
  const searchQuery    = searchParams.get('search')   || ''
  const sortBy         = searchParams.get('sort')     || 'default'
  const viewType       = searchParams.get('view')     || 'grid'
  // Explicit null check: if 'price' param is absent, default to MAX_PRICE (not 0)
  const priceRange     = searchParams.has('price')
    ? toNum(searchParams.get('price'), MAX_PRICE)
    : MAX_PRICE
  const newOnly        = toBool(searchParams.get('new'))
  const healthyOnly    = toBool(searchParams.get('healthy'))
  const currentPage    = toNum(searchParams.get('page'), 1)

  // ── Write helpers — always reset page to 1 on filter change ──────────────
  const setParam = useCallback((key, value, resetPage = true) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      // Remove param if it equals its default value (keeps URLs clean)
      const defaults = { category: 'All', sort: 'default', view: 'grid',
                         price: String(MAX_PRICE), new: 'false', healthy: 'false', page: '1' }
      if (String(value) === defaults[key]) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
      if (resetPage) next.delete('page')
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setPage = useCallback((p) => setParam('page', p, false), [setParam])

  const handleReset = useCallback(() => {
    // Explicitly clear all params — price absence means MAX_PRICE (show all)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  // ── Filter + sort (useMemo) ───────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = activeCategory === 'All'
      ? MENU_ITEMS
      : MENU_ITEMS.filter(i => i.category === activeCategory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      )
    }

    items = items.filter(i => i.price <= priceRange)
    if (newOnly)     items = items.filter(i => i.isNew)
    if (healthyOnly) items = items.filter(i => i.calories < HEALTHY_CAL)

    const sorted = [...items]
    if (sortBy === 'price-low')  sorted.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-high') sorted.sort((a, b) => b.price - a.price)
    if (sortBy === 'calories')   sorted.sort((a, b) => a.calories - b.calories)
    return sorted
  }, [activeCategory, searchQuery, priceRange, newOnly, healthyOnly, sortBy])

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const safePage   = Math.min(currentPage, totalPages)
  const pageItems  = filteredItems.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const activeFilterCount =
    (priceRange < MAX_PRICE ? 1 : 0) + (newOnly ? 1 : 0) + (healthyOnly ? 1 : 0)

  const filterProps = {
    priceRange,  onPrice:   (v) => setParam('price', v),
    newOnly,     onNew:     (v) => setParam('new', v),
    healthyOnly, onHealthy: (v) => setParam('healthy', v),
    onReset: handleReset,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      {/* Page header */}
      <AnimatedSection className="mb-8">
        <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold uppercase tracking-widest mb-1">
          What We Serve
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
          Our Menu
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-lg">
          Freshly prepared Sri Lankan favourites — pick up or dine in.
        </p>
      </AnimatedSection>

      {/* Category pills */}
      <AnimatedSection delay={0.05} className="mb-6">
        <CategoryFilters active={activeCategory} onChange={v => setParam('category', v)} />
      </AnimatedSection>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} {...filterProps} />

      {/* ── Main layout ── */}
      <div className="lg:grid lg:grid-cols-4 lg:gap-8 items-start">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                          rounded-3xl p-5 shadow-sm">
            <FilterSidebarContent {...filterProps} />
          </div>
        </aside>

        {/* Content column */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          <AnimatedSection delay={0.1}>
            <ControlBar
              search={searchQuery}  onSearch={v => setParam('search', v)}
              sortBy={sortBy}       onSort={v => setParam('sort', v)}
              viewType={viewType}   onView={v => setParam('view', v, false)}
              onOpenFilters={() => setMobileFilterOpen(true)}
            />
          </AnimatedSection>

          <AnimatedSection delay={0.12}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{pageItems.length}</span>
                {' '}of{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredItems.length}</span>
                {' '}item{filteredItems.length !== 1 ? 's' : ''}
                {activeCategory !== 'All' && (
                  <> in <span className="font-semibold text-amber-600">{activeCategory}</span></>
                )}
                {searchQuery.trim() && (
                  <> for "<span className="font-semibold text-amber-600">{searchQuery}</span>"</>
                )}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 text-xs font-semibold
                             text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1
                             rounded-full border border-amber-200 dark:border-amber-800">
                  <SlidersHorizontal size={11} /> {activeFilterCount} active
                </button>
              )}
            </div>
          </AnimatedSection>

          {filteredItems.length === 0 ? (
            <EmptyState onReset={handleReset} />
          ) : viewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {pageItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                    animate={{ opacity: 1, scale: 1,    y: 0  }}
                    exit={{    opacity: 0, scale: 0.9            }}
                    transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
                  >
                    <FoodCard {...item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {pageItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0   }}
                    exit={{    opacity: 0, x: -16  }}
                    transition={{ duration: 0.2, delay: index * 0.04, ease: 'easeOut' }}
                  >
                    <ListItem item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <Pagination current={safePage} total={totalPages} onChange={setPage} />

        </div>
      </div>
    </div>
  )
}
