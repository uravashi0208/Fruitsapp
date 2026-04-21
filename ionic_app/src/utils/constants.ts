// ============================================================
// src/utils/constants.ts
// App-wide constants — single source of truth
// ============================================================

export const ROUTES = {
  SPLASH:       "/splash",
  HOME:         "/home",
  PRODUCT:      "/product/:id",
  productDetail: (id: string | number) => `/product/${id}`,
  CART:         "/cart",
  WISHLIST:     "/wishlist",
  CHECKOUT:     "/checkout",
  TRACK:        "/track",
  PROFILE:      "/profile",
  NOTIFICATIONS: "/notifications",
  LOGIN:        "/login",
  REGISTER:     "/register",
  ADD_ADDRESS:  "/add-address",
  EDIT_PROFILE: "/edit-profile",
} as const;

export const PAGE_SIZE = 8;

export const VALID_PRODUCT_STATUSES = [
  "active",
  "inactive",
  "draft",
  "out_of_stock",
] as const;

export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE           = 9.99;
export const CART_DISCOUNT_RATE     = 0.05;

export const TOAST_COLORS: Record<string, string> = {
  success: "#4CAF50",
  error:   "#ff6b6b",
  info:    "#2196F3",
  warning: "#ffc107",
};
