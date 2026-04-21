// ============================================================
// src/components/common/EmptyState.tsx
// Generic empty-state display used by Cart, Wishlist, etc.
// ============================================================

import React from "react";
import Button from "./Button";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
      textAlign: "center",
    }}
  >
    <span style={{ fontSize: 64 }}>{emoji}</span>
    <p
      style={{
        color: "var(--color-text)",
        fontWeight: 600,
        fontSize: 16,
        fontFamily: "var(--font-primary)",
        margin: 0,
      }}
    >
      {title}
    </p>
    {subtitle && (
      <p
        style={{
          color: "var(--color-text-sub)",
          fontSize: 13,
          fontFamily: "var(--font-primary)",
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    )}
    {actionLabel && onAction && (
      <Button
        variant="primary"
        size="md"
        onClick={onAction}
        style={{ marginTop: 8 }}
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
