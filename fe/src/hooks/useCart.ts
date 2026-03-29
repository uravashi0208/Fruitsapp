import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart, removeFromCart, updateQuantity, isInStock } from '../store/cartSlice';
import { toggleWishlist } from '../store/wishlistSlice';
import { showToast } from '../store/uiSlice';
import { Product } from '../types';

// ── Cart Hook ────────────────────────────────────────────────
export const useCart = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  const addItem = useCallback(
    (product: Product) => {
      if (!isInStock(product)) {
        dispatch(showToast({ message: `${product.name} is out of stock`, type: 'error' }));
        return;
      }
      // Check if adding would exceed available stock
      const inCart = items.find((i) => i.id === product.id);
      const currentQty = inCart?.quantity ?? 0;
      const maxStock = product.stock ?? Infinity;
      if (currentQty >= maxStock) {
        dispatch(showToast({
          message: `Only ${maxStock} unit${maxStock === 1 ? '' : 's'} available for ${product.name}`,
          type: 'error',
        }));
        return;
      }
      dispatch(addToCart(product));
      dispatch(showToast({ message: `${product.name} added to cart!`, type: 'success' }));
    },
    [dispatch, items]
  );

  const removeItem = useCallback(
    (id: number) => {
      dispatch(removeFromCart(id));
    },
    [dispatch]
  );

  const changeQty = useCallback(
    (id: number, quantity: number) => {
      dispatch(updateQuantity({ id, quantity }));
    },
    [dispatch]
  );

  return { items, totalItems, subtotal, shipping, total, addItem, removeItem, changeQty };
};

// ── Wishlist Hook ────────────────────────────────────────────
export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.wishlist.items);

  const isWishlisted = useCallback(
    (id: number) => items.some((i) => i.id === id),
    [items]
  );

  const toggle = useCallback(
    (product: Product) => {
      const already = items.some((i) => i.id === product.id);
      dispatch(toggleWishlist(product));
      dispatch(
        showToast({
          message: already
            ? `${product.name} removed from wishlist`
            : `${product.name} added to wishlist ♥`,
          type: already ? 'info' : 'success',
        })
      );
    },
    [dispatch, items]
  );

  return { items, isWishlisted, toggle, count: items.length };
};
