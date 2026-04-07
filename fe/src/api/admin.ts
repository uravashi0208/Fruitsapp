/**
 * src/api/admin.ts
 * All admin panel API calls — auth, dashboard, products, orders, users, cards,
 * contacts, wishlist.
 */

import api, { setTokens, clearTokens } from "./client";

// ─── Generic wrappers ─────────────────────────────────────────
interface Ok<T> {
  success: boolean;
  data: T;
}
interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Domain types ─────────────────────────────────────────────
export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "inactive" | "banned";
  lastLogin: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Profile
  firstName?: string;
  lastName?: string;
  bio?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  avatar?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string; // dynamic — from categories collection
  categoryId?: string;
  categoryName?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  thumbnail?: string; // alias for image stored by backend
  description: string;
  stock: number;
  sku: string;
  badge?: string;
  isNew?: boolean;
  status: "active" | "inactive" | "draft" | "out_of_stock";
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardPaymentDetails {
  cardholderName: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  brand: string;
}

export interface CarrierInfo {
  carrier: string;
  label: string;
  trackingUrl: string | null;
}

export interface TrackingEvent {
  id: string;
  type?: "status" | "carrier";
  status: string;
  note: string;
  location: string;
  actor: string;
  timestamp: string;
}

export interface TrackingTimeline {
  orderId: string;
  orderNumber: string;
  status: string;
  trackingCode: string | null;
  carrierCode: string | null;
  carrierInfo: CarrierInfo | null;
  estimatedDelivery: string | null;
  timeline: TrackingEvent[];
  statusLabels: Record<string, { label: string; icon: string; color: string }>;
}

export interface Order {
  id: string;
  orderNumber?: string;
  sessionId: string;
  paid: boolean;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paymentMethod: string;
  paymentMethodLabel?: string;
  paymentDetails: CardPaymentDetails | null;
  transactionId?: string;
  ibanLast4?: string;
  items: OrderItem[];
  userName: string;
  userEmail: string;
  subtotal: number;
  shipping: number;
  tax?: number;
  total: number;
  address: Record<string, string>;
  notes?: string;
  adminNote?: string;
  trackingCode?: string;
  carrierCode?: string;
  carrierInfo?: CarrierInfo;
  estimatedDelivery?: string;
  statusHistory: Array<{
    status: string;
    note: string;
    timestamp: string;
    actor?: string;
  }>;
  trackingEvents?: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId?: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CardDetail {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  cardType:
    | "visa"
    | "mastercard"
    | "amex"
    | "discover"
    | "diners"
    | "jcb"
    | "unionpay"
    | string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  fingerprint?: string;
  isDefault: boolean;
  source?: "stripe_order" | "manual" | string;
  lastOrderId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  repliedAt: string | null;
}

export interface WishlistAdminEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  productCategory: string;
  addedAt: string;
}

export interface WishlistByUser {
  userId: string;
  userName: string;
  userEmail: string;
  items: WishlistAdminEntry[];
}

export type ChartPeriod = 'monthly' | 'quarterly' | 'annually';

/** One data point in the revenue chart — shape varies by period */
export interface ChartPoint {
  /** Monthly label e.g. "Jan 2024" */
  month?:   string;
  /** Quarterly label e.g. "Q1 2024" */
  quarter?: string;
  /** Annual label e.g. "2024" */
  year?:    string;
  /** Daily/weekly label for custom range e.g. "Apr 1" */
  date?:    string;
  revenue:  number;
  orders:   number;
}

export interface DashboardStats {
  revenue: { total: number; orders: number };
  orders: {
    total: number;
    paid: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  users: { total: number; active: number; inactive: number; banned: number };
  products: {
    total: number;
    active: number;
    inactive: number;
    draft: number;
    outOfStock: number;
  };
  revenueChart: ChartPoint[];
  meta?: { period: ChartPeriod; startDate: string | null; endDate: string | null };
  topProducts: Array<{
    productId: string;
    name: string;
    sold: number;
    revenue: number;
    image: string;
  }>;
}

// ─── Query helper ─────────────────────────────────────────────
const qs = (params: Record<string, unknown>) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ),
  ).toString();

// ─── AUTH ─────────────────────────────────────────────────────
export const adminAuthApi = {
  register: async (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => {
    const res = await api.post<
      Ok<{ accessToken: string; refreshToken: string; user: AdminUser }>
    >("/api/admin/auth/register", body, { noAuth: true });
    if (res.success) setTokens(res.data.accessToken, res.data.refreshToken);
    return res;
  },

  login: async (email: string, password: string) => {
    const res = await api.post<
      Ok<{ accessToken: string; refreshToken: string; user: AdminUser }>
    >("/api/admin/auth/login", { email, password }, { noAuth: true });
    if (res.success) setTokens(res.data.accessToken, res.data.refreshToken);
    return res;
  },

  logout: async () => {
    await api.post("/api/admin/auth/logout").catch(() => {});
    clearTokens();
  },

  getMe: () => api.get<Ok<AdminUser>>("/api/admin/auth/me"),
  updateProfile: (
    body: Partial<
      AdminUser & {
        bio?: string;
        firstName?: string;
        lastName?: string;
        country?: string;
        city?: string;
        postalCode?: string;
        taxId?: string;
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
      }
    >,
  ) => api.patch<Ok<AdminUser>>("/api/admin/auth/me", body),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<Ok<{ message: string }>>("/api/admin/auth/me/password", {
      currentPassword,
      newPassword,
    }),
};

// ─── DASHBOARD ────────────────────────────────────────────────
export const adminDashboardApi = {
  getStats: (params?: { period?: ChartPeriod; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.period)    qs.set('period',    params.period);
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate)   qs.set('endDate',   params.endDate);
    const query = qs.toString();
    return api.get<Ok<DashboardStats>>(`/api/admin/dashboard${query ? '?' + query : ''}`);
  },
};

// ─── PRODUCTS ─────────────────────────────────────────────────
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortDir?: string;
}

export const adminProductsApi = {
  list: (query: ProductQuery = {}) =>
    api.get<Paginated<AdminProduct>>(
      `/api/admin/products?${qs(query as Record<string, unknown>)}`,
    ),

  getOne: (id: string) =>
    api.get<Ok<AdminProduct>>(`/api/admin/products/${id}`),

  create: (body: Partial<AdminProduct>) =>
    api.post<Ok<AdminProduct>>("/api/admin/products", body),

  update: (id: string, body: Partial<AdminProduct>) =>
    api.put<Ok<AdminProduct>>(`/api/admin/products/${id}`, body),

  patch: (id: string, body: Partial<AdminProduct>) =>
    api.patch<Ok<AdminProduct>>(`/api/admin/products/${id}`, body),

  updateStatus: (id: string, status: AdminProduct["status"]) =>
    api.patch<Ok<{ id: string; status: string }>>(
      `/api/admin/products/${id}/status`,
      { status },
    ),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/products/${id}`),

  /** Bulk set status for multiple products */
  bulkUpdateStatus: (ids: string[], status: "active" | "inactive") =>
    api.patch<Ok<{ updated: number }>>("/api/admin/products/bulk/status", {
      ids,
      status,
    }),

  /** Soft-delete multiple products (sets deleted=1, not hard delete) */
  bulkSoftDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/products/bulk", {
      body: { ids },
    }),
};

// ─── ORDERS ───────────────────────────────────────────────────
export interface OrderQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortDir?: string;
}

export const adminOrdersApi = {
  list: (query: OrderQuery = {}) =>
    api.get<Paginated<Order>>(
      `/api/admin/orders?${qs(query as Record<string, unknown>)}`,
    ),

  getStats: () =>
    api.get<Ok<Record<string, number>>>("/api/admin/orders/stats"),

  getOne: (id: string) => api.get<Ok<Order>>(`/api/admin/orders/${id}`),

  updateStatus: (id: string, status: Order["status"], note?: string) =>
    api.patch<Ok<{ id: string; status: string }>>(
      `/api/admin/orders/${id}/status`,
      { status, note },
    ),

  updatePaymentStatus: (id: string, paymentStatus: Order["paymentStatus"]) =>
    api.patch<Ok<{ id: string; paymentStatus: string }>>(
      `/api/admin/orders/${id}/payment`,
      { paymentStatus },
    ),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/orders/${id}`),
};

// ─── TRACKING ─────────────────────────────────────────────────
export const adminTrackingApi = {
  getTimeline: (orderId: string) =>
    api.get<Ok<TrackingTimeline>>(`/api/admin/tracking/${orderId}`),

  assign: (
    orderId: string,
    body: {
      trackingCode?: string;
      carrierCode?: string;
      estimatedDelivery?: string;
      note?: string;
    },
  ) => api.post<Ok<Order>>(`/api/admin/tracking/${orderId}/assign`, body),

  addEvent: (
    orderId: string,
    body: {
      status?: string;
      location?: string;
      note: string;
      timestamp?: string;
    },
  ) =>
    api.post<Ok<TrackingEvent>>(`/api/admin/tracking/${orderId}/event`, body),

  clearEvents: (orderId: string) =>
    api.delete<Ok<null>>(`/api/admin/tracking/${orderId}/events`),
};

// ─── PUBLIC TRACKING ─────────────────────────────────────────
export const publicTrackingApi = {
  lookup: (code: string) =>
    api.get<Ok<TrackingTimeline>>(`/api/tracking/${encodeURIComponent(code)}`),
};

// ─── USERS ────────────────────────────────────────────────────
export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export const adminUsersApi = {
  list: (query: UserQuery = {}) =>
    api.get<Paginated<AdminUser>>(
      `/api/admin/users?${qs(query as Record<string, unknown>)}`,
    ),

  getStats: () => api.get<Ok<Record<string, number>>>("/api/admin/users/stats"),

  getOne: (id: string) => api.get<Ok<AdminUser>>(`/api/admin/users/${id}`),

  update: (id: string, body: Partial<AdminUser>) =>
    api.patch<Ok<AdminUser>>(`/api/admin/users/${id}`, body),

  updateStatus: (id: string, status: AdminUser["status"]) =>
    api.patch<Ok<{ id: string; status: string }>>(
      `/api/admin/users/${id}/status`,
      { status },
    ),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/users/${id}`),

  bulkUpdateStatus: (ids: string[], status: "active" | "inactive" | "banned") =>
    api.patch<Ok<{ updated: number }>>("/api/admin/users/bulk/status", {
      ids,
      status,
    }),

  bulkDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/users/bulk", {
      body: { ids },
    }),
};

// ─── CARDS ────────────────────────────────────────────────────
export interface CardQuery {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
}

export const adminCardsApi = {
  list: (query: CardQuery = {}) =>
    api.get<Paginated<CardDetail>>(
      `/api/admin/cards?${qs(query as Record<string, unknown>)}`,
    ),

  getOne: (id: string) => api.get<Ok<CardDetail>>(`/api/admin/cards/${id}`),

  add: (body: Omit<CardDetail, "id" | "createdAt">) =>
    api.post<Ok<CardDetail>>("/api/admin/cards", body),

  setDefault: (id: string, userId: string) =>
    api.patch<Ok<{ id: string; isDefault: boolean }>>(
      `/api/admin/cards/${id}/default`,
      { userId },
    ),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/cards/${id}`),
};

// ─── CONTACTS ─────────────────────────────────────────────────
export interface ContactQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const adminContactsApi = {
  list: (query: ContactQuery = {}) =>
    api.get<Paginated<Contact>>(
      `/api/admin/contacts?${qs(query as Record<string, unknown>)}`,
    ),

  getStats: () =>
    api.get<Ok<Record<string, number>>>("/api/admin/contacts/stats"),

  getOne: (id: string) => api.get<Ok<Contact>>(`/api/admin/contacts/${id}`),

  updateStatus: (id: string, status: Contact["status"]) =>
    api.patch<Ok<{ id: string; status: string }>>(
      `/api/admin/contacts/${id}/status`,
      { status },
    ),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/contacts/${id}`),
};

// ─── WISHLIST ─────────────────────────────────────────────────
export const adminWishlistApi = {
  list: (
    query: {
      page?: number;
      limit?: number;
      search?: string;
      userId?: string;
    } = {},
  ) =>
    api.get<
      Ok<{
        entries: WishlistAdminEntry[];
        byUser: WishlistByUser[];
        total: number;
      }>
    >(`/api/admin/wishlist?${qs(query as Record<string, unknown>)}`),

  remove: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/wishlist/${id}`),
};

// ─── BLOGS ────────────────────────────────────────────────────
export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
  cover: string;
  tags: string[];
  status: "published" | "draft" | "archived";
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tag?: string;
}

export const adminBlogsApi = {
  list: (query: BlogQuery = {}) =>
    api.get<Paginated<AdminBlogPost>>(
      `/api/admin/blogs?${qs(query as Record<string, unknown>)}`,
    ),

  getOne: (id: string) => api.get<Ok<AdminBlogPost>>(`/api/admin/blogs/${id}`),

  create: (formData: FormData) =>
    api.post<Ok<AdminBlogPost>>("/api/admin/blogs", formData),

  update: (id: string, formData: FormData) =>
    api.put<Ok<AdminBlogPost>>(`/api/admin/blogs/${id}`, formData),

  setStatus: (id: string, status: AdminBlogPost["status"]) =>
    api.patch<Ok<AdminBlogPost>>(`/api/admin/blogs/${id}`, { status }),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/blogs/${id}`),

  bulkUpdateStatus: (
    ids: string[],
    status: "published" | "draft" | "inactive",
  ) =>
    api.patch<Ok<{ updated: number }>>("/api/admin/blogs/bulk/status", {
      ids,
      status,
    }),

  bulkDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/blogs/bulk", {
      body: { ids },
    }),
};

// ─── SETTINGS ─────────────────────────────────────────────────
export interface SiteSettings {
  // Store Info
  siteName: string;
  address: string;
  email: string;
  phone: string;
  twitterLink: string;
  facebookLink: string;
  instagramLink: string;
  aboutUs: string;
  metaTitle: string;
  metaDescription: string;
  logo: string;
  favicon: string;
  // Notifications
  notifNewOrder?: boolean;
  notifLowStock?: boolean;
  notifOrderShipped?: boolean;
  notifNewUser?: boolean;
  notifNewContact?: boolean;
  notifNewsletter?: boolean;
  // Shipping
  shippingThreshold?: number;
  shippingFee?: number;
  processingTime?: string;
  deliveryEstimate?: string;
  shippingZones?: string;
  // Email / SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  mailFromName?: string;
  mailFromEmail?: string;
  // Analytics
  gaId?: string;
  gtmId?: string;
  fbPixelId?: string;
  fbConvToken?: string;
  // Security
  secTwoFactor?: boolean;
  secSessionTimeout?: boolean;
  secRateLimit?: boolean;
  // Customers
  registrationMode?: "open" | "invite";
  emailVerification?: "required" | "optional";
  guestCheckout?: "enabled" | "disabled";
  accountDeletion?: "self" | "admin";
  // Theme
  themeDefault?: "light" | "dark";
  updatedAt?: string | null;
}

export const adminSettingsApi = {
  get: () => api.get<Ok<SiteSettings>>("/api/admin/settings"),

  update: (body: Partial<SiteSettings>) =>
    api.patch<Ok<SiteSettings>>("/api/admin/settings", body),
};

// ─── CATEGORIES ───────────────────────────────────────────────
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: "active" | "inactive";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const adminCategoriesApi = {
  list: () => api.get<Ok<AdminCategory[]>>("/api/admin/categories"),

  getOne: (id: string) =>
    api.get<Ok<AdminCategory>>(`/api/admin/categories/${id}`),

  create: (body: Partial<AdminCategory>) =>
    api.post<Ok<AdminCategory>>("/api/admin/categories", body),

  update: (id: string, body: Partial<AdminCategory>) =>
    api.put<Ok<AdminCategory>>(`/api/admin/categories/${id}`, body),

  setStatus: (id: string, status: AdminCategory["status"]) =>
    api.put<Ok<AdminCategory>>(`/api/admin/categories/${id}`, { status }),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/categories/${id}`),

  bulkUpdateStatus: (ids: string[], status: "active" | "inactive") =>
    api.patch<Ok<{ updated: number }>>("/api/admin/categories/bulk/status", {
      ids,
      status,
    }),

  bulkDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/categories/bulk", {
      body: { ids },
    }),
};

// ─── TESTIMONIALS ─────────────────────────────────────────────
export interface AdminTestimonial {
  id: string;
  name: string;
  position: string;
  message: string;
  rating: number;
  avatar: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export const adminTestimonialsApi = {
  list: () => api.get<Ok<AdminTestimonial[]>>("/api/admin/testimonials"),

  getOne: (id: string) =>
    api.get<Ok<AdminTestimonial>>(`/api/admin/testimonials/${id}`),

  create: (formData: FormData) =>
    api.post<Ok<AdminTestimonial>>("/api/admin/testimonials", formData),

  update: (id: string, formData: FormData) =>
    api.put<Ok<AdminTestimonial>>(`/api/admin/testimonials/${id}`, formData),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/testimonials/${id}`),

  setStatus: (id: string, status: "active" | "inactive") =>
    api.put<Ok<AdminTestimonial>>(`/api/admin/testimonials/${id}`, { status }),
};

// ─── SLIDERS ──────────────────────────────────────────────────
export interface AdminSlider {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export const adminSlidersApi = {
  list: () => api.get<Ok<AdminSlider[]>>("/api/admin/sliders"),

  getOne: (id: string) => api.get<Ok<AdminSlider>>(`/api/admin/sliders/${id}`),

  create: (formData: FormData) =>
    api.post<Ok<AdminSlider>>("/api/admin/sliders", formData),

  update: (id: string, formData: FormData) =>
    api.put<Ok<AdminSlider>>(`/api/admin/sliders/${id}`, formData),

  setStatus: (id: string, status: AdminSlider["status"]) =>
    api.patch<Ok<AdminSlider>>(`/api/admin/sliders/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/sliders/${id}`),

  bulkUpdateStatus: (ids: string[], status: "active" | "inactive") =>
    api.patch<Ok<{ updated: number }>>("/api/admin/sliders/bulk/status", {
      ids,
      status,
    }),

  bulkDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/sliders/bulk", {
      body: { ids },
    }),
};

// ─── NEWSLETTER ───────────────────────────────────────────────
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string;
  status: "active" | "unsubscribed";
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSendResult {
  sent: number;
  failed: number;
  total: number;
}

export const adminNewsletterApi = {
  setStatus: (id: string, status: "active" | "unsubscribed") =>
    api.put<Ok<NewsletterSubscriber>>(`/api/admin/newsletter/${id}`, {
      status,
    }),

  list: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<{
      success: boolean;
      data: NewsletterSubscriber[];
      pagination: {
        total: number;
        totalPages: number;
        page: number;
        limit: number;
      };
    }>(`/api/admin/newsletter${qs ? `?${qs}` : ""}`);
  },

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/newsletter/${id}`),

  send: (body: { subject: string; message: string }) =>
    api.post<Ok<NewsletterSendResult>>("/api/admin/newsletter/send", body),
};

// ─── Admin Reviews ────────────────────────────────────────────
export interface AdminReview {
  id: string;
  productId: string;
  userId: string | null;
  userName: string;
  isGuest: boolean;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

export const adminReviewsApi = {
  list: (productId: string, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<{
      success: boolean;
      data: AdminReview[];
      pagination: { total: number; page: number; limit: number };
    }>(`/api/admin/products/${productId}/reviews${qs ? `?${qs}` : ""}`);
  },
  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(
      `/api/admin/reviews/${id}`,
    ),
};

// ─── FAQs ─────────────────────────────────────────────────────────────────────
export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export const adminFaqsApi = {
  list: (params: { status?: string; category?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== "")
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<Ok<AdminFaq[]>>(`/api/admin/faqs${qs ? `?${qs}` : ""}`);
  },

  getOne: (id: string) => api.get<Ok<AdminFaq>>(`/api/admin/faqs/${id}`),

  create: (body: Omit<AdminFaq, "id" | "createdAt" | "updatedAt">) =>
    api.post<Ok<AdminFaq>>("/api/admin/faqs", body),

  update: (
    id: string,
    body: Partial<Omit<AdminFaq, "id" | "createdAt" | "updatedAt">>,
  ) => api.put<Ok<AdminFaq>>(`/api/admin/faqs/${id}`, body),

  setStatus: (id: string, status: AdminFaq["status"]) =>
    api.patch<Ok<AdminFaq>>(`/api/admin/faqs/${id}`, { status }),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/faqs/${id}`),

  bulkUpdateStatus: (ids: string[], status: "active" | "inactive") =>
    api.patch<Ok<{ updated: number }>>("/api/admin/faqs/bulk/status", {
      ids,
      status,
    }),

  bulkDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/faqs/bulk", {
      body: { ids },
    }),
};

// ─── COUPONS ──────────────────────────────────────────────────
export interface AdminCoupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export const adminCouponsApi = {
  list: () => api.get<Ok<AdminCoupon[]>>("/api/admin/coupons"),

  getOne: (id: string) => api.get<Ok<AdminCoupon>>(`/api/admin/coupons/${id}`),

  create: (body: Partial<AdminCoupon>) =>
    api.post<Ok<AdminCoupon>>("/api/admin/coupons", body),

  update: (id: string, body: Partial<AdminCoupon>) =>
    api.patch<Ok<AdminCoupon>>(`/api/admin/coupons/${id}`, body),

  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/coupons/${id}`),

  bulkUpdateStatus: (ids: string[], status: "active" | "inactive") =>
    api.patch<Ok<{ updated: number }>>("/api/admin/coupons/bulk/status", {
      ids,
      status,
    }),

  bulkDelete: (ids: string[]) =>
    api.delete<Ok<{ deleted: number }>>("/api/admin/coupons/bulk", {
      body: { ids },
    }),
};
