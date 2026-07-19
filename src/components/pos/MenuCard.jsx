import { useState } from 'react';
import { Plus, Utensils } from 'lucide-react';
import { fmtCurrencyDirect } from '../../utils/currency';
import { useSettingsStore } from '../../utils/settingsStore';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const fmt = (n) => Number(n).toLocaleString('en-LK');

function getFullImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

function MenuCardImage({ image }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = !!image && !imgError;
  if (!hasImage) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <Utensils size={32} className="text-gray-400" />
      </div>
    );
  }
  return (
    <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img src={getFullImageUrl(image)} alt=""
        onError={() => setImgError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy" />
    </div>
  );
}

export default function MenuCard({ item, qty, onAdd }) {
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.')
  return (

    <button onClick={onAdd}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
      <MenuCardImage image={item.image} />
      {item.isNew && (
        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
      )}
      {qty > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{qty}</div>
      )}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{item.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-1 font-bold">{currencySymbol} {fmt(item.price)}</p>
      </div>
      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
        <Plus size={14} />
      </div>
    </button>
  );
}