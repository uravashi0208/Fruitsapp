// ============================================================
// src/pages/Cart.tsx
// ============================================================

import React, { useRef, useState } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, trashOutline, cartOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useCart } from "../hooks/useCart";
import { formatPrice, } from "../utils/helpers";
import { ROUTES } from "../utils/constants";
import { CartItem } from "../types";
import { useAppState } from "../store";

import QuantityControl from "../components/common/QuantityControl";
import EmptyState      from "../components/common/EmptyState";
import Button          from "../components/common/Button";
import BottomNav       from "../components/layout/BottomNav";

// ── Swipeable Cart Item ───────────────────────────────────────

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
  onChangeQty: (qty: number) => void;
}

const DELETE_THRESHOLD = 52;

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onRemove, onChangeQty }) => {
  const [swipeX, setSwipeX] = useState(0);
  const startX              = useRef(0);
  const isDragging          = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current    = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    setSwipeX(diff < 0 ? Math.max(diff, -DELETE_THRESHOLD) : 0);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    setSwipeX(swipeX < -DELETE_THRESHOLD / 2 ? -DELETE_THRESHOLD : 0);
  };

  return (
    <div style={{ position: "relative", marginBottom: 12, overflow: "hidden" }}>
      {/* Delete reveal */}
      <div
        onClick={onRemove}
        aria-label="Delete item"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: DELETE_THRESHOLD,
          background: "var(--color-accent-soft)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <IonIcon icon={trashOutline} style={{ color: "var(--color-accent)", fontSize: 22 }} />
      </div>

      {/* Swipeable card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "var(--color-surface)",
          borderRadius: 6,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "var(--shadow-sm)",
          transform: `translateX(${swipeX}px)`,
          transition: isDragging.current ? "none" : "transform 0.3s ease",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Image */}
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--color-bg)",
            flexShrink: 0,
          }}
        >
          <img
            src={item.image}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 15,
              color: "var(--color-text)",
              fontFamily: "var(--font-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </p>
          <p style={{ margin: "2px 0 6px", fontSize: 12, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
            {item.category}
          </p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
            {formatPrice(item.price)}
            <span style={{ fontWeight: 400, fontSize: 11, color: "var(--color-text-sub)" }}>/kg</span>
          </p>
        </div>

        {/* Qty control */}
        <QuantityControl
          value={item.quantity}
          min={1}
          max={item.stock}
          direction="vertical"
          onIncrement={() => onChangeQty(item.quantity + 1)}
          onDecrement={() => onChangeQty(item.quantity - 1)}
        />
      </div>
    </div>
  );
};

// ── Order Summary Row ─────────────────────────────────────────

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 10,
      fontSize: 14,
      color: "var(--color-text-sub)",
      fontFamily: "var(--font-primary)",
    }}
  >
    <span>{label}:</span>
    <span style={{ color: "var(--color-text)", fontWeight: 500 }}>{value}</span>
  </div>
);

// ── Page ──────────────────────────────────────────────────────

const Cart: React.FC = () => {
  const history = useHistory();
  const { items, totalItems, subtotal, shipping, removeItem, changeQty } = useCart();
  const { state } = useAppState();
  const isLoggedIn = !!state.auth.user;

  const handleCheckout = () => {
    if (!isLoggedIn) {
      history.push(ROUTES.LOGIN, { redirectTo: ROUTES.CHECKOUT });
      return;
    }
    history.push(ROUTES.CHECKOUT);
  };

  const discount   = subtotal * 0.05;
  const finalTotal = subtotal + shipping - discount;

  return (
    <IonPage>
      {/* Fixed Header */}

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "var(--color-bg)",
        paddingTop: 31,
        paddingBottom: 24,
        paddingLeft: 29,
        paddingRight: 29,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #d7d6d620",
      }}>
        <Button
          variant="ghost"
          aria-label="Go back"
          onClick={() => history.goBack()}
          style={{ border: "1px solid #d7d6d67a", borderRadius: 20, height: 52, background: "rgb(255 255 255 / 0%)" }}
        >
          <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#32353b" }} />
        </Button>

        <span style={{
          color: "#32353b", fontWeight: 700, fontSize: 18,
          fontFamily: "var(--font-primary)", letterSpacing: 0.2,
        }}>
          Cart
        </span>

        <div style={{ position: "relative" }}>
        <Button
          variant="ghost"
          aria-label="More options"
          style={{ border: "1px solid #d7d6d67a", borderRadius: 20, height: 52, background: "rgb(255 255 255 / 0%)" }}
        >
          <IonIcon icon={cartOutline} style={{ fontSize: 20, color: "#32353b" }} />
        </Button>
        {totalItems > 0 && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 1,
                background: "var(--color-primary)",
                color: "#fff",
                borderRadius: "50%",
                width: 15,
                height: 15,
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-primary)",
              }}
            >
              {totalItems}
            </div>
          )}
          </div>
      </div>

      {/* Scrollable Content */}
      <IonContent
        scrollY
        style={{ "--background": "#fdfdfd", "--padding-top": "110px", "--padding-bottom": "160px" } as any}
      >
        <div style={{ padding: "0 16px" }}>
          {items.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Your cart is empty"
              subtitle="Add some products to get started"
              actionLabel="Shop Now"
              onAction={() => history.push(ROUTES.HOME)}
            />
          ) : (
            <>
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onChangeQty={(qty) => changeQty(item.id, qty)}
                />
              ))}

              {/* Order Summary */}
              <div
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 16px",
                  marginTop: 4,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--color-text)", margin: "0 0 16px", fontFamily: "var(--font-primary)", textAlign: "center" }}>
                  Order Info
                </p>

                <SummaryRow label="Subtotal"     value={formatPrice(subtotal)} />
                <SummaryRow label="Delivery fee" value={formatPrice(shipping)} />
                <SummaryRow
                  label="Discount"
                  value={subtotal > 0 ? `${((discount / subtotal) * 100).toFixed(0)}%` : "0%"}
                />

                <div style={{ borderTop: "1.5px dashed var(--color-border)", margin: "14px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>

      {/* Checkout CTA */}
      {items.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 70,
            left: 0,
            right: 0,
            padding: "0 16px 12px",
            zIndex: 99,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </div>
      )}

      <BottomNav />
    </IonPage>
  );
};

export default Cart;
