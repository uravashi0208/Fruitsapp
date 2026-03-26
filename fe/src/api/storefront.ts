/**
 * src/api/storefront.ts
 * All storefront (public + user-scoped) API calls.
 * Full payment method type support added.
 */

import api from './client';

// ─── Generic ──────────────────────────────────────────────────────────────────
export interface ApiOk<T> { success: boolean; data: T }

// ─── Payment methods ──────────────────────────────────────────────────────────
export type PaymentMethod =
  | 'card' | 'apple_pay' | 'google_pay'
  | 'paypal' | 'klarna' | 'revolut'
  | 'sepa_debit' | 'ideal' | 'bancontact' | 'sofort' | 'giropay' | 'eps'
  | 'przelewy24' | 'blik'
  | 'cod';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/** Masked/tokenised card details — never contains raw PAN */
export interface CardDetails {
  cardholderName?: string;
  last4?:          string;   // e.g. "4242"
  expiryMonth?:    string;   // e.g. "12"
  expiryYear?:     string;   // e.g. "2027"
  cardType?:       'visa' | 'mastercard' | 'amex' | 'maestro' | 'discover' | 'unionpay';
  brand?:          string;
}

/** Payment payload sent to POST /api/orders */
export interface OrderPayment {
  method:           PaymentMethod;
  status?:          PaymentStatus;

  // Card / Apple Pay / Google Pay
  cardDetails?:     CardDetails;

  // PayPal
  paypalEmail?:     string;
  paypalOrderId?:   string;

  // Klarna
  klarnaOrderId?:   string;
  instalments?:     number;

  // Revolut
  revolutOrderId?:  string;

  // SEPA
  ibanLast4?:       string;
  accountHolder?:   string;
  mandateRef?:      string;

  // iDEAL
  idealBank?:       string;

  // SOFORT
  sofortBank?:      string;
  sofortRef?:       string;

  // Giropay
  bic?:             string;

  // EPS
  epsBank?:         string;

  // Przelewy24
  p24TransactionId?: string;

  // BLIK — only post-auth reference, NEVER the raw 6-digit code
  blikRef?:         string;

  // COD
  codNote?:         string;

  // Shared
  transactionId?:   string;
  last4?:           string;
}

// ─── Sliders ──────────────────────────────────────────────────────────────────
export interface ApiSlider {
  id:         string;
  title:      string;
  subtitle:   string;
  buttonText: string;
  buttonLink: string;
  image:      string;
  sortOrder:  number;
  status:     'active' | 'inactive';
}

export const slidersApi = {
  list: () => api.get<ApiOk<ApiSlider[]>>('/api/sliders', { noAuth: true }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
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

export const productsApi = {
  list: (params: { category?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return api.get<ApiOk<ApiProduct[]>>(
      `/api/products${qs ? `?${qs}` : ''}`,
      { noAuth: true }
    );
  },
  getOne: (id: string | number) =>
    api.get<ApiOk<ApiProduct>>(`/api/products/${id}`, { noAuth: true }),
};

// ─── Contact ──────────────────────────────────────────────────────────────────
export const contactApi = {
  submit: (body: {
    name: string; email: string; message: string; phone?: string; subject?: string;
  }) =>
    api.post<ApiOk<{ id: string; message: string }>>('/api/contact', body, { noAuth: true }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface PlaceOrderItem {
  productId?: string | number;
  name:       string;
  price:      number;
  quantity:   number;
  image?:     string;
}

export interface PlaceOrderBilling {
  firstName: string;
  lastName:  string;
  email:     string;
  phone?:    string;
  address:   string;
  city:      string;
  state?:    string;
  zip?:      string;
  country?:  string;
}

export interface PlaceOrderBody {
  items:    PlaceOrderItem[];
  billing:  PlaceOrderBilling;
  payment:  OrderPayment;
  notes?:   string;
}

export interface PlacedOrder {
  id:                 string;
  orderNumber:        string;
  status:             string;
  paymentStatus:      PaymentStatus;
  paymentMethod:      PaymentMethod;
  paymentMethodLabel: string;
  total:              number;
  subtotal:           number;
  shipping:           number;
  tax:                number;
  createdAt:          string;
}

export const ordersApi = {
  place: (body: PlaceOrderBody) =>
    api.post<ApiOk<PlacedOrder>>('/api/orders', body, { noAuth: true }),

  myOrders: () =>
    api.get<ApiOk<PlacedOrder[]>>('/api/orders/my'),

  myOrder: (id: string) =>
    api.get<ApiOk<PlacedOrder>>(`/api/orders/my/${id}`),
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
export interface PaymentIntentResponse {
  clientSecret:    string | null;
  paymentIntentId: string | null;
  isCod?:          boolean;
}

export const stripeApi = {
  createPaymentIntent: (body: {
    amount:         number;
    payMethod:      string;
    customerEmail?: string;
    orderId?:       string;
    billing?:       PlaceOrderBilling;
  }) =>
    api.post<ApiOk<PaymentIntentResponse>>('/api/stripe/payment-intent', body, { noAuth: true }),

  verifyPayment: (paymentIntentId: string) =>
    api.get<ApiOk<{ status: string; paymentIntentId: string; amount: number }>>(`/api/stripe/verify/${paymentIntentId}`, { noAuth: true }),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export interface WishlistEntry {
  id:              string;
  productId:       number | string;
  productName:     string;
  productImage:    string;
  productPrice:    number;
  productCategory: string;
  addedAt:         string;
}

export const wishlistApi = {
  get:    () => api.get<ApiOk<WishlistEntry[]>>('/api/wishlist'),
  check:  (productId: number | string) =>
    api.get<ApiOk<{ wishlisted: boolean }>>(`/api/wishlist/check/${productId}`),
  add:    (body: Omit<WishlistEntry, 'id' | 'addedAt'>) =>
    api.post<ApiOk<WishlistEntry>>('/api/wishlist', body),
  remove: (productId: number | string) =>
    api.delete<ApiOk<{ message: string }>>(`/api/wishlist/${productId}`),
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
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

// ─── Newsletter ───────────────────────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (body: { email: string; name?: string }) =>
    api.post<ApiOk<{ id: string; email: string; status: string }>>(
      '/api/newsletter', body, { noAuth: true }
    ),
};

// ─── Blogs ────────────────────────────────────────────────────────────────────
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
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return api.get<{
      success: boolean;
      data: ApiBlogPost[];
      pagination: { total: number; totalPages: number; page: number; limit: number };
    }>(`/api/blogs${qs ? `?${qs}` : ''}`, { noAuth: true });
  },
  getOne: (idOrSlug: string) =>
    api.get<ApiOk<ApiBlogPost>>(`/api/blogs/${idOrSlug}`, { noAuth: true }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export interface ApiReview {
  id:        string;
  productId: string;
  userId:    string | null;
  userName:  string;
  isGuest:   boolean;
  rating:    number;
  comment:   string;
  status:    string;
  createdAt: string;
}

export interface ReviewsListResponse {
  success:    boolean;
  data:       ApiReview[];
  pagination: { total: number; page: number; limit: number };
}

export const reviewsApi = {
  list: (productId: string, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return api.get<ReviewsListResponse>(
      `/api/products/${productId}/reviews${qs ? `?${qs}` : ''}`,
      { noAuth: true }
    );
  },
  submit: (
    productId: string,
    body: { rating: number; comment: string; guestName?: string }
  ) =>
    api.post<ApiOk<ApiReview>>(
      `/api/products/${productId}/reviews`, body, { noAuth: true }
    ),
};