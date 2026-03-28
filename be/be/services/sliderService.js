/**
 * services/sliderService.js
 * Hero slider CRUD — collection: "sliders"
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { deleteFromFirebase } = require('../utils/upload');

const COL = 'sliders';

const listSliders = async (activeOnly = false) => {
  let q = db.collection(COL).orderBy('sortOrder', 'asc');
  const snap = await q.get();
  let items = snap.docs.map(d => d.data());
  if (activeOnly) items = items.filter(s => s.status === 'active');
  return items;
};

const getSlider = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Slider not found.', 404);
  return snap.data();
};

const createSlider = async (data, imageUrl = '') => {
  const id  = uuidv4();
  const doc = {
    id,
    title:      data.title,
    subtitle:   data.subtitle   || '',
    buttonText: data.buttonText || 'View Details',
    buttonLink: data.buttonLink || '#',
    image:      imageUrl,
    sortOrder:  Number(data.sortOrder) || 0,
    status:     data.status || 'active',
    createdAt:  FieldValue.serverTimestamp(),
    updatedAt:  FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const updateSlider = async (id, data, newImageUrl = null) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Slider not found.', 404);
  const old    = snap.data();
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  if (newImageUrl) {
    if (old.image) await deleteFromFirebase(old.image);
    update.image = newImageUrl;
  }
  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

const deleteSlider = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Slider not found.', 404);
  const s = snap.data();
  if (s.image) await deleteFromFirebase(s.image);
  await db.collection(COL).doc(id).delete();
};

module.exports = { listSliders, getSlider, createSlider, updateSlider, deleteSlider };
