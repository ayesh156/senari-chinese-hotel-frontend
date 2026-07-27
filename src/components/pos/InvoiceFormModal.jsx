import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useInvoiceStore } from '../../utils/invoiceStore';
import { useSettingsStore } from '../../utils/settingsStore';
import { fmtCurrencyDirect } from '../../utils/currency';

const fmt = fmtCurrencyDirect;

const ORDER_TYPES = [
  { value: 'DINE_IN', label: 'Dine-in' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
];

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Mobile', label: 'Mobile Payment' },
  { value: 'Credit', label: 'Credit' },
];

/**
 * InvoiceFormModal — manual invoice creation form.
 *
 * Props:
 *   isOpen      — boolean
 *   onClose     — () => void
 *   foodItems   — array of { id, name, price } for item selection
 */
export default function InvoiceFormModal({ isOpen, onClose, foodItems = [] }) {
  const createInvoice = useInvoiceStore(s => s.createInvoice);
  const currencySymbol = useSettingsStore(s => s.currencySymbol || 'Rs.');

  const [orderType, setOrderType] = useState('DINE_IN');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [items, setItems] = useState([{ foodId: '', foodName: '', quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setOrderType('DINE_IN');
      setCustomerName('');
      setPaymentMethod('Cash');
      setItems([{ foodId: '', foodName: '', quantity: 1, unitPrice: 0 }]);
      setDiscount(0);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // If foodId changed, auto-fill name and price
    if (field === 'foodId') {
      const selected = foodItems.find(f => f.id === Number(value));
      if (selected) {
        updated[index].foodName = selected.name;
        updated[index].unitPrice = Number(selected.price);
      } else {
        updated[index].foodName = '';
        updated[index].unitPrice = 0;
      }
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { foodId: '', foodName: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
  const total = Math.max(0, subtotal - Number(discount));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0 || items.every(i => !i.foodId)) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderType,
        items: items.map(i => ({
          foodId: Number(i.foodId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        subtotal,
        discount: Number(discount),
        total,
        amountPaid: total,
        customerName: customerName.trim() || undefined,
        paymentMethod,
      };

      const result = await createInvoice(payload);
      if (result) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Invoice</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a manual invoice entry</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: Order Type + Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Order Type</label>
              <select
                value={orderType}
                onChange={e => setOrderType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                {ORDER_TYPES.map(ot => (
                  <option key={ot.value} value={ot.value}>{ot.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
                className="w-full px-3 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    paymentMethod === pm.value
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Items</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {/* Item rows */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  {/* Food selector */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.foodId}
                      onChange={e => handleItemChange(index, 'foodId', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select food item…</option>
                      {foodItems.map(f => (
                        <option key={f.id} value={f.id}>{f.name} — {fmt(Number(f.price))}</option>
                      ))}
                    </select>
                  </div>
                  {/* Quantity */}
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleItemChange(index, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-2 rounded-lg border text-sm text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  {/* Price */}
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-lg border text-sm text-right bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  {/* Line total */}
                  <div className="w-24 text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {fmt(Number(item.unitPrice) * Number(item.quantity))}
                    </span>
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount + Totals */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <div className="w-full sm:w-40">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Discount ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Subtotal</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{fmt(subtotal)}</p>
              {Number(discount) > 0 && (
                <p className="text-xs text-red-500">Discount: -{fmt(Number(discount))}</p>
              )}
              <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                Total: {fmt(total)}
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || items.every(i => !i.foodId)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                       bg-gradient-to-r from-amber-500 to-orange-500 text-white
                       hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {submitting ? 'Creating…' : `Create Invoice — ${fmt(total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}