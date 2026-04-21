// ============================================================
// src/pages/Splash.tsx
// ============================================================

import React from "react";
import { IonPage, IonContent, IonButton, IonText } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { ROUTES } from "../utils/constants";

const Splash: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent>
        <div
          style={{
            minHeight: "100vh",
            background: "var(--color-primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 48,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Hero Illustration */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "55%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
            }}
            aria-hidden="true"
          >
            🛒🥦🍎🍓🥕
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "0 32px", zIndex: 2 }}>
            <IonText color="light">
              <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12, fontFamily: "var(--font-primary)" }}>
                Shop your daily grocery
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 36, fontFamily: "var(--font-primary)" }}>
                The easiest way to share your family's grocery shopping — Try it out.
              </p>
            </IonText>

            <IonButton
              expand="block"
              style={{
                "--background":     "#ffffff",
                "--color":          "var(--color-primary)",
                "--border-radius":  "12px",
                fontWeight: 600,
                fontSize: 16,
                height: 52,
              }}
              onClick={() => history.push(ROUTES.HOME)}
            >
              Get Started
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
