// ============================================================
// src/pages/Register.tsx  — real API auth
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

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  api?: string;
}

const Register: React.FC = () => {
  const history  = useHistory();
  const dispatch = useAppDispatch();

  const [form,     setForm]     = useState<FormState>({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<FormErrors>({});

  const redirectTo = (history.location.state as any)?.redirectTo ?? ROUTES.PROFILE;

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined, api: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())                     e.name            = "Full name is required";
    if (!form.email.trim())                    e.email           = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email           = "Enter a valid email";
    if (!form.password)                        e.password        = "Password is required";
    else if (form.password.length < 6)         e.password        = "Minimum 6 characters";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim(),
          password: form.password,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrors({ api: json.message || json.error || "Registration failed. Please try again." });
        return;
      }

      const { accessToken, refreshToken, user } = json.data;
      setTokens(accessToken, refreshToken);

      dispatch(
        login({
          id:     user._id ?? user.id ?? "user",
          name:   user.name ?? form.name.trim(),
          email:  user.email,
          avatar: user.avatar,
        })
      );
      dispatch(showToast({ message: "Account created! Welcome 🎉", type: "success" }));
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
              Create account ✨
            </h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "var(--font-primary)" }}>
              Sign up to get started
            </p>
          </div>

          <div style={{ flex: 1, padding: "32px 20px 40px" }}>

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

            <Field label="Full name" error={errors.name}>
              <input
                type="text"
                placeholder="John Carry Morlay"
                value={form.name}
                onChange={set("name")}
                style={{ ...inputStyle, borderColor: errors.name ? "var(--color-accent)" : "var(--color-border)" }}
              />
            </Field>

            <Field label="Email address" error={errors.email}>
              <input
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={set("email")}
                style={{ ...inputStyle, borderColor: errors.email ? "var(--color-accent)" : "var(--color-border)" }}
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  style={{
                    ...inputStyle,
                    paddingRight: 48,
                    borderColor: errors.password ? "var(--color-accent)" : "var(--color-border)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={eyeButtonStyle}
                >
                  <IonIcon
                    icon={showPass ? eyeOffOutline : eyeOutline}
                    style={{ fontSize: 20, color: "var(--color-text-sub)" }}
                  />
                </button>
              </div>
            </Field>

            <Field label="Confirm password" error={errors.confirmPassword}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                style={{
                  ...inputStyle,
                  borderColor: errors.confirmPassword ? "var(--color-accent)" : "var(--color-border)",
                }}
              />
            </Field>

            <div style={{ marginTop: 8 }}>
              <Button variant="primary" size="lg" fullWidth onClick={handleRegister}>
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: 24,
                fontSize: 13,
                color: "var(--color-text-sub)",
                fontFamily: "var(--font-primary)",
              }}
            >
              Already have an account?{" "}
              <span
                onClick={() => history.replace(ROUTES.LOGIN, { redirectTo })}
                style={{ color: "var(--color-primary)", fontWeight: 600, cursor: "pointer" }}
              >
                Sign In
              </span>
            </p>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

// ── Field wrapper ─────────────────────────────────────────────

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({
  label,
  error,
  children,
}) => (
  <div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && <p style={errorStyle}>{error}</p>}
  </div>
);

// ── Shared styles ─────────────────────────────────────────────

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

const eyeButtonStyle: React.CSSProperties = {
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
};

export default Register;