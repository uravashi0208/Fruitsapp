/**
 * src/pages/CheckoutPage.tsx
 *
 * Real Stripe integration via @stripe/react-stripe-js.
 *
 * Payment flow:
 *   1. User selects payment method + fills shipping form
 *   2. On "Place Order":
 *      a. POST /api/stripe/payment-intent  → get clientSecret
 *      b. stripe.confirmPayment()          → Stripe collects + tokenises card
 *      c. POST /api/orders                 → save order with Stripe paymentIntentId
 *
 * Supported methods:
 *   card | apple_pay | google_pay | paypal | klarna | revolut
 *   sepa_debit | ideal | bancontact | sofort | giropay | eps
 *   przelewy24 | blik | cod
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  CreditCard, Truck, CheckCircle, Lock, Loader, ShoppingBag,
} from 'lucide-react';
import {
  loadStripe, StripeElementsOptions,
} from '@stripe/stripe-js';
import {
  Elements, PaymentElement, useStripe, useElements,
} from '@stripe/react-stripe-js';

import { PageHero }          from '../components/ui/PageHero';
import { useCart }           from '../hooks/useCart';
import { useAppDispatch }    from '../store';
import { clearCart }         from '../store/cartSlice';
import { showToast }         from '../store/uiSlice';
import { theme }             from '../styles/theme';
import {
  Container, Section, Flex, Button, Input, Divider,
} from '../styles/shared';
import { NewsletterSection } from '../components/ui/NewsletterSection';
import {
  ordersApi, stripeApi, OrderPayment, PlaceOrderBilling,
} from '../api/storefront';
import { ApiError } from '../api/client';

// ─── Stripe publishable key ────────────────────────────────────────────────────
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ''
);

// ─── Animations ───────────────────────────────────────────────────────────────
const spin        = keyframes`to { transform: rotate(360deg); }`;
const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const pulseGlow = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(130,174,70,0.45); }
  60%  { box-shadow: 0 0 0 8px rgba(130,174,70,0); }
  100% { box-shadow: 0 0 0 0 rgba(130,174,70,0); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 40px;
  align-items: start;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: 1fr; }
`;
const FormCard  = styled.div`
  background: #fff;
  border: 1px solid #f0f0f0;
  padding: 30px;
  margin-bottom: 24px;
`;
const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  svg { color: ${theme.colors.primary}; }
`;
const FormGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 2}, 1fr);
  gap: 16px;
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;
const FormGroup = styled.div<{ $full?: boolean }>`
  ${({ $full }) => $full && 'grid-column: 1 / -1;'}
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Label    = styled.label`
  font-size: 13px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.text};
`;
const SInput   = styled(Input)`border-radius: 4px; padding: 10px 14px;`;
const SelectEl = styled.select`
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 14px;
  color: ${theme.colors.textDark};
  background: #fff;
  width: 100%;
  outline: none;
  &:focus { border-color: ${theme.colors.primary}; }
`;

// ─── Payment styles ────────────────────────────────────────────────────────────
const PayOption = styled.label<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border: 2px solid ${({ $active }) => $active ? theme.colors.primary : '#dee2e6'};
  background: ${({ $active }) => $active ? 'rgba(130,174,70,0.05)' : '#fff'};
  transition: ${theme.transitions.base};
  margin-bottom: 6px;
  border-radius: 6px;
  &:hover { border-color: ${theme.colors.primary}; }
`;
const RadioDot = styled.span<{ $active: boolean }>`
  width: 17px; height: 17px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => $active ? theme.colors.primary : '#ccc'};
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  &::after {
    content: '';
    width: 7px; height: 7px;
    border-radius: 50%;
    background: ${theme.colors.primary};
    display: ${({ $active }) => $active ? 'block' : 'none'};
  }
`;
const PayLabel      = styled.span`font-size: 13px; font-weight: ${theme.fontWeights.medium}; flex: 1;`;
const PayBadge      = styled.span`
  font-size: 10px; padding: 2px 7px; border-radius: 20px;
  background: rgba(130,174,70,0.13); color: ${theme.colors.primary}; font-weight: 700;
`;
const InfoBox       = styled.div`
  font-size: 12px; color: ${theme.colors.text};
  margin-top: 4px; margin-bottom: 6px;
  padding: 10px 14px;
  background: rgba(130,174,70,0.06);
  border-radius: 4px; line-height: 1.6;
`;
const PayGroupTitle = styled.p`
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .7px; color: #bbb; margin: 14px 0 6px;
`;
const ExtraFields = styled.div`
  margin-top: 4px; margin-bottom: 10px;
  padding: 16px;
  background: #f9fbf7;
  border: 2px solid ${theme.colors.primary};
  border-radius: 6px;
  animation: ${fadeSlideIn} 0.25s ease, ${pulseGlow} 0.7s ease 0.1s;
`;
const SpinIcon = styled(Loader)`animation: ${spin} 0.8s linear infinite;`;

// Stripe PaymentElement wrapper styles
const StripeBox = styled.div`
  .StripeElement {
    padding: 12px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: #fff;
    &--focus { border-color: ${theme.colors.primary}; }
    &--invalid { border-color: #e53e3e; }
  }
`;

// ─── Order summary ─────────────────────────────────────────────────────────────
const OrderSummary = styled.aside`
  background: #fff; border: 1px solid #f0f0f0;
  padding: 30px; position: sticky; top: 20px;
`;
const OItem  = styled(Flex)`justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; gap: 12px;`;
const Thumb  = styled.img`width: 44px; height: 44px; object-fit: cover; border: 1px solid #f0f0f0; flex-shrink: 0;`;
const IName  = styled.span`font-size: 13px; color: ${theme.colors.textDark}; flex: 1;`;
const ITotal = styled.span`font-size: 13px; font-weight: ${theme.fontWeights.semibold}; white-space: nowrap;`;
const TRow   = styled(Flex)`
  justify-content: space-between; font-size: 14px; margin-top: 8px;
  span:first-child { color: ${theme.colors.text}; }
  span:last-child  { font-weight: ${theme.fontWeights.medium}; }
`;
const GTotal = styled(TRow)`
  font-size: 18px; margin-top: 14px; padding-top: 14px; border-top: 2px solid #f0f0f0;
  span:last-child { color: ${theme.colors.primary}; font-weight: ${theme.fontWeights.bold}; }
`;
const SuccessWrap = styled.div`
  text-align: center; padding: 80px 20px;
  background: #fff; border: 1px solid #f0f0f0;
`;

// ─── Payment methods data ──────────────────────────────────────────────────────
type PayMethod =
  | 'card' | 'apple_pay' | 'google_pay'
  | 'paypal' | 'klarna' | 'revolut'
  | 'sepa_debit' | 'ideal' | 'bancontact' | 'sofort' | 'giropay' | 'eps'
  | 'przelewy24' | 'blik'
  | 'cod';

interface MethodDef {
  id:     PayMethod;
  label:  string;
  icon:   string;
  badge?: string;
  info:   string;
  group:  'digital' | 'bnpl' | 'bank' | 'local' | 'offline';
}

const METHODS: MethodDef[] = [
  { id: 'card',       label: 'Credit / Debit Card',       icon: '💳', group: 'digital',
    info: 'Visa, Mastercard, Amex, Maestro — enter your card details securely via Stripe.' },
  { id: 'apple_pay',  label: 'Apple Pay',                 icon: '🍎', group: 'digital',
    info: 'Tap to pay with Face ID / Touch ID. Available on Safari & iOS devices.' },
  { id: 'google_pay', label: 'Google Pay',                icon: '🔵', group: 'digital',
    info: 'One-tap checkout using your saved Google Pay card.' },
  { id: 'paypal',     label: 'PayPal',                    icon: '🅿️', badge: 'Popular', group: 'bnpl',
    info: 'Pay now or use PayPal Pay Later. You will be redirected to PayPal.' },
  { id: 'klarna',     label: 'Klarna — Pay in 3',         icon: '🟣', badge: 'Buy now, pay later', group: 'bnpl',
    info: 'Split into 3 interest-free instalments. Available across the EU.' },
  { id: 'revolut',    label: 'Revolut Pay',               icon: '🔷', group: 'bnpl',
    info: 'Instant payment via your Revolut account.' },
  { id: 'sepa_debit', label: 'SEPA Direct Debit',         icon: '🏦', group: 'bank',
    info: 'Direct debit from any EU bank account via Stripe.' },
  { id: 'ideal',      label: 'iDEAL',                     icon: '🇳🇱', group: 'bank',
    info: 'Netherlands — pay directly from your Dutch bank account.' },
  { id: 'bancontact', label: 'Bancontact',                icon: '🇧🇪', badge: 'Belgium', group: 'bank',
    info: "Belgium's most popular payment method — instant bank transfer." },
  { id: 'sofort',     label: 'SOFORT / Klarna Pay Now',   icon: '⚡', group: 'bank',
    info: 'Instant bank transfer — Germany, Austria & Switzerland.' },
  { id: 'giropay',    label: 'Giropay',                   icon: '🇩🇪', group: 'bank',
    info: 'Germany — secure online bank transfer via Stripe.' },
  { id: 'eps',        label: 'EPS Transfer',              icon: '🇦🇹', group: 'bank',
    info: 'Austria — electronic payment standard.' },
  { id: 'przelewy24', label: 'Przelewy24',                icon: '🇵🇱', badge: 'Poland', group: 'local',
    info: "Poland's most popular gateway — Stripe powered." },
  { id: 'blik',       label: 'BLIK',                      icon: '📱', badge: 'Poland', group: 'local',
    info: 'Poland — generate a 6-digit code in your banking app.' },
  { id: 'cod',        label: 'Cash on Delivery',          icon: '💵', group: 'offline',
    info: 'Pay in cash when your order arrives. No card needed.' },
];

const GROUP_LABELS: Record<string, string> = {
  digital: '💳 Cards & Digital Wallets',
  bnpl:    '🛍️ Pay Later & E-Wallets',
  bank:    '🏦 European Bank Transfers',
  local:   '🌍 Local Payment Methods',
  offline: '📦 Offline',
};
const GROUP_ORDER = ['digital', 'bnpl', 'bank', 'local', 'offline'] as const;

// ─── Stripe Payment Form (inner — uses hooks that need <Elements>) ─────────────
interface StripeFormProps {
  billing:    typeof INITIAL_FORM;
  payMethod:  PayMethod;
  total:      number;
  onSuccess:  (orderNum: string, firstName: string, email: string) => void;
  onError:    (msg: string) => void;
  items:      any[];
}

const StripePaymentForm: React.FC<StripeFormProps> = ({
  billing, payMethod, total, onSuccess, onError, items,
}) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      onError('Stripe is not loaded yet. Please wait a moment.');
      return;
    }

    // Validate shipping fields
    if (!billing.firstName || !billing.email || !billing.address || !billing.city) {
      onError('Please fill in all required shipping fields.');
      return;
    }

    if (items.length === 0) {
      onError('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create PaymentIntent on backend
      const piRes = await stripeApi.createPaymentIntent({
        amount:        total,
        payMethod,
        customerEmail: billing.email,
        billing: {
          firstName: billing.firstName,
          lastName:  billing.lastName,
          email:     billing.email,
          phone:     billing.phone,
          address:   billing.address,
          city:      billing.city,
          state:     billing.state,
          zip:       billing.zip,
          country:   billing.country,
        },
      });

      const { clientSecret, isCod } = piRes.data;

      let stripePaymentIntentId = '';
      let stripeStatus = 'succeeded';

      if (!isCod && clientSecret) {
        // 2. Confirm payment via Stripe Elements
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/checkout?stripe_return=1',
            payment_method_data: {
              billing_details: {
                name:  `${billing.firstName} ${billing.lastName}`.trim(),
                email: billing.email,
                phone: billing.phone || undefined,
                address: {
                  line1:       billing.address,
                  city:        billing.city,
                  state:       billing.state || undefined,
                  postal_code: billing.zip   || undefined,
                  country:     billing.country || 'PL',
                },
              },
            },
          },
          redirect: 'if_required',
        });

        if (error) {
          onError(error.message || 'Payment failed. Please try again.');
          setLoading(false);
          return;
        }

        stripePaymentIntentId = paymentIntent?.id || '';
        stripeStatus          = paymentIntent?.status || 'succeeded';
      }

      // 3. Place order on backend
      const orderPayment: OrderPayment = {
        method:        payMethod,
        status:        (isCod ? 'pending' : 'paid') as any,
        transactionId: stripePaymentIntentId,
      };

      const res = await ordersApi.place({
        items: items.map(i => ({
          productId: i.id,
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          image:     i.image,
        })),
        billing: {
          firstName: billing.firstName,
          lastName:  billing.lastName,
          email:     billing.email,
          phone:     billing.phone,
          address:   billing.address,
          city:      billing.city,
          state:     billing.state,
          zip:       billing.zip,
          country:   billing.country,
        },
        payment: orderPayment,
      });

      if (res.success) {
        dispatch(clearCart());
        dispatch(showToast({ message: 'Order placed successfully! 🎉', type: 'success' }));
        onSuccess((res.data as any)?.orderNumber || '', billing.firstName, billing.email);
      }
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Stripe PaymentElement renders the correct UI per payment method */}
      <StripeBox>
        <PaymentElement
          options={{
            layout:    'tabs',
            wallets:   { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </StripeBox>
      <p style={{ fontSize: 11, color: '#aaa', marginTop: 10 }}>
        🔒 Your payment details are securely handled by Stripe. We never see your card number.
      </p>
      <Button
        style={{ width: '100%', marginTop: 16, justifyContent: 'center', gap: 8 }}
        onClick={handleSubmit}
        disabled={loading || !stripe}
      >
        {loading
          ? <><SpinIcon size={14} /> Processing…</>
          : <><ShoppingBag size={16} /> Place Order</>}
      </Button>
      <p style={{ textAlign: 'center', fontSize: 11, color: theme.colors.text, marginTop: 10 }}>
        <Lock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Secured by Stripe — 256-bit SSL encryption
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {['💳','🍎','🔵','🅿️','🟣','🔷','🏦','🇳🇱','🇧🇪','⚡','🇩🇪','🇦🇹','🇵🇱','📱','💵'].map((icon, i) => (
          <span key={i} style={{ fontSize: 16 }}>{icon}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '', country: 'PL',
};

// ─── Main component ───────────────────────────────────────────────────────────
const CheckoutPage: React.FC = () => {
  const { items, subtotal, shipping, total } = useCart();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [submitted, setSubmitted] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ orderNum: '', firstName: '', email: '' });

  const [form, setForm] = useState(INITIAL_FORM);

  // Stripe Elements options — recreated when payMethod or total changes
  const [elementsOptions, setElementsOptions] = useState<StripeElementsOptions | null>(null);
  const [piLoading, setPiLoading]             = useState(false);

  // Load a PaymentIntent when payMethod or total changes (but not for COD)
  useEffect(() => {
    if (total <= 0 || payMethod === 'cod') {
      setElementsOptions(null);
      return;
    }

    let cancelled = false;
    setPiLoading(true);

    stripeApi.createPaymentIntent({
      amount:    total,
      payMethod,
      customerEmail: form.email || undefined,
    })
      .then(res => {
        if (cancelled) return;
        const { clientSecret } = res.data;
        if (clientSecret) {
          setElementsOptions({
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary:       '#82ae46',
                colorBackground:    '#ffffff',
                colorText:          '#000000',
                colorDanger:        '#e53e3e',
                fontFamily:         'Poppins, sans-serif',
                borderRadius:       '4px',
              },
            },
          });
        }
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('PaymentIntent creation skipped:', err.message);
        // If Stripe key not configured, fall back gracefully
        setElementsOptions(null);
      })
      .finally(() => {
        if (!cancelled) setPiLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payMethod, total]);

  const upd = (k: keyof typeof INITIAL_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSuccess = useCallback((orderNum: string, firstName: string, email: string) => {
    setSuccessInfo({ orderNum, firstName, email });
    setSubmitted(true);
  }, []);

  const handleError = useCallback((msg: string) => {
    dispatch(showToast({ message: msg, type: 'error' }));
  }, [dispatch]);

  // Handle COD submit (no Stripe)
  const handleCodSubmit = async () => {
    if (!form.firstName || !form.email || !form.address || !form.city) {
      dispatch(showToast({ message: 'Please fill in all required fields', type: 'error' }));
      return;
    }
    if (items.length === 0) {
      dispatch(showToast({ message: 'Your cart is empty', type: 'error' }));
      return;
    }
    try {
      const res = await ordersApi.place({
        items: items.map(i => ({
          productId: i.id,
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          image:     i.image,
        })),
        billing: {
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email,
          phone:     form.phone,
          address:   form.address,
          city:      form.city,
          state:     form.state,
          zip:       form.zip,
          country:   form.country,
        },
        payment: { method: 'cod', status: 'pending' },
      });
      if (res.success) {
        dispatch(clearCart());
        dispatch(showToast({ message: 'Order placed! Pay on delivery. 🎉', type: 'success' }));
        setSuccessInfo({
          orderNum:  (res.data as any)?.orderNumber || '',
          firstName: form.firstName,
          email:     form.email,
        });
        setSubmitted(true);
      }
    } catch (err) {
      dispatch(showToast({
        message: err instanceof ApiError ? err.message : 'Order failed.',
        type: 'error',
      }));
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) return (
    <main>
      <PageHero title="Checkout" breadcrumbs={[{ label: 'Checkout' }]} />
      <Section><Container>
        <SuccessWrap>
          <div style={{
            width: 80, height: 80, background: 'rgba(130,174,70,0.1)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px',
            color: theme.colors.primary,
          }}>
            <CheckCircle size={42} />
          </div>
          <h2 style={{ fontSize: 30, marginBottom: 8 }}>Order Confirmed! 🎉</h2>
          {successInfo.orderNum && (
            <p style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
              Order #{successInfo.orderNum}
            </p>
          )}
          <p style={{ color: theme.colors.text, maxWidth: 480, margin: '0 auto 28px' }}>
            Thank you, <strong>{successInfo.firstName}</strong>! A confirmation has been sent to{' '}
            <strong>{successInfo.email}</strong>. Your fresh produce will arrive in 3–5 business days.
          </p>
          <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </SuccessWrap>
      </Container></Section>
      <NewsletterSection />
    </main>
  );

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <main>
      <PageHero title="Checkout" breadcrumbs={[{ label: 'Checkout' }]} />
      <Section><Container>
        <Layout>

          {/* ── Left column ── */}
          <div>

            {/* Shipping info */}
            <FormCard>
              <CardTitle><Truck size={18} /> Shipping Information</CardTitle>
              <FormGrid>
                <FormGroup>
                  <Label>First Name *</Label>
                  <SInput value={form.firstName} onChange={upd('firstName')} placeholder="Jan" />
                </FormGroup>
                <FormGroup>
                  <Label>Last Name *</Label>
                  <SInput value={form.lastName} onChange={upd('lastName')} placeholder="Kowalski" />
                </FormGroup>
                <FormGroup $full>
                  <Label>Email *</Label>
                  <SInput type="email" value={form.email} onChange={upd('email')} placeholder="jan@example.com" />
                </FormGroup>
                <FormGroup>
                  <Label>Phone</Label>
                  <SInput type="tel" value={form.phone} onChange={upd('phone')} placeholder="+48 123 456 789" />
                </FormGroup>
                <FormGroup>
                  <Label>Country</Label>
                  <SelectEl value={form.country} onChange={upd('country')}>
                    <option value="PL">🇵🇱 Poland</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="NL">🇳🇱 Netherlands</option>
                    <option value="BE">🇧🇪 Belgium</option>
                    <option value="AT">🇦🇹 Austria</option>
                    <option value="ES">🇪🇸 Spain</option>
                    <option value="IT">🇮🇹 Italy</option>
                    <option value="SE">🇸🇪 Sweden</option>
                    <option value="CZ">🇨🇿 Czech Republic</option>
                    <option value="HU">🇭🇺 Hungary</option>
                    <option value="RO">🇷🇴 Romania</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="OTHER">🌍 Other</option>
                  </SelectEl>
                </FormGroup>
                <FormGroup $full>
                  <Label>Address *</Label>
                  <SInput value={form.address} onChange={upd('address')} placeholder="ul. Marszałkowska 1" />
                </FormGroup>
                <FormGroup>
                  <Label>City *</Label>
                  <SInput value={form.city} onChange={upd('city')} placeholder="Warsaw" />
                </FormGroup>
                <FormGroup>
                  <Label>State / Province</Label>
                  <SInput value={form.state} onChange={upd('state')} placeholder="Masovia" />
                </FormGroup>
                <FormGroup>
                  <Label>ZIP / Postal Code</Label>
                  <SInput value={form.zip} onChange={upd('zip')} placeholder="00-001" />
                </FormGroup>
              </FormGrid>
            </FormCard>

            {/* Payment method selector */}
            <FormCard>
              <CardTitle><CreditCard size={18} /> Payment Method</CardTitle>

              {GROUP_ORDER.map(group => {
                const methods = METHODS.filter(m => m.group === group);
                return (
                  <div key={group}>
                    <PayGroupTitle>{GROUP_LABELS[group]}</PayGroupTitle>
                    {methods.map(m => (
                      <React.Fragment key={m.id}>
                        <PayOption $active={payMethod === m.id}>
                          <input
                            type="radio"
                            name="pay"
                            hidden
                            checked={payMethod === m.id}
                            onChange={() => setPayMethod(m.id)}
                          />
                          <RadioDot $active={payMethod === m.id} />
                          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{m.icon}</span>
                          <PayLabel>{m.label}</PayLabel>
                          {m.badge && <PayBadge>{m.badge}</PayBadge>}
                        </PayOption>
                        {payMethod === m.id && (
                          <InfoBox>ℹ️ {m.info}</InfoBox>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })}
            </FormCard>

            {/* Stripe payment form — shown below the method selector */}
            <FormCard>
              <CardTitle><Lock size={18} /> Payment Details</CardTitle>

              {payMethod === 'cod' ? (
                <div>
                  <InfoBox>
                    💵 You will pay cash when the order is delivered to your door. No card needed.
                  </InfoBox>
                  <Button
                    style={{ width: '100%', marginTop: 10, justifyContent: 'center', gap: 8 }}
                    onClick={handleCodSubmit}
                  >
                    <ShoppingBag size={16} /> Place Order (Cash on Delivery)
                  </Button>
                </div>
              ) : piLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: theme.colors.text }}>
                  <SpinIcon size={22} style={{ display: 'inline-block', marginBottom: 8 }} />
                  <p style={{ fontSize: 13 }}>Loading payment form…</p>
                </div>
              ) : elementsOptions ? (
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <StripePaymentForm
                    billing={form}
                    payMethod={payMethod}
                    total={total}
                    items={items}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </Elements>
              ) : (
                <InfoBox>
                  ⚠️ Stripe is not configured. Add{' '}
                  <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> to your frontend{' '}
                  <code>.env</code> and restart the app.
                </InfoBox>
              )}
            </FormCard>
          </div>

          {/* ── Order summary ── */}
          <OrderSummary>
            <h3 style={{
              fontSize: 18, fontWeight: theme.fontWeights.medium,
              marginBottom: 20, paddingBottom: 12,
              borderBottom: `2px solid ${theme.colors.primary}`,
            }}>
              Your Order
            </h3>

            {items.map(item => (
              <OItem key={item.id} as="div">
                <Thumb
                  src={item.image}
                  alt={item.name}
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/44x44/f1f8f1/82ae46?text=V';
                  }}
                />
                <IName>{item.name} × {item.quantity}</IName>
                <ITotal>${(item.price * item.quantity).toFixed(2)}</ITotal>
              </OItem>
            ))}

            <Divider $my="14px" />
            <TRow as="div"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></TRow>
            <TRow as="div">
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? theme.colors.primary : undefined }}>
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </span>
            </TRow>
            <GTotal as="div"><span>Total</span><span>${total.toFixed(2)}</span></GTotal>

            <div style={{
              marginTop: 20, padding: '12px', background: 'rgba(130,174,70,0.05)',
              borderRadius: 6, fontSize: 12, color: theme.colors.text, lineHeight: 1.6,
            }}>
              <strong>Selected:</strong> {METHODS.find(m => m.id === payMethod)?.label}
              <br />
              {payMethod !== 'cod' && '🔒 Payment secured by Stripe'}
            </div>
          </OrderSummary>

        </Layout>
      </Container></Section>
      <NewsletterSection />
    </main>
  );
};

export default CheckoutPage;
