/**
 * src/api/storefront.ts
 * All storefront (public + user-scoped) API calls.
 */

import api from './client';

// ─── Types ────────────────────────────────────────────────────
export interface ApiOk<T> { success: boolean; data: T }

export interface ApiSlider {
  id:          string;
  title:       string;
  subtitle:    string;
  buttonText:  string;
  buttonLink:  string;
  image:       string;
  sortOrder:   number;
  status:      'active' | 'inactive';
}

export interface ApiProduct {
  id:            string;
  name:          string;
  category:      string;
  price:         number;
  originalPrice?: number;
  discount?:     number;
  image:         string;
  description:   string;
  stock:         number;
  sku:           string;
  badge?:        string;
  isNew?:        boolean;
  status:        string;
  rating:        number;
  reviews:       number;
}

export interface WishlistEntry {
  id:              string;
  productId:       number | string;
  productName:     string;
  productImage:    string;
  productPrice:    number;
  productCategory: string;
  addedAt:         string;
}

// ─── Sliders ──────────────────────────────────────────────────
export const slidersApi = {
  list: () => api.get<ApiOk<ApiSlider[]>>('/api/sliders', { noAuth: true }),
};

// ─── Products ─────────────────────────────────────────────────
export const productsApi = {
  /** List active products, optionally filtered by category */
  list: (params: { category?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString();
    return api.get<ApiOk<ApiProduct[]>>(`/api/products${qs ? `?${qs}` : ''}`, { noAuth: true });
  },

  /** Single product detail */
  getOne: (id: string | number) =>
    api.get<ApiOk<ApiProduct>>(`/api/products/${id}`, { noAuth: true }),
};

// ─── Contact form ─────────────────────────────────────────────
export const contactApi = {
  submit: (body: { name: string; email: string; message: string; phone?: string; subject?: string }) =>
    api.post<ApiOk<{ id: string; message: string }>>('/api/contact', body, { noAuth: true }),
};

// ─── Stripe checkout ──────────────────────────────────────────
export interface CheckoutItem {
  name:         string;
  price:        number;
  quantity:     number;
  currency?:    string;
  description?: string;
  productId?:   number | string;
  image?:       string;
}

export interface CheckoutCustomer {
  name?:  string;
  email?: string;
  phone?: string;
  address?: { street?: string; city?: string; state?: string; zip?: string; country?: string };
}

export const stripeApi = {
  createCheckout: (items: CheckoutItem[], customer: CheckoutCustomer = {}) =>
    api.post<ApiOk<{ url: string }>>('/create-checkout-session', { items, customer }, { noAuth: true }),

  getSession: (sessionId: string) =>
    api.get<ApiOk<Record<string, unknown>>>(`/session?sessionId=${sessionId}`, { noAuth: true }),
};

// ─── Wishlist (requires JWT from admin auth in same browser) ──
export const wishlistApi = {
  get:    () => api.get<ApiOk<WishlistEntry[]>>('/api/wishlist'),
  check:  (productId: number | string) => api.get<ApiOk<{ wishlisted: boolean }>>(`/api/wishlist/check/${productId}`),
  add:    (body: Omit<WishlistEntry, 'id' | 'addedAt'>) => api.post<ApiOk<WishlistEntry>>('/api/wishlist', body),
  remove: (productId: number | string) => api.delete<ApiOk<{ message: string }>>(`/api/wishlist/${productId}`),
};

// ─── Testimonials ─────────────────────────────────────────────
export interface ApiTestimonial {
  id:       string;
  name:     string;
  position: string;
  message:  string;
  rating:   number;
  avatar:   string;
  status:   'active' | 'inactive';
}

export const testimonialsApi = {
  list: () => api.get<ApiOk<ApiTestimonial[]>>('/api/testimonials', { noAuth: true }),
};

// ─── Newsletter ───────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (body: { email: string; name?: string }) =>
    api.post<ApiOk<{ id: string; email: string; status: string }>>(
      '/api/newsletter',
      body,
      { noAuth: true }
    ),
};

// ─── Blogs ────────────────────────────────────────────────────
export interface ApiBlogPost {
  id:          string;
  title:       string;
  slug:        string;
  author:      string;
  category:    string;
  excerpt:     string;
  content:     string;
  cover:       string;
  tags:        string[];
  status:      string;
  views:       number;
  publishedAt: string | null;
  createdAt:   string;
}

export const blogsApi = {
  list: (params: { page?: number; limit?: number; tag?: string; search?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString();
    return api.get<{ success: boolean; data: ApiBlogPost[]; pagination: { total: number; totalPages: number; page: number; limit: number } }>(
      `/api/blogs${qs ? `?${qs}` : ''}`,
      { noAuth: true }
    );
  },
  getOne: (idOrSlug: string) =>
    api.get<ApiOk<ApiBlogPost>>(`/api/blogs/${idOrSlug}`, { noAuth: true }),
};
