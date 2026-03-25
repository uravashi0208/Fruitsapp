const Joi = require('joi');

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: true, stripUnknown: true });
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
  name:        Joi.string().min(2).max(80),
  phone:       Joi.string().allow(''),
  role:        Joi.string().valid('admin', 'editor', 'viewer'),
  status:      Joi.string().valid('active', 'inactive', 'banned'),
  // Profile fields
  firstName:   Joi.string().max(50).allow(''),
  lastName:    Joi.string().max(50).allow(''),
  bio:         Joi.string().max(300).allow(''),
  country:     Joi.string().max(100).allow(''),
  city:        Joi.string().max(100).allow(''),
  postalCode:  Joi.string().max(20).allow(''),
  taxId:       Joi.string().max(50).allow(''),
  facebook:    Joi.string().uri().allow(''),
  twitter:     Joi.string().uri().allow(''),
  linkedin:    Joi.string().uri().allow(''),
  instagram:   Joi.string().uri().allow(''),
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
  // images handled via multipart upload
}).options({ allowUnknown: false });

const updateProductSchema = productSchema.fork(
  ['name', 'price'],
  (field) => field.optional()
).options({ allowUnknown: false });

// ── Hero Slider ───────────────────────────────────────────────────────────────
const sliderSchema = Joi.object({
  title:       Joi.string().min(1).max(200).required(),
  subtitle:    Joi.string().max(300).allow('').optional(),
  buttonText:  Joi.string().max(100).allow('').optional(),
  buttonLink:  Joi.string().allow('').optional(),
  sortOrder:   Joi.number().integer().min(0).default(0),
  status:      Joi.string().valid('active', 'inactive').default('active'),
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
  // Store Info
  siteName:        Joi.string().max(100).allow('').optional(),
  address:         Joi.string().max(300).allow('').optional(),
  email:           Joi.string().email().allow('').optional(),
  phone:           Joi.string().max(50).allow('').optional(),
  twitterLink:     Joi.string().uri().allow('').optional(),
  facebookLink:    Joi.string().uri().allow('').optional(),
  instagramLink:   Joi.string().uri().allow('').optional(),
  aboutUs:         Joi.string().max(5000).allow('').optional(),
  metaTitle:       Joi.string().max(200).allow('').optional(),
  metaDescription: Joi.string().max(500).allow('').optional(),
  // Notifications
  notifNewOrder:     Joi.boolean().optional(),
  notifLowStock:     Joi.boolean().optional(),
  notifOrderShipped: Joi.boolean().optional(),
  notifNewUser:      Joi.boolean().optional(),
  notifNewContact:   Joi.boolean().optional(),
  notifNewsletter:   Joi.boolean().optional(),
  // Shipping
  shippingThreshold: Joi.number().min(0).optional(),
  shippingFee:       Joi.number().min(0).optional(),
  processingTime:    Joi.string().allow('').optional(),
  deliveryEstimate:  Joi.string().allow('').optional(),
  shippingZones:     Joi.string().allow('').optional(),
  // Email / SMTP
  smtpHost:    Joi.string().allow('').optional(),
  smtpPort:    Joi.number().optional(),
  smtpUser:    Joi.string().allow('').optional(),
  smtpPass:    Joi.string().allow('').optional(),
  mailFromName: Joi.string().allow('').optional(),
  mailFromEmail: Joi.string().email().allow('').optional(),
  // Analytics
  gaId:          Joi.string().allow('').optional(),
  gtmId:         Joi.string().allow('').optional(),
  fbPixelId:     Joi.string().allow('').optional(),
  fbConvToken:   Joi.string().allow('').optional(),
  // Security
  secTwoFactor:      Joi.boolean().optional(),
  secSessionTimeout: Joi.boolean().optional(),
  secRateLimit:      Joi.boolean().optional(),
  // Customers
  registrationMode:  Joi.string().valid('open','invite','closed').optional(),
  emailVerification: Joi.string().valid('required','optional','none').optional(),
  guestCheckout:     Joi.string().valid('enabled','disabled').optional(),
  accountDeletion:   Joi.string().valid('self','admin').optional(),
  // Theme
  themeDefault:   Joi.string().valid('light','dark','auto').optional(),
  fontScale:      Joi.string().valid('sm','md','lg').optional(),
}).options({ allowUnknown: true });

// ── Blog ──────────────────────────────────────────────────────────────────────
const blogSchema = Joi.object({
  title:       Joi.string().min(1).max(300).optional(),
  slug:        Joi.string().lowercase().optional(),
  excerpt:     Joi.string().max(500).allow('').optional(),
  content:     Joi.string().min(1).optional(),
  tags:        Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  status:      Joi.string().valid('published', 'draft', 'archived').optional(),
  author:      Joi.string().max(100).allow('').optional(),
  authorName:  Joi.string().max(100).allow('').optional(),
  category:    Joi.string().allow('').optional(),
  cover:       Joi.string().allow('').optional(),
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
const orderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    productId:   Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    productName: Joi.string().allow('').optional(),
    name:        Joi.string().allow('').optional(),
    price:       Joi.number().min(0).required(),
    qty:         Joi.number().integer().min(1).optional(),
    quantity:    Joi.number().integer().min(1).optional(),
    image:       Joi.string().allow('').optional(),
    thumbnail:   Joi.string().allow('').optional(),
  }).options({ allowUnknown: true })).min(1).required(),
  billing: Joi.object({
    firstName: Joi.string().required(),
    lastName:  Joi.string().required(),
    email:     Joi.string().email().required(),
    phone:     Joi.string().allow('').optional(),
    address:   Joi.string().required(),
    city:      Joi.string().required(),
    state:     Joi.string().allow('').optional(),
    zip:       Joi.string().allow('').optional(),
    country:   Joi.string().default('US'),
  }).required(),
  payment: Joi.object({
    method: Joi.string().valid('card', 'paypal', 'bank', 'cod').required(),
    status: Joi.string().valid('pending', 'paid', 'failed').default('pending'),
  }).required(),
  coupon:        Joi.string().allow('').optional(),
  notes:         Joi.string().max(500).allow('').optional(),
});

const updateOrderStatusSchema = Joi.object({
  status:        Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
  note:          Joi.string().max(500).allow('').optional(),
  trackingCode:  Joi.string().allow('').optional(),
  adminNote:     Joi.string().max(500).allow('').optional(),
});

// ── Wishlist ──────────────────────────────────────────────────────────────────
const wishlistSchema = Joi.object({
  productId: Joi.string().required(),
});

// ── Pagination ────────────────────────────────────────────────────────────────
const paginationSchema = Joi.object({
  page:     Joi.number().integer().min(1).default(1),
  limit:    Joi.number().integer().min(1).max(100).default(20),
  search:   Joi.string().max(100).allow('').optional(),
  status:   Joi.string().allow('').optional(),
  sortBy:   Joi.string().allow('').optional(),
  sortDir:  Joi.string().valid('asc', 'desc').default('desc'),
  category: Joi.string().allow('').optional(),
  tag:      Joi.string().allow('').optional(),
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
  orderSchema, updateOrderStatusSchema,
  wishlistSchema,
  paginationSchema,
};