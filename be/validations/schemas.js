/**
 * validations/schemas.js
 * Joi validation schemas — full payment method support.
 */
const Joi = require('joi');

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly:   true,
    stripUnknown: true,
  });
  if (error) { error.isJoi = true; throw error; }
  return value;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(80).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone:    Joi.string().allow('').optional(),
  role:     Joi.string().valid('admin', 'editor', 'viewer').default('viewer'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(6).max(128).required(),
});

const refreshTokenSchema = Joi.object({ refreshToken: Joi.string().required() });

// ── User ──────────────────────────────────────────────────────────────────────
const updateUserSchema = Joi.object({
  name:       Joi.string().min(2).max(80),
  phone:      Joi.string().allow(''),
  role:       Joi.string().valid('admin', 'editor', 'viewer'),
  status:     Joi.string().valid('active', 'inactive', 'banned'),
  firstName:  Joi.string().max(50).allow(''),
  lastName:   Joi.string().max(50).allow(''),
  bio:        Joi.string().max(300).allow(''),
  country:    Joi.string().max(100).allow(''),
  city:       Joi.string().max(100).allow(''),
  postalCode: Joi.string().max(20).allow(''),
  taxId:      Joi.string().max(50).allow(''),
  facebook:   Joi.string().uri().allow(''),
  twitter:    Joi.string().uri().allow(''),
  linkedin:   Joi.string().uri().allow(''),
  instagram:  Joi.string().uri().allow(''),
});

// ── Product Category ──────────────────────────────────────────────────────────
const categorySchema = Joi.object({
  name:        Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  slug:        Joi.string().lowercase().optional(),
  status:      Joi.string().valid('active', 'inactive').default('active'),
  sortOrder:   Joi.number().integer().min(0).default(0),
});

// ── Product ───────────────────────────────────────────────────────────────────
const productSchema = Joi.object({
  name:             Joi.string().min(1).max(200).required(),
  slug:             Joi.string().lowercase().optional(),
  description:      Joi.string().max(5000).allow('').optional(),
  shortDescription: Joi.string().max(500).allow('').optional(),
  categoryId:       Joi.string().allow('').optional(),
  category:         Joi.string().allow('').optional(),
  categoryName:     Joi.string().allow('').optional(),
  price:            Joi.number().min(0).required(),
  originalPrice:    Joi.number().min(0).allow(null).optional(),
  discount:         Joi.number().min(0).max(100).allow(null).optional(),
  sku:              Joi.string().max(100).allow('').optional(),
  stock:            Joi.number().integer().min(0).default(0),
  unit:             Joi.string().max(50).allow('').optional(),
  weight:           Joi.string().max(50).allow('').optional(),
  dimensions:       Joi.string().max(100).allow('').optional(),
  tags:             Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  isFeatured:       Joi.boolean().truthy('true', '1').falsy('false', '0').default(false),
  isNew:            Joi.boolean().truthy('true', '1').falsy('false', '0').default(false),
  badge:            Joi.string().max(100).allow('').optional(),
  availability:     Joi.string().valid('instock', 'outofstock').optional(),
  status:           Joi.string().valid('active', 'inactive', 'draft').default('active'),
  rating:           Joi.number().min(0).max(5).default(0),
  reviewCount:      Joi.number().integer().min(0).default(0),
  reviews:          Joi.number().integer().min(0).default(0),
}).options({ allowUnknown: false });

const updateProductSchema = productSchema
  .fork(['name', 'price'], (field) => field.optional())
  .options({ allowUnknown: false });

// ── Hero Slider ───────────────────────────────────────────────────────────────
const sliderSchema = Joi.object({
  title:      Joi.string().min(1).max(200).required(),
  subtitle:   Joi.string().max(300).allow('').optional(),
  buttonText: Joi.string().max(100).allow('').optional(),
  buttonLink: Joi.string().allow('').optional(),
  sortOrder:  Joi.number().integer().min(0).default(0),
  status:     Joi.string().valid('active', 'inactive').default('active'),
});

// ── Testimonial ───────────────────────────────────────────────────────────────
const testimonySchema = Joi.object({
  name:     Joi.string().min(1).max(100).required(),
  position: Joi.string().max(100).allow('').optional(),
  message:  Joi.string().min(1).max(1000).required(),
  rating:   Joi.number().min(1).max(5).default(5),
  status:   Joi.string().valid('active', 'inactive').default('active'),
});

// ── Newsletter ────────────────────────────────────────────────────────────────
const newsletterSchema = Joi.object({
  email: Joi.string().email().required(),
  name:  Joi.string().max(100).allow('').optional(),
});

// ── Website Settings ──────────────────────────────────────────────────────────
const settingsSchema = Joi.object({
  siteName:          Joi.string().max(100).allow('').optional(),
  address:           Joi.string().max(300).allow('').optional(),
  email:             Joi.string().email().allow('').optional(),
  phone:             Joi.string().max(50).allow('').optional(),
  twitterLink:       Joi.string().uri().allow('').optional(),
  facebookLink:      Joi.string().uri().allow('').optional(),
  instagramLink:     Joi.string().uri().allow('').optional(),
  aboutUs:           Joi.string().max(5000).allow('').optional(),
  metaTitle:         Joi.string().max(200).allow('').optional(),
  metaDescription:   Joi.string().max(500).allow('').optional(),
  notifNewOrder:     Joi.boolean().optional(),
  notifLowStock:     Joi.boolean().optional(),
  notifOrderShipped: Joi.boolean().optional(),
  notifNewUser:      Joi.boolean().optional(),
  notifNewContact:   Joi.boolean().optional(),
  notifNewsletter:   Joi.boolean().optional(),
  shippingThreshold: Joi.number().min(0).optional(),
  shippingFee:       Joi.number().min(0).optional(),
  processingTime:    Joi.string().allow('').optional(),
  deliveryEstimate:  Joi.string().allow('').optional(),
  shippingZones:     Joi.string().allow('').optional(),
  smtpHost:          Joi.string().allow('').optional(),
  smtpPort:          Joi.number().optional(),
  smtpUser:          Joi.string().allow('').optional(),
  smtpPass:          Joi.string().allow('').optional(),
  mailFromName:      Joi.string().allow('').optional(),
  mailFromEmail:     Joi.string().email().allow('').optional(),
  gaId:              Joi.string().allow('').optional(),
  gtmId:             Joi.string().allow('').optional(),
  fbPixelId:         Joi.string().allow('').optional(),
  fbConvToken:       Joi.string().allow('').optional(),
  secTwoFactor:      Joi.boolean().optional(),
  secSessionTimeout: Joi.boolean().optional(),
  secRateLimit:      Joi.boolean().optional(),
  registrationMode:  Joi.string().valid('open', 'invite', 'closed').optional(),
  emailVerification: Joi.string().valid('required', 'optional', 'none').optional(),
  guestCheckout:     Joi.string().valid('enabled', 'disabled').optional(),
  accountDeletion:   Joi.string().valid('self', 'admin').optional(),
  themeDefault:      Joi.string().valid('light', 'dark', 'auto').optional(),
  fontScale:         Joi.string().valid('sm', 'md', 'lg').optional(),
}).options({ allowUnknown: true });

// ── Blog ──────────────────────────────────────────────────────────────────────
const blogSchema = Joi.object({
  title:      Joi.string().min(1).max(300).optional(),
  slug:       Joi.string().lowercase().optional(),
  excerpt:    Joi.string().max(500).allow('').optional(),
  content:    Joi.string().min(1).optional(),
  tags:       Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  status:     Joi.string().valid('published', 'draft', 'archived').optional(),
  author:     Joi.string().max(100).allow('').optional(),
  authorName: Joi.string().max(100).allow('').optional(),
  category:   Joi.string().allow('').optional(),
  cover:      Joi.string().allow('').optional(),
}).options({ allowUnknown: true });

// ── Contact ───────────────────────────────────────────────────────────────────
const contactSchema = Joi.object({
  name:    Joi.string().min(1).max(100).required(),
  email:   Joi.string().email().required(),
  subject: Joi.string().max(200).allow('').optional(),
  message: Joi.string().min(1).max(2000).required(),
  phone:   Joi.string().max(30).allow('').optional(),
});

// ── Order ─────────────────────────────────────────────────────────────────────
// All supported payment methods
const ALL_PAYMENT_METHODS = [
  'card', 'apple_pay', 'google_pay',
  'paypal', 'klarna', 'revolut',
  'sepa_debit', 'ideal', 'bancontact', 'sofort', 'giropay', 'eps',
  'przelewy24', 'blik',
  'cod',
];

const orderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId:   Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
      productName: Joi.string().allow('').optional(),
      name:        Joi.string().allow('').optional(),
      price:       Joi.number().min(0).required(),
      qty:         Joi.number().integer().min(1).optional(),
      quantity:    Joi.number().integer().min(1).optional(),
      image:       Joi.string().allow('').optional(),
      thumbnail:   Joi.string().allow('').optional(),
    }).options({ allowUnknown: true })
  ).min(1).required(),

  billing: Joi.object({
    firstName: Joi.string().required(),
    lastName:  Joi.string().required(),
    email:     Joi.string().email().required(),
    phone:     Joi.string().allow('').optional(),
    address:   Joi.string().required(),
    city:      Joi.string().required(),
    state:     Joi.string().allow('').optional(),
    zip:       Joi.string().allow('').optional(),
    country:   Joi.string().default('PL'),
  }).required(),

  payment: Joi.object({
    method: Joi.string().valid(...ALL_PAYMENT_METHODS).required(),
    status: Joi.string().valid('pending', 'paid', 'failed').default('pending'),

    // ── Card / Apple Pay / Google Pay ─────────────────────────────────────────
    cardDetails: Joi.object({
      cardholderName: Joi.string().allow('').optional(),
      last4:          Joi.string().length(4).pattern(/^\d{4}$/).optional(),
      expiryMonth:    Joi.string().pattern(/^(0[1-9]|1[0-2])$/).optional(),
      expiryYear:     Joi.string().pattern(/^\d{2,4}$/).optional(),
      cardType:       Joi.string().valid('visa','mastercard','amex','discover','maestro','unionpay').optional(),
      brand:          Joi.string().allow('').optional(),
    }).optional(),

    // ── PayPal ────────────────────────────────────────────────────────────────
    paypalEmail:      Joi.string().email().allow('').optional(),
    paypalOrderId:    Joi.string().allow('').optional(),

    // ── Klarna ────────────────────────────────────────────────────────────────
    klarnaOrderId:    Joi.string().allow('').optional(),
    instalments:      Joi.number().integer().valid(3, 6, 12).optional(),

    // ── Revolut ───────────────────────────────────────────────────────────────
    revolutOrderId:   Joi.string().allow('').optional(),

    // ── SEPA Direct Debit ─────────────────────────────────────────────────────
    ibanLast4:        Joi.string().max(4).allow('').optional(),
    accountHolder:    Joi.string().max(100).allow('').optional(),
    mandateRef:       Joi.string().allow('').optional(),

    // ── iDEAL ─────────────────────────────────────────────────────────────────
    idealBank:        Joi.string().allow('').optional(),

    // ── Bancontact ────────────────────────────────────────────────────────────
    last4:            Joi.string().max(4).allow('').optional(),

    // ── SOFORT ────────────────────────────────────────────────────────────────
    sofortBank:       Joi.string().allow('').optional(),
    sofortRef:        Joi.string().allow('').optional(),

    // ── Giropay ───────────────────────────────────────────────────────────────
    bic:              Joi.string().max(11).allow('').optional(),

    // ── EPS ───────────────────────────────────────────────────────────────────
    epsBank:          Joi.string().allow('').optional(),

    // ── Przelewy24 ────────────────────────────────────────────────────────────
    p24TransactionId: Joi.string().allow('').optional(),

    // ── BLIK ──────────────────────────────────────────────────────────────────
    blikRef:          Joi.string().allow('').optional(),
    // NOTE: never accept raw blikCode — only a post-authorisation reference

    // ── Cash on Delivery ──────────────────────────────────────────────────────
    codNote:          Joi.string().max(300).allow('').optional(),

    // ── Shared ────────────────────────────────────────────────────────────────
    transactionId:    Joi.string().allow('').optional(),
  }).required(),

  coupon: Joi.string().allow('').optional(),
  notes:  Joi.string().max(500).allow('').optional(),
});

// ── Update order status (admin) ───────────────────────────────────────────────
const updateOrderStatusSchema = Joi.object({
  status:            Joi.string().valid(
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  ).required(),
  note:              Joi.string().max(500).allow('').optional(),
  trackingCode:      Joi.string().allow('').optional(),
  adminNote:         Joi.string().max(1000).allow('').optional(),
  carrierCode:       Joi.string().allow('').optional(),
  estimatedDelivery: Joi.string().allow('').optional(),
});

// ── Update payment status (admin manual / webhook) ────────────────────────────
const updatePaymentStatusSchema = Joi.object({
  paymentStatus: Joi.string().valid('processing','pending', 'paid', 'failed', 'refunded','cancelled').required(),
  transactionId: Joi.string().allow('').optional(),
  note:          Joi.string().max(500).allow('').optional(),
});

// ── Wishlist ──────────────────────────────────────────────────────────────────
const wishlistSchema = Joi.object({
  productId: Joi.string().required(),
});

// ── Pagination ────────────────────────────────────────────────────────────────
const paginationSchema = Joi.object({
  page:          Joi.number().integer().min(1).default(1),
  limit:         Joi.number().integer().min(1).max(100).default(20),
  search:        Joi.string().max(100).allow('').optional(),
  status:        Joi.string().allow('').optional(),
  sortBy:        Joi.string().allow('').optional(),
  sortDir:       Joi.string().valid('asc', 'desc').default('desc'),
  category:      Joi.string().allow('').optional(),
  tag:           Joi.string().allow('').optional(),
  paymentMethod: Joi.string().allow('').optional(),
});

module.exports = {
  validate,
  registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema,
  updateUserSchema,
  categorySchema,
  productSchema, updateProductSchema,
  sliderSchema,
  testimonySchema,
  newsletterSchema,
  settingsSchema,
  blogSchema,
  contactSchema,
  orderSchema, updateOrderStatusSchema, updatePaymentStatusSchema,
  wishlistSchema,
  paginationSchema,
};