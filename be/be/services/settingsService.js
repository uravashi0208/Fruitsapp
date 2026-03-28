/**
 * services/settingsService.js
 * Website settings (single document) — collection: "settings", doc: "site"
 */
const { db, FieldValue } = require('../config/firebase');
const { deleteFromFirebase } = require('../utils/upload');

const COL = 'settings';
const DOC = 'site';

const getSettings = async () => {
  const snap = await db.collection(COL).doc(DOC).get();
  if (!snap.exists) return getDefaults();
  return snap.data();
};

const updateSettings = async (data, newLogoUrl = null, newFaviconUrl = null) => {
  const snap   = await db.collection(COL).doc(DOC).get();
  const old    = snap.exists ? snap.data() : getDefaults();
  const update = { ...old, ...data, updatedAt: FieldValue.serverTimestamp() };

  if (newLogoUrl) {
    if (old.logo) await deleteFromFirebase(old.logo);
    update.logo = newLogoUrl;
  }
  if (newFaviconUrl) {
    if (old.favicon) await deleteFromFirebase(old.favicon);
    update.favicon = newFaviconUrl;
  }

  await db.collection(COL).doc(DOC).set(update, { merge: true });
  return update;
};

const getDefaults = () => ({
  // Store Info
  siteName:        'Vegefoods',
  address:         '',
  email:           '',
  phone:           '',
  twitterLink:     '',
  facebookLink:    '',
  instagramLink:   '',
  aboutUs:         '',
  metaTitle:       'Vegefoods — Fresh Organic Delivery',
  metaDescription: 'Order fresh organic vegetables and fruits online.',
  logo:            '',
  favicon:         '',
  // Notifications
  notifNewOrder:     true,
  notifLowStock:     true,
  notifOrderShipped: true,
  notifNewUser:      false,
  notifNewContact:   true,
  notifNewsletter:   false,
  // Shipping
  shippingThreshold: 100,
  shippingFee:       9.99,
  processingTime:    '1-2',
  deliveryEstimate:  '3-5',
  shippingZones:     'California, Oregon, Washington, Nevada, Arizona',
  // Email / SMTP
  smtpHost:      'smtp.gmail.com',
  smtpPort:      587,
  smtpUser:      '',
  smtpPass:      '',
  mailFromName:  'Vegefoods',
  mailFromEmail: '',
  // Analytics
  gaId:        '',
  gtmId:       '',
  fbPixelId:   '',
  fbConvToken: '',
  // Security
  secTwoFactor:      false,
  secSessionTimeout: true,
  secRateLimit:      true,
  // Customers
  registrationMode:  'open',
  emailVerification: 'required',
  guestCheckout:     'enabled',
  accountDeletion:   'self',
  // Theme
  themeDefault: 'light',
  fontScale:    'md',
  updatedAt:    null,
});

module.exports = { getSettings, updateSettings };
