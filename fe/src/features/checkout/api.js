// API helpers for Stripe Checkout integration (Checkout redirect)
const API_BASE = process.env.REACT_APP_API_BASE || 'https://fruitsapp-0vl3.onrender.com';

// Create Stripe Checkout Session (redirect)
export async function createCheckoutSession({ items, customer }) {
  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customer }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create checkout session: ${text || res.status}`);
  }
  return res.json(); // { url }
}

// Fetch session details (optional: for success page)
export async function fetchCheckoutSession(sessionId) {
  const res = await fetch(`${API_BASE}/session?session_id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}