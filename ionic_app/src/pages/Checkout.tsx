// ============================================================
// src/pages/Checkout.tsx
// Redesigned to match the screenshot — dark navy header,
// white rounded scrollable body, fixed Place Order footer
// ============================================================

import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonIcon, IonSpinner } from "@ionic/react";
import { arrowBackOutline, ellipsisVertical, addOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useCart }        from "../hooks/useCart";
import { formatPrice }    from "../utils/helpers";
import { ROUTES }         from "../utils/constants";
import { useAppState, useAppDispatch, showToast, setAddresses } from "../store";
import { ordersApi, addressApi } from "../api/storefront";
import { Address }        from "../types";
import Button          from "../components/common/Button";

// ─── Design tokens (match screenshot) ────────────────────────
const NAV_BG      = "#1a1f3c";
const WHITE       = "#ffffff";
const BORDER_CLR  = "#e5e7eb";
const TEXT_MAIN   = "#1a1f3c";
const TEXT_SUB    = "#9ca3af";

const HEADER_H    = 100;
const CARD_RADIUS = 24;

// ─── Payment options ──────────────────────────────────────────
const PAYMENT_OPTIONS = [
  {
    label: "Master Card",
    method: "card",
    icon: (
      <div style={{ position: "relative", width: 40, height: 26, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EB001B", position: "absolute", left: 0 }} />
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#F79E1B", position: "absolute", left: 14, opacity: 0.92 }} />
      </div>
    ),
  },
  {
    label: "Apple Pay",
    method: "apple_pay",
    icon: (
      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill={TEXT_MAIN}>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      </div>
    ),
  },
  {
    label: "Cash on Delivery",
    method: "cod",
    icon: (
      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        💵
      </div>
    ),
  },
];

// ─── Checkbox ─────────────────────────────────────────────────
const Checkbox: React.FC<{ checked: boolean }> = ({ checked }) => (
  <div style={{
    width: 20, height: 20, borderRadius: 5,
    border: checked ? "none" : `1.5px solid ${BORDER_CLR}`,
    background: checked ? NAV_BG : WHITE,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.15s",
  }}>
    {checked && (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

// ─── Selectable card ──────────────────────────────────────────
const SelectableCard: React.FC<{
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isSelected, onClick, children }) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
    style={{
      background: WHITE,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      border: `1.5px solid ${isSelected ? NAV_BG : BORDER_CLR}`,
      cursor: "pointer",
      transition: "border-color 0.15s ease",
    }}
  >
    <Checkbox checked={isSelected} />
    {children}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────
const Checkout: React.FC = () => {
  const history  = useHistory();
  const dispatch = useAppDispatch();
  const { items, total, subtotal, shipping } = useCart();
  const { state } = useAppState();
  const isLoggedIn = !!state.auth.user;
  const user       = state.auth.user;

  const [selectedAddr,    setSelectedAddr]    = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [placing,         setPlacing]         = useState(false);
  const [addrLoading,     setAddrLoading]     = useState(false);

  const addresses  = state.addresses;
  const addrLoaded = (state as any).addrLoaded as boolean;

  useEffect(() => {
    if (!isLoggedIn || addrLoaded) return;
    setAddrLoading(true);
    addressApi.list()
      .then((res: any) => {
        const mapped: Address[] = (res.data ?? []).map((a: any) => ({
          id:         a.id,
          label:      a.label,
          addr:       [a.addr, a.city, a.postalCode, a.country].filter(Boolean).join(", "),
          city:       a.city,
          postalCode: a.postalCode,
          country:    a.country,
          lat:        a.lat,
          lon:        a.lon,
        }));
        dispatch(setAddresses(mapped));
      })
      .catch(() => dispatch(setAddresses([])))
      .finally(() => setAddrLoading(false));
  }, [isLoggedIn, addrLoaded]);

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      history.push(ROUTES.LOGIN, { redirectTo: ROUTES.CHECKOUT });
      return;
    }
    if (addresses.length === 0) {
      dispatch(showToast({ message: "Please add a delivery address first", type: "error" }));
      return;
    }
    const addr      = addresses[selectedAddr];
    const payment   = PAYMENT_OPTIONS[selectedPayment];
    const nameParts = (user?.name ?? "").split(" ");

    setPlacing(true);
    try {
      await ordersApi.place({
        items: items.map((i) => ({
          productId: i.id, name: i.name, price: i.price,
          quantity: i.quantity, image: i.image,
        })),
        billing: {
          firstName: nameParts[0] ?? "",
          lastName:  nameParts.slice(1).join(" ") ?? "",
          email:     user?.email ?? "",
          address:   addr.addr,
          city:      (addr as any).city       ?? "",
          state:     "",
          zip:       (addr as any).postalCode ?? "",
          country:   (addr as any).country    ?? "",
        },
        payment: { method: payment.method as any, status: "pending" },
        notes:   `Label: ${addr.label}`,
      });
      dispatch(showToast({ message: "Order placed successfully! 🎉", type: "success" }));
      history.push(ROUTES.TRACK);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Could not place order.", type: "error" }));
    } finally {
      setPlacing(false);
    }
  };

  const isLoading = addrLoading && addresses.length === 0;

  return (
    <IonPage>

      {/* ── FIXED HEADER ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: NAV_BG,
        paddingTop: 52, paddingBottom: 16,
        paddingLeft: 20, paddingRight: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Button
            variant="ghost"
            onClick={() => history.goBack()}
            aria-label="Go back"
            style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, height: 52, background:"rgb(255 255 255 / 0%)" }}
          >
            <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "rgb(255 255 255 / 61%)" }} />
          </Button>

        <span style={{
          color: WHITE, fontWeight: 700, fontSize: 18,
          fontFamily: "var(--font-primary)", letterSpacing: 0.2,
        }}>
          Checkout
        </span>
        <Button
            variant="ghost"
            aria-label="Go back"
            style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, height: 52, background:"rgb(255 255 255 / 0%)" }}
          >
            <IonIcon icon={ellipsisVertical} style={{ fontSize: 20, color: "rgb(255 255 255 / 61%)" }} />
          </Button>
      </div>

      {/* ── FIXED FOOTER ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: WHITE,
        padding: "14px 20px 32px",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14,
        }}>
          <span style={{
            fontSize: 15, color: TEXT_MAIN,
            fontFamily: "var(--font-primary)", fontWeight: 500,
          }}>
            Total:
          </span>
          <span style={{
            fontSize: 20, fontWeight: 700,
            color: TEXT_MAIN, fontFamily: "var(--font-primary)",
          }}>
            {formatPrice(total)}
          </span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isLoading || placing || (isLoggedIn && addresses.length === 0)}
          style={{
            width: "100%", padding: "16px",
            background: NAV_BG, color: WHITE,
            border: "none", borderRadius: 16,
            fontSize: 16, fontWeight: 700,
            fontFamily: "var(--font-primary)",
            cursor: placing || isLoading ? "not-allowed" : "pointer",
            opacity: (isLoading || (isLoggedIn && addresses.length === 0)) ? 0.5 : 1,
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
            letterSpacing: 0.3,
          }}
        >
          {placing ? (
            <>
              <IonSpinner name="crescent" style={{ width: 18, height: 18, color: WHITE }} />
              Placing…
            </>
          ) : "Place Order"}
        </button>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <IonContent
        scrollY
        style={{
          "--background":     NAV_BG,
          "--padding-top":    "0px",
          "--padding-bottom": "0px",
        } as React.CSSProperties}
      >
        <div style={{ height: HEADER_H }} />

        {/* White card body */}
        <div style={{
          background: "#f5f5f8",
          padding: "50px 29px 180px",
          minHeight: `calc(100vh - ${HEADER_H}px)`,
        }}>

          {/* Delivery address */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14,
          }}>
            <span style={{
              fontWeight: 700, fontSize: 16, color: TEXT_MAIN,
              fontFamily: "var(--font-primary)",
            }}>
              Delivery address
            </span>
            <span
              onClick={() => history.push(ROUTES.ADD_ADDRESS)}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                color: TEXT_SUB, fontSize: 13,
                fontFamily: "var(--font-primary)", cursor: "pointer",
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 14 }} />
              Add New
            </span>
          </div>

          {isLoading ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "24px 0", justifyContent: "center",
            }}>
              <IonSpinner name="crescent" style={{ color: NAV_BG, width: 22, height: 22 }} />
              <span style={{ fontSize: 13, color: TEXT_SUB, fontFamily: "var(--font-primary)" }}>
                Loading saved addresses…
              </span>
            </div>
          ) : addresses.length === 0 ? (
            <div style={{
              background: WHITE, borderRadius: 14,
              border: `1.5px dashed ${BORDER_CLR}`,
              padding: "28px 16px", textAlign: "center", marginBottom: 20,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 34 }}>📍</p>
              <p style={{
                margin: "0 0 4px", fontWeight: 600, fontSize: 14,
                color: TEXT_MAIN, fontFamily: "var(--font-primary)",
              }}>
                No addresses saved
              </p>
              <p style={{
                margin: "0 0 16px", fontSize: 12,
                color: TEXT_SUB, fontFamily: "var(--font-primary)",
              }}>
                Add a delivery address to continue
              </p>
              <button
                onClick={() => history.push(ROUTES.ADD_ADDRESS)}
                style={{
                  background: NAV_BG, color: WHITE, border: "none",
                  borderRadius: 30, padding: "10px 24px",
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-primary)", cursor: "pointer",
                }}
              >
                + Add Address
              </button>
            </div>
          ) : (
            addresses.map((a, i) => (
              <SelectableCard key={a.id} isSelected={selectedAddr === i} onClick={() => setSelectedAddr(i)}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: "0 0 4px", fontWeight: 700, fontSize: 14,
                    color: TEXT_MAIN, fontFamily: "var(--font-primary)",
                  }}>
                    {a.label}
                  </p>
                  <p style={{
                    margin: 0, fontSize: 12, color: TEXT_SUB,
                    fontFamily: "var(--font-primary)", lineHeight: 1.6,
                  }}>
                    {a.addr}
                  </p>
                </div>
              </SelectableCard>
            ))
          )}

          {/* Payment method */}
          <p style={{
            fontWeight: 700, fontSize: 16, color: TEXT_MAIN,
            fontFamily: "var(--font-primary)", margin: "20px 0 14px",
          }}>
            Payment Method
          </p>

          {PAYMENT_OPTIONS.map((p, i) => (
            <SelectableCard key={p.label} isSelected={selectedPayment === i} onClick={() => setSelectedPayment(i)}>
              {p.icon}
              <span style={{
                fontWeight: 600, fontSize: 14,
                color: TEXT_MAIN, fontFamily: "var(--font-primary)",
              }}>
                {p.label}
              </span>
            </SelectableCard>
          ))}

          {/* Order summary */}
          <div style={{
            background: WHITE, borderRadius: 14,
            padding: "16px", marginTop: 20,
            border: `1px solid ${BORDER_CLR}`,
          }}>
            <b style={{
              fontSize: 14, color: TEXT_MAIN,
              fontFamily: "var(--font-primary)",
              display: "block", marginBottom: 12,
            }}>
              Order Summary
            </b>
            {[
              ["Subtotal", formatPrice(subtotal)],
              ["Delivery", formatPrice(shipping)],
              ["Items",    String(items.reduce((a, i) => a + i.quantity, 0))],
            ].map(([l, v]) => (
              <div key={l} style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 8, fontSize: 13,
                color: TEXT_SUB, fontFamily: "var(--font-primary)",
              }}>
                <span>{l}</span>
                <span style={{ color: TEXT_MAIN, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{
              borderTop: `1px dashed ${BORDER_CLR}`,
              margin: "10px 0 0", paddingTop: 10,
              display: "flex", justifyContent: "space-between",
              fontWeight: 700, fontSize: 16,
              color: TEXT_MAIN, fontFamily: "var(--font-primary)",
            }}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

        </div>
      </IonContent>

    </IonPage>
  );
};

export default Checkout;