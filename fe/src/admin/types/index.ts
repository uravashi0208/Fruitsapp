// ============================================================
// ADMIN — TypeScript Interfaces
// ============================================================

export type UserRole = 'admin' | 'editor' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';
export type PaymentMethod = 'card' | 'paypal' | 'cod';
export type BlogStatus = 'published' | 'draft' | 'archived';
export type ProductCategory = string; // dynamic from categories API
export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

// ── Admin Auth ───────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// ── Product (Admin extended) ─────────────────────────────────
export interface AdminProduct {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  badge?: string;
  isNew?: boolean;
  stock: number;
  sku: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'draft';
}

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  lastLogin: string;
  totalOrders: number;
  totalSpent: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// ── Order ─────────────────────────────────────────────────────
export interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

// ── Card / Payment ────────────────────────────────────────────
export interface CardDetail {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  createdAt: string;
}

// ── Contact ───────────────────────────────────────────────────
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  repliedAt?: string;
}

// ── Blog Post (Admin extended) ────────────────────────────────
export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ── Dashboard Stats ───────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalUsers: number;
  usersGrowth: number;
  totalProducts: number;
  productsGrowth: number;
  recentOrders: Order[];
  topProducts: Array<{ product: AdminProduct; sold: number; revenue: number }>;
  revenueChart: Array<{ month: string; revenue: number; orders: number }>;
}

// ── Table / Filter Utilities ──────────────────────────────────
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}
