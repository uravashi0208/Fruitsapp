// ============================================================
// src/pages/ProductDetail.tsx
// ============================================================

import React, { useState } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  arrowBackOutline,
  heartOutline,
  heart,
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";

import { useCart, useWishlist } from "../hooks/useCart";
import { useProduct, useProducts } from "../hooks/useApi";
import { formatPrice, truncate, isProductInStock } from "../utils/helpers";
import { ROUTES } from "../utils/constants";

import PageLoader      from "../components/common/PageLoader";
import StarRating      from "../components/common/StarRating";
import QuantityControl from "../components/common/QuantityControl";
import Button          from "../components/common/Button";

const DESC_LIMIT = 150;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, loading, error } = useProduct(id ?? null);

  const [qty, setQty]           = useState(1);
  const [expanded, setExpanded] = useState(false);

  const history                  = useHistory();
  const { addItem }              = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted               = isWishlisted(id ?? "");

  const { data: relatedProducts } = useProducts(
    { category: product?.category?.toLowerCase(), limit: 10 },
  );

  if (loading) {
    return (
      <IonPage>
        <IonContent style={{ "--background": "var(--color-bg)" } as any}>
          <PageLoader />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !product) {
    return (
      <IonPage>
        <IonContent style={{ "--background": "var(--color-bg)" } as any}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>😕</span>
            <p style={{ color: "var(--color-text)", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-primary)" }}>
              Product not found
            </p>
            <Button variant="primary" size="md" onClick={() => history.goBack()}>
              Go Back
            </Button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const inStock    = isProductInStock(product.status, product.stock);
  const maxQty     = (product.stock ?? 0) > 0 ? product.stock! : 99;
  const shortDesc  = truncate(product.description, DESC_LIMIT);
  const isLong     = product.description.length > DESC_LIMIT;

  return (
    <IonPage>
      {/* ── Fixed Header + Hero Image ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "var(--color-primary)",
        }}
      >
        {/* Nav Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "25px 16px 20px",
          }}
        >
          <Button
            variant="ghost"
            onClick={() => history.goBack()}
            aria-label="Go back"
            style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, height: 52, background:"rgb(255 255 255 / 0%)" }}
          >
            <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "#fff" }} />
          </Button>

          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17, fontFamily: "var(--font-primary)" }}>
            Details
          </span>

          <Button
            variant="ghost"
            onClick={() => toggle(product)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, height: 52, background:"rgb(255 255 255 / 0%)" }}
          >
            <IonIcon
              icon={wishlisted ? heart : heartOutline}
              style={{ fontSize: 18, color: wishlisted ? "var(--color-accent)" : "#fff" }}
            />
          </Button>
        </div>

        {/* Hero Image */}
        <div style={{ width: "100%", height: 270, overflow: "hidden", borderRadius: "40px 40px 0 0" }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <IonContent
        scrollY
        style={{
          "--background": "#fff",
          "--padding-top": "362px",
          "--padding-bottom": "90px",
        } as any}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "24px 24px 0 0",
            padding: "35px 20px 0",
          }}
        >
          {/* Name + Qty Row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ flex: 1, paddingRight: 12 }}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: 22, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                {product.name}
              </h2>
              <p style={{ margin: "5px 0 0", fontSize: 12, color: inStock ? "var(--color-text-sub)" : "var(--color-accent)", fontFamily: "var(--font-primary)" }}>
                {inStock ? "Available in stock" : "Out of stock"}
              </p>
            </div>

            <QuantityControl
              value={qty}
              min={1}
              max={maxQty}
              direction="horizontal"
              onIncrement={() => setQty((q) => Math.min(maxQty, q + 1))}
              onDecrement={() => setQty((q) => Math.max(1, q - 1))}
            />
          </div>

          {/* Stars */}
          <div style={{ marginBottom: 20 }}>
            <StarRating value={product.rating} size={14} />
          </div>

          <div style={{ height: 1, background: "var(--color-divider)", marginBottom: 20 }} />

          {/* Description */}
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)", margin: "0 0 8px", fontFamily: "var(--font-primary)" }}>
            Description
          </h3>
          <p style={{ fontSize: 13, color: "var(--color-text-sub)", lineHeight: 1.75, margin: "0 0 4px", fontFamily: "var(--font-primary)" }}>
            {expanded ? product.description : shortDesc}
            {isLong && (
              <span
                onClick={() => setExpanded(!expanded)}
                style={{ color: "var(--color-text)", fontWeight: 600, cursor: "pointer", marginLeft: 4 }}
              >
                {expanded ? " See less" : " See more"}
              </span>
            )}
          </p>

          <div style={{ height: 1, background: "var(--color-divider)", margin: "20px 0" }} />

          {/* Related Items */}
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)", margin: "0 0 12px", fontFamily: "var(--font-primary)" }}>
            Related Items
          </h3>
          <div
            style={{
              display: "flex",
              gap: 9,
              overflowX: "auto",
              marginBottom: 32,
              paddingBottom: 4,
              scrollbarWidth: "none",
            }}
          >
            {relatedProducts?.filter((p) => p.id !== product.id).map((p) => (
              <div key={p.id} style={{ flexShrink: 0, width: 84 }}>
                <div
                  style={{
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    height: 76,
                  }}
                >
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <p style={{ fontSize: 11, color: "var(--color-text-sub)", margin: "4px 2px 0", fontFamily: "var(--font-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </IonContent>

      {/* ── Fixed Footer ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "14px 20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          zIndex: 100,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
            Price
          </p>
          <b style={{ fontSize: 20, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
            {formatPrice(product.price * qty)}
          </b>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={!inStock}
          onClick={() => addItem({ ...product, id: id ?? product.id }, qty)}
          style={{
            background: inStock ? "var(--color-primary)" : "var(--color-border)",
            cursor: inStock ? "pointer" : "not-allowed",
            gap: 8,
          }}
        >
          Add to cart <span style={{ fontSize: 16 }}>›</span>
        </Button>
      </div>
    </IonPage>
  );
};

export default ProductDetail;