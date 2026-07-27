import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Search, X } from 'lucide-react'

const DROPDOWN_Z = 10000

/**
 * SearchableSelect — premium combobox with portal-rendered dropdown.
 * Dropdown uses fixed viewport positioning so it is not clipped inside modals.
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  className = '',
  triggerClassName = '',
  clearable = false,
}) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [menuRect, setMenuRect] = useState(null)
  const wrapRef    = useRef(null)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchRef  = useRef(null)

  const selected = options.find(o => o.value === value)

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const maxH = 280
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openUp = spaceBelow < maxH && spaceAbove > spaceBelow

    setMenuRect({
      left:   rect.left,
      width:  rect.width,
      top:    openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      maxHeight: Math.min(maxH, openUp ? spaceAbove : spaceBelow),
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null)
      return
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
    setQuery('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      const t = e.target
      if (
        wrapRef.current?.contains(t) ||
        dropdownRef.current?.contains(t)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleSelect = useCallback((val) => {
    onChange(val)
    setOpen(false)
  }, [onChange])

  const handleClear = useCallback((e) => {
    e.stopPropagation()
    onChange('')
  }, [onChange])

  const dropdown = (
    <AnimatePresence>
      {open && menuRect && (
        <motion.div
          ref={dropdownRef}
          role="listbox"
          initial={{ opacity: 0, y: open && menuRect.top != null ? -6 : 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: menuRect.top != null ? -6 : 6, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            left:     menuRect.left,
            width:    menuRect.width,
            top:      menuRect.top,
            bottom:   menuRect.bottom,
            zIndex:   DROPDOWN_Z,
            maxHeight: menuRect.maxHeight,
          }}
          className="flex flex-col bg-white dark:bg-gray-900
                     border border-gray-200 dark:border-gray-700
                     rounded-2xl shadow-2xl overflow-hidden min-w-[11rem]"
        >
          <div className="sticky top-0 z-10 px-2.5 pt-2.5 pb-1.5 shrink-0
                          bg-white dark:bg-gray-900
                          border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                            bg-gray-50 dark:bg-gray-800
                            border border-gray-200 dark:border-gray-700
                            focus-within:border-amber-400 focus-within:ring-2
                            focus-within:ring-amber-400/20 transition-all">
              <Search size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="bg-transparent border-none outline-none flex-1
                           text-xs text-gray-900 dark:text-white
                           placeholder:text-gray-400 dark:placeholder:text-gray-600
                           min-w-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                             transition-colors shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <ul className="overflow-y-auto py-1.5 px-1.5 flex-1 min-h-0">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-600">
                No results for "{query}"
              </li>
            ) : (
              filtered.map(opt => {
                const isActive = opt.value === value
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center justify-between gap-3
                        px-3 py-2.5 rounded-xl text-sm text-left
                        transition-colors duration-100
                        ${isActive
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isActive && (
                        <Check size={14} className="shrink-0 text-amber-500" />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          flex items-center justify-between gap-2 w-full
          px-3.5 py-2.5 rounded-xl border text-sm font-medium
          transition-all duration-150 select-none text-left
          ${open
            ? 'border-amber-400 ring-2 ring-amber-400/25 bg-white dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-700'
          }
          text-gray-900 dark:text-gray-100
          ${triggerClassName}
        `}
      >
        <span className={`truncate flex-1 ${!selected ? 'text-gray-400 dark:text-gray-500' : ''}`}>
          {selected?.label ?? placeholder}
        </span>

        <span className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => e.key === 'Enter' && handleClear(e)}
              className="p-0.5 rounded-md text-gray-400 hover:text-gray-600
                         dark:hover:text-gray-200 transition-colors"
              aria-label="Clear selection"
            >
              <X size={13} />
            </span>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-gray-400 dark:text-gray-500"
          >
            <ChevronDown size={15} />
          </motion.span>
        </span>
      </button>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
