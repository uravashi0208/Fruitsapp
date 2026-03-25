/**
 * utils/response.js
 * Standardised JSON response helpers.
 * paginated() sends pagination info under BOTH `pagination` and `meta`
 * so the frontend hook (reads `res.pagination`) always gets it.
 */

// Recursively convert Firestore Timestamps to ISO strings so the
// client always receives plain JSON-serialisable values.
const serialize = (data) => {
  if (data === null || data === undefined) return data;

  // Firestore Timestamp object (has toDate method or seconds + nanoseconds)
  if (typeof data?.toDate === 'function') return data.toDate().toISOString();
  if (typeof data?.seconds === 'number' && typeof data?.nanoseconds === 'number') {
    return new Date(data.seconds * 1000).toISOString();
  }

  if (Array.isArray(data)) return data.map(serialize);

  if (typeof data === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(data)) out[k] = serialize(v);
    return out;
  }

  return data;
};

const success = (res, data, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data: serialize(data) });

const created = (res, data, msg = 'Created') =>
  res.status(201).json({ success: true, message: msg, data: serialize(data) });

const paginated = (res, data, meta, msg = 'Success') => {
  // Build pagination object — totalPages may not be pre-calculated
  const total      = meta.total      ?? 0;
  const limit      = meta.limit      ?? 20;
  const page       = meta.page       ?? 1;
  const totalPages = meta.totalPages ?? (Math.ceil(total / limit) || 1);
  const pagination = { total, totalPages, page, limit };

  res.status(200).json({
    success: true,
    message: msg,
    data:       serialize(data),
    pagination,   // what the frontend hook reads
    meta:       pagination, // backward compat alias
  });
};

const noContent = (res, msg = 'Deleted') =>
  res.status(200).json({ success: true, message: msg });

module.exports = { success, created, paginated, noContent };
