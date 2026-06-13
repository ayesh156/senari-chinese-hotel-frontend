import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Pencil, Trash2,
  ChevronUp, ChevronDown, AlertTriangle,
  ImageOff, CheckCircle2, XCircle,
  Sparkles, X, SlidersHorizontal, Database,
  List, LayoutGrid,
} from 'lucide-react'
import { MENU_ITEMS } from '../../utils/menuData'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'
import { useMasterDataStore, buildFoodCategoryFilterOptions } from '../../utils/masterDataStore'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ModernPagination from '../../components/ui/ModernPagination'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8

const AVAIL_SELECT_OPTIONS = [
  { value: 'all',       label: 'All Status'  },
  { value: 'available', label: 'Available'   },
  { value: 'soldout',   label: 'Sold Out'    },
]

const PRICE_RANGE_OPTIONS = [
  { value: 'all',      label: 'Any Price'       },
  { value: '0-500',    label: 'Under Rs. 500'   },
  { value: '500-800',  label: 'Rs. 500 – 800'   },
  { value: '800-1000', label: 'Rs. 800 – 1,000' },
  { value: '1000+',    label: 'Over Rs. 1,000'  },
]

const CAT_COLORS = {
  'Rice Dishes': 'bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20',
  'Mains':       'bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20',
  'Street Food': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'Noodles':     'bg-teal-500/10   text-teal-600   dark:text-teal-400   border-teal-500/20',
  'Desserts':    'bg-pink-500/10   text-pink-600   dark:text-pink-400   border-pink-500/20',
  'Beverages':   'bg-cyan-500/10   text-cyan-600   dark:text-cyan-400   border-cyan-500/20',
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function matchesPriceRange(price, range) {
  if (range === 'all')      return true
  if (range === '0-500')    return price < 500
  if (range === '500-800')  return price >= 500 && price < 800
  if (range === '800-1000') return price >= 800 && price < 1000
  if (range === '1000+')    return price >= 1000
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function CategoryPill({ category }) {
  const cls = CAT_COLORS[category] ??
    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-medium border ${cls}`}>
      {category}
    </span>
  )
}

function AvailabilityBadge({ available }) {
  return available ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                     bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
      <CheckCircle2 size={11} /> Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                     bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
      <XCircle size={11} /> Sold Out
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900
                      border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b
                        bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10
                        border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                            bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Food Item</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This action cannot be undone. The item will be permanently removed from your menu.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white
                        bg-gray-100 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700/50">
            "{item.name}"
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                       transition-all flex items-center justify-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
          <button onClick={onCancel}
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function FoodsListPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState(() =>
    MENU_ITEMS.map(i => ({ ...i, available: true }))
  )
  const [search,              setSearch]              = useState('')
  const [catFilter,           setCatFilter]           = useState('All')
  const [availFilter,         setAvailFilter]         = useState('all')
  const [priceRange,          setPriceRange]          = useState('all')
  const [newOnly,             setNewOnly]             = useState(false)
  const [sortKey,             setSortKey]             = useState('name')
  const [sortDir,             setSortDir]             = useState('asc')
  const [page,                setPage]                = useState(1)
  const [delItem,             setDelItem]             = useState(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode,            setViewMode]            = useState('table')

  // ── Auto-switch to grid on mobile (< 768px) ──────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setViewMode(e.matches ? 'grid' : 'table')
    if (mq.matches) setViewMode('grid')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const foodCategories = useMasterDataStore(s => s.foodCategories)

  const catSelectOptions = useMemo(
    () => buildFoodCategoryFilterOptions(foodCategories),
    [foodCategories],
  )

  // ── Derived filtered + sorted list ───────────────────────────────────────
  const filtered = useMemo(() => {
    return items
      .filter(i => {
        const q = search.toLowerCase()
        const matchSearch = i.name.toLowerCase().includes(q) ||
                            i.category.toLowerCase().includes(q)
        const matchCat    = catFilter === 'All' || i.category === catFilter
        const matchAvail  = availFilter === 'all'
          ? true : availFilter === 'available' ? i.available : !i.available
        const matchPrice  = matchesPriceRange(i.price, priceRange)
        const matchNew    = !newOnly || i.isNew
        return matchSearch && matchCat && matchAvail && matchPrice && matchNew
      })
      .sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey]
        if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ?  1 : -1
        return 0
      })
  }, [items, search, catFilter, availFilter, priceRange, newOnly, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetPage() { setPage(1) }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    resetPage()
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="text-amber-500" />
      : <ChevronDown size={12} className="text-amber-500" />
  }

  function handleDelete(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    setDelItem(null)
    resetPage()
  }

  function toggleAvailability(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i))
  }

  const hasAdvancedFilters = priceRange !== 'all' || newOnly
  const hasAnyFilter       = search || catFilter !== 'All' || availFilter !== 'all' ||
                             priceRange !== 'all' || newOnly
  const availableCount     = items.filter(i => i.available).length

  function clearAll() {
    setSearch(''); setCatFilter('All'); setAvailFilter('all')
    setPriceRange('all'); setNewOnly(false); resetPage()
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Foods</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {items.length} items · {availableCount} available
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/pos/master-data')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       font-medium text-sm border transition-colors shrink-0
                       bg-white dark:bg-gray-800/50
                       text-gray-700 dark:text-gray-200
                       border-gray-200 dark:border-gray-700
                       hover:border-amber-300 dark:hover:border-amber-700
                       hover:text-amber-700 dark:hover:text-amber-400"
          >
            <Database size={16} /> Master Data
          </button>
          <button
            type="button"
            onClick={() => navigate('/pos/foods/add')}
            className="flex items-center justify-center gap-2 px-4 py-2.5
                       bg-gradient-to-r from-amber-500 to-orange-500
                       text-white rounded-xl font-medium text-sm
                       hover:opacity-90 transition-opacity
                       shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus size={16} /> Add Food
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="p-3 sm:p-4 rounded-2xl border
                      bg-white dark:bg-gray-800/30
                      border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-col gap-3">

          {/* ── Row 1: Search + 2 primary filters + More Options toggle ── */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Search — grows to fill available space */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px]
                            bg-gray-50 dark:bg-gray-800/50
                            border-gray-200 dark:border-gray-700/50">
              <Search size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by name or category…"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                           text-gray-900 dark:text-white
                           placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {search && (
                <button onClick={() => { setSearch(''); resetPage() }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Primary filter 1: Category */}
            <SearchableSelect
              options={catSelectOptions}
              value={catFilter}
              onChange={v => { setCatFilter(v); resetPage() }}
              placeholder="All Categories"
              searchPlaceholder="Search categories…"
              triggerClassName="w-44"
            />

            {/* Primary filter 2: Availability */}
            <SearchableSelect
              options={AVAIL_SELECT_OPTIONS}
              value={availFilter}
              onChange={v => { setAvailFilter(v); resetPage() }}
              placeholder="All Status"
              searchPlaceholder="Search status…"
              triggerClassName="w-36"
            />

            {/* More Options toggle */}
            <button
              onClick={() => setShowAdvancedFilters(v => !v)}
              aria-expanded={showAdvancedFilters}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                          border transition-all duration-150 shrink-0
                          ${showAdvancedFilters || hasAdvancedFilters
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
                          }`}
            >
              <SlidersHorizontal size={13} />
              More Options
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Clear all */}
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                           bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                           text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700
                           transition-colors shrink-0"
              >
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

          {/* ── Row 2: Advanced filters (animated expand) ── */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out
                        ${showAdvancedFilters ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0">
                More filters:
              </span>

              {/* Advanced filter: Price Range */}
              <SearchableSelect
                options={PRICE_RANGE_OPTIONS}
                value={priceRange}
                onChange={v => { setPriceRange(v); resetPage() }}
                placeholder="Any Price"
                searchPlaceholder="Search range…"
                triggerClassName="w-40"
              />

              {/* Advanced filter: New Items Only toggle */}
              <button
                onClick={() => { setNewOnly(v => !v); resetPage() }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                            border transition-all duration-150
                            ${newOnly
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
                            }`}
              >
                <Sparkles size={13} />
                New Only
              </button>
            </div>
          </div>

          {/* Active filter summary */}
          {hasAnyFilter && (
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Showing {filtered.length} of {items.length} items
            </p>
          )}
        </div>
      </div>

      {/* ── Data table / Card grid ── */}
      <div className="rounded-2xl border overflow-hidden
                      bg-white dark:bg-gray-900
                      border-gray-200 dark:border-gray-800">

        {viewMode === 'grid' ? (
          /* ── Card Grid ── */
          <>
            {pageItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <ImageOff size={32} className="text-gray-300 dark:text-gray-700" />
                <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No items match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {pageItems.map(item => (
                  <div key={item.id}
                    className="group flex flex-col rounded-2xl border overflow-hidden
                               bg-amber-50 dark:bg-gray-800
                               border-amber-100 dark:border-gray-700
                               shadow-sm hover:shadow-lg hover:-translate-y-0.5
                               transition-all duration-200">
                    {/* Image */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={item.image || FALLBACK_IMAGE_URL}
                        alt={item.name}
                        onError={e => { e.target.src = FALLBACK_IMAGE_URL }}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {item.isNew && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-amber-500 text-white
                                         px-2 py-0.5 rounded-full uppercase tracking-wide">NEW</span>
                      )}
                      <button onClick={() => toggleAvailability(item.id)}
                        className="absolute top-2 right-2 transition-opacity hover:opacity-80">
                        <AvailabilityBadge available={item.available} />
                      </button>
                    </div>
                    {/* Body */}
                    <div className="flex flex-col flex-1 p-3 gap-2">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2">
                        {item.name}
                      </p>
                      <CategoryPill category={item.category} />
                      <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-auto">
                        Rs. {Number(item.price).toLocaleString('en-LK')}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex border-t border-amber-100 dark:border-gray-700 divide-x divide-amber-100 dark:divide-gray-700">
                      <button onClick={() => navigate(`/pos/foods/edit/${item.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                   text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400
                                   hover:bg-amber-100/50 dark:hover:bg-amber-500/10 transition-colors">
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => setDelItem(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
                                   text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Table View ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800/60
                               border-gray-200 dark:border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold
                                 text-gray-500 dark:text-gray-400 w-16">Image</th>
                  {[
                    { label: 'Name',     col: 'name'     },
                    { label: 'Category', col: 'category' },
                    { label: 'Price',    col: 'price'    },
                  ].map(({ label, col }) => (
                    <th key={col} onClick={() => handleSort(col)}
                      className="px-4 py-3 text-left text-xs font-semibold
                                 text-gray-500 dark:text-gray-400
                                 cursor-pointer hover:text-amber-500
                                 select-none whitespace-nowrap transition-colors">
                      <span className="inline-flex items-center gap-1">
                        {label} <SortIcon col={col} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold
                                 text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold
                                 text-gray-500 dark:text-gray-400 pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <ImageOff size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-700" />
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No items match your filters</p>
                    </td>
                  </tr>
                ) : pageItems.map(item => (
                  <tr key={item.id}
                    className="transition-all duration-150 bg-white dark:bg-gray-900
                               border-b border-gray-100 dark:border-gray-800
                               hover:bg-amber-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="w-12 h-10 rounded-xl overflow-hidden shrink-0 bg-amber-50 dark:bg-gray-800">
                        <img src={item.image || FALLBACK_IMAGE_URL} alt={item.name}
                          onError={e => { e.target.src = FALLBACK_IMAGE_URL }}
                          className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{item.name}</p>
                        {item.isNew && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-md leading-none">NEW</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-xs truncate">{item.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><CategoryPill category={item.category} /></td>
                    <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                      Rs. {Number(item.price).toLocaleString('en-LK')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => toggleAvailability(item.id)} title="Click to toggle"
                        className="transition-opacity hover:opacity-75">
                        <AvailabilityBadge available={item.available} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/pos/foods/edit/${item.id}`)} aria-label={`Edit ${item.name}`}
                          className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500
                                     hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDelItem(item)} aria-label={`Delete ${item.name}`}
                          className="p-2 rounded-xl transition-colors text-gray-400 dark:text-gray-500
                                     hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Modern Pagination ── */}
        <ModernPagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={PAGE_SIZE}
          onPageChange={p => setPage(p)}
        />

        {/* Footer hint (only when no pagination shown) */}
        {totalPages <= 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800
                          flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {filtered.length} of {items.length} items
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Click status badge to toggle · Click column headers to sort
            </p>
          </div>
        )}
      </div>

      {/* ── Delete modal ── */}
      {delItem && (
        <DeleteModal
          item={delItem}
          onConfirm={() => handleDelete(delItem.id)}
          onCancel={() => setDelItem(null)}
        />
      )}

    </div>
  )
}
