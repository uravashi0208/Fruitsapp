// ============================================================
// src/types/index.ts
// ============================================================

export type ProductStatus = "active" | "inactive" | "draft" | "out_of_stock";

export interface Product {
  id: number | string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  discount?: number;
  rating: number;
  reviews: number;
  badge?: string;
  isNew?: boolean;
  stock?: number;
  sku?: string;
  status?: ProductStatus;
}

export interface CartItem extends Product {
  quantity: number;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastPayload {
  message: string;
  type: ToastType;
}

export interface NavTab {
  label: string;
  path: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Address {
  id:          string;
  label:       string;
  addr:        string;
  city?:       string;
  postalCode?: string;
  country?:    string;
  lat?:        number | null;
  lon?:        number | null;
}

export interface NotificationItem {
  emoji: string;
  title: string;
  sub:   string;
  time:  string;
}

export interface StatItem {
  val:   string;
  label: string;
}

export interface MenuItem {
  icon:   string;
  label:  string;
  path?:  string;
}