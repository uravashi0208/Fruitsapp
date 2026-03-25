import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Container, Section } from '../../styles/shared';
import { ProductCard } from '../ui/ProductCard';
import { useProducts } from '../../hooks/useApi';

// ── Animations ────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── useInView hook ─────────────────────────────────────────────
function useInView(threshold = 0.1) {
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
const HeadingSection = styled.header<{ $visible: boolean }>`
  text-align: center;
  margin-bottom: 40px;
  margin-top: 1rem;
  opacity: 0;
  ${({ $visible }) => $visible && css`
    animation: ${slideDown} 0.6s ease both;
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
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0 20px;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

// ── Types ─────────────────────────────────────────────────────
interface FeaturedProductsProps { count?: number; }

// ── Component ─────────────────────────────────────────────────
export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ count = 8 }) => {
  const { ref, visible } = useInView();
  const { data: allProducts } = useProducts({ limit: count });

  return (
    <Section>
      <Container>
        <div ref={ref}>
          <HeadingSection $visible={visible}>
            <span className="subheading">Featured Products</span>
            <h2>Our Products</h2>
            <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia</p>
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
