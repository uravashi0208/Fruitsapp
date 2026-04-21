// ============================================================
// src/components/layout/BottomNav.tsx
// ============================================================

import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { ROUTES } from "../../utils/constants";
import { useAppState } from "../../store";
import styles from "./BottomNav.module.css";

// ── Types ─────────────────────────────────────────────────────

type IconProps = React.SVGProps<SVGSVGElement>;

interface NavTab {
  label: string;
  Icon: React.FC<IconProps>;
  path: string;
}

interface NavButtonProps {
  tab: NavTab;
  isActive: boolean;
  onClick: () => void;
}

// ── Icons ─────────────────────────────────────────────────────

const IconHome: React.FC<IconProps> = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconHeart: React.FC<IconProps> = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconCart: React.FC<IconProps> = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6" />
  </svg>
);

const IconProfile: React.FC<IconProps> = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ── Nav Config ────────────────────────────────────────────────

const TABS: NavTab[] = [
  { label: "Home",      Icon: IconHome,    path: ROUTES.HOME     },
  { label: "Favourite", Icon: IconHeart,   path: ROUTES.WISHLIST },
  { label: "My Cart",   Icon: IconCart,    path: ROUTES.CART     },
  { label: "Profile",   Icon: IconProfile, path: ROUTES.PROFILE  },
];

// ── NavButton ─────────────────────────────────────────────────

const NavButton: React.FC<NavButtonProps> = ({ tab, isActive, onClick }) => (
  <button
    onClick={onClick}
    aria-label={tab.label}
    aria-current={isActive ? "page" : undefined}
    className={`${styles.tab} ${isActive ? styles.active : ""}`}
  >
    <span className={styles.icon}>
      <tab.Icon style={{ fill: isActive ? "rgba(255,255,255,0.15)" : "none" }} />
    </span>
    <span className={styles.label}>{tab.label}</span>
  </button>
);

// ── BottomNav ─────────────────────────────────────────────────

const BottomNav: React.FC = () => {
  const history  = useHistory();
  const location = useLocation();
  const { state } = useAppState();
  const isLoggedIn = !!state.auth.user;

  const handleTabClick = (tab: NavTab) => {
    // Profile tab requires login
    if (tab.path === ROUTES.PROFILE && !isLoggedIn) {
      history.push(ROUTES.LOGIN, { redirectTo: ROUTES.PROFILE });
      return;
    }
    history.push(tab.path);
  };

  return (
    <>
      <div style={{ height: "var(--nav-height)" }} aria-hidden="true" />

      <nav aria-label="Main navigation" className={styles.nav}>
        {TABS.map((tab) => (
          <NavButton
            key={tab.path}
            tab={tab}
            isActive={location.pathname === tab.path}
            onClick={() => handleTabClick(tab)}
          />
        ))}
      </nav>
    </>
  );
};

export default BottomNav;