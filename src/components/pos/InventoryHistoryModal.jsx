import { useState, useEffect } from 'react';
import { History, X, Loader2, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../../api/inventory.api';

function fmtDateTime(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
  };
}

function fmtQty(n) {
  return Number.isInteger(Number(n)) ? String(Number(n)) : Number(n).toFixed(1);
}

export default function InventoryHistoryModal({ item, onCancel }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    inventoryApi.getHistory(item.id)
      .then(json => {
        if (cancelled) return;
        const data = Array.isArray(json.data) ? json.data : [];
        setRecords(data);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [item.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden shrink-0 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600">
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <History size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">Stock Ledger</h2>
              <p className="text-white/70 text-xs mt-0.5 truncate">{item.itemName} ({item.sku})</p>
            </div>
            <button type="button" onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-amber-500 animate-spin" />
              <p className="text-sm text-gray-400">Loading ledger entries…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertTriangle size={28} className="text-red-400" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <History size={32} className="text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No stock adjustment history yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Header row */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <span>Date</span>
                <span>Reason / Note</span>
                <span className="text-right">Qty Δ</span>
                <span className="text-right">Before</span>
                <span className="text-right">After</span>
              </div>
              {/* Entry rows */}
              {records.map((rec) => {
                const { date, time } = fmtDateTime(rec.createdAt);
                const qty = Number(rec.quantity);
                const isPositive = qty >= 0;
                return (
                  <div key={rec.id}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 py-2.5 rounded-xl
                               text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <p>{date}</p>
                      <p className="text-[10px] text-gray-400">{time}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {rec.adjustmentType || rec.notes || 'Manual adjustment'}
                      </p>
                      {rec.notes && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {rec.notes}
                        </p>
                      )}
                    </div>
                    <div className={`text-right text-xs font-bold tabular-nums whitespace-nowrap ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{fmtQty(qty)}
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      {fmtQty(rec.previousStock)}
                    </div>
                    <div className="text-right text-xs font-bold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
                      {fmtQty(rec.newStock)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <button type="button" onClick={onCancel}
            className="w-full px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors
                       bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}