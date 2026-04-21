// ============================================================
// src/components/common/StarRating.tsx
// Renders a row of filled/empty star icons.
// Replaces the [1,2,3,4,5].map inline pattern in 2 pages.
// ============================================================

import React from "react";
import { IonIcon } from "@ionic/react";
import { star, starOutline } from "ionicons/icons";

interface StarRatingProps {
  value: number;       // 1–5 (fractional rounds down)
  size?: number;       // icon px size, default 13
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  size = 13,
}) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <IonIcon
        key={i}
        icon={i <= Math.floor(value) ? star : starOutline}
        style={{
          fontSize: size,
          color: i <= Math.floor(value) ? "#ffc107" : "#e0e0e0",
        }}
      />
    ))}
  </div>
);

export default StarRating;
