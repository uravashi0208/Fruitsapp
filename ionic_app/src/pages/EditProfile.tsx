// ============================================================
// src/pages/EditProfile.tsx
// Opens when user taps the pencil (edit) icon on Profile page.
// Calls PATCH /api/auth/me to update name, phone, bio, city,
// country, postalCode. Updates Redux state on success.
// ============================================================

import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import {
  arrowBackOutline,
  checkmarkOutline,
  personOutline,
  callOutline,
  documentTextOutline,
  locationOutline,
  globeOutline,
  mailOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useAppState, useAppDispatch, showToast } from "../store";
import api from "../api/client";

// ── colour tokens (same as Profile.tsx) ──────────────────────
const NAV_BG    = "#1B2A4A";
const NAV_TEXT  = "#FFFFFF";
const PAGE_BG   = "#F5F6FA";
const CARD_BG   = "#FFFFFF";
const TEXT_MAIN = "#1B2A4A";
const TEXT_SUB  = "#9096A5";
const DIVIDER   = "#F0F1F5";
const ACCENT    = "#3B82F6";

// ── tiny helper ───────────────────────────────────────────────
interface FieldProps {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
}

const Field: React.FC<FieldProps> = ({
  icon, label, value, onChange, type = "text",
  placeholder, disabled, multiline,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: multiline ? "flex-start" : "center",
      gap: 12,
      padding: "14px 16px",
      borderBottom: `1px solid ${DIVIDER}`,
    }}
  >
    {/* Icon */}
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 11,
        background: "#EEF1F8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: multiline ? 2 : 0,
      }}
    >
      <IonIcon icon={icon} style={{ fontSize: 18, color: NAV_BG }} />
    </div>

    {/* Text column */}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: TEXT_SUB,
          marginBottom: 3,
          fontFamily: "var(--font-primary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 500,
            color: disabled ? TEXT_SUB : TEXT_MAIN,
            fontFamily: "var(--font-primary)",
            resize: "none",
            lineHeight: 1.5,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 500,
            color: disabled ? TEXT_SUB : TEXT_MAIN,
            fontFamily: "var(--font-primary)",
          }}
        />
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
const EditProfile: React.FC = () => {
  const history    = useHistory();
  const { state }  = useAppState();
  const dispatch   = useAppDispatch();
  const user       = state.auth.user;

  // ── form state (seed from Redux user) ────────────────────
  const nameParts  = (user?.name ?? "").split(" ");
  const [firstName,  setFirstName]  = useState(user?.firstName  ?? nameParts[0] ?? "");
  const [lastName,   setLastName]   = useState(user?.lastName   ?? nameParts.slice(1).join(" ") ?? "");
  const [phone,      setPhone]      = useState(user?.phone      ?? "");
  const [bio,        setBio]        = useState(user?.bio        ?? "");
  const [city,       setCity]       = useState(user?.city       ?? "");
  const [country,    setCountry]    = useState(user?.country    ?? "");
  const [postalCode, setPostalCode] = useState(user?.postalCode ?? "");

  const [saving, setSaving] = useState(false);

  // ── save handler ─────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (firstName.trim())  body.firstName  = firstName.trim();
      if (lastName.trim())   body.lastName   = lastName.trim();
      // also send combined name so backend keeps both in sync
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName)          body.name       = fullName;
      if (phone.trim())      body.phone      = phone.trim();
      if (bio.trim())        body.bio        = bio.trim();
      if (city.trim())       body.city       = city.trim();
      if (country.trim())    body.country    = country.trim();
      if (postalCode.trim()) body.postalCode = postalCode.trim();

      const res = await (api as any).patch("/api/auth/me", body);
      const updated = res?.data ?? res;

      // ── Update Redux store so Profile page reflects new values ──
      dispatch({
        type: "auth/updateUser",
        payload: {
          ...user,
          ...updated,
          name: updated.name ?? fullName,
        },
      });

      dispatch(showToast({ message: "Profile updated successfully", type: "success" }));
      history.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to update profile";
      dispatch(showToast({ message: msg, type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <IonPage>
      <IonContent
        style={{
          "--background": PAGE_BG,
          "--overflow": "visible",
          "--padding-top": "0px",
          "--padding-bottom": "0px",
          "--padding-start": "0px",
          "--padding-end": "0px",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            background: PAGE_BG,
            display: "flex",
            flexDirection: "column",
            paddingBottom: 40,
          }}
        >

          {/* ── Unified Navy Header ── */}
          <div style={{ background: NAV_BG }}>

            {/* Nav Bar */}
            <div
              style={{
                padding: "48px 20px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Back */}
              <button
                onClick={() => history.goBack()}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <IonIcon icon={arrowBackOutline} style={{ color: NAV_TEXT, fontSize: 18 }} />
              </button>

              <span
                style={{
                  color: NAV_TEXT,
                  fontWeight: 600,
                  fontSize: 17,
                  fontFamily: "var(--font-primary)",
                }}
              >
                Edit Profile
              </span>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.18)",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? (
                  <IonSpinner name="crescent" style={{ color: NAV_TEXT, width: 18, height: 18 }} />
                ) : (
                  <IonIcon icon={checkmarkOutline} style={{ color: NAV_TEXT, fontSize: 20 }} />
                )}
              </button>
            </div>

            {/* Avatar */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingBottom: 32,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,0.8)",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  fontWeight: 700,
                  color: NAV_TEXT,
                  fontFamily: "var(--font-primary)",
                }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitials(`${firstName} ${lastName}` || user?.name || "U")
                )}
              </div>
              <p
                style={{
                  margin: "10px 0 0",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontFamily: "var(--font-primary)",
                }}
              >
                {user?.email}
              </p>
            </div>
          </div>

          {/* ── Form Cards ── */}
          <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Personal Info */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: TEXT_SUB,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                  fontFamily: "var(--font-primary)",
                }}
              >
                Personal Information
              </p>
              <div
                style={{
                  background: CARD_BG,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(27,42,74,0.07)",
                }}
              >
                <Field
                  icon={personOutline}
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Enter first name"
                />
                <Field
                  icon={personOutline}
                  label="Last Name"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Enter last name"
                />
                <Field
                  icon={mailOutline}
                  label="Email"
                  value={user?.email ?? ""}
                  onChange={() => {}}
                  type="email"
                  disabled
                  placeholder="Email cannot be changed"
                />
                <Field
                  icon={callOutline}
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  type="tel"
                  placeholder="+1 234 567 8900"
                />
                <div style={{ borderBottom: "none" }}>
                  <Field
                    icon={documentTextOutline}
                    label="Bio"
                    value={bio}
                    onChange={setBio}
                    placeholder="Tell us about yourself…"
                    multiline
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: TEXT_SUB,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                  fontFamily: "var(--font-primary)",
                }}
              >
                Location
              </p>
              <div
                style={{
                  background: CARD_BG,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(27,42,74,0.07)",
                }}
              >
                <Field
                  icon={locationOutline}
                  label="City"
                  value={city}
                  onChange={setCity}
                  placeholder="Your city"
                />
                <Field
                  icon={globeOutline}
                  label="Country"
                  value={country}
                  onChange={setCountry}
                  placeholder="Your country"
                />
                <div style={{ borderBottom: "none" }}>
                  <Field
                    icon={locationOutline}
                    label="Postal Code"
                    value={postalCode}
                    onChange={setPostalCode}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%",
                padding: "16px 0",
                background: saving ? "#3a5080" : NAV_BG,
                border: "none",
                borderRadius: 14,
                color: NAV_TEXT,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "var(--font-primary)",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                letterSpacing: "0.01em",
                transition: "background 0.2s",
              }}
            >
              {saving ? (
                <>
                  <IonSpinner name="crescent" style={{ width: 18, height: 18, color: NAV_TEXT }} />
                  Saving…
                </>
              ) : (
                <>
                  <IonIcon icon={checkmarkOutline} style={{ fontSize: 18, color: NAV_TEXT }} />
                  Save Changes
                </>
              )}
            </button>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;