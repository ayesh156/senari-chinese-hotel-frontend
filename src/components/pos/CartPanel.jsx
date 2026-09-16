import { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'; // 🌟 Added collapse icons
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
  
  // 🌟 Calculate Dine-in Service Charge from Settings store
  const isDineIn = orderType === 'Dine-in' || orderType === 'DINE_IN';
  const serviceChargeRate = isDineIn ? Number(useSettingsStore.getState().defaultServiceCharge || 0) : 0;
  const serviceChargeAmt = isDineIn ? Math.round((subtotal * serviceChargeRate) / 100) : 0;
  const total = Math.max(0, subtotal + serviceChargeAmt - discountAmt);

  // 🌟 Customer cash & change calculation (Fixes: givenCash is not defined)
  const givenCash = parseFloat(customerCash) || 0;
  const change = givenCash - total;
  const hasChange = givenCash > 0 && change >= 0;
  const isShort = givenCash > 0 && change < 0;

  // 🌟 World-class Collapsible Summary State: Collapsed gives maximum space for items
  const [isOptionsOpen, setIsOptionsOpen] = useState(true);

  return (
    <aside className="flex flex-col w-96 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden shrink-0 shadow-lg">
      {/* 🌟 Header Bar */}
      <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
            <ShoppingCart size={15} className="text-amber-500" />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-xs">Current Ticket</h2>
          {count > 0 && (
            <span className="bg-amber-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        {cartItems.length > 0 && (
          <button onClick={onClear} className="text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* 🌟 Expansive Items List (Occupies full vertical space) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <ShoppingCart size={24} className="text-amber-300 dark:text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Ticket is empty</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">Tap food items from menu to add</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5">
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

      {/* 🌟 Collapsible Order Preferences & Billing Controls */}
      <div className="shrink-0 border-t border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/80">
        {/* Accordion Toggle Bar */}
        <button
          type="button"
          onClick={() => setIsOptionsOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={13} className="text-amber-500" />
            <span>Order Options & Breakdown</span>
            {(selectedCustomer !== 'walk-in' || discountAmt > 0 || givenCash > 0) && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <span>{isOptionsOpen ? 'Collapse' : 'Expand'}</span>
            {isOptionsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </button>

        {/* Collapsible Body */}
        {isOptionsOpen && (
          <div className="p-3 space-y-2 border-b border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-2 duration-150">
            <div className="w-full">
              <SearchableSelect
                options={options}
                value={selectedCustomer}
                onChange={onCustomerChange}
                placeholder="Customer"
                searchPlaceholder="Search customer…"
                clearable
                triggerClassName="py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="flex gap-1 p-0.5 bg-gray-200/70 dark:bg-gray-800 rounded-xl">
              {['Dine-in', 'Takeaway', 'Delivery'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onOrderType(t)}
                  className={`flex-1 py-1 rounded-[10px] text-xs font-bold transition-all ${
                    orderType === t ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800">
                {['%', 'fixed'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { onDiscountType(t); onDiscount(''); }}
                    className={`px-2 py-1 text-xs font-bold transition-colors ${
                      discountType === t ? 'bg-amber-500 text-white' : 'text-gray-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                ref={discountInputRef}
                type="number"
                min="0"
                placeholder={discountType === '%' ? 'Discount %' : 'Discount Rs.'}
                value={discount}
                onChange={(e) => onDiscount(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1 rounded-xl text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <input
                ref={customerCashInputRef}
                type="number"
                min="0"
                placeholder="Cash received"
                value={customerCash}
                onChange={(e) => onCustomerCash(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all ${
                  hasChange ? 'border-emerald-400' : isShort ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {givenCash > 0 && (
                <div className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  hasChange ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'
                }`}>
                  {hasChange ? 'Change' : 'Short by'}: {currencySymbol} {fmt(Math.abs(change))}
                </div>
              )}
            </div>

            {/* Breakdown lines */}
            <div className="pt-1.5 border-t border-gray-200 dark:border-gray-800 space-y-1 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{currencySymbol} {fmt(subtotal)}</span>
              </div>
              {serviceChargeAmt > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Service Charge ({serviceChargeRate}%)</span>
                  <span className="font-semibold">+ {currencySymbol} {fmt(serviceChargeAmt)}</span>
                </div>
              )}
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">− {currencySymbol} {fmt(discountAmt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🌟 Permanent Docked Total & Action Button (Always Visible) */}
        <div className="p-3 space-y-2">
          <div className="flex items-baseline justify-between px-0.5">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Payable</span>
              <span className="text-xs text-gray-500 font-medium">({count} item{count !== 1 ? 's' : ''})</span>
            </div>
            <span className="text-2xl font-black text-amber-600 tabular-nums">
              {currencySymbol} {fmt(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={onPay}
            disabled={cartItems.length === 0 || isPaying}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-amber-500/25 transition-all"
          >
            {isPaying ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <span>💳</span>
                {ctaLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}