// ============================================================
// src/pages/Profile.tsx  — UPDATED
// Edit icon now navigates to /edit-profile
// Quick actions visible fix + no header line
// ============================================================

import React, { useEffect } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  createOutline,
  chevronForwardOutline,
  cardOutline,
  cubeOutline,
  locationOutline,
  personOutline,
  walletOutline,
  settingsOutline,
  logOutOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { ROUTES } from "../utils/constants";
import { useAppState, useAppDispatch, logout, showToast } from "../store";
import { clearTokens } from "../api/client";
import BottomNav from "../components/layout/BottomNav";

const NAV_BG   = "#1B2A4A";
const NAV_TEXT = "#FFFFFF";
const PAGE_BG  = "#F5F6FA";
const CARD_BG  = "#FFFFFF";
const TEXT_MAIN= "#1B2A4A";
const TEXT_SUB = "#9096A5";
const DIVIDER  = "#F0F1F5";

interface QuickAction { icon: string; label: string; path?: string }
interface MenuItem    { icon: string; label: string; path?: string; action?: () => void }

const Profile: React.FC = () => {
  const history    = useHistory();
  const { state }  = useAppState();
  const dispatch   = useAppDispatch();
  const user       = state.auth.user;
  const isLoggedIn = !!user;

  useEffect(() => {
    if (!isLoggedIn) {
      history.replace(ROUTES.LOGIN, { redirectTo: ROUTES.PROFILE });
    }
  }, [isLoggedIn, history]);

  const handleLogout = () => {
    clearTokens();
    dispatch(logout());
    dispatch(showToast({ message: "Logged out successfully", type: "info" }));
    history.replace(ROUTES.HOME);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const QUICK_ACTIONS: QuickAction[] = [
    { icon: cardOutline,     label: "Payment",  path: (ROUTES as any).PAYMENT   ?? ROUTES.HOME },
    { icon: cubeOutline,     label: "My Order", path: (ROUTES as any).MY_ORDERS ?? ROUTES.HOME },
    { icon: locationOutline, label: "Location", path: ROUTES.ADD_ADDRESS                       },
  ];

  const MENU_ITEMS: MenuItem[] = [
    { icon: personOutline,   label: "Account information", path: (ROUTES as any).EDIT_PROFILE ?? "/edit-profile" },
    { icon: cardOutline,     label: "My card",             path: (ROUTES as any).MY_CARDS     ?? ROUTES.HOME     },
    { icon: walletOutline,   label: "Balance transfer"                                                           },
    { icon: settingsOutline, label: "Settings",            path: (ROUTES as any).SETTINGS     ?? ROUTES.HOME     },
  ];

  if (!isLoggedIn) return null;

  const EDIT_PROFILE_PATH = (ROUTES as any).EDIT_PROFILE ?? "/edit-profile";

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
        <div style={{ minHeight: "100vh", background: PAGE_BG, display: "flex", flexDirection: "column", paddingBottom: 80 }}>

          {/* Unified navy block */}
          <div style={{ background: NAV_BG }}>
            <div style={{ padding: "48px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => history.goBack()} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IonIcon icon={arrowBackOutline} style={{ color: NAV_TEXT, fontSize: 18 }} />
              </button>
              <span style={{ color: NAV_TEXT, fontWeight: 600, fontSize: 17, fontFamily: "var(--font-primary)", letterSpacing: "0.01em" }}>Profile</span>
              <button onClick={() => history.push(EDIT_PROFILE_PATH)} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IonIcon icon={createOutline} style={{ color: NAV_TEXT, fontSize: 18 }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 52 }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.8)", overflow: "hidden", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: user?.avatar ? 0 : 30, fontWeight: 700, color: NAV_TEXT, fontFamily: "var(--font-primary)", flexShrink: 0 }}>
                {user?.avatar ? <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(user?.name ?? "U")}
              </div>
              <h2 style={{ margin: "12px 0 4px", color: NAV_TEXT, fontWeight: 700, fontSize: 18, fontFamily: "var(--font-primary)" }}>{user?.name}</h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-primary)" }}>{user?.email}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: "0 20px", marginTop: -44 }}>
            <div style={{ background: CARD_BG, borderRadius: 16, padding: "18px 0", display: "flex", boxShadow: "0 4px 20px rgba(27,42,74,0.12)" }}>
              {QUICK_ACTIONS.map((qa, i) => (
                <button key={qa.label} onClick={() => qa.path && history.push(qa.path)} style={{ flex: 1, background: "none", border: "none", borderRight: i < QUICK_ACTIONS.length - 1 ? `1px solid ${DIVIDER}` : "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "#EEF1F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IonIcon icon={qa.icon} style={{ fontSize: 20, color: NAV_BG }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_MAIN, fontFamily: "var(--font-primary)" }}>{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ background: CARD_BG, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(27,42,74,0.06)" }}>
              {MENU_ITEMS.map((item, i) => (
                <div key={item.label} onClick={() => { if (item.action) { item.action(); return; } if (item.path) { history.push(item.path); } }} role="button" tabIndex={0} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px", borderBottom: i < MENU_ITEMS.length - 1 ? `1px solid ${DIVIDER}` : "none", cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EEF1F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IonIcon icon={item.icon} style={{ fontSize: 20, color: NAV_BG }} />
                  </div>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: TEXT_MAIN, fontFamily: "var(--font-primary)" }}>{item.label}</span>
                  <IonIcon icon={chevronForwardOutline} style={{ fontSize: 16, color: TEXT_SUB }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 32 }} />

          {/* Logout */}
          <div style={{ padding: "0 20px 20px" }}>
            <button onClick={handleLogout} style={{ width: "100%", padding: "16px 0", background: NAV_BG, border: "none", borderRadius: 14, color: NAV_TEXT, fontSize: 15, fontWeight: 600, fontFamily: "var(--font-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, letterSpacing: "0.01em" }}>
              <IonIcon icon={logOutOutline} style={{ fontSize: 18, color: NAV_TEXT }} />
              Log Out
            </button>
          </div>
        </div>
        <BottomNav />
      </IonContent>
    </IonPage>
  );
};

export default Profile;