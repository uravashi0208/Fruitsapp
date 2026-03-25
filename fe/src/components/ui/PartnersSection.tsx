import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Container, Section } from '../../styles/shared';

// ── Animations ────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// ── useInView hook ─────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Styled Components ─────────────────────────────────────────
const PartnersRow = styled.nav`
  display: flex;
  gap: 80px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 40px 0;
`;

const PartnerItem = styled.a<{ $visible: boolean; $delay: number }>`
  display: flex;
  opacity: 0;
  transition: transform 0.3s ease, filter 0.3s ease;
  ${({ $visible, $delay }) => $visible && css`
    animation: ${fadeIn} 0.5s ease both;
    animation-delay: ${$delay}ms;
  `}
  &:hover {
    transform: scale(1.1);
    filter: grayscale(0%) opacity(1) !important;
  }
`;

const PartnerImg = styled.img`
  max-height: 60px;
  filter: grayscale(60%) opacity(0.7);
  transition: ${theme.transitions.base};
  ${PartnerItem}:hover & {
    filter: grayscale(0%) opacity(1);
  }
`;

// ── Types ─────────────────────────────────────────────────────
interface PartnersSectionProps { count?: number; }

// ── Component ─────────────────────────────────────────────────
export const PartnersSection: React.FC<PartnersSectionProps> = ({ count = 5 }) => {
  const { ref, visible } = useInView();

  return (
    <>
      <hr style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }} />
      <Section>
        <Container>
          <div ref={ref}>
            <PartnersRow>
              {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                <PartnerItem
                  key={n}
                  href="#"
                  $visible={visible}
                  $delay={n * 100}
                >
                  <PartnerImg
                    src={`/images/partner-${n}.png`}
                    alt={`Partner ${n}`}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </PartnerItem>
              ))}
            </PartnersRow>
          </div>
        </Container>
      </Section>
    </>
  );
};
