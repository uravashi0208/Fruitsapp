// ============================================================
// src/pages/Wishlist.tsx
// FIX: Fixed header (position fixed, zIndex 100)
// ============================================================

import React from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { heart, searchOutline, ellipsisVertical } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useWishlist } from "../hooks/useCart";
import { formatPrice } from "../utils/helpers";
import { ROUTES } from "../utils/constants";

import EmptyState from "../components/common/EmptyState";
import BottomNav  from "../components/layout/BottomNav";
import Button     from "../components/common/Button";

const HEADER_H = 104; // paddingTop(52) + icon row(36) + paddingBottom(16)

const Wishlist: React.FC = () => {
  const history           = useHistory();
  const { items, toggle } = useWishlist();

  return (
    <IonPage>

      {/* ── FIXED HEADER ── */}
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
          aria-label="Go Search"
          style={{ border: "1px solid #d7d6d67a", borderRadius: 20, height: 52, background: "rgb(255 255 255 / 0%)" }}
        >
          <IonIcon icon={searchOutline} style={{ fontSize: 20, color: "#32353b" }} />
        </Button>

        <span style={{
          color: "#32353b", fontWeight: 700, fontSize: 18,
          fontFamily: "var(--font-primary)", letterSpacing: 0.2,
        }}>
          Wishlist
        </span>

        <Button
          variant="ghost"
          aria-label="More options"
          style={{ border: "1px solid #d7d6d67a", borderRadius: 20, height: 52, background: "rgb(255 255 255 / 0%)" }}
        >
          <IonIcon icon={ellipsisVertical} style={{ fontSize: 20, color: "#32353b" }} />
        </Button>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <IonContent
        scrollY
        style={{
          "--background": "var(--color-bg)",
          "--padding-top": "0px",
          "--padding-bottom": "0px",
        } as React.CSSProperties}
      >
        {/* Spacer = fixed header height */}
        <div style={{ height: HEADER_H }} />

        <div style={{ padding: "16px 16px 30px" }}>
          {/* Empty state */}
          {items.length === 0 ? (
            <EmptyState
              emoji="♥"
              title="Your wishlist is empty"
              subtitle="Tap the heart on any product to save it here"
              actionLabel="Browse Products"
              onAction={() => history.push(ROUTES.HOME)}
            />
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2%" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => history.push(ROUTES.productDetail(item.id))}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                    width: "47%",
                    marginBottom: 12,
                    cursor: "pointer",
                    boxShadow: "var(--shadow-md)",
                    position: "relative",
                  }}
                >
                  {/* Product image */}
                  <div style={{
                    width: "100%", height: 100,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden", marginBottom: 8,
                    background: "var(--color-bg)",
                  }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                  </div>

                  {/* Wishlist remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(item); }}
                    aria-label="Remove from wishlist"
                    style={{
                      position: "absolute", bottom: 10, right: 10,
                      background: "var(--color-accent-soft)",
                      border: "none", borderRadius: "0px 0px 13px 0px",
                      width: 32, height: 32,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <IonIcon icon={heart} style={{ color: "var(--color-accent)", fontSize: 14 }} />
                  </button>

                  <b style={{ fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                    {item.name}
                  </b>
                  <p style={{ margin: "2px 0 4px", fontSize: 12, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
                    {item.category}
                  </p>
                  <b style={{ fontSize: 13, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                    {formatPrice(item.price)}
                    <span style={{ color: "var(--color-text-sub)", fontWeight: 400 }}>/kg</span>
                  </b>
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </IonContent>
    </IonPage>
  );
};

export default Wishlist;