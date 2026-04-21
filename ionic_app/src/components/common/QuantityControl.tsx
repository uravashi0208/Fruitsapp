// ============================================================
// src/components/common/QuantityControl.tsx
// Vertical or horizontal quantity stepper.
// Replaces the duplicated inline stepper in Cart + ProductDetail.
// ============================================================

import React from "react";
import { IonIcon } from "@ionic/react";
import { addOutline, removeOutline } from "ionicons/icons";

interface QuantityControlProps {
  value: number;
  min?: number;
  max?: number;
  direction?: "vertical" | "horizontal";
  onIncrement: () => void;
  onDecrement: () => void;
}

const QuantityControl: React.FC<QuantityControlProps> = ({
  value,
  min = 1,
  max = Infinity,
  direction = "vertical",
  onIncrement,
  onDecrement,
}) => {
  const isRow = direction === "horizontal";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isRow ? "row" : "column",
        alignItems: "center",
        borderRadius: 3,
        padding: isRow ? "6px 10px" : "8px 5px",
        gap: 0,
        flexShrink: 0,
        background: "var(--color-primary)",
      }}
    >
      
      <button
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        style={{
          background: "#1a234000",
          border: "none",
          outline: "none",
          cursor: value <= min ? "not-allowed" : "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          opacity: value <= min ? 0.4 : 1,
          borderRadius:"7px"
        }}
      >
        <IonIcon icon={removeOutline} style={{ fontSize: 22, color: "#fff" }} />
      </button>
        <span
          style={{
            fontWeight: 500,
            fontSize: 15,
            color: "#fff",
            fontFamily: "var(--font-primary)",
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {value}
        </span>

        <button
        onClick={onIncrement}
        disabled={value >= max}
        aria-label="Increase quantity"
        style={{
          background: "#1a234000",
          border: "none",
          outline: "none",
          cursor: value >= max ? "not-allowed" : "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          opacity: value >= max ? 0.4 : 1,
          borderRadius:"7px"
        }}
      >
        <IonIcon icon={addOutline} style={{ fontSize: 22, color: "#fff" }} />
      </button>
    </div>
  );
};

export default QuantityControl;
