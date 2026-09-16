import { useState } from 'react';
import { Plus, Utensils, Pin } from 'lucide-react'; // 🌟 Added Pin icon
import { fmtCurrencyDirect } from '../../utils/currency';
import { useSettingsStore } from '../../utils/settingsStore';
import { useFoodStore } from '../../utils/foodStore'; // 🌟 Added foodStore for instant pin/unpin

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
    <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-950/80 dark:bg-gray-950/90 flex items-center justify-center">
      <img
        src={getFullImageUrl(image)}
        alt=""
        onError={() => setImgError(true)}
        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
}

export default function MenuCard({ item, qty, onAdd }) {
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.')
  const updateFood = useFoodStore(s => s.update); // 🌟 Direct store update hook

  // 🌟 Toggle Pin / Featured status without triggering cart addition
  const handleTogglePin = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await updateFood(item.id, { isFeatured: !item.isFeatured });
  };

  return (
    <button onClick={onAdd}
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
        item.isFeatured
          ? 'border-amber-400/80 dark:border-amber-500/60 ring-1 ring-amber-400/30'
          : 'border-gray-100 dark:border-gray-800'
      }`}>
      <MenuCardImage image={item.image} />

      {/* 🌟 Interactive Creative Pin Action (Visible always if pinned, or on hover to pin) */}
      <span
        role="button"
        tabIndex={0}
        onClick={handleTogglePin}
        title={item.isFeatured ? "Unpin item" : "Pin item to top"}
        className={`absolute top-2 left-2 z-10 p-1.5 rounded-xl backdrop-blur-md transition-all duration-200 shadow-md ${
          item.isFeatured
            ? 'bg-amber-500 text-white shadow-amber-500/40 opacity-100 scale-100 ring-2 ring-white/60 dark:ring-gray-900/60'
            : 'bg-gray-900/60 text-white/80 hover:text-white hover:bg-amber-500 opacity-0 group-hover:opacity-100 hover:scale-110'
        }`}
      >
        <Pin size={12} className={item.isFeatured ? "fill-white rotate-45" : ""} />
      </span>

    {/* 🌟 Food Code Badge (Smart alignment based on pin visibility) */}
      {item.code && (
        <span className={`absolute top-2 z-10 bg-gray-950/85 dark:bg-gray-900/90 text-amber-400 border border-amber-400/40 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm uppercase tracking-wider ${
          item.isFeatured ? 'left-10' : 'left-2 group-hover:left-10 transition-all duration-200'
        }`}>
          {item.code}
        </span>
      )}
      
      {item.isNew && !item.isFeatured && (
        <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
      )}
      {qty > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{qty}</div>
      )}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{item.name}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-auto pt-1 font-extrabold tabular-nums">
          {fmtCurrencyDirect(item.price)}
        </p>
      </div>
      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
        <Plus size={14} />
      </div>
    </button>
  );
}