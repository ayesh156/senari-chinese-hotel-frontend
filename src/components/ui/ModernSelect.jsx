import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

/**
 * ModernSelect — premium custom dropdown replacing native <select>.
 *
 * Props:
 *   options  {Array<{label: string, value: string}>}
 *   value    {string}   — currently selected value
 *   onChange {function} — called with the new value string
 *   className {string}  — optional extra classes on the trigger button
 */
export default function ModernSelect({ options = [], value, onChange, className = '' }) {
  const [open, setOpen]   = useState(false)
  const containerRef      = useRef(null)

  const selected = options.find(o => o.value === value) || options[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 w-full sm:w-48
                    px-4 py-2.5 rounded-xl border text-sm font-medium
                    transition-all duration-150 select-none
                    ${open
                      ? 'border-amber-400 ring-2 ring-amber-400/30 bg-white dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-700'
                    }
                    text-gray-900 dark:text-gray-100`}
      >
        <span className="truncate">{selected?.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-gray-400 dark:text-gray-500"
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50
                       bg-white dark:bg-gray-900
                       border border-gray-200 dark:border-gray-800
                       rounded-2xl shadow-xl overflow-hidden
                       min-w-[12rem]"
          >
            {options.map(opt => {
              const isActive = opt.value === value
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-3
                                px-4 py-2.5 text-sm text-left transition-colors
                                ${isActive
                                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                  >
                    <span>{opt.label}</span>
                    {isActive && <Check size={14} className="shrink-0 text-amber-500" />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
