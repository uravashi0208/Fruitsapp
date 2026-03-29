/**
 * services/calendarService.js
 * 
 * Calendar Event service — Firebase Firestore
 * 
 * Fields per event:
 *   id, title, description, startDate, endDate, startTime,
 *   type ('event'|'meeting'|'seminar'|'submission'|'other'),
 *   color, allDay, createdAt, updatedAt
 */

const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'calendarEvents';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

/** ── helpers ─────────────────────────────────────────────── */
const docToEvent = (data) => ({
  ...data,
  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
});

/** ── Create event ─────────────────────────────────────────── */
const createEvent = async ({ title, description = '', startDate, endDate, startTime = '', endTime = '', type = 'event', color = '#4caf50', allDay = false }) => {
  if (!title?.trim())     throw new AppError('Title is required.', 422);
  if (!startDate?.trim()) throw new AppError('Start date is required.', 422);

  const id  = uuidv4();
  const doc = {
    id, title: title.trim(), description,
    startDate, endDate: endDate || startDate,
    startTime, endTime, type, color,
    allDay: Boolean(allDay),
    notificationSent: false,   // flag for 2-day-before reminder
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

/** ── List events (optional month filter) ─────────────────── */
const listEvents = async ({ year, month } = {}) => {
  const snap = await db.collection(COL).get();
  let all = snap.docs.map(d => docToEvent(d.data()));

  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    all = all.filter(e => e.startDate?.startsWith(prefix));
  }

  all.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return all;
};

/** ── Get single event ─────────────────────────────────────── */
const getEvent = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Event not found.', 404);
  return docToEvent(snap.data());
};

/** ── Update event ─────────────────────────────────────────── */
const updateEvent = async (id, updates) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Event not found.', 404);

  const allowed = ['title', 'description', 'startDate', 'endDate', 'startTime', 'endTime', 'type', 'color', 'allDay'];
  const patch = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) patch[k] = updates[k];
  }

  // If date changed, reset notification flag
  if (patch.startDate) patch.notificationSent = false;

  patch.updatedAt = FieldValue.serverTimestamp();
  await db.collection(COL).doc(id).update(patch);
  return getEvent(id);
};

/** ── Delete event ─────────────────────────────────────────── */
const deleteEvent = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Event not found.', 404);
  await db.collection(COL).doc(id).delete();
};

/**
 * ── Get events that are exactly 2 days away (for cron reminder)
 * 
 * Returns events where startDate == today+2 AND notificationSent == false
 */
const getUpcomingEvents = async () => {
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);
  const dateStr = twoDaysLater.toISOString().slice(0, 10); // YYYY-MM-DD

  const snap = await db.collection(COL)
    .where('startDate', '==', dateStr)
    .where('notificationSent', '==', false)
    .get();

  return snap.docs.map(d => docToEvent(d.data()));
};

/** Mark event notification as sent */
const markNotificationSent = async (id) => {
  await db.collection(COL).doc(id).update({
    notificationSent: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
};

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  markNotificationSent,
};