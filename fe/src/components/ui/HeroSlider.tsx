import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { theme } from '../../styles/theme';
import { Button } from '../../styles/shared';
import { API_BASE } from '../../api/client';

// ── Animations ────────────────────────────────────────────────
const heroTextIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const heroSubIn = keyframes`
  from { opacity: 0; letter-spacing: 10px; }
  to   { opacity: 0.9; letter-spacing: 4px; }
`;

const heroBtnIn = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const kenBurns = keyframes`
  0%   { transform: scale(1); }
  100% { transform: scale(1.07); }
`;

// ── Styled Components ─────────────────────────────────────────
const HeroSection = styled.section`
  position: relative;
  overflow: hidden;
  height: 650px;
  @media (max-width: ${theme.breakpoints.md}) { height: 480px; }
`;

const SliderItem = styled.figure<{ $bg: string; $active: boolean }>`
  position: absolute; inset: 0;
  background-image: url(${({ $bg }) => $bg});
  background-size: cover;
  background-position: center;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.9s ease;
  z-index: ${({ $active }) => ($active ? 1 : 0)};
  margin: 0;
  ${({ $active }) => $active && css`
    animation: ${kenBurns} 8s ease-in-out forwards;
  `}
`;

const SliderOverlay = styled.span`
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
`;

const SliderContent = styled.aside`
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  text-align: center;
  z-index: 2;
`;

const SliderH1 = styled.h1<{ $animate: boolean }>`
  font-size: clamp(40px, 8vw, 90px);
  color: white;
  line-height: 1.2;
  font-weight: ${theme.fontWeights.normal};
  font-family: ${theme.fonts.display};
  margin-bottom: 10px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.3);
  white-space: pre-line;
  opacity: 0;
  ${({ $animate }) => $animate && css`
    animation: ${heroTextIn} 0.8s ease 0.2s both;
  `}
`;

const SliderH2 = styled.h2<{ $animate: boolean }>`
  color: rgba(255,255,255,0.9);
  font-weight: ${theme.fontWeights.light};
  font-size: ${theme.fontSizes.xs};
  letter-spacing: 4px;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 30px;
  opacity: 0;
  ${({ $animate }) => $animate && css`
    animation: ${heroSubIn} 0.9s ease 0s both;
  `}
`;

const SliderBtnWrap = styled.p<{ $animate: boolean }>`
  margin-top: 20px;
  opacity: 0;
  ${({ $animate }) => $animate && css`
    animation: ${heroBtnIn} 0.7s ease 0.5s both;
  `}
`;

const SliderArrow = styled.button<{ $dir: 'left' | 'right' }>`
  position: absolute;
  top: 50%; transform: translateY(-50%);
  z-index: 10;
  width: 50px; height: 50px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  transition: ${theme.transitions.base};
  ${({ $dir }) => $dir === 'left' ? 'left: 30px;' : 'right: 30px;'}
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
  @media (max-width: ${theme.breakpoints.md}) {
    ${({ $dir }) => $dir === 'left' ? 'left: 10px;' : 'right: 10px;'}
    width: 38px; height: 38px;
  }
  &:hover {
    background: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
    transform: translateY(-50%) scale(1.08);
  }
`;

const SliderContentInner = styled.article`
  padding: 0 60px;
  max-width: 900px;
  width: 100%;
`;

const SliderDots = styled.nav`
  position: absolute; bottom: 25px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 8px; z-index: 10;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '24px' : '8px')};
  height: 8px; border-radius: 4px;
  background: ${({ $active }) => ($active ? theme.colors.primary : 'rgba(255,255,255,0.5)')};
  transition: all 0.3s ease; border: none; cursor: pointer;
  &:hover { background: ${theme.colors.primaryLight}; }
`;

// Skeleton shown while sliders load
const SkeletonWrap = styled.div`
  height: 650px;
  background: linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 50%, #1a2e1a 100%);
  display: flex; align-items: center; justify-content: center;
  @media (max-width: ${theme.breakpoints.md}) { height: 480px; }
`;
const SkeletonPulse = styled.div`
  width: 60px; height: 60px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.2);
  border-top-color: ${theme.colors.primary};
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── Types ─────────────────────────────────────────────────────
export interface SlideData {
  id?:         string;
  image?:      string;   // from API  (local /uploads/... path)
  bg?:         string;   // legacy static path
  title:       string;
  subtitle?:   string;
  sub?:        string;   // legacy alias
  buttonText?: string;
  buttonLink?: string;
}

interface HeroSliderProps {
  slides:   SlideData[];
  loading?: boolean;
}

// ── Resolve image URL from either API or static data ──────────
const resolveImage = (s: SlideData): string => {
  const raw = s.image || s.bg || '';
  if (!raw) return '';
  if (raw.startsWith('http') || raw.startsWith('/images') || raw.startsWith('data:')) return raw;
  // local upload path — prefix with API base
  return `${API_BASE}${raw}`;
};

// ── Component ─────────────────────────────────────────────────
export const HeroSlider: React.FC<HeroSliderProps> = ({ slides, loading = false }) => {
  const [slide,   setSlide]   = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
      setAnimKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const prev = () => { setSlide((s) => (s - 1 + slides.length) % slides.length); setAnimKey((k) => k + 1); };
  const next = () => { setSlide((s) => (s + 1) % slides.length); setAnimKey((k) => k + 1); };

  if (loading) {
    return <SkeletonWrap><SkeletonPulse /></SkeletonWrap>;
  }

  if (slides.length === 0) {
    return <SkeletonWrap />;
  }

  const current = slides[slide];
  const subText   = current.subtitle || current.sub || '';
  const btnText   = current.buttonText || 'View Details';
  const btnLink   = current.buttonLink || '/shop';

  return (
    <HeroSection>
      {slides.map((s, i) => (
        <SliderItem key={s.id || i} $bg={resolveImage(s)} $active={slide === i}>
          <SliderOverlay />
        </SliderItem>
      ))}

      <SliderContent>
        <SliderContentInner key={animKey}>
          {subText && <SliderH2 $animate>{subText}</SliderH2>}
          <SliderH1 $animate>{current.title}</SliderH1>
          <SliderBtnWrap $animate>
            <Button as={Link as any} to={btnLink}>{btnText}</Button>
          </SliderBtnWrap>
        </SliderContentInner>
      </SliderContent>

      <SliderArrow $dir="left" onClick={prev} aria-label="Previous slide">
        <ChevronLeft size={22} />
      </SliderArrow>
      <SliderArrow $dir="right" onClick={next} aria-label="Next slide">
        <ChevronRight size={22} />
      </SliderArrow>

      <SliderDots>
        {slides.map((_, i) => (
          <Dot key={i} $active={i === slide} onClick={() => { setSlide(i); setAnimKey((k) => k + 1); }} />
        ))}
      </SliderDots>
    </HeroSection>
  );
};
