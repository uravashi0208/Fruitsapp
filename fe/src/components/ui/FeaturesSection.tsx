// ============================================================
// FEATURES SECTION — uses shared useInView + animations
// ============================================================
import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Truck, Salad, Medal, Headset } from 'lucide-react';
import { theme } from '../../styles/theme';
import { Container, Section } from '../../styles/shared';
import { fadeUp, shimmer } from '../../styles/animations';
import { useInView } from '../../hooks/useInView';

const iconPop = keyframes`
  0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
  70%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const FeaturesGrid = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const FeatureItem = styled.article<{ $visible: boolean; $delay: number }>`
  text-align: center;
  padding: 30px 20px;
  display: flex; flex-direction: column; align-items: center;
  opacity: 0;
  ${({ $visible, $delay }) => $visible && css`
    animation: ${fadeUp} 0.6s ease both;
    animation-delay: ${$delay}ms;
  `}
  &:hover .feature-icon {
    transform: translateY(-6px) scale(1.08);
    box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  }
`;

const FeatureIcon = styled.figure<{ $bg: string; $visible: boolean; $delay: number }>`
  width: 100px; height: 100px;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  position: relative;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
  opacity: 0;
  ${({ $visible, $delay }) => $visible && css`
    animation: ${iconPop} 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
    animation-delay: ${$delay + 100}ms;
  `}
  &::after {
    content: '';
    position: absolute; inset: 10px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
  }
  &::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  &:hover::before {
    opacity: 1;
    animation: ${shimmer} 0.8s linear;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 16px;
  font-family: ${theme.fonts.body};
  color: ${theme.colors.textDark};
  font-weight: ${theme.fontWeights.medium};
  margin-bottom: 4px;
  transition: color 0.3s ease;
  ${FeatureItem}:hover & { color: ${theme.colors.primary}; }
`;

interface Feature { icon: React.ReactNode; bg: string; title: string; desc: string; }

const DEFAULT_FEATURES: Feature[] = [
  { icon: <Truck size={50} color="white" />,   bg: theme.colors.bgColor1, title: 'Free Shipping',     desc: 'On orders over $100' },
  { icon: <Salad size={50} color="white" />,   bg: theme.colors.bgColor2, title: 'Always Fresh',      desc: 'Product well packaged' },
  { icon: <Medal size={50} color="white" />,   bg: theme.colors.bgColor3, title: 'Superior Quality',  desc: 'Certified organic produce' },
  { icon: <Headset size={50} color="white" />, bg: theme.colors.bgColor4, title: '24/7 Support',      desc: 'We\'re here to help' },
];

export const FeaturesSection: React.FC<{ features?: Feature[] }> = ({ features = DEFAULT_FEATURES }) => {
  const { ref, visible } = useInView(0.15);
  return (
    <Section>
      <Container>
        <div ref={ref}>
          <FeaturesGrid>
            {features.map((f, i) => (
              <FeatureItem key={f.title} $visible={visible} $delay={i * 120}>
                <FeatureIcon className="feature-icon" $bg={f.bg} $visible={visible} $delay={i * 120}>
                  {f.icon}
                </FeatureIcon>
                <figcaption>
                  <FeatureTitle>{f.title}</FeatureTitle>
                  <span style={{ fontSize: theme.fontSizes.sm, color: theme.colors.textMuted }}>{f.desc}</span>
                </figcaption>
              </FeatureItem>
            ))}
          </FeaturesGrid>
        </div>
      </Container>
    </Section>
  );
};
