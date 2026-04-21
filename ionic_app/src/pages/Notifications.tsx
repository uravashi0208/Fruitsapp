// ============================================================
// src/pages/Notifications.tsx
// ============================================================

import React from "react";
import { IonPage, IonContent, IonIcon, IonText } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { NotificationItem } from "../types";
import Button from "../components/common/Button";

const NOTIFICATIONS: NotificationItem[] = [
  { emoji: "🎉", title: "Order Confirmed!",  sub: "Your order #1042 has been confirmed.", time: "2 min ago"  },
  { emoji: "🚴", title: "Out for Delivery",  sub: "John is heading to your location.",    time: "10 min ago" },
  { emoji: "✅", title: "Order Delivered",   sub: "Your order #1038 was delivered.",      time: "2 hrs ago"  },
  { emoji: "🏷️", title: "5% Off Coupon",    sub: "Use FRESH5 for 5% off today!",         time: "Yesterday"  },
];

const Notifications: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent style={{ "--background": "var(--color-primary)" }}>
        <div style={{ padding: "52px 0 40px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 16px",
              marginBottom: 24,
            }}
          >
            <Button variant="ghost" onClick={() => history.goBack()} aria-label="Go back">
              <IonIcon icon={arrowBackOutline} style={{ color: "#fff", fontSize: 20 }} />
            </Button>
            <IonText color="light">
              <h2 style={{ margin: 0, fontWeight: 700, fontFamily: "var(--font-primary)" }}>
                Notifications
              </h2>
            </IonText>
          </div>

          {/* Card list */}
          <div
            style={{
              background: "var(--color-bg)",
              borderRadius: "var(--radius-xl)",
              minHeight: "calc(100vh - 100px)",
              padding: "24px 16px",
            }}
          >
            {NOTIFICATIONS.map((n, i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                  marginBottom: 12,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--color-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {n.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-primary)" }}>
                    {n.title}
                  </b>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
                    {n.sub}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: "var(--color-text-sub)", whiteSpace: "nowrap", fontFamily: "var(--font-primary)" }}>
                  {n.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
