import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertTriangle,
  Users, UtensilsCrossed, CheckCircle2, Clock,
  LayoutGrid, List, Search,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED:  'OCCUPIED',
  RESERVED:  'RESERVED',
}

const STATUS_CONFIG = {
  [STATUS.AVAILABLE]: {
    label:     'Available',
    icon:      CheckCircle2,
    card:      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    badge:     'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    dot:       'bg-green-500',
    ring:      'ring-green-400/40',
    headerBg:  'bg-green-500',
  },
  [STATUS.OCCUPIED]: {
    label:     'Occupied',
    icon:      UtensilsCrossed,
    card:      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    badge:     'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    dot:       'bg-red-500',
    ring:      'ring-red-400/40',
    headerBg:  'bg-red-500',
  },
  [STATUS.RESERVED]: {
    label:     'Reserved',
    icon:      Clock,
    card:      'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    badge:     'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dot:       'bg-amber-500',
    ring:      'ring-amber-400/40',
    headerBg:  'bg-amber-500',
  },
}

const STATUS_CYCLE = [STATUS.AVAILABLE, STATUS.OCCUPIED, STATUS.RESERVED]

const SEED_TABLES = [
  { id:  1, number: 'T-01', capacity: 2, status: STATUS.AVAILABLE, note: '' },
  { id:  2, number: 'T-02', capacity: 2, status: STATUS.OCCUPIED,  note: 'Kamal Perera' },
  { id:  3, number: 'T-03', capacity: 4, status: STATUS.AVAILABLE, note: '' },
  { id:  4, number: 'T-04', capacity: 4, status: STATUS.RESERVED,  note: 'Nimal — 7:30 PM' },
  { id:  5, number: 'T-05', capacity: 4, status: STATUS.OCCUPIED,  note: 'Sanduni Fernando' },
  { id:  6, number: 'T-06', capacity: 6, status: STATUS.AVAILABLE, note: '' },
  { id:  7, number: 'T-07', capacity: 6, status: STATUS.AVAILABLE, note: '' },
  { id:  8, number: 'T-08', capacity: 6, status: STATUS.OCCUPIED,  note: 'Group of 5' },
  { id:  9, number: 'T-09', capacity: 8, status: STATUS.RESERVED,  note: 'Birthday party — 8 PM' },
  { id: 10, number: 'T-10', capacity: 8, status: STATUS.AVAILABLE, note: '' },
  { id: 11, number: 'T-11', capacity: 2, status: STATUS.AVAILABLE, note: '' },
  { id: 12, number: 'T-12', capacity: 4, status: STATUS.OCCUPIED,  note: 'Chamara Bandara' },
]

const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12]

const STATUS_FILTER_OPTIONS = [
  { value: 'all',              label: 'All Tables'  },
  { value: STATUS.AVAILABLE,   label: 'Available'   },
  { value: STATUS.OCCUPIED,    label: 'Occupied'    },
  { value: STATUS.RESERVED,    label: 'Reserved'    },
]

// ─────────────────────────────────────────────────────────────────────────────
// TABLE FORM MODAL (Add / Edit)
// ─────────────────────────────────────────────────────────────────────────────
function TableFormModal({ initialData, onSave, onCancel }) {
  const isEdit = Boolean(initialData)
  const [number,   setNumber]   = useState(initialData?.number   ?? '')
  const [capacity, setCapacity] = useState(initialData?.capacity ?? 4)
  const [status,   setStatus]   = useState(initialData?.status   ?? STATUS.AVAILABLE)
  const [note,     setNote]     = useState(initialData?.note     ?? '')
  const [errors,   setErrors]   = useState({})

  function validate() {
    const e = {}
    if (!number.trim()) e.number = 'Table number is required.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ number: number.trim(), capacity, status, note: note.trim() })
  }

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm
     bg-white dark:bg-gray-800
     border text-gray-900 dark:text-gray-100
     placeholder:text-gray-400 dark:placeholder:text-gray-600
     focus:outline-none focus:ring-2 transition-colors
     ${hasErr
       ? 'border-red-400 dark:border-red-500 focus:ring-red-400/30'
       : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
     }`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-md shadow-2xl border
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                      max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`relative overflow-hidden shrink-0
                         ${isEdit
                           ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600'
                           : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                         }`}>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3 px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl
                            flex items-center justify-center shrink-0">
              <LayoutGrid size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">
                {isEdit ? `Edit Table ${initialData.number}` : 'Add New Table'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">
                {isEdit ? 'Update table details' : 'Configure the new table'}
              </p>
            </div>
            <button onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30
                         flex items-center justify-center text-white transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">

            {/* Table Number */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                uppercase tracking-wide block mb-1.5">
                Table Number / Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={number}
                onChange={e => { setNumber(e.target.value); setErrors(p => ({ ...p, number: '' })) }}
                placeholder="e.g. T-01 or VIP-1"
                autoFocus
                className={inputCls(!!errors.number)}
              />
              {errors.number && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> {errors.number}
                </p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                uppercase tracking-wide block mb-1.5">
                Seating Capacity
              </label>
              <div className="flex gap-2 flex-wrap">
                {CAPACITY_OPTIONS.map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setCapacity(cap)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold
                               border transition-all duration-150 active:scale-95
                               ${capacity === cap
                                 ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                 : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700'
                               }`}
                  >
                    <Users size={13} /> {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                uppercase tracking-wide block mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(STATUS).map(s => {
                  const cfg  = STATUS_CONFIG[s]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2
                                 text-xs font-semibold transition-all duration-150 active:scale-95
                                 ${status === s
                                   ? `${cfg.card} border-current ring-2 ${cfg.ring}`
                                   : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                 }`}
                    >
                      <Icon size={16} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400
                                uppercase tracking-wide block mb-1.5">
                Note <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Customer name or reservation detail"
                className={inputCls(false)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-2 flex gap-3 shrink-0 sticky bottom-0 z-10
                          border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900">
            <button type="submit"
              className={`flex-1 flex items-center justify-center gap-2
                         px-4 py-2.5 rounded-xl font-semibold text-sm text-white
                         transition-all shadow-md
                         ${isEdit
                           ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 hover:opacity-90'
                           : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 hover:opacity-90'
                         }`}>
              {isEdit ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Add Table</>}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                         bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                         text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ table, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden
                      bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b
                        bg-gradient-to-r from-red-100 to-red-50
                        dark:from-red-600/20 dark:to-red-500/10
                        border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                            bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Remove Table</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            This will permanently remove the table from the floor plan.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border
                        text-gray-900 dark:text-white
                        bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            {table.number} · {table.capacity} seats
          </p>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white
                       bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600
                       transition-all flex items-center justify-center gap-2">
            <Trash2 size={15} /> Remove
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
// TABLE CARD (grid view)
// ─────────────────────────────────────────────────────────────────────────────
function TableCard({ table, onCycleStatus, onEdit, onDelete }) {
  const cfg  = STATUS_CONFIG[table.status]
  const Icon = cfg.icon

  return (
    <div className={`group relative rounded-2xl border-2 p-4 flex flex-col gap-3
                     transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
                     cursor-default ${cfg.card}`}>

      {/* Status dot + number */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
            {table.number}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Users size={11} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{table.capacity} seats</span>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.headerBg}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>

      {/* Status badge — click to cycle */}
      <button
        onClick={() => onCycleStatus(table.id)}
        title="Click to change status"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                   text-xs font-semibold border self-start
                   transition-all duration-150 active:scale-95
                   hover:opacity-80 ${cfg.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </button>

      {/* Note */}
      {table.note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-snug">
          {table.note}
        </p>
      )}

      {/* Action buttons — appear on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100
                      transition-opacity duration-150">
        <button
          onClick={() => onEdit(table)}
          aria-label={`Edit ${table.number}`}
          title="Edit"
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500
                     hover:text-blue-600 dark:hover:text-blue-400
                     hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(table)}
          aria-label={`Remove ${table.number}`}
          title="Remove"
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500
                     hover:text-red-600 dark:hover:text-red-400
                     hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function TableManagementPage() {
  const [tables,       setTables]       = useState(SEED_TABLES)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode,     setViewMode]     = useState('grid')   // 'grid' | 'list'
  const [formTarget,   setFormTarget]   = useState(null)     // null=closed, {}=add, table=edit
  const [deleteTarget, setDeleteTarget] = useState(null)

  // ── Auto-switch to grid on mobile (< 768px) ──────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setViewMode(e.matches ? 'grid' : 'grid') // grid is default; keep grid on mobile
    if (mq.matches) setViewMode('grid')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const nextId = useMemo(() => Math.max(...tables.map(t => t.id)) + 1, [tables])

  // ── Filtered tables ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tables.filter(t => {
      const matchSearch = !q || t.number.toLowerCase().includes(q) || t.note.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [tables, search, statusFilter])

  // ── Summary counts ───────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    available: tables.filter(t => t.status === STATUS.AVAILABLE).length,
    occupied:  tables.filter(t => t.status === STATUS.OCCUPIED).length,
    reserved:  tables.filter(t => t.status === STATUS.RESERVED).length,
  }), [tables])

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleCycleStatus(id) {
    setTables(prev => prev.map(t => {
      if (t.id !== id) return t
      const idx  = STATUS_CYCLE.indexOf(t.status)
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
      return { ...t, status: next, note: next === STATUS.AVAILABLE ? '' : t.note }
    }))
  }

  function handleSave({ number, capacity, status, note }) {
    if (formTarget?.id) {
      setTables(prev => prev.map(t =>
        t.id === formTarget.id ? { ...t, number, capacity, status, note } : t
      ))
    } else {
      setTables(prev => [...prev, { id: nextId, number, capacity, status, note }])
    }
    setFormTarget(null)
  }

  function handleDelete(id) {
    setTables(prev => prev.filter(t => t.id !== id))
    setDeleteTarget(null)
  }

  const hasFilter = search || statusFilter !== 'all'

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tables</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {tables.length} tables · {counts.available} available · {counts.occupied} occupied · {counts.reserved} reserved
          </p>
        </div>
        <button
          onClick={() => setFormTarget({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                     bg-gradient-to-r from-amber-500 to-orange-500 text-white
                     hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20 shrink-0"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      {/* ── Summary stat pills ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { status: STATUS.AVAILABLE, count: counts.available },
          { status: STATUS.OCCUPIED,  count: counts.occupied  },
          { status: STATUS.RESERVED,  count: counts.reserved  },
        ].map(({ status, count }) => {
          const cfg  = STATUS_CONFIG[status]
          const Icon = cfg.icon
          const isActive = statusFilter === status
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? 'all' : status)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2
                         transition-all duration-150 active:scale-[0.98]
                         ${isActive
                           ? `${cfg.card} border-current ring-2 ${cfg.ring}`
                           : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                         }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.headerBg}`}>
                <Icon size={16} className="text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">
                  {count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cfg.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2
                      p-3 rounded-2xl border
                      bg-white dark:bg-gray-800/30
                      border-gray-200 dark:border-gray-700/50">

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[180px]
                        bg-gray-50 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700/50">
          <Search size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by table number or note…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm
                       text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0">
          {[
            { mode: 'grid', Icon: LayoutGrid },
            { mode: 'list', Icon: List       },
          ].map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-label={`${mode} view`}
              className={`p-2 rounded-lg transition-all duration-150
                         ${viewMode === mode
                           ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                           : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                         }`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        {/* Clear */}
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700
                       transition-colors shrink-0"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3
                          bg-white dark:bg-gray-900 rounded-2xl border
                          border-gray-200 dark:border-gray-800">
            <LayoutGrid size={32} className="text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
              No tables match your filters
            </p>
          </div>
        ) : (
          <div className="grid gap-3
                          grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map(table => (
              <TableCard
                key={table.id}
                table={table}
                onCycleStatus={handleCycleStatus}
                onEdit={t => setFormTarget(t)}
                onDelete={t => setDeleteTarget(t)}
              />
            ))}
          </div>
        )
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border overflow-hidden
                        bg-white dark:bg-gray-900
                        border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800/60
                               border-gray-200 dark:border-gray-700/50">
                  {['Table', 'Capacity', 'Status', 'Note', 'Actions'].map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold
                                 text-gray-400 dark:text-gray-500
                                 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
                        No tables match your filters
                      </p>
                    </td>
                  </tr>
                ) : filtered.map(table => {
                  const cfg  = STATUS_CONFIG[table.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={table.id}
                      className="bg-white dark:bg-gray-900
                                 hover:bg-amber-50/50 dark:hover:bg-gray-800/30
                                 transition-colors duration-150">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {table.number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                                         text-gray-600 dark:text-gray-400">
                          <Users size={12} /> {table.capacity} seats
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleCycleStatus(table.id)}
                          title="Click to change status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                     text-xs font-semibold border transition-all active:scale-95
                                     hover:opacity-80 ${cfg.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                        {table.note || <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setFormTarget(table)}
                            aria-label={`Edit ${table.number}`} title="Edit"
                            className="p-2 rounded-xl transition-colors
                                       text-gray-400 dark:text-gray-500
                                       hover:text-blue-600 dark:hover:text-blue-400
                                       hover:bg-blue-50 dark:hover:bg-blue-500/10">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(table)}
                            aria-label={`Remove ${table.number}`} title="Remove"
                            className="p-2 rounded-xl transition-colors
                                       text-gray-400 dark:text-gray-500
                                       hover:text-red-600 dark:hover:text-red-400
                                       hover:bg-red-50 dark:hover:bg-red-500/10">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {hasFilter && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Showing {filtered.length} of {tables.length} tables
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {formTarget !== null && (
        <TableFormModal
          initialData={formTarget?.id ? formTarget : null}
          onSave={handleSave}
          onCancel={() => setFormTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          table={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
