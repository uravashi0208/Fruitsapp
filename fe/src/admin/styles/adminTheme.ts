/**
 * adminTheme.ts
 * Design tokens extracted from TailAdmin (Tailwind CSS v4 admin theme)
 * Applied to styled-components for the Vegefoods admin panel.
 */
export const adminTheme = {
  colors: {
    // ── Sidebar ──────────────────────────────────────────────
    sidebarBg:       '#ffffff',
    sidebarBgDark:   '#1c2333',
    sidebarBorder:   '#e4e7ec',
    sidebarText:     '#475467',
    sidebarActive:   '#465fff',
    sidebarActiveBg: '#ecf3ff',
    sidebarHover:    '#f9fafb',

    // ── Main background ───────────────────────────────────────
    bg:           '#f9fafb',
    surface:      '#ffffff',
    surfaceAlt:   '#f9fafb',
    border:       '#e4e7ec',

    // ── Brand (TailAdmin brand-500 = #465fff) ─────────────────
    primary:      '#465fff',
    primaryDark:  '#3641f5',
    primaryLight: '#9cb9ff',
    primaryGhost: 'rgba(70,95,255,0.08)',

    // ── Status ────────────────────────────────────────────────
    success:    '#12b76a',
    successBg:  '#ecfdf3',
    warning:    '#f79009',
    warningBg:  '#fffaeb',
    danger:     '#f04438',
    dangerBg:   '#fef3f2',
    info:       '#0ba5ec',
    infoBg:     '#f0f9ff',

    // ── Text ──────────────────────────────────────────────────
    textPrimary:   '#101828',
    textSecondary: '#475467',
    textMuted:     '#98a2b3',
    textWhite:     '#ffffff',

    // ── Gradient KPI cards ────────────────────────────────────
    card1: 'linear-gradient(135deg,#465fff 0%,#3641f5 100%)',
    card2: 'linear-gradient(135deg,#0ba5ec 0%,#026aa2 100%)',
    card3: 'linear-gradient(135deg,#f79009 0%,#b54708 100%)',
    card4: 'linear-gradient(135deg,#f04438 0%,#b42318 100%)',
  },

  fonts: {
    body:    "'Outfit', 'Segoe UI', sans-serif",
    heading: "'Outfit', 'Segoe UI', sans-serif",
    mono:    "'JetBrains Mono', 'Fira Code', monospace",
  },

  radii: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    full: '9999px',
  },

  shadows: {
    xs:   '0px 1px 2px 0px rgba(16,24,40,0.05)',
    sm:   '0px 1px 3px 0px rgba(16,24,40,0.1),0px 1px 2px 0px rgba(16,24,40,0.06)',
    md:   '0px 4px 8px -2px rgba(16,24,40,0.1),0px 2px 4px -2px rgba(16,24,40,0.06)',
    lg:   '0px 12px 16px -4px rgba(16,24,40,0.08),0px 4px 6px -2px rgba(16,24,40,0.03)',
    card: '0px 1px 3px 0px rgba(16,24,40,0.1),0px 1px 2px 0px rgba(16,24,40,0.06)',
    focus:'0px 0px 0px 4px rgba(70,95,255,0.12)',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  transitions: {
    fast: '0.15s ease',
    base: '0.25s ease',
  },

  sidebar: {
    width:          '290px',
    collapsedWidth: '90px',
  },

  zIndex: {
    sidebar:  200,
    topbar:   100,
    modal:    400,
    toast:    500,
    overlay:  300,
  },
} as const;

export type AdminTheme = typeof adminTheme;
