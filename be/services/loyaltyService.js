/**
 * services/loyaltyService.js
 * Points per order, redeem at checkout.
 * Points stored on the user doc: loyaltyPoints (number)
 * Transactions stored in 'loyaltyTransactions' collection.
 *
 * Rules (defaults, can be tuned via settings):
 *   EARN_RATE  = 1 point per $1 spent  (integers only)
 *   REDEEM_RATE = $0.01 per point       (100 points = $1 discount)
 *   MIN_REDEEM = 100 points
 */
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { v4: uuidv4 }     = require('uuid');

const COL_USERS = 'users';
const COL_TX    = 'loyaltyTransactions';

const EARN_RATE   = 1;      // points per $1
const REDEEM_RATE = 0.01;   // $ per point
const MIN_REDEEM  = 100;

// ─── Get balance ──────────────────────────────────────────────────────────────
const getBalance = async (userId) => {
  const snap = await db.collection(COL_USERS).doc(userId).get();
  if (!snap.exists) throw new AppError('User not found.', 404);
  return { points: snap.data().loyaltyPoints || 0 };
};

// ─── Earn points after an order ──────────────────────────────────────────────
const earnPoints = async (userId, orderTotal, orderId) => {
  if (!userId) return;
  const pts = Math.floor(orderTotal * EARN_RATE);
  if (pts <= 0) return;

  const tx = {
    id:        uuidv4(),
    userId,
    orderId,
    type:      'earn',
    points:    pts,
    note:      `Earned for order ${orderId}`,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(COL_TX).add(tx);
  await db.collection(COL_USERS).doc(userId).update({
    loyaltyPoints: FieldValue.increment(pts),
  });

  return pts;
};

// ─── Preview: how much discount for N points ─────────────────────────────────
const previewRedeem = (points) => ({
  points,
  discount: points * REDEEM_RATE,
  redeemRate: REDEEM_RATE,
});

// ─── Redeem points at checkout ────────────────────────────────────────────────
const redeemPoints = async (userId, points, orderId) => {
  if (points < MIN_REDEEM)
    throw new AppError(`Minimum ${MIN_REDEEM} points required to redeem.`, 422);

  const snap = await db.collection(COL_USERS).doc(userId).get();
  if (!snap.exists) throw new AppError('User not found.', 404);

  const balance = snap.data().loyaltyPoints || 0;
  if (balance < points) throw new AppError('Insufficient loyalty points.', 422);

  const discount = points * REDEEM_RATE;

  const tx = {
    id:        uuidv4(),
    userId,
    orderId,
    type:      'redeem',
    points:    -points,
    note:      `Redeemed ${points} pts for $${discount.toFixed(2)} discount`,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection(COL_TX).add(tx);
  await db.collection(COL_USERS).doc(userId).update({
    loyaltyPoints: FieldValue.increment(-points),
  });

  return { discount, newBalance: balance - points };
};

// ─── Transaction history ──────────────────────────────────────────────────────
const getHistory = async (userId) => {
  const snap = await db.collection(COL_TX)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      createdAt: data.createdAt?.toMillis ? new Date(data.createdAt.toMillis()).toISOString() : data.createdAt,
    };
  });
};

module.exports = { getBalance, earnPoints, previewRedeem, redeemPoints, getHistory, MIN_REDEEM, REDEEM_RATE };
