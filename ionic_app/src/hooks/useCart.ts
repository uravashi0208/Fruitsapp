// ============================================================
// src/hooks/useCart.ts
// Convenience hooks wrapping the global cart & wishlist state.
// ============================================================

import { useCallback } from "react";

import { Product } from "../types";
import {
  addToCart,
  isInStock,
  removeFromCart,
  showToast,
  toggleWishlist,
  updateQuantity,
  useAppDispatch,
  useAppSelector,
} from "../store";

// ── Cart Hook ────────────────────────────────────────────────

export const useCart = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  const addItem = useCallback(
    (product: Product, qty = 1) => {
      if (!isInStock(product)) {
        dispatch(
          showToast({
            message: `${product.name} is out of stock`,
            type: "error",
          }),
        );
        return;
      }
      const inCart     = items.find((i) => i.id === product.id);
      const currentQty = inCart?.quantity ?? 0;
      const maxStock   = product.stock ?? Infinity;
      if (currentQty + qty > maxStock) {
        dispatch(
          showToast({
            message: `Only ${maxStock} unit${maxStock === 1 ? "" : "s"} available for ${product.name}`,
            type: "error",
          }),
        );
        return;
      }
      dispatch(addToCart(product, qty));
      dispatch(
        showToast({
          message: `${qty > 1 ? `${qty}x ` : ""}${product.name} added to cart!`,
          type: "success",
        }),
      );
    },
    [dispatch, items],
  );

  const removeItem = useCallback(
    (id: number | string) => {
      dispatch(removeFromCart(id));
    },
    [dispatch],
  );

  const changeQty = useCallback(
    (id: number | string, quantity: number) => {
      dispatch(updateQuantity(id, quantity));
    },
    [dispatch],
  );

  return {
    items,
    totalItems,
    subtotal,
    shipping,
    total,
    addItem,
    removeItem,
    changeQty,
  };
};

// ── Wishlist Hook ────────────────────────────────────────────

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.wishlist.items);

  const isWishlisted = useCallback(
    (id: number | string) => items.some((i) => i.id === id),
    [items],
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
          type: already ? "info" : "success",
        }),
      );
    },
    [dispatch, items],
  );

  return { items, isWishlisted, toggle, count: items.length };
};