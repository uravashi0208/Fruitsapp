// ============================================================
// SKELETON LOADER — common skeletons for all loading states
// Use these instead of writing ad-hoc skeleton CSS per component
// ============================================================
import React from 'react';
import styled from 'styled-components';

// Base shimmer block
const Shimmer = styled.div<{
  $w?: string;
  $h?: string;
  $radius?: string;
  $mb?: string;
}>`
  background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  border-radius: ${({ $radius }) => $radius ?? '4px'};
  margin-bottom: ${({ $mb }) => $mb ?? '8px'};

  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
`;

// ── Exported primitives ────────────────────────────────────────

/** Generic shimmer line */
export const SkeletonLine: React.FC<{
  width?: string;
  height?: string;
  marginBottom?: string;
}> = ({ width, height, marginBottom }) => (
  <Shimmer $w={width} $h={height ?? '14px'} $mb={marginBottom} />
);

/** Circle avatar / icon placeholder */
export const SkeletonCircle: React.FC<{ size?: string }> = ({ size = '80px' }) => (
  <Shimmer $w={size} $h={size} $radius="50%" $mb="16px" style={{ flexShrink: 0 }} />
);

/** Rectangular image placeholder */
export const SkeletonImage: React.FC<{ height?: string }> = ({ height = '220px' }) => (
  <Shimmer $w="100%" $h={height} $radius="0" $mb="0" />
);

// ── Pre-built composite skeletons ─────────────────────────────

const CardWrap = styled.div`
  border: 1px solid #f0f0f0;
  background: white;
  overflow: hidden;
`;
const CardBody = styled.div`
  padding: 16px;
`;

/** Product card skeleton */
export const SkeletonProductCard: React.FC = () => (
  <CardWrap>
    <SkeletonImage height="220px" />
    <CardBody>
      <SkeletonLine width="70%" />
      <SkeletonLine width="40%" height="12px" />
    </CardBody>
  </CardWrap>
);

const TestiCardWrap = styled.div`
  background: rgba(255,255,255,0.1);
  padding: 30px;
  display: flex; flex-direction: column; align-items: center;
`;

/** Testimonial card skeleton */
export const SkeletonTestimonialCard: React.FC = () => (
  <TestiCardWrap>
    <SkeletonCircle size="100px" />
    <SkeletonLine width="60%" />
    <SkeletonLine width="40%" height="12px" />
    <SkeletonLine />
    <SkeletonLine />
    <SkeletonLine width="80%" />
  </TestiCardWrap>
);

/** Page loader spinner */
const SpinnerWrap = styled.div`
  min-height: 60vh;
  display: flex; align-items: center; justify-content: center;
`;

const SpinnerRing = styled.div`
  width: 36px; height: 36px;
  border: 3px solid #e8f5e9;
  border-top-color: #82ae46;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export const PageSpinner: React.FC = () => (
  <SpinnerWrap><SpinnerRing /></SpinnerWrap>
);
