// ============================================================
// src/components/common/PageLoader.tsx
// Full-screen loading spinner used by ProductDetail and others.
// ============================================================

import React from "react";

const PageLoader: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      flexDirection: "column",
      gap: 12,
      background: "var(--color-bg)",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: "3px solid var(--color-border)",
        borderTop: "3px solid var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <p
      style={{
        color: "var(--color-text-sub)",
        fontSize: 13,
        fontFamily: "var(--font-primary)",
        margin: 0,
      }}
    >
      Loading…
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default PageLoader;
