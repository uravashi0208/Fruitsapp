// ============================================================
// src/pages/TrackOrder.tsx
// ============================================================

import React from "react";
import { IonPage, IonContent, IonButton, IonIcon, IonText } from "@ionic/react";
import {
  arrowBackOutline,
  ellipsisVertical,
  callOutline,
  locationOutline,
  storefrontOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import Button from "../components/common/Button";

// ── Local types ───────────────────────────────────────────────

interface RouteStep {
  icon: string;
  title: string;
  sub: string;
}

const ROUTE_STEPS: RouteStep[] = [
  {
    icon:  storefrontOutline,
    title: "Best grocery shop",
    sub:   "Store Location  |  12:00 PM",
  },
  {
    icon:  locationOutline,
    title: "71, South central road, Canada.",
    sub:   "Delivery Location  |  12:20 PM",
  },
];

// ── Page ──────────────────────────────────────────────────────

const TrackOrder: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent style={{ "--background": "var(--color-bg)" }}>
        <div style={{ padding: "52px 16px 40px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Button variant="icon" onClick={() => history.goBack()} aria-label="Go back">
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 20, color: "var(--color-text)" }} />
            </Button>

            <IonText>
              <h2 style={{ margin: 0, fontWeight: 700, fontFamily: "var(--font-primary)", color: "var(--color-text)" }}>
                Track Order
              </h2>
            </IonText>

            <Button variant="icon" aria-label="More options">
              <IonIcon icon={ellipsisVertical} style={{ fontSize: 20, color: "var(--color-text)" }} />
            </Button>
          </div>

          {/* Map Placeholder */}
          <div
            style={{
              background: "#e8f0fe",
              borderRadius: "var(--radius-lg)",
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              fontSize: 48,
              position: "relative",
              overflow: "hidden",
            }}
          >
            🗺️
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                background: "var(--color-surface)",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "var(--shadow-md)",
              }}
            >
              🛵
            </div>
          </div>

          {/* Delivery Person */}
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              👨
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 15, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                John Carry Morlay
              </b>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
                Delivery Boy
              </p>
            </div>
            <button
              aria-label="Call delivery person"
              style={{
                background: "var(--color-primary)",
                border: "none",
                borderRadius: "50%",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <IonIcon icon={callOutline} style={{ color: "#fff", fontSize: 18 }} />
            </button>
          </div>

          {/* Route Steps */}
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              marginBottom: 20,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {ROUTE_STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: i < ROUTE_STEPS.length - 1 ? 16 : 0,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IonIcon icon={step.icon} style={{ color: "#fff", fontSize: 16 }} />
                </div>
                <div>
                  <b style={{ fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                    {step.title}
                  </b>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
                    {step.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <IonButton
            expand="block"
            style={{
              "--background": "var(--color-primary)",
              "--border-radius": "14px",
              height: 52,
            }}
          >
            Order Received
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TrackOrder;
