import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';

const EMPTY_ITEM = {
  itemName: '',
  sku: '',
  category: '',
  quantityInStock: '0',
  unit: '',
  minAlertLevel: '5', // default changed from 10 to 5
  unitPrice: '',
};

/**
 * @param {Array}  inventoryItems - all fetched inventory items (to compute next SKU)
 * @param {Object} initialItem     - null for add, existing item for edit
 * @param {Array}  categoryOptions - [{value, label}]
 * @param {Array}  unitOptions     - [{value, label}]
 * @param {function} onSave
 * @param {function} onCancel
 */
export default function InventoryFormModal({ inventoryItems = [], initialItem, categoryOptions, unitOptions, onSave, onCancel }) {
  const isEdit = Boolean(initialItem?.id);

  // Auto-generate next SKU: parse highest numeric suffix from existing items
  const nextSku = useMemo(() => {
    if (isEdit) return initialItem?.sku || EMPTY_ITEM.sku;
    let maxNum = 0;
    inventoryItems.forEach(item => {
      const match = (item.sku || '').match(/^ITM(\d{5})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `ITM${String(maxNum + 1).padStart(5, '0')}`;
  }, [inventoryItems, isEdit, initialItem]);

  const [form, setForm] = useState(() => ({
    itemName:        initialItem?.itemName        ?? EMPTY_ITEM.itemName,
    sku:             initialItem?.sku             ?? nextSku,
    category:        initialItem?.category        ?? EMPTY_ITEM.category,
    quantityInStock: String(initialItem?.quantityInStock ?? EMPTY_ITEM.quantityInStock),
    unit:            initialItem?.unit            ?? EMPTY_ITEM.unit,
    minAlertLevel:   String(initialItem?.minAlertLevel ?? EMPTY_ITEM.minAlertLevel),
    unitPrice:       initialItem?.unitPrice != null ? String(initialItem.unitPrice) : EMPTY_ITEM.unitPrice,
  }));
  const [errors, setErrors] = useState({});

  // On mount: set defaults for category, unit, and SKU
  useEffect(() => {
    if (!isEdit) {
      setForm(f => ({
        ...f,
        sku: f.sku || nextSku,
        category: f.category || categoryOptions[0]?.value || '',
        unit:     f.unit     || unitOptions[0]?.value     || '',
      }));
    }
  }, [isEdit, categoryOptions, unitOptions, nextSku]);

  // Update SKU in form when nextSku changes (after save, new items added)
  useEffect(() => {
    if (!isEdit && !form.sku) {
      setForm(f => ({ ...f, sku: nextSku }));
    }
  }, [nextSku, isEdit, form.sku]);

  const set = key => val => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const inputCls = (hasErr) =>
    `w-full px-3 py-2.5 rounded-xl text-sm
     bg-white dark:bg-gray-800 border text-gray-900 dark:text-white
     placeholder:text-gray-400 dark:placeholder:text-gray-500
     focus:outline-none focus:ring-2 transition-colors
     ${hasErr
       ? 'border-red-400 focus:ring-red-400/30'
       : 'border-gray-200 dark:border-gray-700 focus:ring-amber-400/40'
     }`;

  function validate() {
    const e = {};
    if (!form.itemName.trim()) e.itemName = 'Item name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.unit.trim()) e.unit = 'Unit is required';
    const qty = parseFloat(form.quantityInStock);
    const min = parseFloat(form.minAlertLevel);
    const price = parseFloat(form.unitPrice);
    if (Number.isNaN(qty) || qty < 0) e.quantityInStock = 'Enter a valid quantity';
    if (Number.isNaN(min) || min < 0) e.minAlertLevel = 'Enter a valid alert level';
    if (Number.isNaN(price) || price < 0) e.unitPrice = 'Enter a valid unit price';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      itemName:        form.itemName.trim(),
      sku:             form.sku.trim(),
      category:        form.category,
      quantityInStock: parseFloat(form.quantityInStock),
      unit:            form.unit.trim(),
      minAlertLevel:   parseFloat(form.minAlertLevel),
      unitPrice:       parseFloat(form.unitPrice),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border
                   bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700/50
                   max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="relative overflow-hidden shrink-0 sticky top-0 z-10
                        bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
          <div className="relative flex items-center gap-3 px-4 sm:px-5 py-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
              {isEdit ? <Pencil size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {isEdit ? 'Edit Item' : 'Add New Item'}
              </h2>
              <p className="text-white/70 text-xs mt-0.5 truncate">
                {isEdit ? initialItem.sku : `Auto SKU: ${nextSku}`}
              </p>
            </div>
            <button type="button" onClick={onCancel} aria-label="Close"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30
                         flex items-center justify-center text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                Item Name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.itemName} onChange={e => set('itemName')(e.target.value)}
                autoFocus className={inputCls(!!errors.itemName)} />
              {errors.itemName && <p className="text-xs text-red-500 mt-1">{errors.itemName}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  SKU <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.sku} onChange={e => set('sku')(e.target.value)}
                  readOnly={isEdit}
                  className={`${inputCls(!!errors.sku)} ${isEdit ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700/50' : ''}`} />
                {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={categoryOptions}
                  value={form.category}
                  onChange={set('category')}
                  placeholder="Select…"
                  searchPlaceholder="Search…"
                />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Quantity <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" step="any" value={form.quantityInStock}
                  onChange={e => set('quantityInStock')(e.target.value)}
                  className={inputCls(!!errors.quantityInStock)} />
                {errors.quantityInStock && <p className="text-xs text-red-500 mt-1">{errors.quantityInStock}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Unit <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={unitOptions}
                  value={form.unit}
                  onChange={set('unit')}
                  placeholder="Select unit…"
                  searchPlaceholder="Search units…"
                />
                {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Unit Price <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" step="any" value={form.unitPrice}
                  onChange={e => set('unitPrice')(e.target.value)}
                  placeholder="Rs." className={inputCls(!!errors.unitPrice)} />
                {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                  Min Alert <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" step="any" value={form.minAlertLevel}
                  onChange={e => set('minAlertLevel')(e.target.value)}
                  className={inputCls(!!errors.minAlertLevel)} />
                {errors.minAlertLevel && <p className="text-xs text-red-500 mt-1">{errors.minAlertLevel}</p>}
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex gap-3 shrink-0 sticky bottom-0 z-10
                          border-t border-gray-100 dark:border-gray-800
                          bg-white dark:bg-gray-900">
            <button type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         font-semibold text-sm text-white
                         bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 shadow-md hover:opacity-90">
              {isEdit ? <><Pencil size={15} /> Save Changes</> : <><Plus size={15} /> Add Item</>}
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
  );
}