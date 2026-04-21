// ============================================================
// src/pages/AddAddress.tsx
// Fixed header + scrollable content
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, locateOutline, checkmarkCircleOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { useAppDispatch, addAddress, showToast } from "../store";
import { ROUTES } from "../utils/constants";
import Button from "../components/common/Button";
import { addressApi } from "../api/storefront";

declare const L: any;

interface GeoResult {
  lat: number; lon: number; display_name: string;
  address?: {
    road?: string; suburb?: string; city?: string; town?: string;
    village?: string; state?: string; country?: string;
    postcode?: string; house_number?: string;
  };
}
interface FormState { label: string; addr: string; city: string; postalCode: string; country: string; }

const LABEL_PRESETS = ["Home", "Office", "Other"];

const ensureLeaflet = (): Promise<void> =>
  new Promise((resolve) => {
    if ((window as any)._leafletReady) { resolve(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => { (window as any)._leafletReady = true; resolve(); };
    document.head.appendChild(script);
  });

const nominatimFetch = async (url: string): Promise<any> => {
  try {
    const r = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (r.ok) return r.json();
  } catch { /* fallthrough */ }
  try {
    const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    if (r.ok) return r.json();
  } catch { return null; }
  return null;
};

const reverseGeocode = (lat: number, lon: number) =>
  nominatimFetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);

const forwardGeocode = async (query: string): Promise<GeoResult | null> => {
  const results = await nominatimFetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`
  );
  return Array.isArray(results) ? results[0] ?? null : null;
};

const buildForm = (geo: GeoResult): Partial<FormState> => {
  const a = geo.address ?? {};
  const street   = [a.house_number, a.road].filter(Boolean).join(" ");
  const locality = a.suburb ?? a.village ?? "";
  return {
    addr:       [street, locality].filter(Boolean).join(", ") || geo.display_name.split(",").slice(0, 3).join(","),
    city:       a.city ?? a.town ?? a.village ?? "",
    postalCode: a.postcode ?? "",
    country:    a.country ?? "",
  };
};

const PIN_HTML = `
  <div style="position:relative;width:40px;height:52px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35))">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="40" height="52">
      <path d="M20 2C11.163 2 4 9.163 4 18c0 12 16 32 16 32s16-20 16-32C36 9.163 28.837 2 20 2z"
        fill="#e53935" stroke="#fff" stroke-width="2"/>
      <circle cx="20" cy="18" r="7" fill="#fff" opacity="0.95"/>
      <circle cx="20" cy="18" r="3.5" fill="#e53935"/>
    </svg>
  </div>`;

// ── Component ──────────────────────────────────────────────────
const AddAddress: React.FC = () => {
  const history  = useHistory();
  const dispatch = useAppDispatch();

  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const timerRef  = useRef<any>(null);

  const [coords,    setCoords]    = useState<{ lat: number; lon: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [form, setForm] = useState<FormState>({ label: "", addr: "", city: "", postalCode: "", country: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    let alive = true;
    ensureLeaflet().then(() => {
      if (!alive || !mapRef.current || mapInst.current) return;
      const map = L.map(mapRef.current, { zoomControl: false }).setView([20, 78], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInst.current = map;

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        pinMap(lat, lng);
        setGeocoding(true);
        const geo = await reverseGeocode(lat, lng);
        setGeocoding(false);
        if (geo) { setForm((p) => ({ ...p, ...buildForm(geo) })); setErrors({}); }
      });
    });
    return () => { alive = false; };
  }, []);

  const pinMap = (lat: number, lon: number, zoom = 14) => {
    const map = mapInst.current; if (!map) return;
    if (markerRef.current) markerRef.current.remove();
    const icon = L.divIcon({ className: "", html: PIN_HTML, iconSize: [40, 52], iconAnchor: [20, 52] });
    markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
    map.flyTo([lat, lon], Math.max(map.getZoom(), zoom), { animate: true, duration: 1 });
    setCoords({ lat, lon });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords: c }) => {
      pinMap(c.latitude, c.longitude, 16);
      setGeocoding(true);
      const geo = await reverseGeocode(c.latitude, c.longitude);
      setGeocoding(false);
      if (geo) { setForm((p) => ({ ...p, ...buildForm(geo) })); setErrors({}); }
    });
  };

  const geocodeAndPin = async (query: string) => {
    setGeocoding(true);
    const geo = await forwardGeocode(query);
    setGeocoding(false);
    if (!geo) return;
    const lat = parseFloat(String(geo.lat));
    const lon = parseFloat(String(geo.lon));
    pinMap(lat, lon, 13);
    setForm((p) => ({ ...p, ...buildForm(geo) }));
    setErrors({});
  };

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 3) return;
    timerRef.current = setTimeout(() => geocodeAndPin(val.trim()), 600);
  };

  const handlePincodeChange = (val: string) => {
    setForm((p) => ({ ...p, postalCode: val }));
    clearTimeout(timerRef.current);
    if (/^\d{5,6}$/.test(val.trim())) {
      timerRef.current = setTimeout(() => geocodeAndPin(val.trim()), 400);
    }
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.label.trim()) e.label = "Label is required";
    if (!form.addr.trim())  e.addr  = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await addressApi.create({
        label:      form.label.trim(),
        addr:       form.addr.trim(),
        city:       form.city       || undefined,
        postalCode: form.postalCode || undefined,
        country:    form.country    || undefined,
        lat:        coords?.lat     ?? null,
        lon:        coords?.lon     ?? null,
      });

      const saved = (res as any).data;
      dispatch(addAddress({
        id:         saved.id,
        label:      saved.label,
        addr:       [saved.addr, saved.city, saved.postalCode, saved.country].filter(Boolean).join(", "),
        city:       saved.city,
        postalCode: saved.postalCode,
        country:    saved.country,
        lat:        saved.lat,
        lon:        saved.lon,
      }));
      dispatch(showToast({ message: "Address saved! 📍", type: "success" }));
      history.replace(ROUTES.CHECKOUT);
    } catch {
      dispatch(showToast({ message: "Failed to save address. Please try again.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <IonPage>

      {/* ── FIXED HEADER — stays on top always ── */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "var(--color-primary)",
        padding: "48px 20px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => history.goBack()} style={backBtnStyle} aria-label="Go back">
            <IonIcon icon={arrowBackOutline} style={{ color: "#fff", fontSize: 20 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-primary)", lineHeight: 1.2 }}>
              Add Delivery Address 📍
            </h1>
            <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "var(--font-primary)" }}>
              Pin on map or search by address / pincode
            </p>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <IonContent
        scrollY
        style={{
          "--background":    "var(--color-primary)",
          "--padding-top":   "0px",
          "--padding-bottom":"40px",
        } as React.CSSProperties}
      >
        {/* spacer = height of fixed header so rounded card peeks out below it */}
        <div style={{ height: 110 }} />

        <div style={{
          background: "var(--color-bg)",
          borderRadius: "40px 40px 0 0",
          padding: "24px 16px 60px",
          minHeight: "calc(100vh - 110px)",
        }}>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type="text"
              value={searchVal}
              placeholder="Paste pincode or full address to auto-fill…"
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ ...inputStyle, paddingRight: 44, boxShadow: "var(--shadow-sm)" }}
            />
            {geocoding && <Spinner />}
          </div>

          {/* Map */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div
              ref={mapRef}
              style={{ height: 220, borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-md)", background: "#e8f5e9" }}
            />

            {/* GPS button */}
            <button
              onClick={useMyLocation}
              title="Use my location"
              style={{ position: "absolute", bottom: 12, left: 12, zIndex: 999, background: "#fff", border: "none", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", cursor: "pointer" }}
            >
              <IonIcon icon={locateOutline} style={{ fontSize: 20, color: "var(--color-primary)" }} />
            </button>

            {/* Tap hint */}
            {!coords && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 12, fontFamily: "var(--font-primary)", padding: "6px 14px", borderRadius: 20, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 998 }}>
                Tap anywhere on map to pin
              </div>
            )}
          </div>

          {/* Label presets */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Address label</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              {LABEL_PRESETS.map((p) => (
                <button key={p} type="button"
                  onClick={() => { setForm((f) => ({ ...f, label: p })); setErrors((e) => ({ ...e, label: undefined })); }}
                  style={{ padding: "8px 20px", borderRadius: "var(--radius-full)", border: `1.5px solid ${form.label === p ? "var(--color-primary)" : "var(--color-border)"}`, background: form.label === p ? "var(--color-primary)" : "var(--color-surface)", color: form.label === p ? "#fff" : "var(--color-text-sub)", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-primary)", cursor: "pointer", transition: "all 0.15s" }}>
                  {p}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Or custom label…" value={form.label}
              onChange={(e) => { setForm((f) => ({ ...f, label: e.target.value })); setErrors((er) => ({ ...er, label: undefined })); }}
              style={{ ...inputStyle, borderColor: errors.label ? "var(--color-accent)" : "var(--color-border)" }} />
            {errors.label && <p style={errStyle}>{errors.label}</p>}
          </div>

          {/* Street */}
          <Field label="Street / full address" error={errors.addr}>
            <textarea rows={2} placeholder="Flat no., street, area…" value={form.addr}
              onChange={(e) => { setForm((f) => ({ ...f, addr: e.target.value })); setErrors((er) => ({ ...er, addr: undefined })); }}
              style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "none", lineHeight: 1.5, borderColor: errors.addr ? "var(--color-accent)" : "var(--color-border)" }} />
          </Field>

          {/* City + Pincode */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>City</label>
              <input type="text" placeholder="Mumbai" value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                style={{ ...inputStyle }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pincode</label>
              <input type="text" placeholder="400001" value={form.postalCode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                style={{ ...inputStyle }} />
            </div>
          </div>

          {/* Country */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Country</label>
            <input type="text" placeholder="India" value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              style={{ ...inputStyle }} />
          </div>

          {geocoding && (
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-primary)", fontFamily: "var(--font-primary)", margin: "0 0 16px" }}>
              📡 Finding address…
            </p>
          )}

          <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
            {loading
              ? "Saving…"
              : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20 }} />
                  Save Address
                </span>
            }
          </Button>

        </div>
      </IonContent>

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </IonPage>
  );
};

// ── Helpers ────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, border: "2.5px solid var(--color-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
);

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && <p style={errStyle}>{error}</p>}
  </div>
);

// ── Styles ─────────────────────────────────────────────────────
const backBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "none", borderRadius: "50%",
  width: 36, height: 36, flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "var(--color-text)", fontFamily: "var(--font-primary)", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%", height: 50,
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--color-border)",
  background: "var(--color-surface)",
  padding: "0 14px", fontSize: 14,
  color: "var(--color-text)", fontFamily: "var(--font-primary)",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};
const errStyle: React.CSSProperties = {
  margin: "5px 0 0", fontSize: 12,
  color: "var(--color-accent)", fontFamily: "var(--font-primary)",
};

export default AddAddress;