/**
 * services/addressService.js
 * User delivery addresses stored in Firestore "addresses" collection.
 * One doc per user (userId), contains an items[] array.
 */

const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { v4: uuidv4 }     = require('uuid');

const COL = 'addresses';

/** GET all addresses for a user */
const getAddresses = async (userId) => {
  const snap = await db.collection(COL).doc(userId).get();
  if (!snap.exists) return [];
  return snap.data().items || [];
};

/** POST — add a new address */
const addAddress = async (userId, data) => {
  const { label, addr, city = '', postalCode = '', country = '', lat = null, lon = null } = data;
  if (!label || !addr) throw new AppError('label and addr are required.', 422);

  const snap  = await db.collection(COL).doc(userId).get();
  const items = snap.exists ? (snap.data().items || []) : [];

  const entry = {
    id:         uuidv4(),
    label:      label.trim(),
    addr:       addr.trim(),
    city:       city.trim(),
    postalCode: postalCode.trim(),
    country:    country.trim(),
    lat,
    lon,
    createdAt:  new Date().toISOString(),
  };

  await db.collection(COL).doc(userId).set(
    { userId, items: FieldValue.arrayUnion(entry), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  return entry;
};

/** DELETE — remove an address by id */
const deleteAddress = async (userId, addressId) => {
  const snap = await db.collection(COL).doc(userId).get();
  if (!snap.exists) throw new AppError('No addresses found.', 404);

  const items = snap.data().items || [];
  const entry = items.find(a => a.id === addressId);
  if (!entry) throw new AppError('Address not found.', 404);

  await db.collection(COL).doc(userId).update({
    items: FieldValue.arrayRemove(entry),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return items.filter(a => a.id !== addressId);
};

/** PUT — update an existing address */
const updateAddress = async (userId, addressId, data) => {
  const snap = await db.collection(COL).doc(userId).get();
  if (!snap.exists) throw new AppError('No addresses found.', 404);

  const items = snap.data().items || [];
  const old   = items.find(a => a.id === addressId);
  if (!old) throw new AppError('Address not found.', 404);

  const updated = {
    ...old,
    label:      (data.label      ?? old.label).trim(),
    addr:       (data.addr       ?? old.addr).trim(),
    city:       (data.city       ?? old.city     || '').trim(),
    postalCode: (data.postalCode ?? old.postalCode || '').trim(),
    country:    (data.country    ?? old.country  || '').trim(),
    lat:        data.lat !== undefined ? data.lat : old.lat,
    lon:        data.lon !== undefined ? data.lon : old.lon,
    updatedAt:  new Date().toISOString(),
  };

  const newItems = items.map(a => a.id === addressId ? updated : a);
  await db.collection(COL).doc(userId).update({
    items: newItems,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return updated;
};

module.exports = { getAddresses, addAddress, deleteAddress, updateAddress };