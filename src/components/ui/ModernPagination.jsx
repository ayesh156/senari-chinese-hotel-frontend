/**
 * ModernPagination
 * ─────────────────────────────────────────────────────────────────────────────
 * Screenshot-accurate pagination component.
 *
 * Left  : "Showing {start} to {end} of {total} results"
 * Right : << < [pages] > >>
 *
 * Active page  : orange→red gradient, white text, shadow
 * Inactive btn : dark/gray bg, muted text, hover lift
 *
 * Props
 * ─────
 * currentPage   number   1-based current page
 * totalPages    number   total number of pages
 * totalItems    number   total record count (for "Showing X to Y of Z")
 * itemsPerPage  number   records per page
 * onPageChange  fn(page) called with new 1-based page number
 */
export default function ModernPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  if (totalPages <= 1) return null

  const start = (currentPage - 1) * itemsPerPage + 1
  const end   = Math.min(currentPage * itemsPerPage, totalItems)

  // ── Build page-number window ──────────────────────────────────────────────
  // Always show: first, last, current ±1, with "…" gaps
  function buildPages() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = new Set([1, totalPages, currentPage])
    if (currentPage > 1) pages.add(currentPage - 1)
    if (currentPage < totalPages) pages.add(currentPage + 1)

    const sorted = [...pages].sort((a, b) => a - b)
    const result = []
    let prev = 0
    for (const p of sorted) {
      if (p - prev > 1) result.push('…')
      result.push(p)
      prev = p
    }
    return result
  }

  const pages = buildPages()

  // ── Shared button base classes ────────────────────────────────────────────
  const base =
    'inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold transition-all duration-150 select-none'

  const activeBtn =
    `${base} bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30 scale-105`

  const inactiveBtn =
    `${base} bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
     hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
     hover:-translate-y-px`

  const navBtn = (disabled) =>
    `${base} ${
      disabled
        ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:-translate-y-px'
    }`

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3
                    px-4 py-4 border-t border-gray-100 dark:border-gray-800">

      {/* Left: result count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
        Showing{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{start}</span>
        {' '}to{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{end}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{totalItems}</span>
        {' '}results
      </p>

      {/* Right: navigation controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">

        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          className={navBtn(currentPage === 1)}
        >
          «
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={navBtn(currentPage === 1)}
        >
          ‹
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              className="inline-flex items-center justify-center min-w-[36px] h-9 px-1
                         text-sm text-gray-400 dark:text-gray-600 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              className={p === currentPage ? activeBtn : inactiveBtn}
            >
              {p}
            </button>
          )
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={navBtn(currentPage === totalPages)}
        >
          ›
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          className={navBtn(currentPage === totalPages)}
        >
          »
        </button>
      </div>
    </div>
  )
}
