// ============================================================
// ADMIN — TypeScript Interfaces
// Single source of truth — fully aligned with backend Firestore schemas
// Last updated: March 2026
// ============================================================

export type UserRole        = 'admin' | 'editor' | 'viewer';
export type UserStatus      = 'active' | 'inactive' | 'banned';
export type OrderStatus     = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus   = 'paid' | 'pending' | 'refunded' | 'failed';
// All 14 payment methods supported by the backend
export type PaymentMethod   =
  | 'card' | 'apple_pay' | 'google_pay'
  | 'paypal' | 'klarna' | 'revolut'
  | 'sepa_debit' | 'ideal' | 'bancontact' | 'sofort'
  | 'giropay' | 'eps' | 'przelewy24' | 'blik'
  | 'cod';
export type BlogStatus      = 'published' | 'draft' | 'archived';
export type ProductCategory = string;          // dynamic — from categories collection
export type ContactStatus   = 'new' | 'read' | 'replied' | 'archived';
export type CardSource      = 'stripe_order' | 'manual';

// ── Admin Auth ────────────────────────────────────────────────
export interface AdminUser {
  id:          string;       // = uid in Firestore
  uid?:        string;
  name:        string;
  email:       string;
  phone?:      string;
  role:        UserRole;
  status?:     UserStatus;
  avatar?:     string;
  bio?:        string;
  firstName?:  string;
  lastName?:   string;
  country?:    string;
  city?:       string;
  postalCode?: string;
  taxId?:      string;
  facebook?:   string;
  twitter?:    string;
  linkedin?:   string;
  instagram?:  string;
  lastLogin?:  string | null;
  createdAt?:  string | null;
  updatedAt?:  string | null;
}

// ── Product ───────────────────────────────────────────────────
export interface AdminProduct {
  id:               string;    // uuid
  name:             string;
  slug?:            string;
  category:         ProductCategory;
  categoryId?:      string;
  categoryName?:    string;
  price:            number;
  originalPrice?:   number | null;
  discount?:        number | null;
  image:            string;    // = thumbnail
  thumbnail?:       string;
  images?:          string[];
  description:      string;
  shortDescription?: string;
  badge?:           string;
  isNew?:           boolean;
  isFeatured?:      boolean;
  stock:            number;
  sku:              string;
  unit?:            string;
  tags?:            string[];
  rating?:          number;
  reviews?:         number;    // = reviewCount (alias)
  reviewCount?:     number;
  status:           'active' | 'inactive' | 'draft' | 'out_of_stock';
  createdAt:        string;
  updatedAt:        string;
}

// ── Storefront User ───────────────────────────────────────────
export interface User {
  id:          string;
  uid?:        string;
  name:        string;
  email:       string;
  phone:       string;
  avatar?:     string;
  role?:       string;
  status:      UserStatus;
  joinedAt?:   string;
  lastLogin?:  string | null;
  totalOrders?: number;
  totalSpent?:  number;
  address?: {
    street:  string;
    city:    string;
    state:   string;
    zip:     string;
    country: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// ── Order ─────────────────────────────────────────────────────
export interface OrderItem {
  productId?:    string | number;
  name:          string;         // = productName
  productName?:  string;
  image?:        string;
  productImage?: string;
  price:         number;
  quantity:      number;
}

export interface CarrierInfo {
  carrier:     string;
  label:       string;
  trackingUrl: string | null;
}

export interface TrackingHistoryEntry {
  status:    string;
  note:      string;
  timestamp: string;
  actor?:    string;
  location?: string;
}

export interface Order {
  id:                 string;
  orderNumber?:       string;
  userId?:            string | null;
  sessionId?:         string;
  userName:           string;
  userEmail:          string;
  items:              OrderItem[];
  address:            Record<string, string>;
  subtotal:           number;
  shipping:           number;
  tax?:               number;
  total:              number;
  status:             OrderStatus;
  paymentStatus:      PaymentStatus;
  paymentMethod:      string;             // PaymentMethod string
  paymentMethodLabel?: string;
  paymentDetails?: {
    method:          string;
    status:          string;
    cardholderName?: string;
    last4?:          string;
    expiryMonth?:    string;
    expiryYear?:     string;
    cardType?:       string;
    brand?:          string;
    fingerprint?:    string;
    transactionId?:  string;
    [key: string]:   unknown;
  };
  paid:               boolean;
  notes?:             string;
  adminNote?:         string;
  trackingCode?:      string;
  carrierCode?:       string;
  carrierInfo?:       CarrierInfo;
  estimatedDelivery?: string;
  statusHistory:      TrackingHistoryEntry[];
  trackingEvents?:    TrackingHistoryEntry[];
  createdAt:          string;
  updatedAt:          string;
}

// ── Card / Payment ─────────────────────────────────────────────
export interface CardDetail {
  id:             string;
  userId:         string | null;
  userName:       string;
  userEmail:      string;
  cardType:       'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay' | string;
  last4:          string;
  expiryMonth:    string;
  expiryYear:     string;
  cardholderName: string;
  fingerprint?:   string;
  isDefault:      boolean;
  source?:        CardSource;
  lastOrderId?:   string;
  createdAt:      string;
  updatedAt?:     string;
}

// ── Contact ────────────────────────────────────────────────────
export interface Contact {
  id:        string;
  name:      string;
  email:     string;
  phone?:    string;
  subject?:  string;
  message:   string;
  status:    ContactStatus;
  createdAt: string;
  repliedAt?: string | null;
  updatedAt?: string;
}

// ── Blog Post ──────────────────────────────────────────────────
export interface AdminBlogPost {
  id:          string;
  title:       string;
  slug:        string;
  excerpt:     string;
  content:     string;
  cover?:      string;   // Firestore field
  image?:      string;   // alias used in UI
  author:      string;
  authorName?: string;
  authorId?:   string;
  category:    string;
  tags:        string[];
  status:      BlogStatus;
  views:       number;
  publishedAt?: string | null;
  createdAt:   string;
  updatedAt:   string;
}

// ── Category ───────────────────────────────────────────────────
export interface AdminCategory {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  image:       string;
  status:      'active' | 'inactive';
  sortOrder:   number;
  createdAt:   string;
  updatedAt:   string;
}

// ── Testimonial ────────────────────────────────────────────────
export interface AdminTestimonial {
  id:        string;
  name:      string;
  position:  string;
  message:   string;
  rating:    number;
  avatar:    string;
  status:    'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ── Slider ─────────────────────────────────────────────────────
export interface AdminSlider {
  id:         string;
  title:      string;
  subtitle:   string;
  buttonText: string;
  buttonLink: string;
  image:      string;
  sortOrder:  number;
  status:     'active' | 'inactive';
  createdAt:  string;
  updatedAt:  string;
}

// ── Review ─────────────────────────────────────────────────────
export interface AdminReview {
  id:        string;
  productId: string;
  userId:    string | null;
  userName:  string;
  isGuest:   boolean;
  rating:    number;
  comment:   string;
  status:    'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

// ── FAQ ────────────────────────────────────────────────────────
export interface AdminFaq {
  id:        string;
  question:  string;
  answer:    string;
  category:  string;
  sortOrder: number;
  status:    'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ── Newsletter Subscriber ──────────────────────────────────────
export interface NewsletterSubscriber {
  id:        string;
  email:     string;
  name:      string;
  status:    'active' | 'unsubscribed';
  createdAt: string;
  updatedAt: string;
}

// ── Calendar Event ─────────────────────────────────────────────
export interface CalendarEvent {
  id:                string;
  title:             string;
  description?:      string;
  startDate:         string;    // YYYY-MM-DD
  endDate?:          string;
  startTime?:        string;    // HH:mm
  endTime?:          string;
  type:              string;
  color?:            string;
  allDay:            boolean;
  notificationSent?: boolean;
  createdAt:         string;
  updatedAt:         string;
}

// ── Wishlist ───────────────────────────────────────────────────
export interface WishlistItem {
  id:        string;
  productId: string | number;
  name:      string;
  price:     number;
  thumbnail: string;
  addedAt:   string;
}

export interface WishlistByUser {
  userId:    string;
  userName:  string;
  userEmail: string;
  items:     WishlistItem[];
  updatedAt?: string;
}

// ── Site Settings (singleton: settings/site) ───────────────────
export interface SiteSettings {
  siteName:        string;
  address:         string;
  email:           string;
  phone:           string;
  twitterLink:     string;
  facebookLink:    string;
  instagramLink:   string;
  aboutUs:         string;
  metaTitle:       string;
  metaDescription: string;
  logo:            string;
  favicon:         string;
  notifNewOrder?:     boolean;
  notifLowStock?:     boolean;
  notifOrderShipped?: boolean;
  notifNewUser?:      boolean;
  notifNewContact?:   boolean;
  notifNewsletter?:   boolean;
  shippingThreshold?: number;
  shippingFee?:       number;
  processingTime?:    string;
  deliveryEstimate?:  string;
  shippingZones?:     string;
  smtpHost?:          string;
  smtpPort?:          number;
  smtpUser?:          string;
  smtpPass?:          string;
  mailFromName?:      string;
  mailFromEmail?:     string;
  gaId?:              string;
  gtmId?:             string;
  fbPixelId?:         string;
  fbConvToken?:       string;
  secTwoFactor?:      boolean;
  secSessionTimeout?: boolean;
  secRateLimit?:      boolean;
  registrationMode?:  'open' | 'invite';
  emailVerification?: 'required' | 'optional';
  guestCheckout?:     'enabled' | 'disabled';
  accountDeletion?:   'self' | 'admin';
  themeDefault?:      'light' | 'dark';
  updatedAt?:         string | null;
}

// ── Dashboard Stats ────────────────────────────────────────────
export interface DashboardStats {
  totalRevenue:   number;
  revenueGrowth:  number;
  totalOrders:    number;
  ordersGrowth:   number;
  totalUsers:     number;
  usersGrowth:    number;
  totalProducts:  number;
  productsGrowth: number;
  recentOrders:   Order[];
  topProducts:    Array<{ product: AdminProduct; sold: number; revenue: number }>;
  revenueChart:   Array<{ month: string; revenue: number; orders: number }>;
}

// ── Table / Filter Utilities ───────────────────────────────────
export interface TableColumn<T> {
  key:       keyof T | string;
  label:     string;
  sortable?: boolean;
  render?:   (value: unknown, row: T) => React.ReactNode;
  width?:    string;
}

export interface PaginationState {
  page:      number;
  pageSize:  number;
  total:     number;
}

export interface SortState {
  key:       string;
  direction: 'asc' | 'desc';
}
