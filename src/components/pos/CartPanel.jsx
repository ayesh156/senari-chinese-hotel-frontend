import { ShoppingCart } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import CartRow from './CartRow';
import { useSettingsStore } from '../../utils/settingsStore';

const DEFAULT_CUSTOMER_OPTIONS = [
  { value: 'walk-in', label: 'Walk-in Customer' },
];

const fmt = (n) => Number(n).toLocaleString('en-LK');

export default function CartPanel({
  cartItems, onIncrease, onDecrease, onRemove, onClear, onPay, isPaying,
  orderType, onOrderType, selectedCustomer, onCustomerChange,
  discount, discountType, onDiscount, onDiscountType, discountInputRef,
  customerCash, onCustomerCash, customerCashInputRef,
  ctaLabel, maxDiscountPercent, customerOptions,
}) {
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.')
  const options = customerOptions && customerOptions.length > 0 ? customerOptions : DEFAULT_CUSTOMER_OPTIONS;
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cartItems.reduce((s, i) => s + i.quantity, 0);
  const rawDiscount = parseFloat(discount) || 0;
  const discountAmt = discountType === '%'
    ? Math.min(subtotal, Math.round(subtotal * rawDiscount / 100))
    : Math.min(subtotal, rawDiscount);
  const total = Math.max(0, subtotal - discountAmt);
  const givenCash = parseFloat(customerCash) || 0;
  const change = givenCash - total;
  const hasChange = givenCash > 0 && change >= 0;
  const isShort = givenCash > 0 && change < 0;

  return (
    <aside className="flex flex-col w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
            <ShoppingCart size={16} className="text-amber-500" />
          </div>
          <h2 className="font-extrabold text-gray-900 dark:text-gray-100 text-[15px]">Ticket</h2>
          {count > 0 && <span className="bg-amber-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">{count}</span>}
        </div>
        {cartItems.length > 0 && (
          <button onClick={onClear} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors">Clear</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <ShoppingCart size={24} className="text-amber-300 dark:text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Ticket is empty</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Tap any item to add it here</p>
            </div>
          </div>
        ) : (
          <ul className="pt-1 pb-2">
            {cartItems.map((item) => (
              <CartRow
                key={item.id}
                item={item}
                onIncrease={() => onIncrease(item.id)}
                onDecrease={() => onDecrease(item.id)}
                onRemove={() => onRemove(item.id)}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-3 pb-4 space-y-3">
        <div className="space-y-2">
          <div className="w-full">
            <SearchableSelect
              options={options} value={selectedCustomer} onChange={onCustomerChange}
              placeholder="Customer" searchPlaceholder="Search customer…" clearable
              triggerClassName="py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {['Dine-in', 'Takeaway', 'Delivery'].map((t) => (
              <button key={t} onClick={() => onOrderType(t)}
                className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold transition-all ${orderType === t ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
              {['%', 'fixed'].map((t) => (
                <button key={t} onClick={() => { onDiscountType(t); onDiscount('') }}
                  className={`px-2.5 py-2 text-xs font-bold transition-colors ${discountType === t ? 'bg-amber-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'}`}>{t}</button>
              ))}
            </div>
            <input ref={discountInputRef} type="number" min="0" placeholder={discountType === '%' ? '0–100' : '0.00'}
              value={discount} onChange={(e) => onDiscount(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all" />
          </div>
          <input ref={customerCashInputRef} type="number" min="0" placeholder="Cash received"
            value={customerCash} onChange={(e) => onCustomerCash(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${hasChange ? 'border-emerald-400 dark:border-emerald-500' : isShort ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-amber-400'}`} />
          {givenCash > 0 && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${hasChange ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
              {hasChange ? 'Change' : 'Short by'}: {currencySymbol} {fmt(Math.abs(change))}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">Subtotal</span>
            <span className="text-xs font-semibold text-gray-600">{currencySymbol} {fmt(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between">
              <span className="text-xs font-medium text-emerald-600">Discount</span>
              <span className="text-xs font-semibold text-emerald-600">− {currencySymbol} {fmt(discountAmt)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-xl font-extrabold text-amber-600 tabular-nums">{currencySymbol} {fmt(total)}</span>
            </div>
          </div>
        </div>
        <button onClick={onPay} disabled={cartItems.length === 0 || isPaying}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[15px] py-4 rounded-2xl shadow-lg shadow-amber-500/40 transition-all">
          {isPaying ? (
            <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Processing…</>
          ) : <><span>💳</span>{ctaLabel}</>}
        </button>
      </div>
    </aside>
  );
}