import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../../styles/theme';

// ── Animations ────────────────────────────────────────────────
const fadeDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const breadcrumbIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Styled Components ─────────────────────────────────────────
const HeroWrap = styled.section<{ $bg?: string }>`
  width: 100%;
  position: relative;
  background-image: url(${({ $bg }) => $bg ?? '/images/bg_1.jpg'});
  background-size: cover;
  background-position: center;
  padding: 10em 0;
  display: flex;
  align-items: center;
  /* dark overlay */
  &::before {
    content: '';
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.45);
    pointer-events: none;
  }
  @media (max-width: ${theme.breakpoints.md}) {
    padding: 6em 0;
  }
`;

const HeroContent = styled.article`
  position: relative;
  z-index: 1;
  text-align: center;
  width: 100%;
`;

const HeroContainer = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
`;

const Breadcrumbs = styled.nav`
  text-transform: uppercase;
  font-size: ${theme.fontSizes.sm};
  letter-spacing: 3px;
  margin-bottom: 0.5rem;
  font-weight: ${theme.fontWeights.light};
  color: white;
  animation: ${breadcrumbIn} 0.6s ease 0.3s both;
  opacity: 0;

  a {
    color: white;
    text-decoration: none;
    transition: opacity 0.2s ease;
    &:hover { opacity: 0.75; }
  }
  span { color: white; }
`;

const PageTitle = styled.h1`
  font-weight: ${theme.fontWeights.extrabold};
  color: white;
  font-size: 30px;
  font-family: ${theme.fonts.body};
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0;
  animation: ${fadeDown} 0.7s ease 0.1s both;
  opacity: 0;
`;

// ── Types ─────────────────────────────────────────────────────
interface Props {
  title: string;
  subtitle?: string;
  bg?: string;
  breadcrumbs?: Array<{ label: string; to?: string }>;
}

// ── Component ─────────────────────────────────────────────────
export const PageHero: React.FC<Props> = ({ title, bg, breadcrumbs = [] }) => (
  <HeroWrap $bg={bg}>
    <HeroContainer>
      <HeroContent>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to="/">Home</Link>
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {' '}&gt;{' '}
              {b.to ? <Link to={b.to}>{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </Breadcrumbs>
        <PageTitle>{title}</PageTitle>
      </HeroContent>
    </HeroContainer>
  </HeroWrap>
);
