/**
 * Zustand store for POS Cart management.
 * Total = Subtotal - Discount (no tax/service charge).
 * Uses the API layer (orderApi) for submitting orders.
 */
import { create } from 'zustand';
import { orderApi } from '../api/order.api';

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

  getGrandTotal: () => {
    return Math.max(0, get().getSubtotal() - get().getDiscountAmount());
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

  setOrderType: (orderType) => set({ orderType }),
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
      const total = state.getGrandTotal();

      const json = await orderApi.update(orderId, {
        orderType: typeMapToApi[orderType] || 'DINE_IN',
        items: state.cartItems.map(i => ({ foodId: i.id, quantity: i.quantity, unitPrice: i.price })),
        subtotal,
        discount: discountAmt,
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
      const total = state.getGrandTotal();

      const json = await orderApi.create({
        orderType: typeMapToApi[orderType] || 'DINE_IN',
        items: state.cartItems.map(i => ({ foodId: i.id, quantity: i.quantity, unitPrice: i.price })),
        subtotal,
        discount: discountAmt,
        total,
        amountPaid: Number(amountPaid) || 0,
        customerName: customerName || 'Walk-in Customer',
        customerId: customerId || null,
      });

      if (json.success) {
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