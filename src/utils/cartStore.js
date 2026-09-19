/**
 * Zustand store for POS Cart management.
 * Total = Subtotal - Discount (no tax/service charge).
 * Uses the API layer (orderApi) for submitting orders.
 */
import { create } from 'zustand';
import { orderApi } from '../api/order.api';
import { useSettingsStore } from './settingsStore'; // 🌟 Added settings store for service charge rate
import { useLiveOrdersStore } from './liveOrdersStore'; // 🌟 Auto-sync live kitchen board on POS submit

const typeMapToApi = { 'Dine-in': 'DINE_IN', 'Takeaway': 'TAKEAWAY', 'Delivery': 'DELIVERY' };
const typeMapFromApi = { 'DINE_IN': 'Dine-in', 'TAKEAWAY': 'Takeaway', 'DELIVERY': 'Delivery' };

export const useCartStore = create((set, get) => ({
  // ── State ──
  cartItems: [],
  orderType: 'Dine-in',
  discount: '',
  discountType: '%',
  customerCash: '',
  customerName: '',
  isPaying: false,

  // ── Calculations ──────────────────────────────────────────────────────
  getSubtotal: () => {
    return get().cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const raw = parseFloat(get().discount) || 0;
    return get().discountType === '%'
      ? Math.min(subtotal, Math.round(subtotal * raw / 100))
      : Math.min(subtotal, raw);
  },

  // 🌟 Calculate Grand Total including Dine-in Service Charge
  getServiceChargeAmount: () => {
    const isDineIn = get().orderType === 'Dine-in' || get().orderType === 'DINE_IN';
    if (!isDineIn) return 0;
    const rate = Number(useSettingsStore.getState().defaultServiceCharge || 0);
    return Math.round((get().getSubtotal() * rate) / 100);
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const serviceCharge = get().getServiceChargeAmount();
    return Math.max(0, subtotal + serviceCharge - discount);
  },

  // ── Actions ───────────────────────────────────────────────────────────
  addToCart: (foodItem) => {
    set((state) => {
      const existing = state.cartItems.find(i => i.id === foodItem.id);
      if (existing) {
        return {
          cartItems: state.cartItems.map(i =>
            i.id === foodItem.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        cartItems: [...state.cartItems, {
          id: foodItem.id,
          name: foodItem.name,
          price: Number(foodItem.price),
          image: foodItem.image || '',
          quantity: 1,
        }],
      };
    });
  },

  removeFromCart: (id) => set((state) => ({ cartItems: state.cartItems.filter(i => i.id !== id) })),

  updateQuantity: (id, qty) => {
    if (qty <= 0) { get().removeFromCart(id); return; }
    set((state) => ({ cartItems: state.cartItems.map(i => i.id === id ? { ...i, quantity: qty } : i) }));
  },

  increaseQuantity: (id) => set((state) => ({
    cartItems: state.cartItems.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i),
  })),

  decreaseQuantity: (id) => set((state) => {
    const item = state.cartItems.find(i => i.id === id);
    if (!item) return state;
    if (item.quantity <= 1) return { cartItems: state.cartItems.filter(i => i.id !== id) };
    return { cartItems: state.cartItems.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i) };
  }),

  clearCart: () => set({ cartItems: [], discount: '', customerCash: '', customerName: '' }),

  // 🌟 Auto-toggle Service Charge percentage on Dine-in mode selection
  setOrderType: (orderType) => {
    const isDineIn = orderType === 'Dine-in' || orderType === 'DINE_IN';
    set({ orderType });
  },
  setDiscount: (discount) => set({ discount }),
  setDiscountType: (discountType) => set({ discountType }),
  setCustomerCash: (customerCash) => set({ customerCash }),
  setCustomerName: (customerName) => set({ customerName }),

  // ── Hydrate cart from existing order (for edit mode) ──────────────────
  hydrateFromOrder: (order) => {
    let name = '';
    try { if (order.notes) { const p = JSON.parse(order.notes); if (p.customerName) name = p.customerName; } } catch {}
    if (!name) name = order.customerName || 'Walk-in Customer';
    const subtotal = Number(order.subtotal || 0);
    const discountAmt = Number(order.discount || 0);
    const percent = subtotal > 0 ? Math.round((discountAmt / subtotal) * 100) : 0;
    const items = (order.items || []).map(i => ({
      id: i.foodId || i.id,
      name: i.food?.name || i.name || 'Item',
      price: Number(i.unitPrice),
      image: i.food?.image || '',
      quantity: i.quantity,
    }));
    set({
      cartItems: items,
      orderType: typeMapFromApi[order.type || order.orderType] || 'Dine-in',
      discount: String(percent > 0 ? percent : ''),
      discountType: '%',
      customerCash: String(order.amountPaid || ''),
      customerName: name,
      customerId: order.customerId || null, // store this for the edit form
    });
  },

  // ── Submit / Update order via API layer ───────────────────────────────
  updateOrder: async ({ orderId, orderType, customerName, amountPaid, customerId }) => {
    const state = get();
    if (state.cartItems.length === 0) return false;
    set({ isPaying: true });
    try {
      const subtotal = state.getSubtotal();
      const discountAmt = state.getDiscountAmount();
      const serviceCharge = state.getServiceChargeAmount();
      const total = state.getGrandTotal();

      // 🌟 Extract Dine-in service charge rate and amount
      const isDineIn = orderType === 'Dine-in' || orderType === 'DINE_IN';
      const serviceChargeRate = isDineIn ? Number(useSettingsStore.getState().defaultServiceCharge || 0) : 0;

      const json = await orderApi.update(orderId, {
        orderType: typeMapToApi[orderType] || 'DINE_IN',
        items: state.cartItems.map(i => ({ foodId: i.id, quantity: i.quantity, unitPrice: i.price })),
        subtotal,
        discount: discountAmt,
        serviceChargeRate, // 🌟 Save to DB column
        serviceCharge,     // 🌟 Save to DB column
        total,
        amountPaid: Number(amountPaid) || 0,
        customerName: customerName || 'Walk-in Customer',
        customerId: customerId || null,
      });

      if (json.success) return json.data;
      return false;
    } catch (e) {
      console.error('[cartStore] updateOrder ERROR:', e.message);
      return false;
    } finally {
      set({ isPaying: false });
    }
  },

  submitOrder: async ({ orderType, invoiceNumber, customerName, amountPaid, customerId }) => {
    const state = get();
    if (state.cartItems.length === 0) return false;

    set({ isPaying: true });
    try {
      const subtotal = state.getSubtotal();
      const discountAmt = state.getDiscountAmount();
      const serviceCharge = state.getServiceChargeAmount();
      const total = state.getGrandTotal();

      // 🌟 Extract Dine-in service charge rate and amount
      const isDineIn = orderType === 'Dine-in' || orderType === 'DINE_IN';
      const serviceChargeRate = isDineIn ? Number(useSettingsStore.getState().defaultServiceCharge || 0) : 0;

      const json = await orderApi.create({
        source: 'POS', // 🌟 Explicit flag: Silences top bell notification and kitchen alert
        orderType: typeMapToApi[orderType] || 'DINE_IN',
        items: state.cartItems.map(i => ({ foodId: i.id, quantity: i.quantity, unitPrice: i.price })),
        subtotal,
        discount: discountAmt,
        serviceChargeRate, // 🌟 Save to DB column
        serviceCharge,     // 🌟 Save to DB column
        total,
        amountPaid: Number(amountPaid) || 0,
        customerName: customerName || 'Walk-in Customer',
        customerId: customerId || null,
      });

      if (json.success) {
        // 🌟 POS එකෙන් දමන ලද බිල ක්ෂණිකව Kitchen Live Orders පුවරුවට එකතු කරයි
        try {
          useLiveOrdersStore.getState().addNewOrder(json.data);
          useLiveOrdersStore.getState().fetchLiveOrders();
        } catch (syncErr) {
          console.warn('[cartStore] Live kitchen queue sync error:', syncErr);
        }

        state.clearCart();
        return json.data;
      }
      console.error('[cartStore] submitOrder failed:', json.error);
      return false;
    } catch (e) {
      console.error('[cartStore] submitOrder ERROR:', e.message);
      return false;
    } finally {
      set({ isPaying: false });
    }
  },
}));