import { useState, useMemo, useEffect } from 'react';
import { fmtCurrencyDirect } from '../../utils/currency';
import {
  Search, X, Plus, Pencil, Trash2,
  Users, UtensilsCrossed, Clock, Circle,
  AlertTriangle, LayoutGrid,
} from 'lucide-react';
import { useTableStore } from '../../utils/tableStore';

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    color: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
    gradient: 'from-green-500 to-emerald-600',
  },
  OCCUPIED: {
    label: 'Occupied',
    color: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-400 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
    gradient: 'from-red-500 to-rose-600',
  },
  RESERVED: {
    label: 'Reserved',
    color: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-400 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    gradient: 'from-amber-500 to-orange-600',
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AVAILABLE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-green-500 animate-pulse' : status === 'OCCUPIED' ? 'bg-red-500' : 'bg-amber-500'}`} />
      {cfg.label}
    </span>
  );
}

// ── Quick Add Modal ─────────────────────────────────────────────────────────
function AddTableModal({ onSave, onCancel }) {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!tableNumber.trim()) e.tableNumber = 'Table number is required.';
    if (!capacity || capacity < 1) e.capacity = 'Capacity must be at least 1.';
    if (capacity > 50) e.capacity = 'Capacity seems too high.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ tableNumber: tableNumber.trim().toUpperCase(), capacity: parseInt(capacity, 10), notes: notes.trim() || undefined });
  }

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-colors ${
      hasErr ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
    }`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 relative overflow-hidden shrink-0">
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <Plus size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">Add New Table</h2>
              <p className="text-white/70 text-xs mt-0.5">Register a new dining table</p>
            </div>
            <button type="button" onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Table Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  autoFocus
                  onChange={(e) => { setTableNumber(e.target.value); setErrors((p) => ({ ...p, tableNumber: '' })); }}
                  placeholder="e.g. T1, VIP-1"
                  className={inputCls(!!errors.tableNumber)}
                />
                {errors.tableNumber && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10} />{errors.tableNumber}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => { setCapacity(e.target.value); setErrors((p) => ({ ...p, capacity: '' })); }}
                  className={inputCls(!!errors.capacity)}
                />
                {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Location, special features, etc."
                  className={`${inputCls(false)} resize-none`}
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 hover:opacity-90"
            >
              <Plus size={15} /> Add Table
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit/Update Status Modal ────────────────────────────────────────────────
function EditTableModal({ table, onSave, onCancel }) {
  const [status, setStatus] = useState(table.status);
  const [notes, setNotes] = useState(table.notes || '');
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    if (!status) {
      setErrors({ status: 'Please select a status.' });
      return;
    }
    onSave({
      id: table.id,
      status,
      reservationNotes: notes.trim() || undefined,
    });
  }

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-colors ${
      hasErr ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
    }`;

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', color: 'bg-green-500' },
    { value: 'OCCUPIED', label: 'Occupied', color: 'bg-red-500' },
    { value: 'RESERVED', label: 'Reserved', color: 'bg-amber-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-teal-600 relative overflow-hidden shrink-0">
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <Pencil size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">Edit — Table {table.tableNumber}</h2>
              <p className="text-white/70 text-xs mt-0.5">Change status or update notes</p>
            </div>
            <button type="button" onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-5">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
                  Table Status <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {statusOptions.map((opt) => {
                    const isActive = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setStatus(opt.value); setErrors((p) => ({ ...p, status: '' })); }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? `${opt.color} text-white border-transparent shadow-md`
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-white' : opt.color}`} />
                        <span className="text-xs font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.status && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10} />{errors.status}</p>}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                <Users size={16} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Capacity: <strong className="text-gray-900 dark:text-white">{table.capacity}</strong> seats
                </span>
              </div>

              {table.currentOrder && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <UtensilsCrossed size={16} className="text-red-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">Active Order</span>
                    <span className="text-sm text-red-700 dark:text-red-300">#{table.currentOrder.invoiceNumber} — {fmtCurrencyDirect(table.currentOrder.total)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Notes / Reservation Details</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this table..."
                  className={`${inputCls(false)} resize-none`}
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:opacity-90"
            >
              <Pencil size={15} /> Save Changes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteTableModal({ table, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50">
        <div className="p-6 border-b bg-gradient-to-r from-red-100 to-red-50 dark:from-red-600/20 dark:to-red-500/10 border-red-200 dark:border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-500/20">
              <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Table</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            This action cannot be undone. The table record will be permanently removed.
          </p>
          <p className="text-sm font-semibold p-3 rounded-xl border text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            Table {table.tableNumber} · {table.capacity} seats · {STATUS_CONFIG[table.status]?.label || table.status}
          </p>
          {table.status === 'OCCUPIED' && (
            <p className="text-xs text-red-500 mt-3 flex items-center gap-1">
              <AlertTriangle size={12} /> Cannot delete an occupied table. Clear it first.
            </p>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={table.status === 'OCCUPIED'}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${
              table.status === 'OCCUPIED'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
            }`}
          >
            <Trash2 size={15} /> Delete
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600/50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Page ──────────────────────────────────────────────────────
const STATUS_ORDER = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];

export default function TableManagementPage() {
  const { tables, loading, fetchAll, create, updateStatus, remove } = useTableStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((t) => {
      const matchSearch =
        !q ||
        t.tableNumber.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tables, search, statusFilter]);

  // Group by status for the grid layout
  const grouped = useMemo(() => {
    const groups = {};
    STATUS_ORDER.forEach((s) => {
      groups[s] = filtered.filter((t) => t.status === s);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === 'AVAILABLE').length;
    const occupied = tables.filter((t) => t.status === 'OCCUPIED').length;
    const reserved = tables.filter((t) => t.status === 'RESERVED').length;
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
    return { total, available, occupied, reserved, totalCapacity };
  }, [tables]);

  async function handleAdd(data) {
    const result = await create(data);
    if (result.success) setShowAddModal(false);
  }

  async function handleEdit(data) {
    const result = await updateStatus(data.id, {
      status: data.status,
      reservationNotes: data.reservationNotes,
    });
    if (result.success) setEditTarget(null);
  }

  async function handleDelete(id) {
    const result = await remove(id);
    if (result.success) setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Table Management</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {stats.total} tables · {stats.totalCapacity} total seats
            {loading && <span className="ml-2 text-amber-500">(loading…)</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20 w-full sm:w-auto"
        >
          <Plus size={16} /> Quick Add Table
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <LayoutGrid size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Tables</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
            <Circle size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-green-600 dark:text-green-400 tabular-nums">{stats.available}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Available</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">{stats.occupied}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Occupied</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{stats.reserved}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Reserved</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by table number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 min-w-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {[
              { value: 'ALL', label: 'All', color: 'bg-gray-400' },
              { value: 'AVAILABLE', label: 'Available', color: 'bg-green-500' },
              { value: 'OCCUPIED', label: 'Occupied', color: 'bg-red-500' },
              { value: 'RESERVED', label: 'Reserved', color: 'bg-amber-500' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === opt.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {search && (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            Showing {filtered.length} of {tables.length} tables
          </p>
        )}
      </div>

      {/* Grid Dashboard */}
      <div className="flex flex-col gap-6">
        {STATUS_ORDER.map((statusKey) => {
          const items = grouped[statusKey];
          const cfg = STATUS_CONFIG[statusKey];
          if (!items || items.length === 0) return null;

          return (
            <div key={statusKey} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${cfg.color}`} />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  {cfg.label}
                </h2>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-600">({items.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {items.map((table) => (
                  <div
                    key={table.id}
                    className={`group relative flex flex-col rounded-xl border-2 overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200 ${cfg.border}`}
                  >
                    {/* Compact card body */}
                    <div className="flex flex-col gap-1.5 p-3">
                      {/* Row 1: Avatar + Name + Status — all on one line */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm bg-gradient-to-br ${cfg.gradient} shrink-0`}>
                            {table.tableNumber.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-gray-100 truncate min-w-0">
                            {table.tableNumber}
                          </h3>
                        </div>
                        <StatusBadge status={table.status} />
                      </div>

                      {/* Row 2: Capacity badge + Note inline */}
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1 shrink-0">
                          <Users size={10} className="shrink-0" />
                          {table.capacity} {table.capacity === 1 ? 'seat' : 'seats'}
                        </span>

                        {table.currentOrder ? (
                          <span className="flex items-center gap-1 min-w-0 truncate text-red-500 dark:text-red-400 font-medium">
                            <UtensilsCrossed size={10} className="shrink-0" />
                            <span className="truncate">#{table.currentOrder.invoiceNumber}</span>
                            <span className="tabular-nums shrink-0">· {fmtCurrencyDirect(table.currentOrder.total)}</span>
                          </span>
                        ) : table.notes ? (
                          <span className="truncate opacity-60 italic">{table.notes}</span>
                        ) : null}
                      </div>

                      {/* Row 3: Compact action buttons */}
                      <div className="flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-gray-100 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setEditTarget(table)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors"
                        >
                          <Pencil size={10} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(table)}
                          disabled={table.status === 'OCCUPIED'}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                            table.status === 'OCCUPIED'
                              ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LayoutGrid size={40} className="text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
              {search || statusFilter !== 'ALL'
                ? 'No tables match your filters'
                : 'No tables yet — click "Quick Add Table" to get started'}
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading tables…</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <AddTableModal onSave={handleAdd} onCancel={() => setShowAddModal(false)} />}
      {editTarget && <EditTableModal table={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteTableModal table={deleteTarget} onConfirm={() => handleDelete(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}