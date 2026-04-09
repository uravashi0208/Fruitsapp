// ============================================================
// FEATURED PRODUCTS — uses shared useInView + animations
// ============================================================
import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Container, Section } from '../../styles/shared';
import { fadeUp, fadeDown } from '../../styles/animations';
import { useInView } from '../../hooks/useInView';
import { ProductCard } from '../ui/ProductCard';
import { useProducts } from '../../hooks/useApi';

// ── Styled ────────────────────────────────────────────────────
const HeadingSection = styled.header<{ $visible: boolean }>`
  text-align: center;
  margin-bottom: 40px;
  margin-top: 1rem;
  opacity: 0;
  ${({ $visible }) => $visible && css`
    animation: ${fadeDown} 0.6s ease both;
  `}
  h2 {
    font-size: ${theme.fontSizes['4xl']};
    font-weight: ${theme.fontWeights.semibold};
    color: ${theme.colors.textDark};
    font-family: ${theme.fonts.heading};
    margin-bottom: 1rem;
    @media (max-width: ${theme.breakpoints.md}) { font-size: 28px; }
  }
  .subheading {
    font-size: ${theme.fontSizes.lg};
    display: block;
    margin-bottom: 0.4rem;
    font-family: ${theme.fonts.serif};
    color: ${theme.colors.primary};
    font-style: italic;
    line-height: 1.8;
    font-weight: ${theme.fontWeights.normal};
    letter-spacing: 1px;
    text-transform: capitalize;
  }
  p { max-width: 680px; margin: 10px auto 0; color: ${theme.colors.text}; }
`;

const AnimatedLi = styled.li<{ $visible: boolean; $delay: number }>`
  opacity: 0;
  ${({ $visible, $delay }) => $visible && css`
    animation: ${fadeUp} 0.55s ease both;
    animation-delay: ${$delay}ms;
  `}
`;

const ProductsGrid = styled.ul`
  list-style: none;
  padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

// ── Component ─────────────────────────────────────────────────
interface Props { count?: number; }

export const FeaturedProducts: React.FC<Props> = ({ count = 8 }) => {
  const { ref, visible } = useInView();
  const { data: allProducts } = useProducts({ limit: count });

  return (
    <Section>
      <Container>
        <div ref={ref}>
          <HeadingSection $visible={visible}>
            <span className="subheading">Featured Products</span>
            <h2>Our Products</h2>
            <p>Farm-fresh goodness delivered straight to your door — quality you can taste in every bite.</p>
          </HeadingSection>
        </div>
      </Container>
      <Container>
        <ProductsGrid>
          {(allProducts ?? []).slice(0, count).map((p, i) => (
            <AnimatedLi key={p.id} $visible={visible} $delay={i * 80}>
              <ProductCard product={p as any} />
            </AnimatedLi>
          ))}
        </ProductsGrid>
      </Container>
    </Section>
  );
};
