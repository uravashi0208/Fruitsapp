// ============================================================
// SECTION HEADER — reusable animated section title block
// Used on every page to ensure consistent heading style
// ============================================================
import React from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../../styles/theme';
import { fadeDown } from '../../styles/animations';
import { useInView } from '../../hooks/useInView';

interface Props {
  subheading?: string;
  title: string;
  description?: string;
  center?: boolean;
}

const Wrap = styled.header<{ $visible: boolean; $center: boolean }>`
  margin-bottom: 2.5rem;
  margin-top: 1rem;
  text-align: ${({ $center }) => $center ? 'center' : 'left'};
  opacity: 0;
  ${({ $visible }) => $visible && css`
    animation: ${fadeDown} 0.6s ease both;
  `}
`;

const Sub = styled.span`
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
`;

const Title = styled.h2`
  font-size: ${theme.fontSizes['4xl']};
  font-weight: ${theme.fontWeights.semibold};
  color: ${theme.colors.textDark};
  font-family: ${theme.fonts.heading};
  margin-bottom: 0.75rem;
  @media (max-width: ${theme.breakpoints.md}) { font-size: 28px; }
`;

const Desc = styled.p`
  max-width: 680px;
  margin: 0 auto;
  color: ${theme.colors.text};
  font-size: ${theme.fontSizes.base};
  line-height: 1.8;
`;

export const SectionHeader: React.FC<Props> = ({
  subheading,
  title,
  description,
  center = true,
}) => {
  const { ref, visible } = useInView(0.1);
  return (
    <Wrap ref={ref} $visible={visible} $center={center}>
      {subheading && <Sub>{subheading}</Sub>}
      <Title>{title}</Title>
      {description && <Desc>{description}</Desc>}
    </Wrap>
  );
};
