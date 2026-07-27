import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Filter, X, ChevronLeft, ChevronRight,
  Shield, Eye, RefreshCw, Calendar, Clock, User,
  Activity, Info, FileText,
} from 'lucide-react'
import { getAuditLogs } from '../../api/audit.api'

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BADGE STYLES
// ─────────────────────────────────────────────────────────────────────────────
const ACTION_STYLES = {
  CREATE:              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  UPDATE:              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  DELETE:              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  LOGIN:               'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  LOGIN_FAILED:        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  PRICE_CHANGE:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  INVENTORY_ADJUSTMENT:'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  STATUS_CHANGE:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  PASSWORD_RESET:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  ROLE_CHANGE:         'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  LOGOUT:              'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

const ROLE_STYLES = {
  ADMIN:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  CASHIER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  STAFF:   'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

const ENTITY_OPTIONS = [
  'Order', 'FoodItem', 'Category', 'Unit', 'Inventory',
  'User', 'Customer', 'Supplier', 'PurchaseOrder', 'Invoice',
  'Settings', 'Table', 'Auth',
]

const ACTION_OPTIONS = Object.keys(ACTION_STYLES)

// ─────────────────────────────────────────────────────────────────────────────
// DETAILS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DetailsModal({ log, onClose }) {
  if (!log) return null

  const detailsStr = log.details
    ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2))
    : 'No details recorded'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <FileText size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Audit Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</span>
              <span className={`mt-1 inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-700'}`}>
                {log.action}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Entity</span>
              <p className="mt-1 text-gray-900 dark:text-gray-100 font-medium">{log.entity}{log.entityId ? ` #${log.entityId}` : ''}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">User</span>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{log.userName || 'System'}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</span>
              {log.userRole && (
                <span className={`mt-1 inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLES[log.userRole] || ''}`}>
                  {log.userRole}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Timestamp</span>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{formatTimestamp(log.createdAt)}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">IP Address</span>
              <p className="mt-1 text-gray-900 dark:text-gray-100 font-mono text-xs">{log.ipAddress || '—'}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Details Payload</span>
            <pre className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {detailsStr}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold
                       bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                       hover:bg-gray-200 dark:hover:bg-gray-600
                       border border-gray-200 dark:border-gray-600 transition-colors min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatTimestamp(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`
  } catch {
    return dateStr
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AuditLogTab() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entity: '',
    from: '',
    to: '',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef(null)

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search)
      setPage(1)
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [filters.search])

  // Reset page when other filters change
  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', action: '', entity: '', from: '', to: '' })
    setDebouncedSearch('')
    setPage(1)
  }

  const hasFilters = filters.search || filters.action || filters.entity || filters.from || filters.to

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (debouncedSearch) params.search = debouncedSearch
      if (filters.action) params.action = filters.action
      if (filters.entity) params.entity = filters.entity
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to

      const res = await getAuditLogs(params)
      if (res.success) {
        setLogs(res.data.data)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, filters.action, filters.entity, filters.from, filters.to])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter Bar ── */}
      <div className="bg-amber-50 dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-md dark:shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-amber-500" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filters</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search user, ID, details..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                         bg-white dark:bg-gray-900
                         border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100
                         placeholder:text-gray-400 dark:placeholder:text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-amber-400/40
                         transition-colors min-h-[40px]"
            />
          </div>

          {/* Action */}
          <select
            value={filters.action}
            onChange={e => setFilter('action', e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm
                       bg-white dark:bg-gray-900
                       border border-gray-200 dark:border-gray-700
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-amber-400/40
                       transition-colors min-h-[40px]"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Entity */}
          <select
            value={filters.entity}
            onChange={e => setFilter('entity', e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm
                       bg-white dark:bg-gray-900
                       border border-gray-200 dark:border-gray-700
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-amber-400/40
                       transition-colors min-h-[40px]"
          >
            <option value="">All Entities</option>
            {ENTITY_OPTIONS.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {/* Date from */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filters.from}
              onChange={e => setFilter('from', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                         bg-white dark:bg-gray-900
                         border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100
                         dark:[color-scheme:dark]
                         focus:outline-none focus:ring-2 focus:ring-amber-400/40
                         transition-colors min-h-[40px]"
              title="From date"
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filters.to}
              onChange={e => setFilter('to', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                         bg-white dark:bg-gray-900
                         border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-gray-100
                         dark:[color-scheme:dark]
                         focus:outline-none focus:ring-2 focus:ring-amber-400/40
                         transition-colors min-h-[40px]"
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          {loading ? 'Loading...' : `${total} log${total !== 1 ? 's' : ''} found`}
        </span>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400
                     hover:underline disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-amber-50 dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-md dark:shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 dark:border-gray-700 bg-amber-100/50 dark:bg-gray-700/50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    Timestamp
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    User
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} />
                    Action
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} />
                    Entity
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">IP</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Info size={12} />
                    Details
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-gray-700">
              {loading && logs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}
                    className="hover:bg-amber-100/40 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.userName || <span className="text-gray-400 italic">System</span>}
                        </span>
                        {log.userRole && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROLE_STYLES[log.userRole] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {log.userRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 font-mono">
                          #{log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                                   text-amber-600 dark:text-amber-400
                                   bg-amber-100 dark:bg-amber-900/30
                                   hover:bg-amber-200 dark:hover:bg-amber-900/50
                                   border border-amber-200 dark:border-amber-800
                                   transition-colors min-h-[32px]"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400
                         border border-gray-200 dark:border-gray-700
                         hover:bg-gray-100 dark:hover:bg-gray-700
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors min-h-[40px]"
            >
              <ChevronLeft size={14} />
              Prev
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                                ${page === pageNum
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400
                         border border-gray-200 dark:border-gray-700
                         hover:bg-gray-100 dark:hover:bg-gray-700
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors min-h-[40px]"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Details Modal ── */}
      <DetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  )
}