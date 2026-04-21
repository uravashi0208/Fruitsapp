// ============================================================
// src/components/common/CategoryChip.tsx
// Pill chip for category filters.  Supports an optional image
// thumbnail (populated from the DB category data in Home).
// ============================================================

import React from "react";

interface CategoryChipProps {
  /** Display label */
  label: string;
  /** Whether this chip is the currently selected category */
  isActive: boolean;
  /** Optional thumbnail URL from DB category */
  imageUrl?: string;
  /** Click handler */
  onClick: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  isActive,
  imageUrl,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-pressed={isActive}
    style={{
      background: isActive ? "var(--color-primary)" : "var(--color-surface)",
      color: isActive ? "#fff" : "var(--color-text)",
      border: "none",
      borderRadius: "var(--radius-full)",
      padding: imageUrl ? "6px 16px 6px 6px" : "9px 20px",
      fontWeight: 600,
      fontSize: 13,
      fontFamily: "var(--font-primary)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 8,
      boxShadow: isActive
        ? "0 4px 12px rgba(26,35,64,0.25)"
        : "var(--shadow-sm)",
      transition: "all 0.2s ease",
      WebkitTapHighlightColor: "transparent",
    }}
  >
    {imageUrl && (
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          overflow: "hidden",
          background: isActive ? "rgba(255,255,255,0.2)" : "var(--color-bg)",
          flexShrink: 0,
        }}
      >
        <img
          src={imageUrl}
          alt={label}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    )}
    {label}
  </button>
);

export default CategoryChip;
