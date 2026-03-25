// ============================================================
// VEGEFOODS — Design Tokens
// Extracted from original Colorlib Bootstrap 4 template
// Primary: #82ae46  |  Fonts: Poppins, Lora, Amatic SC
// ============================================================
export const theme = {
  colors: {
    // Brand greens — matches original #82ae46
    primary:       '#82ae46',
    primaryDark:   '#6e9a35',   // darker shade for gradients/hover
    primaryHover:  '#6e9a35',   // alias
    primaryLight:  '#a8cc70',   // lighter tint
    primaryGhost:  'rgba(130,174,70,0.08)',
    primaryLight2: 'rgba(130,174,70,0.12)',

    // Neutrals
    dark:          '#000000',
    darkBg:        '#3c312e',
    text:          'gray',
    textDark:      '#000000',
    textMuted:     'rgba(0,0,0,0.5)',
    textLight:     '#b3b3b3',
    white:         '#ffffff',
    offWhite:      '#f8f9fa',
    surface:       '#ffffff',
    surfaceAlt:    '#f8f9fa',
    border:        '#f0f0f0',
    borderMid:     '#dee2e6',

    // Service icon bg colours (original .bg-color-1 thru 4)
    bgColor1:      '#e4b2d6',
    bgColor2:      '#dcc698',
    bgColor3:      '#a2d1e1',
    bgColor4:      '#dcd691',
    bgColor5:      '#f7f6f2',

    // Semantic
    success:       '#28a745',
    info:          '#17a2b8',
    warning:       '#ffc107',
    danger:        '#dc3545',

    // Overlays / shadows
    shadow:        'rgba(0,0,0,0.09)',
    overlay:       'rgba(0,0,0,0.5)',
  },

  fonts: {
    body:    '"Poppins", Arial, sans-serif',
    heading: '"Poppins", Arial, sans-serif',
    serif:   '"Lora", Georgia, serif',
    display: '"Amatic SC", cursive',
    mono:    'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    accent:  '"Amatic SC", cursive',
  },

  fontSizes: {
    xs:   '11px',
    sm:   '12px',
    base: '15px',
    md:   '16px',
    lg:   '18px',
    xl:   '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '40px',
    '5xl': '8vw',
  },

  fontWeights: {
    light:     300,
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },

  spacing: {
    xs:   '5px',
    sm:   '10px',
    md:   '15px',
    lg:   '20px',
    xl:   '30px',
    '2xl': '40px',
    '3xl': '6em',
    '4xl': '7em',
    '5xl': '8em',
  },

  radii: {
    sm:   '0px',
    md:   '4px',
    lg:   '30px',
    full: '50%',
    pill: '30px',
  },

  shadows: {
    btn:  '0px 24px 36px -11px rgba(0,0,0,0.09)',
    card: '0px 10px 34px -20px rgba(0,0,0,0.41)',
    nav:  '0 0 10px 0 rgba(0,0,0,0.1)',
    sm:   '0 1px 4px rgba(0,0,0,0.08)',
    md:   '0 4px 16px rgba(0,0,0,0.1)',
    lg:   '0 8px 32px rgba(0,0,0,0.12)',
    xl:   '0 20px 60px rgba(0,0,0,0.15)',
    hover:'0 12px 40px rgba(130,174,70,0.22)',
  },

  transitions: {
    base:   '.3s all ease',
    fast:   '.15s all ease',
    slow:   '.5s all ease',
    spring: '.5s cubic-bezier(0.34,1.56,0.64,1)',
  },

  breakpoints: {
    xs:  '480px',
    sm:  '576px',
    md:  '768px',
    lg:  '992px',
    xl:  '1200px',
    '2xl': '1400px',
  },

  zIndex: {
    base:     0,
    raised:   10,
    nav:      3,
    dropdown: 100,
    sticky:   200,
    overlay:  300,
    modal:    400,
    toast:    500,
    loader:   9999,
  },
} as const;

export type Theme = typeof theme;
