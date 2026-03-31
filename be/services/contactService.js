/**
 * services/contactService.js — In-memory filter/sort, no composite indexes.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'contacts';
const notificationService = require('./notificationService');
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const createContact = async (data) => {
  const id  = uuidv4();
  const doc = {
    id, name: data.name, email: data.email,
    phone: data.phone || '', subject: data.subject || '', message: data.message,
    status: 'new', repliedAt: null,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  setImmediate(() => notificationService.notifyNewContact(doc).catch(() => {}));
  return { ...doc, createdAt: new Date().toISOString() };
};

const listContacts = async ({ page = 1, limit = 20, status = '', search = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let all    = snap.docs.map(d => d.data());
  if (status) all = all.filter(c => c.status === status);
  if (search) { const s = search.toLowerCase(); all = all.filter(c => c.name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.subject?.toLowerCase().includes(s)); }
  all.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  const total = all.length;
  const start = (page - 1) * Number(limit);
  return { contacts: all.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const getContact = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Contact not found.', 404);
  return snap.data();
};

const updateContactStatus = async (id, status) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Contact not found.', 404);
  const update = { status, updatedAt: FieldValue.serverTimestamp() };
  if (status === 'replied') update.repliedAt = new Date().toISOString();
  await db.collection(COL).doc(id).update(update);
  return { ...snap.data(), ...update };
};

const deleteContact = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Contact not found.', 404);
  await db.collection(COL).doc(id).delete();
};

const getContactStats = async () => {
  const snap = await db.collection(COL).get();
  const all  = snap.docs.map(d => d.data());
  return {
    total:    all.length,
    new:      all.filter(c => c.status === 'new').length,
    read:     all.filter(c => c.status === 'read').length,
    replied:  all.filter(c => c.status === 'replied').length,
    archived: all.filter(c => c.status === 'archived').length,
  };
};

module.exports = { createContact, listContacts, getContact, updateContactStatus, deleteContact, getContactStats };
