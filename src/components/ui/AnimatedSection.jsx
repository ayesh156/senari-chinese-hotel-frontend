import { motion } from 'framer-motion'

/**
 * AnimatedSection
 * Wraps children in a scroll-reveal motion.div.
 *
 * Props:
 *   delay    {number}  — stagger delay in seconds (default 0)
 *   duration {number}  — animation duration in seconds (default 0.5)
 *   y        {number}  — initial vertical offset in px (default 20)
 *   className {string} — extra Tailwind classes forwarded to the wrapper
 *   children  {node}   — content to animate
 */
export default function AnimatedSection({
  children,
  delay    = 0,
  duration = 0.5,
  y        = 20,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
