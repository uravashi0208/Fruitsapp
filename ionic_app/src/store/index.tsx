// ============================================================
// src/store/index.tsx
// — persists user session to localStorage (survives page reload)
// — auto-restores user + fetches addresses on app launch
// ============================================================

import React, {
  createContext, useContext, useReducer, useEffect,
  useCallback, ReactNode,
} from "react";
import { CartItem, Product, ToastPayload, User, Address } from "../types";

// ── Keys for localStorage persistence ────────────────────────
const LS_USER      = "vf_user";       // serialised User object
const LS_REFRESH   = "vf_refresh";   // refresh token (already stored by client.ts)

// ── State shape ───────────────────────────────────────────────
interface AppState {
  cart:        { items: CartItem[] };
  wishlist:    { items: Product[]  };
  ui:          { toast: (ToastPayload & { id: number }) | null };
  auth:        { user: User | null };
  addresses:   Address[];
  addrLoaded:  boolean;   // true once addresses have been fetched from DB
}

type Action =
  | { type: "ADD_TO_CART";          payload: Product; quantity?: number }
  | { type: "REMOVE_FROM_CART";     payload: number | string }
  | { type: "UPDATE_QUANTITY";      payload: { id: number | string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_WISHLIST";      payload: Product }
  | { type: "REMOVE_FROM_WISHLIST"; payload: number | string }
  | { type: "SET_WISHLIST";         payload: Product[] }
  | { type: "SHOW_TOAST";           payload: ToastPayload }
  | { type: "CLEAR_TOAST" }
  | { type: "LOGIN";                payload: User }
  | { type: "LOGOUT" }
  | { type: "ADD_ADDRESS";          payload: Address }
  | { type: "REMOVE_ADDRESS";       payload: string }
  | { type: "SET_ADDRESSES";        payload: Address[] };

let _toastId = 0;

// ── Restore persisted user on first load ──────────────────────
const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const initialState: AppState = {
  cart:       { items: [] },
  wishlist:   { items: [] },
  ui:         { toast: null },
  auth:       { user: readStoredUser() },   // ← restored immediately
  addresses:  [],
  addrLoaded: false,
};

// ── Reducer ───────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    // Cart
    case "ADD_TO_CART": {
      const product  = action.payload;
      const addQty   = action.quantity ?? 1;
      const maxStock = (product.stock ?? Infinity) as number;
      const idx      = state.cart.items.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const updated = [...state.cart.items];
        updated[idx]  = { ...updated[idx], quantity: Math.min(updated[idx].quantity + addQty, maxStock) };
        return { ...state, cart: { items: updated } };
      }
      return { ...state, cart: { items: [...state.cart.items, { ...product, quantity: Math.min(addQty, maxStock) }] } };
    }
    case "REMOVE_FROM_CART":
      return { ...state, cart: { items: state.cart.items.filter((i) => i.id !== action.payload) } };
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) return { ...state, cart: { items: state.cart.items.filter((i) => i.id !== id) } };
      return { ...state, cart: { items: state.cart.items.map((i) => i.id === id ? { ...i, quantity } : i) } };
    }
    case "CLEAR_CART":
      return { ...state, cart: { items: [] } };

    // Wishlist
    case "TOGGLE_WISHLIST": {
      const product = action.payload;
      const exists  = state.wishlist.items.some((i) => i.id === product.id);
      return { ...state, wishlist: { items: exists ? state.wishlist.items.filter((i) => i.id !== product.id) : [...state.wishlist.items, product] } };
    }
    case "REMOVE_FROM_WISHLIST":
      return { ...state, wishlist: { items: state.wishlist.items.filter((i) => i.id !== action.payload) } };
    case "SET_WISHLIST":
      return { ...state, wishlist: { items: action.payload } };

    // Toast
    case "SHOW_TOAST":
      return { ...state, ui: { toast: { ...action.payload, id: ++_toastId } } };
    case "CLEAR_TOAST":
      return { ...state, ui: { toast: null } };

    // Auth — persist user to localStorage
    case "LOGIN":
      try { localStorage.setItem(LS_USER, JSON.stringify(action.payload)); } catch { /* ignore */ }
      return { ...state, auth: { user: action.payload }, addrLoaded: false };

    case "LOGOUT":
      localStorage.removeItem(LS_USER);
      return { ...state, auth: { user: null }, addresses: [], addrLoaded: false, wishlist: { items: [] } };

    // Addresses
    case "ADD_ADDRESS":
      return { ...state, addresses: [...state.addresses, action.payload] };
    case "REMOVE_ADDRESS":
      return { ...state, addresses: state.addresses.filter((a) => a.id !== action.payload) };
    case "SET_ADDRESSES":
      return { ...state, addresses: action.payload, addrLoaded: true };

    case "EDIT_PROFILE":
      return { ...state, user: { ...state.user, ...action.payload } };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

// ── Provider — auto-fetches addresses when a user is present ──
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // If a user is present (restored from localStorage or just logged in)
    // and addresses haven't been loaded yet → fetch from DB
    if (state.auth.user && !state.addrLoaded) {
      import("../api/storefront").then(({ addressApi }) => {
        addressApi.list()
          .then((res: any) => {
            const items: Address[] = (res.data ?? []).map((a: any) => ({
              id:         a.id,
              label:      a.label,
              addr:       [a.addr, a.city, a.postalCode, a.country].filter(Boolean).join(", "),
              city:       a.city,
              postalCode: a.postalCode,
              country:    a.country,
              lat:        a.lat,
              lon:        a.lon,
            }));
            dispatch({ type: "SET_ADDRESSES", payload: items });
          })
          .catch(() => {
            // non-fatal — just mark as loaded so we don't keep retrying
            dispatch({ type: "SET_ADDRESSES", payload: [] });
          });
      });
    }
  }, [state.auth.user, state.addrLoaded]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

// ── Hooks ─────────────────────────────────────────────────────
export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used inside <AppProvider>");
  return ctx;
}

export function useAppSelector<T>(selector: (state: AppState) => T): T {
  const { state } = useAppState();
  return selector(state);
}

export function useAppDispatch() {
  const { dispatch } = useAppState();
  return dispatch;
}

// ── Action creators ───────────────────────────────────────────
export const addToCart      = (product: Product, quantity = 1): Action => ({ type: "ADD_TO_CART", payload: product, quantity });
export const removeFromCart = (id: number | string): Action             => ({ type: "REMOVE_FROM_CART", payload: id });
export const updateQuantity = (id: number | string, quantity: number): Action => ({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
export const toggleWishlist = (product: Product): Action                => ({ type: "TOGGLE_WISHLIST", payload: product });
export const setWishlist    = (items: Product[]): Action                => ({ type: "SET_WISHLIST", payload: items });
export const showToast      = (payload: ToastPayload): Action           => ({ type: "SHOW_TOAST", payload });
export const login          = (user: User): Action                      => ({ type: "LOGIN", payload: user });
export const logout         = (): Action                                => ({ type: "LOGOUT" });
export const addAddress     = (address: Address): Action                => ({ type: "ADD_ADDRESS", payload: address });
export const removeAddress  = (id: string): Action                     => ({ type: "REMOVE_ADDRESS", payload: id });
export const setAddresses   = (addresses: Address[]): Action           => ({ type: "SET_ADDRESSES", payload: addresses });

export function isInStock(product: Product): boolean {
  if (product.status === "out_of_stock") return false;
  if (typeof product.stock === "number") return product.stock > 0;
  return true;
}