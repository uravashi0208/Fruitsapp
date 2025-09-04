require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';
const PORT = process.env.PORT || 4242;

// Initialize Firebase Admin (Firestore)
// Expect FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  } catch (e) {
    console.error('Failed to init Firebase Admin. Check env vars.', e);
  }
}
const db = admin.firestore();

// Security middlewares
app.use(helmet());
// app.use(cors({ origin: CLIENT_URL }));

app.use(cors({
  origin: [
    "http://localhost:3001",
    process.env.CLIENT_URL,   // Production mobile app URL
    /^https:\/\/.*\.vercel\.app$/, // Allow all Vercel deployments
    /^https:\/\/.*\.netlify\.app$/, // Allow all Netlify deployments
  ].filter(Boolean), // Remove undefined values
}));

// Register Stripe webhook BEFORE body parsing so we can verify signature using raw body
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Payment completed:', session.id);

    // Update Firestore order as paid
    try {
      await db.collection('orders').doc(session.id).set(
        {
          paid: true,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          updated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to update order in Firestore:', e);
    }
  }

  res.json({ received: true });
});

// Parse JSON for the rest of the routes
app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

// ✅ Create Checkout Session (items come from frontend)
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items = [], customer = {} } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    // WARNING: trusting frontend prices; recommended to validate on server in production
    const line_items = items.map((it) => ({
      price_data: {
        currency: it.currency || 'usd',
        product_data: {
          name: it.name,
          description: it.description || undefined,
        //   images: it.image ? [it.image] : undefined,
        },
        // frontend sends price in decimal; convert to cents if needed
        unit_amount: typeof it.price === 'number' && it.price < 1000 ? Math.round(it.price * 100) : it.price,
      },
      quantity: it.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cancel`,
      metadata: {
        customer_email: customer.email || '',
      },
    });

    // Store pending order in Firestore
    try {
      await db.collection('orders').doc(session.id).set({
        sessionId: session.id,
        created: admin.firestore.FieldValue.serverTimestamp(),
        paid: false,
        items,
        amount_total: null, // will be filled after webhook
        customer: customer || {},
      });
    } catch (e) {
      console.error('Failed to write order to Firestore:', e);
      // Continue anyway; payment can still proceed
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Retrieve session (for success page)
app.get('/session', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'session_id required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch session' });
  }
});

// ✅ Webhook handler
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Payment completed:', session.id);

    // Update Firestore order as paid
    try {
      await db.collection('orders').doc(session.id).set(
        {
          paid: true,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          updated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to update order in Firestore:', e);
    }
  }

  res.json({ received: true });
});

// List orders (debug)
app.get('/orders', async (req, res) => {
  try {
    const snap = await db.collection('orders').orderBy('created', 'desc').limit(50).get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
