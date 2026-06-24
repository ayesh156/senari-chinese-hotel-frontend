import { useState, useEffect } from 'react';
import { History, X, Loader2, AlertTriangle, Phone, Banknote, Bell } from 'lucide-react';
import { customerApi } from '../../api/customer.api';
import ModernPagination from '../ui/ModernPagination';

const PER_PAGE = 8;

function fmtDateTime(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
  };
}

function fmtCurrency(n) {
  return `Rs. ${Number(n).toLocaleString('en-LK')}`;
}

export default function CustomerHistoryModal({ customer, type = 'reminders', onCancel }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetcher = type === 'payments' ? customerApi.getPayments : customerApi.getReminders;
    fetcher(customer.id)
      .then(json => { if (!cancelled) { setRecords(Array.isArray(json.data) ? json.data : []); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [customer.id, type]);

  const totalPages = Math.max(1, Math.ceil(records.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = records.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const isPayments = type === 'payments';
  const gradient = isPayments ? 'from-emerald-600 via-teal-500 to-emerald-600' : 'from-violet-600 via-purple-500 to-indigo-600';
  const title = isPayments ? 'Payment History' : 'Reminder History';
  const Icon = isPayments ? Banknote : Bell;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`relative overflow-hidden shrink-0 bg-gradient-to-r ${gradient}`}>
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              <Icon size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{title}</h2>
              <p className="text-white/70 text-xs mt-0.5 truncate">{customer.name} · {records.length} {isPayments ? 'payment(s)' : 'reminder(s)'}</p>
            </div>
            <button type="button" onClick={onCancel} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0"><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="text-amber-500 animate-spin" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2"><AlertTriangle size={28} className="text-red-400" /><p className="text-sm text-red-500">{error}</p></div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2"><Icon size={32} className="text-gray-300 dark:text-gray-700" /><p className="text-sm font-medium text-gray-400">No {isPayments ? 'payments' : 'reminders'} yet</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <span>Date</span>
                <span>{isPayments ? 'Notes' : 'Message'}</span>
                <span className="text-right">{isPayments ? 'Amount' : 'Status'}</span>
              </div>
              {pageItems.map((rec) => {
                const { date, time } = fmtDateTime(rec.createdAt);
                return (
                  <div key={rec.id} className="grid grid-cols-[auto_1fr_auto] gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"><p>{date}</p><p className="text-[10px] text-gray-400">{time}</p></div>
                    <div className="min-w-0"><p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{rec.notes || rec.message || (isPayments ? `Payment of ${fmtCurrency(rec.amount)}` : 'Reminder sent')}</p></div>
                    <div className="text-right text-xs font-bold tabular-nums whitespace-nowrap">
                      {isPayments ? <span className="text-emerald-600">{fmtCurrency(rec.amount)}</span> : <span className="text-violet-500 capitalize">{rec.status}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && <ModernPagination currentPage={safePage} totalPages={totalPages} totalItems={records.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />}

        {/* Footer */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <button type="button" onClick={onCancel} className="w-full px-4 py-2.5 rounded-xl font-medium text-sm border transition-colors bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600">Close</button>
        </div>
      </div>
    </div>
  );
}