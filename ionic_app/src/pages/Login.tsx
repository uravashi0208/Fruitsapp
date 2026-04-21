// ============================================================
// src/pages/Login.tsx  — real API auth
// ============================================================

import React, { useState } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useAppDispatch } from "../store";
import { login, showToast } from "../store";
import { ROUTES } from "../utils/constants";
import Button from "../components/common/Button";
import { API_BASE, setTokens } from "../api/client";

const Login: React.FC = () => {
  const history  = useHistory();
  const dispatch = useAppDispatch();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<{ email?: string; password?: string; api?: string }>({});

  const redirectTo = (history.location.state as any)?.redirectTo ?? ROUTES.PROFILE;

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())                    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Enter a valid email";
    if (!password)                         e.password = "Password is required";
    else if (password.length < 6)          e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrors({ api: json.message || json.error || "Login failed. Please try again." });
        return;
      }

      const { accessToken, refreshToken, user } = json.data;
      setTokens(accessToken, refreshToken);

      dispatch(
        login({
          id:     user._id ?? user.id ?? "user",
          name:   user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          email:  user.email,
          avatar: user.avatar,
        })
      );
      dispatch(showToast({ message: "Welcome back! 👋", type: "success" }));
      history.replace(redirectTo);
    } catch {
      setErrors({ api: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent style={{ "--background": "var(--color-bg)" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

          <div
            style={{
              background: "var(--color-primary)",
              padding: "52px 20px 40px",
              borderRadius: "0 0 28px 28px",
            }}
          >
            <button
              onClick={() => history.goBack()}
              aria-label="Go back"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "50%",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginBottom: 28,
              }}
            >
              <IonIcon icon={arrowBackOutline} style={{ color: "#fff", fontSize: 20 }} />
            </button>

            <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 700, fontFamily: "var(--font-primary)" }}>
              Welcome back 👋
            </h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "var(--font-primary)" }}>
              Sign in to your account
            </p>
          </div>

          <div style={{ flex: 1, padding: "32px 20px" }}>

            {errors.api && (
              <div
                style={{
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid var(--color-accent)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  marginBottom: 20,
                  fontSize: 13,
                  color: "var(--color-accent)",
                  fontFamily: "var(--font-primary)",
                }}
              >
                {errors.api}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={email}
                placeholder="john@example.com"
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, api: undefined })); }}
                style={{ ...inputStyle, borderColor: errors.email ? "var(--color-accent)" : "var(--color-border)" }}
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, api: undefined })); }}
                  style={{
                    ...inputStyle,
                    paddingRight: 48,
                    borderColor: errors.password ? "var(--color-accent)" : "var(--color-border)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IonIcon
                    icon={showPass ? eyeOffOutline : eyeOutline}
                    style={{ fontSize: 20, color: "var(--color-text-sub)" }}
                  />
                </button>
              </div>
              {errors.password && <p style={errorStyle}>{errors.password}</p>}
            </div>

            <p
              style={{
                textAlign: "right",
                margin: "0 0 32px",
                fontSize: 13,
                color: "var(--color-primary)",
                fontFamily: "var(--font-primary)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Forgot password?
            </p>

            <Button variant="primary" size="lg" fullWidth onClick={handleLogin}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
              <span style={{ fontSize: 13, color: "var(--color-text-sub)", fontFamily: "var(--font-primary)" }}>
                Don't have an account?
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            </div>

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => history.push(ROUTES.REGISTER, { redirectTo })}
            >
              Create Account
            </Button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text)",
  fontFamily: "var(--font-primary)",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 50,
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--color-border)",
  background: "var(--color-surface)",
  padding: "0 16px",
  fontSize: 14,
  color: "var(--color-text)",
  fontFamily: "var(--font-primary)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const errorStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 12,
  color: "var(--color-accent)",
  fontFamily: "var(--font-primary)",
};

export default Login;