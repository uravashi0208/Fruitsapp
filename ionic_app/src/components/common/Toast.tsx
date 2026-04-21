// ============================================================
// src/components/common/Toast.tsx
// Global notification toast — driven by the app store.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store";
import { TOAST_COLORS } from "../../utils/constants";

const VISIBLE_MS   = 2500;
const FADE_OUT_MS  = 300;

const Toast: React.FC = () => {
  const toast    = useAppSelector((s) => s.ui.toast);
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const fadeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), FADE_OUT_MS);
    }, VISIBLE_MS);
    return () => clearTimeout(fadeTimer);
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 90,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-16px"})`,
        opacity: visible ? 1 : 0,
        transition: `all ${FADE_OUT_MS}ms ease`,
        zIndex: 9999,
        background: "var(--color-primary)",
        color: "#fff",
        borderRadius: "var(--radius-md)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "var(--shadow-lg)",
        minWidth: 220,
        maxWidth: "85vw",
        fontFamily: "var(--font-primary)",
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: TOAST_COLORS[toast.type] ?? TOAST_COLORS.success,
          flexShrink: 0,
        }}
      />
      {toast.message}
    </div>
  );
};

export default Toast;
