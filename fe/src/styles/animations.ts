// ============================================================
// VEGEFOODS — Centralized Keyframe Animations
// Import from here — NEVER redefine in individual files
// ============================================================
import { keyframes } from 'styled-components';

// ── Entrance ──────────────────────────────────────────────────

/** General fade + rise (most common entrance) */
export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** Subtle slide down (headings, navbars) */
export const fadeDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** Slide in from left */
export const fadeLeft = keyframes`
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: translateX(0); }
`;

/** Slide in from right */
export const fadeRight = keyframes`
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
`;

/** Plain opacity fade */
export const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

/** Scale + fade (popovers, badges, modals) */
export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
`;

/** Spring pop — badges, icons */
export const springPop = keyframes`
  0%   { transform: scale(0); opacity: 0; }
  70%  { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1); }
`;

/** Avatar / icon reveal with subtle rotation */
export const avatarReveal = keyframes`
  from { opacity: 0; transform: scale(0.6) rotate(-8deg); }
  to   { opacity: 1; transform: scale(1) rotate(0deg); }
`;

// ── Hero specific ─────────────────────────────────────────────

export const heroTextIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const heroSubIn = keyframes`
  from { opacity: 0; letter-spacing: 10px; }
  to   { opacity: 0.9; letter-spacing: 4px; }
`;

export const heroBtnIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

/** Ken-Burns background zoom for hero slides */
export const kenBurns = keyframes`
  0%   { transform: scale(1); }
  100% { transform: scale(1.07); }
`;

// ── Loaders / Indicators ─────────────────────────────────────

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
`;

/** Skeleton shimmer */
export const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

// ── Interaction ───────────────────────────────────────────────

/** Countdown timer tick */
export const countUp = keyframes`
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

/** Gentle CTA pulse */
export const gentlePulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(130,174,70,0.4); }
  50%       { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(130,174,70,0); }
`;

/** Toast slide in from right */
export const toastSlide = keyframes`
  from { opacity: 0; transform: translateX(100px); }
  to   { opacity: 1; transform: translateX(0); }
`;

/** Newsletter success pop */
export const successPop = keyframes`
  0%   { transform: scale(0.8); opacity: 0; }
  70%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
`;

/** Floating (leaf, decorative elements) */
export const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33%       { transform: translateY(-12px) rotate(2deg); }
  66%       { transform: translateY(-6px) rotate(-1deg); }
`;

/** Scroll-to-top button bounce */
export const bounceIn = keyframes`
  0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
  60%  { transform: translateY(-6px) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;
