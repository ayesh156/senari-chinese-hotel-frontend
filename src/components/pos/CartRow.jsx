import { Plus, Minus, Trash2, Utensils } from 'lucide-react';
import { useSettingsStore } from '../../utils/settingsStore';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const fmt = (n) => Number(n).toLocaleString('en-LK');

function getFullImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export default function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.')
  return (
    <li className="group flex items-center gap-2.5 py-2.5 border-b border-gray-100 dark:border-gray-800/70 last:border-0">
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
        {item.image ? (
          <img src={getFullImageUrl(item.image)} alt=""
            onError={(e) => { e.target.style.display = 'none'; }}
            className="w-full h-full object-cover rounded-lg" />
        ) : <Utensils size={14} className="text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{item.name}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">{currencySymbol} {fmt(item.price)} × {item.quantity}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{currencySymbol} {fmt(item.price * item.quantity)}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={onDecrease} aria-label={item.quantity === 1 ? 'Remove' : 'Decrease'}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all active:scale-90 ${item.quantity === 1 ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-amber-500 hover:text-white'}`}>
            {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
          </button>
          <span className="w-6 text-center text-[13px] font-bold text-gray-900 dark:text-gray-100 select-none tabular-nums">{item.quantity}</span>
          <button onClick={onIncrease}
            className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-amber-500 hover:text-white transition-all active:scale-90">
            <Plus size={11} />
          </button>
        </div>
      </div>
    </li>
  );
}