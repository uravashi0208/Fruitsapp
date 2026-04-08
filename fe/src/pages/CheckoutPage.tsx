/**
 * src/pages/CheckoutPage.tsx
 *
 * Payment flows:
 *   - PayPal  → native @paypal/react-paypal-js (no Stripe)
 *   - Google Pay → native Google Pay API (no Stripe)
 *   - COD     → direct order placement (no payment processor)
 *   - All others (card, apple_pay, etc.) → Stripe Elements
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  CreditCard,
  Truck,
  CheckCircle,
  Lock,
  Loader,
  ShoppingBag,
} from "lucide-react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

import { PageHero } from "../components/ui/PageHero";
import { useCart } from "../hooks/useCart";
import { useAppDispatch } from "../store";
import { clearCart } from "../store/cartSlice";
import { showToast } from "../store/uiSlice";
import { theme } from "../styles/theme";
import {
  Container,
  Section,
  Flex,
  Button,
  Input,
  Divider,
} from "../styles/shared";
import { NewsletterSection } from "../components/ui/NewsletterSection";
import {
  ordersApi,
  stripeApi,
  paypalApi,
  OrderPayment,
} from "../api/storefront";
import { GooglePayButton } from "../components/ui/GooglePayButton";
import { ApiError } from "../api/client";

// ─── Stripe publishable key ────────────────────────────────────────────────────
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "",
);

// ─── Apple Pay test mode detection ───────────────────────────────────────────
const isApplePayAvailable = (): boolean => {
  // ApplePaySession is only available in Safari / WebKit
  return (
    typeof (window as any).ApplePaySession !== "undefined" &&
    (window as any).ApplePaySession.canMakePayments?.() === true
  );
};

const isTestMode = (
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ""
).startsWith("pk_test_");

// ─── Animations ───────────────────────────────────────────────────────────────
const spin = keyframes`to { transform: rotate(360deg); }`;

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 40px;
  align-items: start;
  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;
const FormCard = styled.div`
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
  svg {
    color: ${theme.colors.primary};
  }
`;
const FormGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 2}, 1fr);
  gap: 16px;
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;
const FormGroup = styled.div<{ $full?: boolean }>`
  ${({ $full }) => $full && "grid-column: 1 / -1;"}
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Label = styled.label`
  font-size: 13px;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.text};
`;
const SInput = styled(Input)`
  border-radius: 4px;
  padding: 10px 14px;
`;
const SelectEl = styled.select`
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 14px;
  color: ${theme.colors.textDark};
  background: #fff;
  width: 100%;
  outline: none;
  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

// ─── Payment styles ────────────────────────────────────────────────────────────
const PayOption = styled.label<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border: 2px solid
    ${({ $active }) => ($active ? theme.colors.primary : "#dee2e6")};
  background: ${({ $active }) => ($active ? "rgba(130,174,70,0.05)" : "#fff")};
  transition: ${theme.transitions.base};
  margin-bottom: 6px;
  border-radius: 6px;
  &:hover {
    border-color: ${theme.colors.primary};
  }
`;
const RadioDot = styled.span<{ $active: boolean }>`
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 2px solid
    ${({ $active }) => ($active ? theme.colors.primary : "#ccc")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &::after {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${theme.colors.primary};
    display: ${({ $active }) => ($active ? "block" : "none")};
  }
`;
const PayLabel = styled.span`
  font-size: 13px;
  font-weight: ${theme.fontWeights.medium};
  flex: 1;
`;
const PayBadge = styled.span`
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 20px;
  background: rgba(130, 174, 70, 0.13);
  color: ${theme.colors.primary};
  font-weight: 700;
`;
const InfoBox = styled.div`
  font-size: 12px;
  color: ${theme.colors.text};
  margin-top: 4px;
  margin-bottom: 6px;
  padding: 10px 14px;
  background: rgba(130, 174, 70, 0.06);
  border-radius: 4px;
  line-height: 1.6;
`;
const SpinIcon = styled(Loader)`
  animation: ${spin} 0.8s linear infinite;
`;

// Stripe PaymentElement wrapper styles
const StripeBox = styled.div`
  .StripeElement {
    padding: 12px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: #fff;
    &--focus {
      border-color: ${theme.colors.primary};
    }
    &--invalid {
      border-color: #e53e3e;
    }
  }
`;

// ─── Order summary ─────────────────────────────────────────────────────────────
const OrderSummary = styled.aside`
  background: #fff;
  border: 1px solid #f0f0f0;
  padding: 30px;
  position: sticky;
  top: 20px;
`;
const OItem = styled(Flex)`
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
`;
const Thumb = styled.img`
  width: 44px;
  height: 44px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
`;
const IName = styled.span`
  font-size: 13px;
  color: ${theme.colors.textDark};
  flex: 1;
`;
const ITotal = styled.span`
  font-size: 13px;
  font-weight: ${theme.fontWeights.semibold};
  white-space: nowrap;
`;
const TRow = styled(Flex)`
  justify-content: space-between;
  font-size: 14px;
  margin-top: 8px;
  span:first-child {
    color: ${theme.colors.text};
  }
  span:last-child {
    font-weight: ${theme.fontWeights.medium};
  }
`;
const GTotal = styled(TRow)`
  font-size: 18px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px solid #f0f0f0;
  span:last-child {
    color: ${theme.colors.primary};
    font-weight: ${theme.fontWeights.bold};
  }
`;
const SuccessWrap = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
`;

// ─── Apple Pay test mode banner ───────────────────────────────────────────────
const TestModeBanner = styled.div`
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #795548;
  margin-bottom: 12px;
  line-height: 1.6;
  strong {
    color: #5d4037;
  }
`;
const ApplePayNote = styled.div`
  background: #f3e5f5;
  border: 1px solid #ce93d8;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #4a148c;
  margin-top: 8px;
  line-height: 1.6;
`;
// ─── Payment methods data ──────────────────────────────────────────────────────
type PayMethod =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "klarna"
  | "revolut"
  | "sepa_debit"
  | "ideal"
  | "bancontact"
  | "sofort"
  | "giropay"
  | "eps"
  | "przelewy24"
  | "blik"
  | "cod";

interface MethodDef {
  id: PayMethod;
  label: string;
  icon: string;
  badge?: string;
  info: string;
  group: "digital" | "bnpl" | "bank" | "local" | "offline";
}

const METHODS: MethodDef[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    icon: "💳",
    group: "digital",
    info: "Visa, Mastercard, Amex, Maestro — enter your card details securely via Stripe.",
  },
  {
    id: "apple_pay",
    label: "Apple Pay",
    icon: "🍎",
    group: "digital",
    info: "Tap to pay with Face ID / Touch ID. Available on Safari & iOS devices.",
  },
  {
    id: "google_pay",
    label: "Google Pay",
    icon: "🔵",
    group: "digital",
    info: "One-tap checkout with your saved Google Pay card. Powered directly by the Google Pay API — no Stripe required.",
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: "🅿️",
    badge: "Popular",
    group: "bnpl",
    info: "Pay now or use PayPal Pay Later. You will be redirected to PayPal.",
  },
  {
    id: "blik",
    label: "BLIK",
    icon: "📱",
    badge: "Poland",
    group: "local",
    info: "Poland — generate a 6-digit code in your banking app.",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    icon: "💵",
    group: "offline",
    info: "Pay in cash when your order arrives. No card needed.",
  },
];
const GROUP_ORDER = ["digital", "bnpl", "bank", "local", "offline"] as const;

// ─── BLIK Payment Form ────────────────────────────────────────────────────────
// BLIK is a Polish instant payment — user generates a 6-digit code in their
// banking app and enters it here. Stripe captures it via confirmBlikPayment().
// Flow:
//   1. Create order (pending) on backend
//   2. Create PaymentIntent (PLN, payment_method_types: ['blik']) on backend
//   3. User enters 6-digit BLIK code
//   4. stripe.confirmBlikPayment() — Stripe calls the bank in real-time
//   5. Bank approves → paymentIntent status = 'succeeded'
//   6. Update order to paid + deduct stock

interface BlikFormProps {
  billing: typeof INITIAL_FORM;
  total: number;
  items: any[];
  onSuccess: (orderNum: string, firstName: string, email: string) => void;
  onError: (msg: string) => void;
}

const BlikDigitInput = styled.input`
  width: 44px;
  height: 56px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  outline: none;
  color: ${theme.colors.textDark};
  transition: border-color 0.15s;
  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(130, 174, 70, 0.15);
  }
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
  }
  -moz-appearance: textfield;
`;

const BlikTimerBar = styled.div<{ $pct: number }>`
  height: 3px;
  background: #e9ecef;
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${({ $pct }) => $pct}%;
    background: ${({ $pct }) => ($pct > 30 ? theme.colors.primary : "#e53e3e")};
    transition:
      width 1s linear,
      background 0.3s;
  }
`;

const BlikPaymentForm: React.FC<BlikFormProps> = ({
  billing,
  total,
  items,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"input" | "waiting" | "done">("input");
  const [secondsLeft, setSecondsLeft] = useState(120); // BLIK codes valid 2 min
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useAppDispatch();

  // Countdown timer — starts when user clicks Pay
  // Use a ref to avoid stale closure inside the setInterval callback
  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (stage !== "waiting") return;
    setSecondsLeft(120);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          // Use ref — not closed-over stage — to get the current value
          if (stageRef.current === "waiting") {
            setStage("input");
            onError(
              "BLIK code expired. Please generate a new code and try again.",
            );
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [stage, onError]);

  const handleDigit = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const fullCode = code.join("");

  const handlePay = async () => {
    if (!stripe) {
      onError("Stripe is not loaded.");
      return;
    }
    if (fullCode.length !== 6) {
      onError("Enter the full 6-digit BLIK code.");
      return;
    }
    if (
      !billing.firstName ||
      !billing.email ||
      !billing.address ||
      !billing.city
    ) {
      onError("Please fill in all required shipping fields.");
      return;
    }
    if (items.length === 0) {
      onError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setStage("waiting");

    try {
      // 1. Create pending order
      const orderRes = await ordersApi.place({
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        billing: {
          firstName: billing.firstName,
          lastName: billing.lastName,
          email: billing.email,
          phone: billing.phone,
          address: billing.address,
          city: billing.city,
          state: billing.state,
          zip: billing.zip,
          country: billing.country,
        },
        payment: { method: "blik", status: "pending" },
      });

      const appOrderId = (orderRes.data as any)?.id || "";

      // 2. Create PaymentIntent (PLN, blik-only) on backend
      //    Pass appOrderId so the webhook can link payment → order
      const piRes = await stripeApi.createPaymentIntent({
        amount: total,
        payMethod: "blik",
        customerEmail: billing.email,
        orderId: appOrderId,
        billing: {
          firstName: billing.firstName,
          lastName: billing.lastName,
          email: billing.email,
          phone: billing.phone,
          address: billing.address,
          city: billing.city,
          state: billing.state,
          zip: billing.zip,
          country: billing.country,
        },
      });

      const { clientSecret } = piRes.data;
      if (!clientSecret) {
        onError("Payment setup failed. Please try again.");
        setStage("input");
        setLoading(false);
        return;
      }

      // 3. Confirm BLIK payment with the 6-digit code
      const { error, paymentIntent } = await stripe.confirmBlikPayment(
        clientSecret,
        {
          payment_method: {
            blik: {},
            billing_details: {
              name: `${billing.firstName} ${billing.lastName}`.trim(),
              email: billing.email,
            },
          },
          payment_method_options: {
            blik: { code: fullCode },
          },
        },
      );

      clearInterval(timerRef.current!);

      if (error) {
        setStage("input");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        onError(error.message || "BLIK payment failed. Please try again.");
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // 4. Payment confirmed — the Stripe webhook (payment_intent.succeeded)
        //    will mark the order as paid and deduct stock server-side.
        //    We just clear the cart and show success to the user.
        dispatch(clearCart());
        dispatch(
          showToast({
            message: "BLIK payment successful! 🎉",
            type: "success",
          }),
        );
        setStage("done");
        onSuccess(
          (orderRes.data as any)?.orderNumber || "",
          billing.firstName,
          billing.email,
        );
      }
    } catch (err) {
      clearInterval(timerRef.current!);
      setStage("input");
      setCode(["", "", "", "", "", ""]);
      onError(
        err instanceof ApiError
          ? err.message
          : "BLIK payment failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Code input */}
      <div style={{ marginBottom: 16 }}>
        <Label style={{ display: "block", marginBottom: 10, fontSize: 14 }}>
          📱 Enter your 6-digit BLIK code
        </Label>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {code.map((digit, idx) => (
            <BlikDigitInput
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="number"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(idx, e.target.value.slice(-1))}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={idx === 0 ? handlePaste : undefined}
              disabled={loading}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {stage === "waiting" && (
          <>
            <div
              style={{
                textAlign: "center",
                marginTop: 12,
                fontSize: 13,
                color: theme.colors.text,
              }}
            >
              ⏳ Waiting for bank approval… {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </div>
            <BlikTimerBar $pct={(secondsLeft / 120) * 100} />
          </>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: 10,
            fontSize: 12,
            color: "#888",
          }}
        >
          Open your banking app → BLIK → copy the 6-digit code here
        </div>
      </div>

      <Button
        style={{ width: "100%", justifyContent: "center", gap: 8 }}
        onClick={handlePay}
        disabled={loading || fullCode.length !== 6 || !stripe}
      >
        {loading ? (
          <>
            <SpinIcon size={14} /> Waiting for bank…
          </>
        ) : (
          <>
            <ShoppingBag size={16} /> Pay with BLIK
          </>
        )}
      </Button>

      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: theme.colors.text,
          marginTop: 10,
        }}
      >
        <Lock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
        Secured by Stripe — BLIK code is never stored
      </p>
    </div>
  );
};

// ─── Stripe Payment Form (inner — uses hooks that need <Elements>) ─────────────
interface StripeFormProps {
  billing: typeof INITIAL_FORM;
  payMethod: PayMethod;
  total: number;
  onSuccess: (orderNum: string, firstName: string, email: string) => void;
  onError: (msg: string) => void;
  items: any[];
}

const StripePaymentForm: React.FC<StripeFormProps> = ({
  billing,
  payMethod,
  total,
  onSuccess,
  onError,
  items,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      onError("Stripe is not loaded yet. Please wait a moment.");
      return;
    }

    if (
      !billing.firstName ||
      !billing.email ||
      !billing.address ||
      !billing.city
    ) {
      onError("Please fill in all required shipping fields.");
      return;
    }

    if (items.length === 0) {
      onError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      // 1. Submit the Elements form (validates card fields)
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || "Please check your card details.");
        setLoading(false);
        return;
      }

      // 2. Create PaymentIntent on backend (only on Place Order click)
      const piRes = await stripeApi.createPaymentIntent({
        amount: total,
        payMethod,
        customerEmail: billing.email,
        billing: {
          firstName: billing.firstName,
          lastName: billing.lastName,
          email: billing.email,
          phone: billing.phone,
          address: billing.address,
          city: billing.city,
          state: billing.state,
          zip: billing.zip,
          country: billing.country,
        },
      });

      const { clientSecret } = piRes.data;
      if (!clientSecret) {
        onError("Payment setup failed. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Confirm payment with the fresh clientSecret
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + "/checkout?stripe_return=1",
          payment_method_data: {
            billing_details: {
              name: `${billing.firstName} ${billing.lastName}`.trim(),
              email: billing.email,
              phone: billing.phone || undefined,
              address: {
                line1: billing.address,
                city: billing.city,
                state: billing.state || undefined,
                postal_code: billing.zip || undefined,
                country: billing.country || "PL",
              },
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      const stripePaymentIntentId = paymentIntent?.id || "";
      const stripeStatus = paymentIntent?.status || "succeeded";

      // 4. Retrieve card details from Stripe PaymentMethod (gives us last4, expiry, brand)
      //    paymentIntent.payment_method is a string PM id after confirmPayment
      let resolvedCardDetails: OrderPayment["cardDetails"] | undefined;
      const pmId =
        typeof (paymentIntent as any)?.payment_method === "string"
          ? ((paymentIntent as any).payment_method as string)
          : "";

      if (pmId && pmId.startsWith("pm_")) {
        try {
          const pmRes = await stripeApi.getPaymentMethod(
            pmId,
            `${billing.firstName} ${billing.lastName}`.trim(),
          );
          if (pmRes.success && pmRes.data?.cardDetails) {
            resolvedCardDetails = pmRes.data.cardDetails;
          }
        } catch (_pmErr) {
          // Non-fatal — card details can be patched by webhook later
          console.warn("Could not retrieve payment method details:", _pmErr);
        }
      }

      // 5. Place order on backend with confirmed paymentIntentId + card details
      const orderPayment: OrderPayment = {
        method: payMethod,
        status: "paid" as any,
        transactionId: stripePaymentIntentId,
        orderPaymentStatus: stripeStatus,
        cardDetails: resolvedCardDetails,
      };

      const res = await ordersApi.place({
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        billing: {
          firstName: billing.firstName,
          lastName: billing.lastName,
          email: billing.email,
          phone: billing.phone,
          address: billing.address,
          city: billing.city,
          state: billing.state,
          zip: billing.zip,
          country: billing.country,
        },
        payment: orderPayment,
      });

      if (res.success) {
        dispatch(clearCart());
        dispatch(
          showToast({
            message: "Order placed successfully! 🎉",
            type: "success",
          }),
        );
        onSuccess(
          (res.data as any)?.orderNumber || "",
          billing.firstName,
          billing.email,
        );
      }
    } catch (err) {
      onError(
        err instanceof ApiError
          ? err.message
          : "Order failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Stripe PaymentElement renders the correct UI per payment method.
          Apple Pay / Google Pay wallet buttons appear here automatically
          when the browser/device supports them — no extra code needed. */}
      <StripeBox>
        <PaymentElement
          options={{
            // 'tabs' layout shows each PM as a tab; 'accordion' stacks them.
            // google_pay is handled outside Stripe — this block never runs for it.
            layout:
              payMethod === "apple_pay"
                ? { type: "tabs", defaultCollapsed: false }
                : "tabs",
            wallets: {
              // Only show Apple Pay button for apple_pay method.
              // For BLIK and other local methods, suppress wallets so Stripe
              // does not render a confusing saved-card / Link UI on top.
              applePay: payMethod === "apple_pay" ? "auto" : "never",
              googlePay: "never", // Google Pay is handled natively, never via Stripe
            },
          }}
        />
      </StripeBox>
      <p style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>
        🔒 Your payment details are securely handled by Stripe. We never see
        your card number.
      </p>
      <Button
        style={{
          width: "100%",
          marginTop: 16,
          justifyContent: "center",
          gap: 8,
        }}
        onClick={handleSubmit}
        disabled={loading || !stripe}
      >
        {loading ? (
          <>
            <SpinIcon size={14} /> Processing…
          </>
        ) : (
          <>
            <ShoppingBag size={16} /> Place Order
          </>
        )}
      </Button>
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: theme.colors.text,
          marginTop: 10,
        }}
      >
        <Lock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
        Secured by Stripe — 256-bit SSL encryption
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        {[
          "💳",
          "🍎",
          "🔵",
          "🅿️",
          "🟣",
          "🔷",
          "🏦",
          "🇳🇱",
          "🇧🇪",
          "⚡",
          "🇩🇪",
          "🇦🇹",
          "🇵🇱",
          "📱",
          "💵",
        ].map((icon, i) => (
          <span key={i} style={{ fontSize: 16 }}>
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── PayPal Section (native — no Stripe) ─────────────────────────────────────
interface PayPalSectionProps {
  billing: typeof INITIAL_FORM;
  total: number;
  items: any[];
  onSuccess: (orderNum: string, firstName: string, email: string) => void;
  onError: (msg: string) => void;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

const PayPalSection: React.FC<PayPalSectionProps> = ({
  billing,
  total,
  items,
  onSuccess,
  onError,
  triggerRef,
}) => {
  const dispatch = useAppDispatch();
  const appOrderRef = useRef<string>("");
  const paypalButtonRef = useRef<HTMLDivElement>(null);

  // Expose a trigger so the Order Summary "Place Order" button can click the PayPal button
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => {
        // Find and click the PayPal button inside the hidden container
        const btn = paypalButtonRef.current?.querySelector(
          "button, .paypal-button",
        ) as HTMLElement | null;
        if (btn) {
          btn.click();
        }
      };
    }
    return () => {
      if (triggerRef) triggerRef.current = null;
    };
  }, [triggerRef]);

  return (
    <div>
      <InfoBox>
        🅿️ <strong>PayPal</strong> — Click the button below to pay securely via
        PayPal. You can use your PayPal balance, bank account, or any card saved
        in PayPal. No Stripe involved.
      </InfoBox>

      {!process.env.REACT_APP_PAYPAL_CLIENT_ID && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 12,
            color: "#856404",
            marginBottom: 12,
          }}
        >
          ⚠️ <strong>Setup required:</strong> Add{" "}
          <code>REACT_APP_PAYPAL_CLIENT_ID=your_sandbox_client_id</code> to your
          frontend <code>.env</code> file and restart the dev server.
        </div>
      )}

      {/* PayPalScriptProvider is mounted at CheckoutPage level (above) so the
          SDK is initialised only once and never re-mounts on re-render.
          PayPalButtons here are rendered inside that outer Provider. */}
      {/* PayPal buttons — visible inline */}
      <div ref={paypalButtonRef}>
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "pay",
            height: 45,
          }}
          forceReRender={[total]}
          createOrder={async () => {
            if (
              !billing.firstName ||
              !billing.email ||
              !billing.address ||
              !billing.city
            ) {
              onError(
                "Please fill in all required shipping fields before paying.",
              );
              throw new Error("Missing billing fields");
            }
            if (items.length === 0) {
              onError("Your cart is empty.");
              throw new Error("Empty cart");
            }

            try {
              // 1. Create a pending app order first
              const orderRes = await ordersApi.place({
                items: items.map((i) => ({
                  productId: i.id,
                  name: i.name,
                  price: i.price,
                  quantity: i.quantity,
                  image: i.image,
                })),
                billing: {
                  firstName: billing.firstName,
                  lastName: billing.lastName,
                  email: billing.email,
                  phone: billing.phone,
                  address: billing.address,
                  city: billing.city,
                  state: billing.state,
                  zip: billing.zip,
                  country: billing.country,
                },
                payment: { method: "paypal", status: "pending" },
              });

              appOrderRef.current = (orderRes.data as any)?.id || "";

              // 2. Create PayPal order linked to app order
              const ppRes = await paypalApi.createOrder({
                amount: total,
                currency: "USD",
                orderId: appOrderRef.current,
              });

              return ppRes.data.id; // PayPal order ID — returned to SDK
            } catch (err) {
              onError(
                err instanceof ApiError
                  ? err.message
                  : "Failed to start PayPal payment.",
              );
              throw err;
            }
          }}
          onApprove={async (data: { orderID: string }) => {
            try {
              const res = await paypalApi.captureOrder({
                paypalOrderId: data.orderID,
                appOrderId: appOrderRef.current,
              });

              if (res.success) {
                dispatch(clearCart());
                dispatch(
                  showToast({
                    message: "PayPal payment successful! 🎉",
                    type: "success",
                  }),
                );
                onSuccess(
                  (res.data as any)?.paypalOrderId || "",
                  billing.firstName,
                  billing.email,
                );
              } else {
                onError("PayPal capture failed. Please contact support.");
              }
            } catch (err) {
              onError(
                err instanceof ApiError
                  ? err.message
                  : "PayPal payment capture failed.",
              );
            }
          }}
          onError={(err: unknown) => {
            console.error("[PayPal] error:", err);
            onError(
              "PayPal encountered an error. Please try again or choose another payment method.",
            );
          }}
          onCancel={() => {
            dispatch(
              showToast({
                message: "PayPal payment cancelled.",
                type: "info",
              }),
            );
          }}
        />
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: theme.colors.text,
          marginTop: 10,
        }}
      >
        <Lock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
        Secured by PayPal — your financial details are never shared with us
      </p>
    </div>
  );
};

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "PL",
};

// ─── Main component ───────────────────────────────────────────────────────────
const CheckoutPage: React.FC = () => {
  const { items, subtotal, shipping, total } = useCart();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading, openAuthModal } = useAuth();

  // Guard: guest users must log in before checkout
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      dispatch(
        showToast({
          message: "Please sign in to continue to checkout",
          type: "info",
        }),
      );
      openAuthModal("login");
    }
  }, [authLoading, isLoggedIn, openAuthModal, dispatch]);

  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [submitted, setSubmitted] = useState(false);
  const [successInfo, setSuccessInfo] = useState({
    orderNum: "",
    firstName: "",
    email: "",
  });
  const [applePayAvailable, setApplePayAvailable] = useState<boolean | null>(
    null,
  );
  // Ref to programmatically trigger PayPal button from Order Summary "Place Order" btn
  const paypalTriggerRef = useRef<(() => void) | null>(null);

  // Detect Apple Pay availability on mount
  useEffect(() => {
    setApplePayAvailable(isApplePayAvailable());
  }, []);

  const [form, setForm] = useState(INITIAL_FORM);

  // Stripe Elements options — deferred intent pattern (no clientSecret at mount time).
  // ✅ Must NOT specify payment_method_types here — backend uses automatic_payment_methods.
  // The key prop on <Elements> ensures Stripe re-initialises when payment method changes,
  // which is critical for Apple Pay — it needs Elements to know the amount upfront.
  // BLIK requires PLN currency — all other Stripe methods use USD
  const elementsOptions: StripeElementsOptions = {
    mode: "payment",
    amount: Math.round(total * 100),
    currency: payMethod === "blik" ? "pln" : "usd",
    // BLIK requires explicit payment_method_types — it is incompatible with
    // automatic_payment_methods. All other Stripe methods use automatic mode.
    ...(payMethod === "blik"
      ? { payment_method_types: ["blik"] }
      : payMethod !== "cod" &&
          payMethod !== "google_pay" &&
          payMethod !== "paypal"
        ? { paymentMethodCreationParams: undefined }
        : {}),
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#82ae46",
        colorBackground: "#ffffff",
        colorText: "#000000",
        colorDanger: "#e53e3e",
        fontFamily: "Poppins, sans-serif",
        borderRadius: "4px",
      },
    },
  };

  const upd =
    (k: keyof typeof INITIAL_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSuccess = useCallback(
    (orderNum: string, firstName: string, email: string) => {
      setSuccessInfo({ orderNum, firstName, email });
      setSubmitted(true);
    },
    [],
  );

  const handleError = useCallback(
    (msg: string) => {
      dispatch(showToast({ message: msg, type: "error" }));
    },
    [dispatch],
  );

  // Handle COD submit (no Stripe)
  const handleCodSubmit = async () => {
    if (!form.firstName || !form.email || !form.address || !form.city) {
      dispatch(
        showToast({
          message: "Please fill in all required fields",
          type: "error",
        }),
      );
      return;
    }
    if (items.length === 0) {
      dispatch(showToast({ message: "Your cart is empty", type: "error" }));
      return;
    }
    try {
      const res = await ordersApi.place({
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        billing: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        payment: { method: "cod", status: "pending" },
      });
      if (res.success) {
        dispatch(clearCart());
        dispatch(
          showToast({
            message: "Order placed! Pay on delivery. 🎉",
            type: "success",
          }),
        );
        setSuccessInfo({
          orderNum: (res.data as any)?.orderNumber || "",
          firstName: form.firstName,
          email: form.email,
        });
        setSubmitted(true);
      }
    } catch (err) {
      dispatch(
        showToast({
          message: err instanceof ApiError ? err.message : "Order failed.",
          type: "error",
        }),
      );
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  // Show login prompt overlay for guests
  if (!authLoading && !isLoggedIn)
    return (
      <main>
        <PageHero title="Checkout" breadcrumbs={[{ label: "Checkout" }]} />
        <Section>
          <Container>
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "white",
                border: "1px solid #f0f0f0",
                maxWidth: 480,
                margin: "0 auto",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
              <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>
                Sign in to checkout
              </h2>
              <p style={{ color: "gray", marginBottom: 24, fontSize: 14 }}>
                Create a free account or sign in to place your order, track
                deliveries, and earn loyalty points.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  onClick={() => openAuthModal("login")}
                  style={{ minWidth: 130 }}
                >
                  Sign In
                </Button>
                <Button
                  $variant="outline"
                  onClick={() => openAuthModal("register")}
                  style={{ minWidth: 130 }}
                >
                  Create Account
                </Button>
              </div>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <p style={{ fontSize: 12, color: "gray" }}>
                  ✓ Free to join &nbsp;·&nbsp; ✓ Earn loyalty points
                  &nbsp;·&nbsp; ✓ Order tracking
                </p>
              </div>
            </div>
          </Container>
        </Section>
      </main>
    );

  if (submitted)
    return (
      <main>
        <PageHero title="Checkout" breadcrumbs={[{ label: "Checkout" }]} />
        <Section>
          <Container>
            <SuccessWrap>
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: "rgba(130,174,70,0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  color: theme.colors.primary,
                }}
              >
                <CheckCircle size={42} />
              </div>
              <h2 style={{ fontSize: 30, marginBottom: 8 }}>
                Order Confirmed! 🎉
              </h2>
              {successInfo.orderNum && (
                <p style={{ fontSize: 14, color: "#888", marginBottom: 12 }}>
                  Order #{successInfo.orderNum}
                </p>
              )}
              <p
                style={{
                  color: theme.colors.text,
                  maxWidth: 480,
                  margin: "0 auto 28px",
                }}
              >
                Thank you, <strong>{successInfo.firstName}</strong>! A
                confirmation has been sent to{" "}
                <strong>{successInfo.email}</strong>. Your fresh produce will
                arrive in 3–5 business days.
              </p>
              <Button onClick={() => navigate("/shop")}>
                Continue Shopping
              </Button>
            </SuccessWrap>
          </Container>
        </Section>
        <NewsletterSection />
      </main>
    );

  // ── Checkout form ──────────────────────────────────────────────────────────
  // PayPalScriptProvider is mounted here (top level) so the SDK loads once
  // and is never torn down on re-render. PayPalSection below uses the
  // PayPalButtons directly — they find the Provider via React context.
  const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || "";

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId || "sb",
        currency: "USD",
        intent: "capture",
        // "commit: true" shows "Pay Now" on the PayPal review page instead of "Continue"
        // and prevents the buyer from changing payment method after clicking Pay
        commit: true,
      }}
    >
      <main>
        <PageHero title="Checkout" breadcrumbs={[{ label: "Checkout" }]} />
        <Section>
          <Container>
            <Layout>
              {/* ── Left column ── */}
              <div>
                {/* Shipping info */}
                <FormCard>
                  <CardTitle>
                    <Truck size={18} /> Shipping Information
                  </CardTitle>
                  <FormGrid>
                    <FormGroup>
                      <Label>First Name *</Label>
                      <SInput
                        value={form.firstName}
                        onChange={upd("firstName")}
                        placeholder="Jan"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Last Name *</Label>
                      <SInput
                        value={form.lastName}
                        onChange={upd("lastName")}
                        placeholder="Kowalski"
                      />
                    </FormGroup>
                    <FormGroup $full>
                      <Label>Email *</Label>
                      <SInput
                        type="email"
                        value={form.email}
                        onChange={upd("email")}
                        placeholder="jan@example.com"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Phone</Label>
                      <SInput
                        type="tel"
                        value={form.phone}
                        onChange={upd("phone")}
                        placeholder="+48 123 456 789"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Country</Label>
                      <SelectEl value={form.country} onChange={upd("country")}>
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
                      <SInput
                        value={form.address}
                        onChange={upd("address")}
                        placeholder="ul. Marszałkowska 1"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>City *</Label>
                      <SInput
                        value={form.city}
                        onChange={upd("city")}
                        placeholder="Warsaw"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>State / Province</Label>
                      <SInput
                        value={form.state}
                        onChange={upd("state")}
                        placeholder="Masovia"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>ZIP / Postal Code</Label>
                      <SInput
                        value={form.zip}
                        onChange={upd("zip")}
                        placeholder="00-001"
                      />
                    </FormGroup>
                  </FormGrid>
                </FormCard>

                {/* Payment method selector + Payment Details — combined in one card */}
                <FormCard>
                  <CardTitle>
                    <CreditCard size={18} /> Payment Method
                  </CardTitle>

                  {GROUP_ORDER.map((group) => {
                    const methods = METHODS.filter((m) => m.group === group);
                    return (
                      <div key={group}>
                        {methods.map((m) => (
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
                              <span
                                style={{
                                  fontSize: 18,
                                  width: 24,
                                  textAlign: "center",
                                }}
                              >
                                {m.icon}
                              </span>
                              <PayLabel>{m.label}</PayLabel>
                              {m.badge && <PayBadge>{m.badge}</PayBadge>}
                              {/* Show TEST badge for Apple Pay in Stripe test mode */}
                              {isTestMode && m.id === "apple_pay" && (
                                <PayBadge
                                  style={{
                                    background: "rgba(103,58,183,0.12)",
                                    color: "#673ab7",
                                  }}
                                >
                                  TEST
                                </PayBadge>
                              )}
                              {/* Google Pay TEST badge — always shown (direct GPay API has its own test mode) */}
                              {m.id === "google_pay" && (
                                <PayBadge
                                  style={{
                                    background: "rgba(66,133,244,0.12)",
                                    color: "#1a73e8",
                                  }}
                                >
                                  TEST
                                </PayBadge>
                              )}
                              {/* Show ⚠️ if Apple Pay is not available on this device/browser */}
                              {m.id === "apple_pay" &&
                                applePayAvailable === false && (
                                  <span
                                    style={{ fontSize: 11, color: "#e65100" }}
                                    title="Apple Pay not available on this browser"
                                  >
                                    ⚠️
                                  </span>
                                )}
                            </PayOption>

                            {/* ── Payment Details shown inline below the selected method ── */}
                            {payMethod === m.id && (
                              <div style={{ marginBottom: 8 }}>
                                <InfoBox>ℹ️ {m.info}</InfoBox>

                                <div
                                  style={{
                                    borderTop: `2px solid ${theme.colors.primary}`,
                                    paddingTop: 16,
                                    marginTop: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      fontSize: 16,
                                      fontWeight: 500,
                                      color: theme.colors.textDark,
                                      marginBottom: 14,
                                    }}
                                  >
                                    <Lock
                                      size={16}
                                      color={theme.colors.primary}
                                    />
                                    Payment Details
                                  </div>

                                  {/* Test mode banner — only for card-based Stripe methods */}
                                  {isTestMode &&
                                    m.id !== "paypal" &&
                                    m.id !== "google_pay" &&
                                    m.id !== "cod" &&
                                    m.id !== "blik" && (
                                      <TestModeBanner>
                                        🧪 <strong>Stripe Test Mode</strong> —
                                        No real charges. Use test card{" "}
                                        <strong>4242 4242 4242 4242</strong>,
                                        any future expiry, any CVC.
                                      </TestModeBanner>
                                    )}
                                  {isTestMode && m.id === "blik" && (
                                    <TestModeBanner>
                                      🧪 <strong>Stripe Test Mode</strong> — No
                                      real charges. Use BLIK test code{" "}
                                      <strong>000000</strong> in the Stripe
                                      payment form below.
                                    </TestModeBanner>
                                  )}

                                  {/* Apple Pay specific guidance */}
                                  {m.id === "apple_pay" && (
                                    <ApplePayNote>
                                      {applePayAvailable === true ? (
                                        <>
                                          ✅ <strong>Apple Pay detected</strong>{" "}
                                          — the Apple Pay button will appear
                                          below. Tap it to pay with Face ID /
                                          Touch ID using your saved card.
                                        </>
                                      ) : applePayAvailable === false ? (
                                        <>
                                          ⚠️{" "}
                                          <strong>
                                            Apple Pay not available
                                          </strong>{" "}
                                          on this browser/device. Apple Pay
                                          requires <strong>Safari</strong> on
                                          macOS/iOS with at least one card added
                                          to your Wallet. The Stripe
                                          PaymentElement will fall back to a
                                          card form.
                                          {isTestMode && (
                                            <>
                                              <br />
                                              🧪{" "}
                                              <em>
                                                Test mode: works on any Safari
                                                with Apple Pay configured.
                                              </em>
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <>🔍 Checking Apple Pay availability…</>
                                      )}
                                    </ApplePayNote>
                                  )}

                                  {/* Google Pay */}
                                  {m.id === "google_pay" ? (
                                    <div>
                                      <InfoBox>
                                        🔵 <strong>Google Pay</strong> — powered
                                        directly by the Google Pay API. No
                                        Stripe or third-party processor
                                        required. Click the button to open the
                                        native Google Pay sheet.
                                      </InfoBox>
                                      <GooglePayButton
                                        total={total}
                                        currency="USD"
                                        items={items}
                                        billing={form}
                                        onSuccess={(orderNum) =>
                                          handleSuccess(
                                            orderNum,
                                            form.firstName,
                                            form.email,
                                          )
                                        }
                                        onError={handleError}
                                      />
                                    </div>
                                  ) : m.id === "paypal" ? (
                                    <PayPalSection
                                      billing={form}
                                      total={total}
                                      items={items}
                                      onSuccess={handleSuccess}
                                      onError={handleError}
                                      triggerRef={paypalTriggerRef}
                                    />
                                  ) : m.id === "cod" ? (
                                    <div>
                                      <InfoBox>
                                        💵 You will pay cash when the order is
                                        delivered to your door. No card needed.
                                        Click <strong>Place Order</strong> in
                                        the summary on the right to confirm.
                                      </InfoBox>
                                    </div>
                                  ) : m.id === "blik" ? (
                                    /* BLIK has its own dedicated form with 6-digit
                                     code input and stripe.confirmBlikPayment().
                                     It still needs <Elements> for the stripe hook,
                                     but renders its own UI — not PaymentElement. */
                                    <Elements
                                      stripe={stripePromise}
                                      options={elementsOptions}
                                      key="blik"
                                    >
                                      <BlikPaymentForm
                                        billing={form}
                                        total={total}
                                        items={items}
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                      />
                                    </Elements>
                                  ) : (
                                    <Elements
                                      stripe={stripePromise}
                                      options={elementsOptions}
                                      key={m.id}
                                    >
                                      <StripePaymentForm
                                        billing={form}
                                        payMethod={payMethod}
                                        total={total}
                                        items={items}
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                      />
                                    </Elements>
                                  )}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })}
                </FormCard>
              </div>

              {/* ── Order summary ── */}
              <OrderSummary>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: theme.fontWeights.medium,
                    marginBottom: 20,
                    paddingBottom: 12,
                    borderBottom: `2px solid ${theme.colors.primary}`,
                  }}
                >
                  Your Order
                </h3>

                {items.map((item) => (
                  <OItem key={item.id} as="div">
                    <Thumb
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/44x44/f1f8f1/82ae46?text=V";
                      }}
                    />
                    <IName>
                      {item.name} × {item.quantity}
                    </IName>
                    <ITotal>${(item.price * item.quantity).toFixed(2)}</ITotal>
                  </OItem>
                ))}

                <Divider $my="14px" />
                <TRow as="div">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </TRow>
                <TRow as="div">
                  <span>Shipping</span>
                  <span
                    style={{
                      color: shipping === 0 ? theme.colors.primary : undefined,
                    }}
                  >
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </TRow>
                <GTotal as="div">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </GTotal>

                {/* ── Place Order button in summary for PayPal and COD ── */}
                {(payMethod === "paypal" || payMethod === "cod") && (
                  <Button
                    style={{
                      width: "100%",
                      marginTop: 18,
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 15,
                      padding: "13px 20px",
                    }}
                    onClick={() => {
                      if (payMethod === "paypal") {
                        if (
                          !form.firstName ||
                          !form.email ||
                          !form.address ||
                          !form.city
                        ) {
                          dispatch(
                            showToast({
                              message:
                                "Please fill in all required shipping fields.",
                              type: "error",
                            }),
                          );
                          return;
                        }
                        if (items.length === 0) {
                          dispatch(
                            showToast({
                              message: "Your cart is empty.",
                              type: "error",
                            }),
                          );
                          return;
                        }
                        if (paypalTriggerRef.current) {
                          paypalTriggerRef.current();
                        }
                      } else if (payMethod === "cod") {
                        handleCodSubmit();
                      }
                    }}
                  >
                    <ShoppingBag size={16} />
                    {payMethod === "paypal" ? "Pay with PayPal" : "Place Order"}
                  </Button>
                )}

                <div
                  style={{
                    marginTop: 20,
                    padding: "12px",
                    background: "rgba(130,174,70,0.05)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: theme.colors.text,
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Selected:</strong>{" "}
                  {METHODS.find((m) => m.id === payMethod)?.label}
                  <br />
                  {payMethod === "google_pay" && "🔵 Powered by Google Pay API"}
                  {payMethod === "paypal" && "🅿️ Payment secured by PayPal"}
                  {payMethod === "cod" && "💵 Pay cash on delivery"}
                  {payMethod !== "cod" &&
                    payMethod !== "google_pay" &&
                    payMethod !== "paypal" &&
                    "🔒 Payment secured by Stripe"}
                </div>
              </OrderSummary>
            </Layout>
          </Container>
        </Section>
        <NewsletterSection />
      </main>
    </PayPalScriptProvider>
  );
};

export default CheckoutPage;
