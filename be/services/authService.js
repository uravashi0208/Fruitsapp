/**
 * services/authService.js
 * Authentication for both Users (storefront) and Admins (dashboard).
 * Collections: "users", "admins"
 */
const bcrypt          = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { signAccessToken, signRefreshToken, verifyRefresh } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const SALT = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeUser = (u) => {
  const { passwordHash, ...rest } = u;
  return rest;
};

const findByEmail = async (collection, email) => {
  const snap = await db.collection(collection).where('email', '==', email).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// ─── REGISTER (User or Admin) ─────────────────────────────────────────────────
const register = async ({ name, email, password, phone = '', role }, collection = 'users') => {
  const existing = await findByEmail(collection, email);
  if (existing) throw new AppError('Email already in use.', 409);

  const uid  = uuidv4();
  const hash = await bcrypt.hash(password, SALT);

  const finalRole = collection === 'admins' ? (role || 'viewer') : 'user';

  const doc = {
    uid, name, email, phone,
    role:         finalRole,
    status:       'active',
    passwordHash: hash,
    avatar:       '',
    createdAt:    FieldValue.serverTimestamp(),
    updatedAt:    FieldValue.serverTimestamp(),
    lastLogin:    null,
  };

  await db.collection(collection).doc(uid).set(doc);

  const payload      = { uid, email, role: finalRole, collection };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken, user: safeUser({ ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }) };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async ({ email, password }, collection = 'users') => {
  const user = await findByEmail(collection, email);
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (user.status === 'banned') throw new AppError('Account suspended.', 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError('Invalid email or password.', 401);

  await db.collection(collection).doc(user.uid).update({
    lastLogin: FieldValue.serverTimestamp(),
  });

  const payload      = { uid: user.uid, email: user.email, role: user.role, collection };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken, user: safeUser(user) };
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshAccessToken = async (token) => {
  let decoded;
  try { decoded = verifyRefresh(token); }
  catch { throw new AppError('Invalid or expired refresh token.', 401); }

  const col  = decoded.collection || 'users';
  const snap = await db.collection(col).doc(decoded.uid).get();
  if (!snap.exists) throw new AppError('User not found.', 401);

  const user = snap.data();
  if (user.status === 'banned') throw new AppError('Account suspended.', 403);

  const payload     = { uid: user.uid, email: user.email, role: user.role, collection: col };
  const accessToken = signAccessToken(payload);
  return { accessToken };
};

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
const getProfile = async (uid, collection = 'users') => {
  const snap = await db.collection(collection).doc(uid).get();
  if (!snap.exists) throw new AppError('User not found.', 404);
  return safeUser(snap.data());
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
const changePassword = async (uid, { currentPassword, newPassword }, collection = 'users') => {
  const snap = await db.collection(collection).doc(uid).get();
  if (!snap.exists) throw new AppError('User not found.', 404);

  const user  = snap.data();
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new AppError('Current password is incorrect.', 400);

  const hash = await bcrypt.hash(newPassword, SALT);
  await db.collection(collection).doc(uid).update({ passwordHash: hash, updatedAt: FieldValue.serverTimestamp() });
};

const updateProfile = async (uid, data, collection = 'users') => {
  const ref = db.collection(collection).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('User not found.', 404);
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  // If firstName/lastName provided, auto-update name
  if (data.firstName || data.lastName) {
    const current = snap.data();
    const fn = data.firstName ?? (current.firstName || current.name?.split(' ')[0] || '');
    const ln = data.lastName  ?? (current.lastName  || current.name?.split(' ').slice(1).join(' ') || '');
    update.name = `${fn} ${ln}`.trim();
  }
  await ref.update(update);
  return { ...snap.data(), ...update };
};

module.exports = { register, login, refreshAccessToken, getProfile, changePassword, updateProfile };
