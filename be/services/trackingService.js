/**
 * services/trackingService.js
 *
 * Order Tracking System
 *  - Generates & validates tracking codes
 *  - Manages tracking events / timeline
 *  - Carrier detection from tracking number format
 *  - Sends tracking emails to customers
 *  - Webhook stub for real carrier integrations
 */

const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { sendMail, buildEmailTemplate } = require('../utils/mailer');

const ORDERS_COL   = 'orders';
const TRACKING_COL = 'trackingEvents';

// ─── Carrier patterns ──────────────────────────────────────────────────────────
const CARRIER_PATTERNS = [
  { carrier: 'UPS',     regex: /^1Z[A-Z0-9]{16}$/i,                   label: 'UPS',         trackingUrl: 'https://www.ups.com/track?tracknum={code}' },
  { carrier: 'FedEx',   regex: /^(\d{12}|\d{15}|\d{20}|96\d{20})$/,  label: 'FedEx',       trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={code}' },
  { carrier: 'USPS',    regex: /^(9[234]\d{20}|[A-Z]{2}\d{9}[A-Z]{2})$/i, label: 'USPS',   trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={code}' },
  { carrier: 'DHL',     regex: /^(\d{10}|[A-Z]{3}\d{10}|JD\d{18})$/i, label: 'DHL',        trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB={code}' },
  { carrier: 'GLS',     regex: /^\d{8,11}$/,                           label: 'GLS',         trackingUrl: 'https://gls-group.eu/track/{code}' },
  { carrier: 'DPD',     regex: /^\d{14}$/,                             label: 'DPD',         trackingUrl: 'https://www.dpd.com/tracking?parcelNumber={code}' },
  { carrier: 'InPost',  regex: /^\d{24}$/,                             label: 'InPost',      trackingUrl: 'https://inpost.pl/sledzenie-przesylek?number={code}' },
  { carrier: 'Vegefoods', regex: /^VGF-[A-Z0-9]{4}-[A-Z0-9]{6}$/,    label: 'Vegefoods Delivery', trackingUrl: null },
];

// ─── Order lifecycle status → human label ─────────────────────────────────────
const STATUS_LABELS = {
  pending:    { label: 'Order Placed',      icon: '📋', color: '#f59e0b' },
  confirmed:  { label: 'Order Confirmed',   icon: '✅', color: '#3b82f6' },
  processing: { label: 'Being Prepared',    icon: '📦', color: '#8b5cf6' },
  shipped:    { label: 'Out for Delivery',  icon: '🚚', color: '#06b6d4' },
  delivered:  { label: 'Delivered',         icon: '🎉', color: '#10b981' },
  cancelled:  { label: 'Cancelled',         icon: '❌', color: '#ef4444' },
};

// ─── Generate internal tracking code ──────────────────────────────────────────
const generateTrackingCode = () => {
  const seg1 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const seg2 = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VGF-${seg1}-${seg2}`;
};

// ─── Detect carrier from tracking number format ────────────────────────────────
const detectCarrier = (trackingNumber) => {
  if (!trackingNumber) return null;
  const code = trackingNumber.trim();
  for (const p of CARRIER_PATTERNS) {
    if (p.regex.test(code)) {
      return {
        carrier:     p.carrier,
        label:       p.label,
        trackingUrl: p.trackingUrl ? p.trackingUrl.replace('{code}', code) : null,
      };
    }
  }
  return { carrier: 'Other', label: 'Carrier', trackingUrl: null };
};

// ─── Assign tracking code and optionally carrier code ─────────────────────────
const assignTracking = async (orderId, { trackingCode, carrierCode, estimatedDelivery, note } = {}) => {
  const ref  = db.collection(ORDERS_COL).doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('Order not found.', 404);

  const order    = snap.data();
  const code     = trackingCode || generateTrackingCode();
  const detected = detectCarrier(carrierCode || code);

  const update = {
    trackingCode:      code,
    carrierCode:       carrierCode || '',
    carrierInfo:       detected,
    estimatedDelivery: estimatedDelivery || null,
    updatedAt:         FieldValue.serverTimestamp(),
  };

  // Push event to statusHistory
  const historyEntry = {
    status:    order.status,
    note:      note || `Tracking assigned: ${code}`,
    timestamp: new Date().toISOString(),
    actor:     'system',
  };

  update.statusHistory = [...(order.statusHistory || []), historyEntry];

  await ref.update(update);

  // Send tracking email to customer (non-blocking)
  if (order.userEmail) {
    setImmediate(() =>
      sendTrackingAssignedEmail(order, code, detected, estimatedDelivery).catch(err =>
        console.error('[trackingService] tracking email failed:', err.message)
      )
    );
  }

  return { ...order, ...update, id: orderId };
};

// ─── Add a tracking event to the timeline ─────────────────────────────────────
const addTrackingEvent = async (orderId, { status, location, note, actor = 'system', timestamp } = {}) => {
  const ref  = db.collection(ORDERS_COL).doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('Order not found.', 404);

  const order = snap.data();
  const event = {
    id:        uuidv4(),
    status:    status || order.status,
    location:  location || '',
    note:      note    || '',
    actor,
    timestamp: timestamp || new Date().toISOString(),
  };

  const trackingEvents = [...(order.trackingEvents || []), event];
  await ref.update({ trackingEvents, updatedAt: FieldValue.serverTimestamp() });

  return event;
};

// ─── Get full tracking timeline for an order ──────────────────────────────────
const getTrackingTimeline = async (orderId) => {
  const snap = await db.collection(ORDERS_COL).doc(orderId).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);

  const order = snap.data();

  // Merge statusHistory (always present) + trackingEvents (optional) into one timeline
  const history = (order.statusHistory || []).map(h => ({
    id:        h.id || uuidv4(),
    type:      'status',
    status:    h.status,
    note:      h.note || '',
    location:  h.location || '',
    actor:     h.actor || 'system',
    timestamp: h.timestamp,
  }));

  const events = (order.trackingEvents || []).map(e => ({
    ...e,
    type: 'carrier',
  }));

  const timeline = [...history, ...events].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return {
    orderId,
    orderNumber:       order.orderNumber || orderId,
    status:            order.status,
    trackingCode:      order.trackingCode || null,
    carrierCode:       order.carrierCode  || null,
    carrierInfo:       order.carrierInfo  || detectCarrier(order.trackingCode),
    estimatedDelivery: order.estimatedDelivery || null,
    timeline,
    statusLabels:      STATUS_LABELS,
  };
};

// ─── Public tracking lookup (by tracking code or order number) ─────────────────
const lookupTracking = async (code) => {
  if (!code) throw new AppError('Tracking code or order number required.', 400);

  // Try tracking code first
  let snap = await db.collection(ORDERS_COL)
    .where('trackingCode', '==', code.trim().toUpperCase())
    .limit(1)
    .get();

  // Fall back to order number
  if (snap.empty) {
    snap = await db.collection(ORDERS_COL)
      .where('orderNumber', '==', code.trim().toUpperCase())
      .limit(1)
      .get();
  }

  if (snap.empty) throw new AppError('No order found for this tracking code.', 404);

  const orderId = snap.docs[0].id;
  const timeline = await getTrackingTimeline(orderId);

  // Return safe public view (no payment details, no email)
  return {
    orderNumber:       timeline.orderNumber,
    status:            timeline.status,
    statusLabel:       STATUS_LABELS[timeline.status]?.label || timeline.status,
    trackingCode:      timeline.trackingCode,
    carrierInfo:       timeline.carrierInfo,
    estimatedDelivery: timeline.estimatedDelivery,
    timeline:          timeline.timeline,
    statusLabels:      STATUS_LABELS,
  };
};

// ─── Carrier webhook ingest ────────────────────────────────────────────────────
// POST /api/tracking/webhook/:carrier
// Carriers POST updates here; map their payload to our event schema
const ingestWebhook = async (carrier, payload) => {
  const carrierUpper = (carrier || '').toUpperCase();

  // Normalize to { trackingNumber, status, location, note, timestamp }
  let normalized = null;

  switch (carrierUpper) {
    case 'UPS':
      normalized = {
        trackingNumber: payload.trackingNumber || payload.TrackingNumber,
        status:         payload.ActivityStatus?.Description || 'update',
        location:       [payload.ActivityLocation?.City, payload.ActivityLocation?.CountryCode].filter(Boolean).join(', '),
        note:           payload.ActivityStatus?.Description || '',
        timestamp:      payload.PickupDate || new Date().toISOString(),
      };
      break;
    case 'FEDEX':
      normalized = {
        trackingNumber: payload.trackingNumber,
        status:         payload.eventType || 'update',
        location:       payload.scanLocation?.city || '',
        note:           payload.eventDescription || '',
        timestamp:      payload.date || new Date().toISOString(),
      };
      break;
    case 'DHL':
      normalized = {
        trackingNumber: payload.shipmentTrackingNumber,
        status:         payload.status?.description || 'update',
        location:       payload.location?.address?.addressLocality || '',
        note:           payload.description || '',
        timestamp:      payload.timestamp || new Date().toISOString(),
      };
      break;
    default:
      // Generic — accept { trackingNumber, status, location, note, timestamp }
      normalized = payload;
  }

  if (!normalized?.trackingNumber) {
    throw new AppError('Webhook payload missing trackingNumber.', 400);
  }

  // Find the order
  const snap = await db.collection(ORDERS_COL)
    .where('carrierCode', '==', normalized.trackingNumber)
    .limit(1)
    .get();

  if (snap.empty) {
    console.warn(`[trackingService] Webhook: no order for tracking# ${normalized.trackingNumber}`);
    return { received: true, matched: false };
  }

  const orderId = snap.docs[0].id;
  await addTrackingEvent(orderId, {
    status:    normalized.status,
    location:  normalized.location || '',
    note:      normalized.note     || '',
    actor:     `${carrierUpper}_WEBHOOK`,
    timestamp: normalized.timestamp,
  });

  return { received: true, matched: true, orderId };
};

// ─── Email: tracking assigned ──────────────────────────────────────────────────
const sendTrackingAssignedEmail = async (order, trackingCode, carrierInfo, estimatedDelivery) => {
  const subject = `Your order ${order.orderNumber} is on its way! 🚚`;
  const carrierLabel = carrierInfo?.label || 'Our Delivery Team';
  const deliveryLine = estimatedDelivery
    ? `<p style="font-size:14px;color:#555;margin:0 0 20px;">Estimated delivery: <strong>${new Date(estimatedDelivery).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</strong></p>`
    : '';

  const trackingUrlLine = carrierInfo?.trackingUrl
    ? `<a href="${carrierInfo.trackingUrl}" style="display:inline-block;background:#82ae46;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;margin-top:4px;">Track with ${carrierLabel}</a>`
    : '';

  const body = `
    <h2 style="color:#2d7a2d;margin:0 0 16px;">Your order is on its way! 🚚</h2>
    <p style="font-size:15px;color:#333;margin:0 0 20px;">
      Hi ${order.userName || 'there'}, your order <strong>${order.orderNumber}</strong> has been shipped.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;width:160px;">Tracking Number</td>
        <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;font-weight:700;letter-spacing:1px;">${trackingCode}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Carrier</td>
        <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${carrierLabel}</td>
      </tr>
      ${estimatedDelivery ? `<tr>
        <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Est. Delivery</td>
        <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#2d7a2d;font-weight:600;">${new Date(estimatedDelivery).toLocaleDateString()}</td>
      </tr>` : ''}
    </table>
    ${deliveryLine}
    ${trackingUrlLine}
    <p style="margin-top:24px;font-size:12px;color:#aaa;">
      You can also track your order at any time from your account page.
    </p>`;

  const html = buildEmailTemplate({ subject, body });
  await sendMail({ to: order.userEmail, subject, html });
  console.log(`[trackingService] Tracking email sent to ${order.userEmail} for ${order.orderNumber}`);
};

// ─── Delete all tracking events for an order (admin utility) ──────────────────
const clearTrackingEvents = async (orderId) => {
  const ref  = db.collection(ORDERS_COL).doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('Order not found.', 404);
  await ref.update({ trackingEvents: [], updatedAt: FieldValue.serverTimestamp() });
};

module.exports = {
  generateTrackingCode,
  detectCarrier,
  assignTracking,
  addTrackingEvent,
  getTrackingTimeline,
  lookupTracking,
  ingestWebhook,
  clearTrackingEvents,
  STATUS_LABELS,
  CARRIER_PATTERNS,
};
