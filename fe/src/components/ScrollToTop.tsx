// ============================================================
// SCROLL TO TOP — route reset + animated floating button
// ============================================================
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { ChevronUp } from 'lucide-react';
import { theme } from '../styles/theme';
import { bounceIn } from '../styles/animations';

// Scroll-reset on route change
const ScrollReset: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

// ── Floating scroll-to-top button ─────────────────────────────
const Btn = styled.button<{ $visible: boolean }>`
  position: fixed;
  bottom: 30px; right: 30px;
  z-index: ${theme.zIndex.sticky};
  width: 44px; height: 44px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(130,174,70,0.35);
  transition: background 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
  pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  ${({ $visible }) => $visible && css`
    animation: ${bounceIn} 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  `}
  &:hover {
    background: ${theme.colors.primaryDark};
    transform: translateY(-3px) scale(1.08);
  }
  &:active { transform: scale(0.95); }

  @media (max-width: ${theme.breakpoints.sm}) {
    bottom: 20px; right: 16px;
  }
`;

const ScrollToTopBtn: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Btn
      $visible={visible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ChevronUp size={20} />
    </Btn>
  );
};

// ── Combined default export ────────────────────────────────────
const ScrollToTop: React.FC = () => (
  <>
    <ScrollReset />
    <ScrollToTopBtn />
  </>
);

export default ScrollToTop;
