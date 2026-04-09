// ============================================================
// PARTNERS SECTION — shared useInView + animations
// ============================================================
import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Container, Section } from '../../styles/shared';
import { scaleIn } from '../../styles/animations';
import { useInView } from '../../hooks/useInView';

const PartnersRow = styled.nav`
  display: flex;
  gap: 80px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 40px 0;
`;

const PartnerItem = styled.div<{ $visible: boolean; $delay: number }>`
  display: flex;
  opacity: 0;
  transition: transform 0.3s ease, filter 0.3s ease;
  ${({ $visible, $delay }) => $visible && css`
    animation: ${scaleIn} 0.5s ease both;
    animation-delay: ${$delay}ms;
  `}
  &:hover {
    transform: scale(1.1);
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

export const PartnersSection: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { ref, visible } = useInView(0.15);
  return (
    <>
      <hr style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }} />
      <Section>
        <Container>
          <div ref={ref}>
            <PartnersRow>
              {Array.from({ length: count }, (_, i) => i + 1).map(n => (
                <PartnerItem key={n} $visible={visible} $delay={n * 100}>
                  <PartnerImg
                    src={`/images/partner-${n}.png`}
                    alt={`Partner ${n}`}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
