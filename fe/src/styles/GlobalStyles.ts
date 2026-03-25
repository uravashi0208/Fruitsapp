import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Amatic+SC:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    font-family: ${theme.fonts.body};
    background: #fff;
    font-size: ${theme.fontSizes.base};
    line-height: 1.8;
    font-weight: ${theme.fontWeights.normal};
    color: ${theme.colors.text};
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  a {
    transition: ${theme.transitions.base};
    color: ${theme.colors.primary};
    text-decoration: none;
    &:hover, &:focus { text-decoration: none; color: ${theme.colors.primary}; }
  }

  h1, h2, h3, h4, h5 {
    line-height: 1.5;
    font-weight: ${theme.fontWeights.normal};
    color: ${theme.colors.textDark};
    font-family: ${theme.fonts.body};
    margin-bottom: 0.5rem;
  }

  p { margin-top: 0; margin-bottom: 1rem; }

  img { max-width: 100%; display: block; }
  ul, ol { list-style: none; padding: 0; margin: 0; }
  button { cursor: pointer; border: none; background: none; font-family: inherit; outline: none; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; }
  ::-webkit-scrollbar-thumb { background: ${theme.colors.primary}; border-radius: 2px; }

  /* Original template colour override */
  .text-primary { color: ${theme.colors.primary} !important; }
  .bg-primary   { background: ${theme.colors.primary} !important; }

  @keyframes fadeInUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn     { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes scaleIn    { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideDown  { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastSlide { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse      { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
`;
