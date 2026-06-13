import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ArrowUp } from 'lucide-react'

const WA_URL = 'https://wa.me/94762801006?text=Hello%20Senari%20Chinese%20Hotel!'
const SCROLL_THRESHOLD = 300

// ── Shared button motion variants ─────────────────────────────────────────────
const btnVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  exit:   { scale: 0, opacity: 0, transition: { duration: 0.15 } },
}

// ── Tooltip wrapper ───────────────────────────────────────────────────────────
function FAB({ onClick, href, label, className, children }) {
  const base = `group relative flex items-center justify-center
                w-12 h-12 rounded-full shadow-lg
                transition-transform duration-150 active:scale-90 ${className}`

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
         aria-label={label} className={base}>
        {children}
        <Tooltip label={label} />
      </a>
    )
  }
  return (
    <button onClick={onClick} aria-label={label} className={base}>
      {children}
      <Tooltip label={label} />
    </button>
  )
}

function Tooltip({ label }) {
  return (
    <span className="pointer-events-none absolute right-14 whitespace-nowrap
                     bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium
                     px-2.5 py-1.5 rounded-lg shadow
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloatingActionButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > SCROLL_THRESHOLD)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    /*
     * Positioned bottom-6 right-6.
     * On mobile the SlideCart panel slides in from the right and sits at z-50.
     * FABs are z-40 so they sit below the open cart panel — no overlap.
     * mb-safe adds extra breathing room on devices with home indicators.
     */
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40"
         role="group" aria-label="Quick actions">

      {/* WhatsApp — always visible */}
      <motion.div
        variants={btnVariants}
        initial="hidden"
        animate="visible"
      >
        <FAB
          href={WA_URL}
          label="Chat on WhatsApp"
          className="bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-green-300 dark:shadow-green-900/40"
        >
          <MessageCircle size={22} strokeWidth={2} />
        </FAB>
      </motion.div>

      {/* Scroll to top — only when scrolled past threshold */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            key="scroll-top"
            variants={btnVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <FAB
              onClick={scrollToTop}
              label="Back to top"
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900/40"
            >
              <ArrowUp size={20} strokeWidth={2.5} />
            </FAB>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
