// ============================================================
// src/components/common/Button.tsx
// Reusable button with consistent style variants.
// Replaces all one-off inline <button> definitions across pages.
// ============================================================

import React from "react";

type Variant = "primary" | "ghost" | "icon" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: "8px 16px",  fontSize: 13, borderRadius: 10 },
  md: { padding: "12px 24px", fontSize: 14, borderRadius: 14 },
  lg: { padding: "16px 0",    fontSize: 15, borderRadius: 16 },
};

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--color-primary)",
    color: "#fff",
    border: "none",
  },
  ghost: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: 38,
    height: 38,
    padding: 0,
  },
  icon: {
    background: "var(--color-surface)",
    color: "var(--color-text)",
    border: "none",
    borderRadius: "50%",
    width: 38,
    height: 38,
    padding: 0,
    boxShadow: "var(--shadow-sm)",
  },
  danger: {
    background: "var(--color-accent-soft)",
    color: "var(--color-accent)",
    border: "none",
  },
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  style,
  ...rest
}) => (
  <button
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontFamily: "var(--font-primary)",
      fontWeight: 600,
      outline: "none",
      WebkitTapHighlightColor: "transparent",
      transition: "opacity 0.15s ease",
      width: fullWidth ? "100%" : undefined,
      ...VARIANT_STYLES[variant],
      ...(variant !== "ghost" && variant !== "icon" ? SIZE_STYLES[size] : {}),
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
