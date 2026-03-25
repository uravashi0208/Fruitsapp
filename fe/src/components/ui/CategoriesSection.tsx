import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../../styles/theme';
import { Container, Section, Button } from '../../styles/shared';

// ── Animations ────────────────────────────────────────────────
const fadeLeft = keyframes`
  from { opacity: 0; transform: translateX(-50px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const zoomIn = keyframes`
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
`;

// ── useInView hook ─────────────────────────────────────────────
function useInView(threshold = 0.12) {
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
const CategoriesLayout = styled.article`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  @media (max-width: ${theme.breakpoints.lg}) { grid-template-columns: 1fr; }
`;

const CatLeftGrid = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: ${theme.breakpoints.sm}) { grid-template-columns: 1fr; }
`;

const CatFeatured = styled.figure<{ $bg: string; $visible: boolean }>`
  background-image: url(${({ $bg }) => $bg});
  background-size: cover;
  background-position: center;
  min-height: 300px;
  position: relative;
  text-align: center;
  padding: 40px 20px;
  margin: 0;
  opacity: 0;
  overflow: hidden;
  ${({ $visible }) => $visible && css`
    animation: ${zoomIn} 0.75s ease both;
    animation-delay: 0ms;
  `}
  &::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(0,0,0,0);
    transition: background 0.4s ease;
  }
  &:hover::after { background: rgba(0,0,0,0.08); }
`;

const CatFeaturedText = styled.figcaption`
  position: relative; z-index: 1;
  h2 {
    font-size: 24px;
    color: ${theme.colors.primary};
    font-family: ${theme.fonts.serif};
    font-style: italic;
    margin-bottom: 8px;
  }
  p { color: ${theme.colors.text}; margin-bottom: 16px; }
`;

const CatSmall = styled(Link)<{ $bg: string; $visible: boolean; $delay: number }>`
  background-image: url(${({ $bg }) => $bg});
  background-size: cover;
  background-position: center;
  display: flex; align-items: flex-end;
  height: 270px;
  position: relative;
  text-decoration: none;
  overflow: hidden;
  opacity: 0;
  ${({ $visible, $delay }) => $visible && css`
    animation: ${fadeUp} 0.6s ease both;
    animation-delay: ${$delay}ms;
  `}
  &:hover .cat-text { background: ${theme.colors.primaryDark}; }
  &:hover img { transform: scale(1.05); }
  /* img zoom trick via pseudo */
  &::before {
    content: '';
    position: absolute; inset: 0;
    background: inherit;
    background-size: cover;
    background-position: center;
    transition: transform 0.5s ease;
    z-index: 0;
  }
  &:hover::before { transform: scale(1.06); }
`;

const CatSmallText = styled.span`
  background: ${theme.colors.primary};
  padding: 6px 16px;
  transition: ${theme.transitions.base};
  position: relative; z-index: 1;
  h2 {
    font-size: 16px;
    font-family: ${theme.fonts.body};
    color: white;
    margin: 0;
    a { color: white; text-decoration: none; }
  }
`;

const CatFeaturedWrap = styled.aside<{ $visible: boolean }>`
  grid-column: 2;
  grid-row: 1 / 3;
  opacity: 0;
  ${({ $visible }) => $visible && css`
    animation: ${fadeLeft} 0.7s ease both;
    animation-delay: 350ms;
  `}
`;

const CatRightStack = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

// ── Component ─────────────────────────────────────────────────
export const CategoriesSection: React.FC = () => {
  const { ref, visible } = useInView();

  return (
    <Section $noPt>
      <Container>
        <div ref={ref}>
          <CategoriesLayout>
            {/* Left: featured + 2 small */}
            <CatLeftGrid>
              <CatSmall to="/shop" $bg="/images/category-1.jpg" $visible={visible} $delay={100}>
                <CatSmallText className="cat-text">
                  <h2><Link to="/shop">Fruits</Link></h2>
                </CatSmallText>
              </CatSmall>
              <CatSmall to="/shop" $bg="/images/category-2.jpg" $visible={visible} $delay={200}>
                <CatSmallText className="cat-text">
                  <h2><Link to="/shop">Vegetables</Link></h2>
                </CatSmallText>
              </CatSmall>

              {/* Featured tall card in col 2 spanning 2 rows */}
              <CatFeaturedWrap $visible={visible}>
                <CatFeatured $bg="/images/category.jpg" $visible={visible} style={{ height: '100%', minHeight: 420 }}>
                  <CatFeaturedText>
                    <h2>Vegetables</h2>
                    <p>Protect the health of every home</p>
                    <Button as={Link as any} to="/shop">Shop now</Button>
                  </CatFeaturedText>
                </CatFeatured>
              </CatFeaturedWrap>
            </CatLeftGrid>

            {/* Right: 2 stacked */}
            <CatRightStack>
              <CatSmall to="/shop" $bg="/images/category-3.jpg" $visible={visible} $delay={300}>
                <CatSmallText className="cat-text">
                  <h2><Link to="/shop">Juices</Link></h2>
                </CatSmallText>
              </CatSmall>
              <CatSmall to="/shop" $bg="/images/category-4.jpg" $visible={visible} $delay={420}>
                <CatSmallText className="cat-text">
                  <h2><Link to="/shop">Dried</Link></h2>
                </CatSmallText>
              </CatSmall>
            </CatRightStack>
          </CategoriesLayout>
        </div>
      </Container>
    </Section>
  );
};