/**
 * src/api/storefront.ts
 * All storefront (public + user-scoped) API calls.
 * Full payment method type support added.
 */

import api from "./client";

// ─── Generic ──────────────────────────────────────────────────────────────────
export interface ApiOk<T> {
  success: boolean;
  data: T;
}

// ─── Payment methods ──────────────────────────────────────────────────────────
export type PaymentMethod =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "klarna"
  | "revolut"
  | "sepa_debit"
  | "ideal"
  | "bancontact"
  | "sofort"
  | "giropay"
  | "eps"
  | "przelewy24"
  | "blik"
  | "cod";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/** Masked/tokenised card details — never contains raw PAN */
export interface CardDetails {
  cardholderName?: string;
  last4?: string; // e.g. "4242"
  expiryMonth?: string; // e.g. "12"
  expiryYear?: string; // e.g. "2027"
  cardType?:
    | "visa"
    | "mastercard"
    | "amex"
    | "maestro"
    | "discover"
    | "unionpay";
  brand?: string;
}

/** Payment payload sent to POST /api/orders */
export interface OrderPayment {
  method: PaymentMethod;
  status?: PaymentStatus;
  orderPaymentStatus?: string;

  // Card / Apple Pay / Google Pay
  cardDetails?: CardDetails;

  // PayPal
  paypalEmail?: string;
  paypalOrderId?: string;

  // Klarna
  klarnaOrderId?: string;
  instalments?: number;

  // Revolut
  revolutOrderId?: string;

  // SEPA
  ibanLast4?: string;
  accountHolder?: string;
  mandateRef?: string;

  // iDEAL
  idealBank?: string;

  // SOFORT
  sofortBank?: string;
  sofortRef?: string;

  // Giropay
  bic?: string;

  // EPS
  epsBank?: string;

  // Przelewy24
  p24TransactionId?: string;

  // BLIK — only post-auth reference, NEVER the raw 6-digit code
  blikRef?: string;

  // COD
  codNote?: string;

  // Shared
  transactionId?: string;
  last4?: string;
}

// ─── Sliders ──────────────────────────────────────────────────────────────────
export interface ApiSlider {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  sortOrder: number;
  status: "active" | "inactive";
}

export const slidersApi = {
  list: () => api.get<ApiOk<ApiSlider[]>>("/api/sliders", { noAuth: true }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export interface ApiProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  description: string;
  stock: number;
  sku: string;
  badge?: string;
  isNew?: boolean;
  status: string;
  rating: number;
  reviews: number;
}

export const productsApi = {
  list: (params: { category?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<ApiOk<ApiProduct[]>>(`/api/products${qs ? `?${qs}` : ""}`, {
      noAuth: true,
    });
  },
  getOne: (id: string | number) =>
    api.get<ApiOk<ApiProduct>>(`/api/products/${id}`, { noAuth: true }),
};

// ─── Contact ──────────────────────────────────────────────────────────────────
export const contactApi = {
  submit: (body: {
    name: string;
    email: string;
    message: string;
    phone?: string;
    subject?: string;
  }) =>
    api.post<ApiOk<{ id: string; message: string }>>("/api/contact", body, {
      noAuth: true,
    }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface PlaceOrderItem {
  productId?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface PlaceOrderBilling {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface PlaceOrderBody {
  items: PlaceOrderItem[];
  billing: PlaceOrderBilling;
  payment: OrderPayment;
  notes?: string;
}

export interface PlacedOrderItem {
  productId?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  createdAt: string;
  // Full order fields returned by /api/orders/my
  items?: PlacedOrderItem[];
  userEmail?: string;
  userName?: string;
  address?: Record<string, string>;
  notes?: string;
  trackingCode?: string;
  updatedAt?: string;
}

export const ordersApi = {
  place: (body: PlaceOrderBody) =>
    api.post<ApiOk<PlacedOrder>>("/api/orders", body, { noAuth: true }),

  myOrders: () => api.get<ApiOk<PlacedOrder[]>>("/api/orders/my"),

  myOrder: (id: string) => api.get<ApiOk<PlacedOrder>>(`/api/orders/my/${id}`),
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
export interface PaymentIntentResponse {
  clientSecret: string | null;
  paymentIntentId: string | null;
  isCod?: boolean;
}

export const stripeApi = {
  createPaymentIntent: (body: {
    amount: number;
    payMethod: string;
    customerEmail?: string;
    orderId?: string;
    billing?: PlaceOrderBilling;
  }) =>
    api.post<ApiOk<PaymentIntentResponse>>("/api/stripe/payment-intent", body, {
      noAuth: true,
    }),

  verifyPayment: (paymentIntentId: string) =>
    api.get<
      ApiOk<{
        status: string;
        paymentIntentId: string;
        amount: number;
        cardDetails?: CardDetails;
      }>
    >(`/api/stripe/verify/${paymentIntentId}`, { noAuth: true }),

  /** Fetch masked card details for a Stripe PaymentMethod ID (pm_xxx) */
  getPaymentMethod: (pmId: string, cardholderName?: string) =>
    api.get<
      ApiOk<{
        paymentMethodId: string;
        type: string;
        cardDetails: CardDetails | null;
      }>
    >(
      `/api/stripe/payment-method/${pmId}${cardholderName ? `?name=${encodeURIComponent(cardholderName)}` : ""}`,
      { noAuth: true },
    ),

  /** Dev/test helper — returns Apple Pay mode, requirements & test cards */
  getApplePayTestStatus: () =>
    api.get<
      ApiOk<{
        testMode: boolean;
        note: string;
        requirements: string[];
        testCards: Record<string, string>;
      }>
    >("/api/stripe/apple-pay/test-status", { noAuth: true }),

  /** Dev/test helper — returns Google Pay mode, requirements & test steps */
  getGooglePayTestStatus: () =>
    api.get<
      ApiOk<{
        testMode: boolean;
        note: string;
        requirements: string[];
        testMode_steps: string[];
        testCards: Record<string, string>;
      }>
    >("/api/stripe/google-pay/test-status", { noAuth: true }),
};

// ─── PayPal (native — no Stripe) ─────────────────────────────────────────────
export interface PayPalCreateOrderResponse {
  id: string;
}

export interface PayPalCaptureResponse {
  paypalOrderId: string;
  captureId: string;
  status: string;
  payerEmail: string;
  payerName: string;
  amount: string;
  currency: string;
}

export const paypalApi = {
  createOrder: (body: {
    amount: number;
    currency?: string;
    orderId?: string;
  }) =>
    api.post<ApiOk<PayPalCreateOrderResponse>>(
      "/api/paypal/create-order",
      body,
      { noAuth: true },
    ),

  captureOrder: (body: { paypalOrderId: string; appOrderId?: string }) =>
    api.post<ApiOk<PayPalCaptureResponse>>("/api/paypal/capture-order", body, {
      noAuth: true,
    }),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export interface WishlistEntry {
  id: string;
  productId: number | string;
  productName: string;
  productImage: string;
  productPrice: number;
  productCategory: string;
  addedAt: string;
}

export const wishlistApi = {
  get: () => api.get<ApiOk<WishlistEntry[]>>("/api/wishlist"),
  check: (productId: number | string) =>
    api.get<ApiOk<{ wishlisted: boolean }>>(`/api/wishlist/check/${productId}`),
  add: (body: Omit<WishlistEntry, "id" | "addedAt">) =>
    api.post<ApiOk<WishlistEntry>>("/api/wishlist", body),
  remove: (productId: number | string) =>
    api.delete<ApiOk<{ message: string }>>(`/api/wishlist/${productId}`),
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
export interface ApiTestimonial {
  id: string;
  name: string;
  position: string;
  message: string;
  rating: number;
  avatar: string;
  status: "active" | "inactive";
}

export const testimonialsApi = {
  list: () =>
    api.get<ApiOk<ApiTestimonial[]>>("/api/testimonials", { noAuth: true }),
};

// ─── Newsletter ───────────────────────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (body: { email: string; name?: string }) =>
    api.post<ApiOk<{ id: string; email: string; status: string }>>(
      "/api/newsletter",
      body,
      { noAuth: true },
    ),
};

// ─── Blogs ────────────────────────────────────────────────────────────────────
export interface ApiBlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
  cover: string;
  tags: string[];
  status: string;
  views: number;
  publishedAt: string | null;
  createdAt: string;
}

export const blogsApi = {
  list: (
    params: {
      page?: number;
      limit?: number;
      tag?: string;
      search?: string;
    } = {},
  ) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<{
      success: boolean;
      data: ApiBlogPost[];
      pagination: {
        total: number;
        totalPages: number;
        page: number;
        limit: number;
      };
    }>(`/api/blogs${qs ? `?${qs}` : ""}`, { noAuth: true });
  },
  getOne: (idOrSlug: string) =>
    api.get<ApiOk<ApiBlogPost>>(`/api/blogs/${idOrSlug}`, { noAuth: true }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export interface ApiReview {
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

export interface ReviewsListResponse {
  success: boolean;
  data: ApiReview[];
  pagination: { total: number; page: number; limit: number };
}

export const reviewsApi = {
  list: (productId: string, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<ReviewsListResponse>(
      `/api/products/${productId}/reviews${qs ? `?${qs}` : ""}`,
      { noAuth: true },
    );
  },
  submit: (
    productId: string,
    body: { rating: number; comment: string; guestName?: string },
  ) =>
    api.post<ApiOk<ApiReview>>(`/api/products/${productId}/reviews`, body, {
      noAuth: true,
    }),
};
// ─── FAQs ─────────────────────────────────────────────────────────────────────
export interface ApiFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export const faqApi = {
  list: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return api.get<ApiOk<ApiFaq[]>>(`/api/faqs${qs}`, { noAuth: true });
  },
  categories: () =>
    api.get<ApiOk<string[]>>("/api/faqs/categories", { noAuth: true }),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
export interface CouponResult {
  couponId: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  discount: number;
  finalTotal: number;
}

export const couponsApi = {
  apply: (code: string, orderTotal: number) =>
    api.post<ApiOk<CouponResult>>(
      "/api/coupons/apply",
      { code, orderTotal },
      { noAuth: true },
    ),
};

// ─── Cancel order & lookup ────────────────────────────────────────────────────
export const cancelOrder = (id: string) =>
  api.post<ApiOk<PlacedOrder>>(`/api/orders/my/${id}/cancel`, {});

export const lookupOrdersByEmail = (email: string) =>
  api.get<ApiOk<PlacedOrder[]>>(
    `/api/orders/lookup?email=${encodeURIComponent(email)}`,
    { noAuth: true },
  );

// ─── Admin notifications ──────────────────────────────────────────────────────
export interface AdminNotification {
  id: string;
  type: "order" | "stock" | "contact";
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export const adminNotificationsApi = {
  list: () => api.get<ApiOk<AdminNotification[]>>("/api/admin/notifications"),
  unread: () =>
    api.get<ApiOk<{ count: number }>>("/api/admin/notifications/unread"),
  markRead: (id: string) =>
    api.patch<ApiOk<null>>(`/api/admin/notifications/${id}/read`, {}),
  markAllRead: () =>
    api.patch<ApiOk<null>>("/api/admin/notifications/read-all", {}),
  delete: (id: string) =>
    api.delete<ApiOk<null>>(`/api/admin/notifications/${id}`),
};

// ─── Admin coupons ────────────────────────────────────────────────────────────
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
  list: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {},
  ) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    return api.get<{ success: boolean; data: AdminCoupon[]; pagination: any }>(
      `/api/admin/coupons${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Partial<AdminCoupon>) =>
    api.post<ApiOk<AdminCoupon>>("/api/admin/coupons", body),
  update: (id: string, body: Partial<AdminCoupon>) =>
    api.put<ApiOk<AdminCoupon>>(`/api/admin/coupons/${id}`, body),
  delete: (id: string) => api.delete<ApiOk<null>>(`/api/admin/coupons/${id}`),
  bulkUpdateStatus: (ids: string[], status: "active" | "inactive") =>
    api.patch<ApiOk<{ updated: number }>>("/api/admin/coupons/bulk/status", {
      ids,
      status,
    }),
  bulkDelete: (ids: string[]) =>
    api.delete<ApiOk<{ deleted: number }>>("/api/admin/coupons/bulk", {
      body: { ids },
    }),
};
// ─── Google Pay (direct — no Stripe) ─────────────────────────────────────────
export interface GPayConfig {
  environment: "TEST" | "PRODUCTION";
  merchantId: string;
  merchantName: string;
  allowedCardNetworks: string[];
  allowedAuthMethods: string[];
  tokenizationSpecification: object;
}

export interface GPayProcessBody {
  paymentData: object; // raw PaymentData from PaymentsClient.loadPaymentData()
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  items: Array<{
    productId: string | number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

export const gpayApi = {
  /** Fetch merchant config (environment, merchantId, tokenization spec) */
  getConfig: () =>
    api.get<ApiOk<GPayConfig>>("/api/gpay/config", { noAuth: true }),

  /** Send GPay PaymentData + order to backend, get order confirmation back */
  processPayment: (body: GPayProcessBody) =>
    api.post<ApiOk<{ orderNumber: string; orderId: string }>>(
      "/api/gpay/process",
      body,
      { noAuth: true },
    ),
};

// ─── Categories (Public) ──────────────────────────────────────────────────────
// આ code storefront.ts ની LAST LINE પછી add કરો

export interface ApiCategory {
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

export const categoriesApi = {
  list: () =>
    api.get<ApiOk<ApiCategory[]>>("/api/categories", { noAuth: true }),
};

// ─── Address API ──────────────────────────────────────────────────────────────

export interface SavedAddress {
  id:         string;
  label:      string;
  addr:       string;
  city?:      string;
  postalCode?:string;
  country?:   string;
  lat?:       number | null;
  lon?:       number | null;
  createdAt?: string;
}

export interface CreateAddressBody {
  label:       string;
  addr:        string;
  city?:       string;
  postalCode?: string;
  country?:    string;
  lat?:        number | null;
  lon?:        number | null;
}

export const addressApi = {
  /** GET /api/addresses — fetch all saved addresses */
  list: () =>
    api.get<ApiOk<SavedAddress[]>>("/api/addresses"),

  /** POST /api/addresses — save new address to DB */
  create: (body: CreateAddressBody) =>
    api.post<ApiOk<SavedAddress>>("/api/addresses", body),

  /** PUT /api/addresses/:id — update existing address */
  update: (id: string, body: Partial<CreateAddressBody>) =>
    api.put<ApiOk<SavedAddress>>(`/api/addresses/${id}`, body),

  /** DELETE /api/addresses/:id — delete address */
  remove: (id: string) =>
    api.delete<ApiOk<SavedAddress[]>>(`/api/addresses/${id}`),
};



export interface UpdateProfileBody {
  name?:       string;
  firstName?:  string;
  lastName?:   string;
  phone?:      string;
  bio?:        string;
  city?:       string;
  country?:    string;
  postalCode?: string;
}
 
export interface UserProfile {
  id:          string;
  name:        string;
  email:       string;
  phone?:      string;
  bio?:        string;
  firstName?:  string;
  lastName?:   string;
  city?:       string;
  country?:    string;
  postalCode?: string;
  avatar?:     string;
  status?:     string;
  createdAt?:  string;
  updatedAt?:  string;
}
 
export const authApi = {
  /** GET /api/auth/me */
  me: () =>
    api.get<ApiOk<UserProfile>>("/api/auth/me"),
 
  /** PATCH /api/auth/me — update name, phone, bio, city, country, postalCode */
  updateProfile: (body: UpdateProfileBody) =>
    api.patch<ApiOk<UserProfile>>("/api/auth/me", body),
 
  /** PATCH /api/auth/me/password */
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch<ApiOk<null>>("/api/auth/me/password", body),
};