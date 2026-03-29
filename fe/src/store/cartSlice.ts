import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

/** Returns true when a product is purchasable */
export const isInStock = (p: Pick<Product, 'stock' | 'status'>): boolean => {
  if (p.status === 'out_of_stock' || p.status === 'inactive' || p.status === 'draft') return false;
  return (p.stock ?? 1) > 0;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const product = action.payload;
      if (!isInStock(product)) return; // silently reject out-of-stock

      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        // Cap at available stock
        const maxStock = product.stock ?? Infinity;
        existing.quantity = Math.min(existing.quantity + 1, maxStock);
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateQuantity(state, action: PayloadAction<{ id: number; quantity: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        const maxStock = (item as CartItem & Product).stock ?? Infinity;
        item.quantity = Math.min(Math.max(1, action.payload.quantity), maxStock);
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
