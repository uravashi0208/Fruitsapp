// ============================================================
// CATEGORIES SECTION — uses shared useInView + animations
// ============================================================
import React from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { theme } from "../../styles/theme";
import { Container, Section, Button } from "../../styles/shared";
import { fadeLeft, fadeUp, scaleIn } from "../../styles/animations";
import { useInView } from "../../hooks/useInView";

const CategoriesLayout = styled.article`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const CatLeftGrid = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
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
  ${({ $visible }) =>
    $visible &&
    css`
      animation: ${scaleIn} 0.75s ease both;
    `}
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    transition: background 0.4s ease;
  }
  &:hover::after {
    background: rgba(0, 0, 0, 0.08);
  }
`;

const CatFeaturedText = styled.figcaption`
  position: relative;
  z-index: 1;
  h2 {
    font-size: 24px;
    color: ${theme.colors.primary};
    font-family: ${theme.fonts.serif};
    font-style: italic;
    margin-bottom: 8px;
  }
  p {
    color: ${theme.colors.text};
    margin-bottom: 16px;
  }
`;

const CatSmall = styled(Link)<{
  $bg: string;
  $visible: boolean;
  $delay: number;
}>`
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  height: 270px;
  position: relative;
  text-decoration: none;
  overflow: hidden;
  opacity: 0;
  ${({ $visible, $delay }) =>
    $visible &&
    css`
      animation: ${fadeUp} 0.6s ease both;
      animation-delay: ${$delay}ms;
    `}
  &:hover .cat-text {
    background: ${theme.colors.primaryDark};
  }
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url(${({ $bg }) => $bg});
    background-size: cover;
    background-position: center;
    transition: transform 0.5s ease;
    z-index: 0;
  }
  &:hover::before {
    transform: scale(1.06);
  }
`;

const CatSmallText = styled.span`
  background: ${theme.colors.primary};
  padding: 8px 20px;
  transition: ${theme.transitions.base};
  position: relative;
  z-index: 1;
  border-top-right-radius: 7px;
  h2 {
    font-size: 16px;
    font-family: ${theme.fonts.body};
    color: white;
    margin: 0;
    a {
      color: white;
      text-decoration: none;
    }
  }
`;

const CatFeaturedWrap = styled.aside<{ $visible: boolean }>`
  grid-column: 2;
  grid-row: 1 / 3;
  opacity: 0;
  ${({ $visible }) =>
    $visible &&
    css`
      animation: ${fadeLeft} 0.7s ease both;
      animation-delay: 350ms;
    `}
`;

const CatRightStack = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const CategoriesSection: React.FC = () => {
  const { ref, visible } = useInView(0.12);
  return (
    <Section $noPt>
      <Container>
        <div ref={ref}>
          <CategoriesLayout>
            <CatLeftGrid>
              <CatSmall
                to="/shop"
                $bg="/images/category-1.jpg"
                $visible={visible}
                $delay={100}
              >
                <CatSmallText className="cat-text">
                  <h2>
                    <Link to="/shop">Fruits</Link>
                  </h2>
                </CatSmallText>
              </CatSmall>
              <CatSmall
                to="/shop"
                $bg="/images/category-2.jpg"
                $visible={visible}
                $delay={200}
              >
                <CatSmallText className="cat-text">
                  <h2>
                    <Link to="/shop">Vegetables</Link>
                  </h2>
                </CatSmallText>
              </CatSmall>
              <CatFeaturedWrap $visible={visible}>
                <CatFeatured
                  $bg="/images/category.jpg"
                  $visible={visible}
                  style={{ height: "100%", minHeight: 420 }}
                >
                  <CatFeaturedText>
                    <h2>Vegetables</h2>
                    <p>Protect the health of every home</p>
                    <Button as={Link as any} to="/shop">
                      Shop now
                    </Button>
                  </CatFeaturedText>
                </CatFeatured>
              </CatFeaturedWrap>
            </CatLeftGrid>
            <CatRightStack>
              <CatSmall
                to="/shop"
                $bg="/images/category-3.jpg"
                $visible={visible}
                $delay={300}
              >
                <CatSmallText className="cat-text">
                  <h2>
                    <Link to="/shop">Juices</Link>
                  </h2>
                </CatSmallText>
              </CatSmall>
              <CatSmall
                to="/shop"
                $bg="/images/category-4.jpg"
                $visible={visible}
                $delay={420}
              >
                <CatSmallText className="cat-text">
                  <h2>
                    <Link to="/shop">Dried</Link>
                  </h2>
                </CatSmallText>
              </CatSmall>
            </CatRightStack>
          </CategoriesLayout>
        </div>
      </Container>
    </Section>
  );
};
