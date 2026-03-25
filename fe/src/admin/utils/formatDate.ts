/**
 * Safely format a date value that may be:
 *  - An ISO string ("2026-03-20T19:54:33.000Z")
 *  - A Firestore Timestamp object ({ toDate(), seconds, nanoseconds })
 *  - A plain JS Date
 *  - null / undefined
 */
export const formatDate = (value: any, fallback = '—'): string => {
  if (!value) return fallback;
  try {
    // Firestore Timestamp with toDate() method
    if (typeof value?.toDate === 'function') {
      return value.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    // Firestore Timestamp as plain object { seconds, nanoseconds }
    if (typeof value?.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    // ISO string or anything Date can parse
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return fallback;
  }
};
