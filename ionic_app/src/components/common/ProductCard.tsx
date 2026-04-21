// ============================================================
// src/components/common/ProductCard.tsx
// Product grid card.
// Fix: removed local Product interface re-declaration (was diverging
//      from src/types).  Now imports the canonical type.
// ============================================================

import React from "react";
import { IonIcon } from "@ionic/react";
import { heart } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { Product } from "../../types";
import { useWishlist } from "../../hooks/useCart";
import { formatPrice } from "../../utils/helpers";
import { ROUTES } from "../../utils/constants";
import StarRating from "./StarRating";

interface ProductCardProps {
  product: Product;
}

/** Maps badge name → background / text colour pair */
const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  NEW:   { bg: "var(--badge-new-bg)",   color: "var(--badge-new-text)"   },
  FRESH: { bg: "var(--badge-fresh-bg)", color: "var(--badge-fresh-text)" },
  SALE:  { bg: "var(--badge-sale-bg)",  color: "var(--badge-sale-text)"  },
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const history                 = useHistory();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted              = isWishlisted(product.id);

  const badge      = product.badge?.toUpperCase();
  const badgeStyle = badge ? (BADGE_STYLES[badge] ?? BADGE_STYLES.SALE) : null;

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card navigation
    toggle(product);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => history.push(ROUTES.productDetail(product.id))}
      onKeyDown={(e) => e.key === "Enter" && history.push(ROUTES.productDetail(product.id))}
      style={{
        background: "var(--color-background)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "var(--shadow-md)",
        position: "relative",
      }}
    >
      {/* Product Image */}
      <div
        style={{
          width: "100%",
          height: 130,
          overflow: "hidden",
          background: "var(--color-bg)",
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
      </div>

      {/* Badge */}
      {badgeStyle && (
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 20,
            fontFamily: "var(--font-primary)",
            background: badgeStyle.bg,
            color: badgeStyle.color,
          }}
        >
          {badge}
        </span>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          background: "var(--color-accent-soft)",
          border: "none",
          borderRadius: "0px 0px 13px 0px",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <IonIcon
          icon={heart}
          style={{
            color: wishlisted ? "var(--color-accent)" : "#fff",
            fontSize: 15,
          }}
        />
      </button>

      {/* Info Panel */}
      <div style={{ padding: "14px 12px 15px" }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: "var(--color-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 5,
            fontFamily: "var(--font-primary)",
          }}
        >
          {product.name}
        </div>

        <div style={{ marginBottom: 6 }}>
          <StarRating value={product.rating} size={12} />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <b style={{ fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
            {formatPrice(product.price)}
          </b>
          {product.originalPrice && (
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                textDecoration: "line-through",
                fontFamily: "var(--font-primary)",
              }}
            >
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
