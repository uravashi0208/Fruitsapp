// ============================================================
// VEGEFOODS — Global Styles  (upgraded)
// • CSS custom properties for every token
// • Enhanced scrollbar, selection, focus ring
// • Utility classes for common patterns
// ============================================================
import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Amatic+SC:wght@400;700&display=swap');

  :root {
    --c-primary:       ${theme.colors.primary};
    --c-primary-dark:  ${theme.colors.primaryDark};
    --c-primary-light: ${theme.colors.primaryLight};
    --c-primary-ghost: ${theme.colors.primaryGhost};
    --c-dark:          ${theme.colors.dark};
    --c-text:          ${theme.colors.text};
    --c-text-dark:     ${theme.colors.textDark};
    --c-text-muted:    ${theme.colors.textMuted};
    --c-text-light:    ${theme.colors.textLight};
    --c-white:         ${theme.colors.white};
    --c-off-white:     ${theme.colors.offWhite};
    --c-border:        ${theme.colors.border};
    --c-border-mid:    ${theme.colors.borderMid};
    --c-success:       ${theme.colors.success};
    --c-warning:       ${theme.colors.warning};
    --c-danger:        ${theme.colors.danger};
    --c-info:          ${theme.colors.info};
    --shadow-btn:      ${theme.shadows.btn};
    --shadow-card:     ${theme.shadows.card};
    --shadow-nav:      ${theme.shadows.nav};
    --shadow-hover:    ${theme.shadows.hover};
    --t-base:   ${theme.transitions.base};
    --t-fast:   ${theme.transitions.fast};
    --t-slow:   ${theme.transitions.slow};
    --t-spring: ${theme.transitions.spring};
    --r-md:   ${theme.radii.md};
    --r-pill: ${theme.radii.pill};
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    font-family: ${theme.fonts.body};
    background: #ffffff;
    font-size: ${theme.fontSizes.base};
    line-height: 1.8;
    font-weight: ${theme.fontWeights.normal};
    color: ${theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.4;
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textDark};
    font-family: ${theme.fonts.body};
    margin-bottom: 0.5rem;
  }

  p { margin-top: 0; margin-bottom: 1rem; }

  a {
    transition: var(--t-base);
    color: var(--c-primary);
    text-decoration: none;
    &:hover, &:focus { text-decoration: none; color: var(--c-primary-dark); }
  }

  img, video { max-width: 100%; display: block; }
  ul, ol     { list-style: none; padding: 0; margin: 0; }
  button     { cursor: pointer; border: none; background: none; font-family: inherit; outline: none; }

  :focus-visible {
    outline: 2px solid var(--c-primary);
    outline-offset: 3px;
    border-radius: 4px;
  }
  :focus:not(:focus-visible) { outline: none; }

  ::selection { background: var(--c-primary); color: white; }

  ::-webkit-scrollbar       { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; }
  ::-webkit-scrollbar-thumb { background: var(--c-primary); border-radius: 4px; }

  /* Utility classes */
  .text-primary     { color: var(--c-primary) !important; }
  .bg-primary       { background: var(--c-primary) !important; }
  .text-center      { text-align: center; }
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease infinite;
    border-radius: 4px;
  }
  .visually-hidden {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  /* Global @keyframes */
  @keyframes fadeInUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn     { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes scaleIn    { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideDown  { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastSlide { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse      { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes shimmer    { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes float      { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes gentlePulse {
    0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(130,174,70,0.4); }
    50%      { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(130,174,70,0); }
  }
`;
