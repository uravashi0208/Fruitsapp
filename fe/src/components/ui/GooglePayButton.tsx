/**
 * src/components/ui/GooglePayButton.tsx
 *
 * Native Google Pay integration — zero Stripe dependency.
 *
 * Uses the official Google Pay JavaScript API:
 *   https://developers.google.com/pay/api/web/guides/tutorial
 *
 * Flow:
 *   1. On mount: load pay.google.com/gp/p/js/pay.js script
 *   2. GET /api/gpay/config → merchant config + tokenization spec
 *   3. PaymentsClient.isReadyToPay() → show/hide button
 *   4. User clicks → PaymentsClient.loadPaymentData() → Google Pay sheet opens
 *   5. User authorises → we get PaymentData (encrypted token + card info)
 *   6. POST /api/gpay/process → backend records order, returns orderNumber
 *
 * TEST mode (NODE_ENV !== 'production'):
 *   - environment = 'TEST'  →  Google returns fake tokens instantly
 *   - No real Google account or real card needed
 *   - The Google Pay sheet shows a test card automatically
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { Loader } from 'lucide-react';
import { gpayApi, GPayConfig, GPayProcessBody } from '../../api/storefront';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id:       string | number;
  name:     string;
  price:    number;
  quantity: number;
  image?:   string;
}

interface BillingForm {
  firstName: string; lastName: string; email: string; phone?: string;
  address: string; city: string; state?: string; zip?: string; country?: string;
}

interface Props {
  total:     number;
  currency?: string;
  items:     CartItem[];
  billing:   BillingForm;
  onSuccess: (orderNumber: string) => void;
  onError:   (msg: string) => void;
}

// ─── Styled ───────────────────────────────────────────────────────────────────
const spin = keyframes`to { transform: rotate(360deg); }`;

const Wrap = styled.div`
  width: 100%;
  margin-top: 8px;
`;

const GPayBtn = styled.button`
  width: 100%;
  height: 48px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s, opacity 0.2s;
  &:hover:not(:disabled) { background: #1a1a1a; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const GPayLogo = styled.span`
  font-size: 17px;
  letter-spacing: -0.5px;
  font-weight: 700;
  font-family: 'Google Sans', Roboto, sans-serif;
  /* Official Google Pay colours on the G */
  background: linear-gradient(135deg, #4285f4 0%, #34a853 34%, #fbbc05 67%, #ea4335 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SpinIcon   = styled(Loader)`animation: ${spin} 0.8s linear infinite;`;
const StatusBox  = styled.div<{ $type?: 'info' | 'error' | 'warn' }>`
  font-size: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  margin-top: 8px;
  line-height: 1.6;
  background: ${({ $type }) =>
    $type === 'error' ? '#fff3cd' :
    $type === 'warn'  ? '#fff8e1' : '#e8f5e9'};
  border: 1px solid ${({ $type }) =>
    $type === 'error' ? '#ffc107' :
    $type === 'warn'  ? '#ffe082' : '#a5d6a7'};
  color: ${({ $type }) =>
    $type === 'error' ? '#856404' :
    $type === 'warn'  ? '#795548' : '#1b5e20'};
`;

const Divider = styled.div`
  display: flex; align-items: center; gap: 10px;
  margin: 14px 0;
  font-size: 11px; color: #bbb; text-transform: uppercase; letter-spacing: .5px;
  &::before, &::after { content: ''; flex: 1; height: 1px; background: #f0f0f0; }
`;

// ─── Load Google Pay script once ──────────────────────────────────────────────
let _scriptLoaded = false;
const loadGooglePayScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (_scriptLoaded || typeof (window as any).google?.payments?.api?.PaymentsClient !== 'undefined') {
      _scriptLoaded = true;
      resolve();
      return;
    }
    const existing = document.getElementById('google-pay-script');
    if (existing) { existing.addEventListener('load', () => { _scriptLoaded = true; resolve(); }); return; }
    const s = document.createElement('script');
    s.id  = 'google-pay-script';
    s.src = 'https://pay.google.com/gp/p/js/pay.js';
    s.async = true;
    s.onload = () => { _scriptLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load Google Pay script'));
    document.head.appendChild(s);
  });

// ─── Component ────────────────────────────────────────────────────────────────
export const GooglePayButton: React.FC<Props> = ({
  total, currency = 'USD', items, billing, onSuccess, onError,
}) => {
  const [ready,    setReady]    = useState(false);   // GPay available on this browser
  const [loading,  setLoading]  = useState(false);   // payment in progress
  const [status,   setStatus]   = useState<string>('');
  const [isTest,   setIsTest]   = useState(false);
  const clientRef  = useRef<any>(null);
  const configRef  = useRef<GPayConfig | null>(null);

  // ── Initialise PaymentsClient ────────────────────────────────────────────
  const init = useCallback(async () => {
    try {
      setStatus('Loading Google Pay…');

      // 1. Fetch merchant config from our backend
      const cfgRes = await gpayApi.getConfig();
      if (!cfgRes.success) throw new Error('Could not load Google Pay config');
      const cfg = cfgRes.data;
      configRef.current = cfg;
      setIsTest(cfg.environment === 'TEST');

      // 2. Load the Google Pay JS SDK
      await loadGooglePayScript();

      const PaymentsClient = (window as any).google.payments.api.PaymentsClient;

      // 3. Create client (TEST vs PRODUCTION)
      const client = new PaymentsClient({
        environment: cfg.environment,
        // In PRODUCTION add merchantInfo:
        ...(cfg.environment === 'PRODUCTION' && {
          merchantInfo: {
            merchantId:   cfg.merchantId,
            merchantName: cfg.merchantName,
          },
        }),
      });
      clientRef.current = client;

      // 4. Check if device/browser is ready to pay
      const isReadyResponse = await client.isReadyToPay({
        apiVersion:        2,
        apiVersionMinor:   0,
        allowedPaymentMethods: [{
          type:       'CARD',
          parameters: {
            allowedAuthMethods:   cfg.allowedAuthMethods,
            allowedCardNetworks:  cfg.allowedCardNetworks,
          },
        }],
      });

      if (isReadyResponse.result) {
        setReady(true);
        setStatus('');
      } else {
        setStatus('Google Pay is not available on this device.');
      }
    } catch (err: any) {
      setStatus(err.message || 'Google Pay failed to initialise.');
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  // ── Handle Pay button click ───────────────────────────────────────────────
  const handlePay = useCallback(async () => {
    const client = clientRef.current;
    const cfg    = configRef.current;

    if (!client || !cfg) { onError('Google Pay is not ready.'); return; }

    if (!billing.firstName || !billing.email || !billing.address || !billing.city) {
      onError('Please fill in all required shipping fields before paying.');
      return;
    }

    if (items.length === 0) { onError('Your cart is empty.'); return; }

    setLoading(true);
    setStatus('');

    try {
      // Build the payment request
      const paymentRequest = {
        apiVersion:      2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type:       'CARD',
          parameters: {
            allowedAuthMethods:  cfg.allowedAuthMethods,
            allowedCardNetworks: cfg.allowedCardNetworks,
            billingAddressRequired:        true,
            billingAddressParameters:      { format: 'FULL', phoneNumberRequired: false },
          },
          tokenizationSpecification: cfg.tokenizationSpecification,
        }],
        merchantInfo: {
          merchantId:   cfg.environment === 'TEST' ? '12345678901234567890' : cfg.merchantId,
          merchantName: cfg.merchantName,
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice:       total.toFixed(2),
          currencyCode:     currency,
          countryCode:      billing.country || 'US',
        },
        emailRequired: true,
        shippingAddressRequired: false,  // we use billing form for shipping
      };

      // Open Google Pay sheet
      const paymentData = await client.loadPaymentData(paymentRequest);

      setStatus('Processing payment…');

      // Send token + order to backend
      const body: GPayProcessBody = {
        paymentData,
        billing: {
          firstName: billing.firstName,
          lastName:  billing.lastName  || '',
          email:     paymentData.email || billing.email,
          phone:     billing.phone     || '',
          address:   billing.address,
          city:      billing.city,
          state:     billing.state     || '',
          zip:       billing.zip       || '',
          country:   billing.country   || 'US',
        },
        items: items.map(i => ({
          productId: i.id,
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          image:     i.image,
        })),
      };

      const result = await gpayApi.processPayment(body);

      if (result.success) {
        onSuccess((result.data as any)?.orderNumber || '');
      } else {
        throw new Error('Order could not be placed. Please try again.');
      }
    } catch (err: any) {
      // Google Pay sheet dismissed by user — not a real error
      if (err?.statusCode === 'CANCELED' || err?.message === 'User closed the Payment Handler window without making a payment.') {
        setStatus('Payment cancelled.');
        setLoading(false);
        return;
      }
      const msg = err?.message || 'Google Pay payment failed.';
      setStatus(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  }, [billing, items, total, currency, onSuccess, onError]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Wrap>
      {ready ? (
        <>
          {isTest && (
            <StatusBox $type="warn">
              🧪 <strong>Test Mode</strong> — Google issues a fake token automatically.
              No real Google account or card needed. Click the button below to try it.
            </StatusBox>
          )}
          <Divider>or pay with</Divider>
          <GPayBtn onClick={handlePay} disabled={loading} type="button">
            {loading
              ? <><SpinIcon size={15} color="#fff" /> Processing…</>
              : <><GPayLogo>G</GPayLogo> Pay</>}
          </GPayBtn>
          {status && !loading && (
            <StatusBox $type={status.includes('cancel') ? 'warn' : 'info'}>
              {status}
            </StatusBox>
          )}
        </>
      ) : status ? (
        <StatusBox $type="warn">⚠️ {status}</StatusBox>
      ) : (
        <StatusBox $type="info">
          <SpinIcon size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Checking Google Pay availability…
        </StatusBox>
      )}
    </Wrap>
  );
};

export default GooglePayButton;
