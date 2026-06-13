import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * useCartStore — global cart state via Zustand
 *
 * State:
 *   cartItems   — array of { id, name, image, price, category, quantity }
 *   isCartOpen  — controls SlideCart visibility
 *
 * Actions:
 *   addToCart(product)                  — add item or increment quantity
 *   removeFromCart(productId)           — remove item entirely
 *   updateQuantity(productId, quantity) — set exact quantity (removes if ≤ 0)
 *   toggleCart()                        — open / close the slide-over
 *   clearCart()                         — empty the cart
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────
      cartItems:  [],
      isCartOpen: false,

      // ── Actions ────────────────────────────────────────────

      addToCart: (product) => {
        const existing = get().cartItems.find(i => i.id === product.id)
        if (existing) {
          set(state => ({
            cartItems: state.cartItems.map(i =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }))
        } else {
          set(state => ({
            cartItems: [...state.cartItems, { ...product, quantity: 1 }],
          }))
        }
        // Auto-open the cart on first add
        if (!get().isCartOpen) set({ isCartOpen: true })
      },

      removeFromCart: (productId) =>
        set(state => ({
          cartItems: state.cartItems.filter(i => i.id !== productId),
        })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
        } else {
          set(state => ({
            cartItems: state.cartItems.map(i =>
              i.id === productId ? { ...i, quantity } : i
            ),
          }))
        }
      },

      toggleCart: () => set(state => ({ isCartOpen: !state.isCartOpen })),

      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'senarichinese-cart',          // localStorage key
      partialState: (state) => ({       // only persist cart items, not UI state
        cartItems: state.cartItems,
      }),
    }
  )
)

// ── Derived selectors (use outside components for performance) ────────────────

/** Total number of individual items (sum of quantities) */
export const selectCartCount = (state) =>
  state.cartItems.reduce((sum, i) => sum + i.quantity, 0)

/** Subtotal in Rs. */
export const selectSubtotal = (state) =>
  state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
