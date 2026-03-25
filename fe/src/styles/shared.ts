// ============================================================
// VEGEFOODS — Shared Styled Components
// Faithful to original Colorlib template design:
//   Primary: #82ae46  |  Fonts: Poppins, Lora, Amatic SC
//   Buttons: 30px pill radius  |  Sections: 6em padding
// ============================================================
import styled, { css } from 'styled-components';
import { theme } from './theme';

// ── Layout ────────────────────────────────────────────────────
export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
`;

export const Section = styled.section<{
  $bg?: string;
  $noPt?: boolean;
  $noPb?: boolean;
}>`
  padding: ${({ $noPt, $noPb }) =>
    $noPt && $noPb ? '0' :
    $noPt ? `0 0 6em` :
    $noPb ? `6em 0 0` :
    `3em 0`};
  position: relative;
  background: ${({ $bg }) => $bg ?? 'transparent'};
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -15px;
`;

export const Flex = styled.div<{
  $align?: string;
  $justify?: string;
  $gap?: string;
  $wrap?: boolean;
  $direction?: string;
}>`
  display: flex;
  align-items: ${({ $align }) => $align ?? 'center'};
  justify-content: ${({ $justify }) => $justify ?? 'flex-start'};
  gap: ${({ $gap }) => $gap ?? '0'};
  flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};
  flex-direction: ${({ $direction }) => $direction ?? 'row'};
`;

export const Grid = styled.div<{
  $cols?: number;
  $gap?: string;
  $colsMd?: number;
  $colsSm?: number;
}>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 4}, 1fr);
  gap: ${({ $gap }) => $gap ?? '30px'};

  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: repeat(${({ $colsMd }) => $colsMd ?? 2}, 1fr);
  }
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: repeat(${({ $colsSm }) => $colsSm ?? 1}, 1fr);
  }
`;

// ── Typography ────────────────────────────────────────────────
export const Heading = styled.h2<{
  $size?: string;
  $color?: string;
}>`
  font-family: ${theme.fonts.body};
  font-size: ${({ $size }) =>
    $size === '5xl' ? '8vw'  :
    $size === '4xl' ? '40px' :
    $size === '3xl' ? '30px' :
    $size === '2xl' ? '24px' :
    $size === 'xl'  ? '20px' :
    $size === 'lg'  ? '18px' :
    $size === 'md'  ? '16px' :
    $size === 'sm'  ? '14px' : '40px'};
  font-weight: ${theme.fontWeights.semibold};
  color: ${({ $color }) => $color ?? theme.colors.textDark};
  line-height: 1.3;

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${({ $size }) => ($size === '5xl' || $size === '4xl') ? '28px' : undefined};
  }
`;

export const SubHeading = styled.span`
  color: ${theme.colors.primary};
  font-weight: ${theme.fontWeights.light};
  font-size: ${theme.fontSizes.xs};
  letter-spacing: 4px;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 6px;
`;

export const Text = styled.p<{ $muted?: boolean; $size?: string }>`
  font-size: ${({ $size }) => $size ?? theme.fontSizes.base};
  color: ${({ $muted }) => ($muted ? theme.colors.textMuted : theme.colors.text)};
  line-height: 1.8;
  margin: 0;
`;

export const SectionHeader = styled.header`
  text-align: center;
  margin-bottom: 2rem;
`;

// ── Buttons — original 30px pill ─────────────────────────────
export const Button = styled.button<{ $variant?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 30px;
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.base};
  font-weight: ${theme.fontWeights.normal};
  cursor: pointer;
  box-shadow: ${theme.shadows.btn};
  transition: all 0.3s ease;
  text-decoration: none;
  white-space: nowrap;
  line-height: 1;
  border: 1px solid;

  /* variant logic */
  background: ${({ $variant }) =>
    $variant === 'outline' || $variant === 'ghost' ? 'transparent' :
    $variant === 'secondary' ? theme.colors.textDark :
    $variant === 'danger'    ? '#dc3545' :
    theme.colors.primary};

  border-color: ${({ $variant }) =>
    $variant === 'outline' || $variant === 'ghost' ? theme.colors.primary :
    $variant === 'secondary' ? theme.colors.textDark :
    $variant === 'danger'    ? '#dc3545' :
    theme.colors.primary};

  color: ${({ $variant }) =>
    $variant === 'outline' || $variant === 'ghost' ? theme.colors.primary :
    '#fff'};

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'outline' || $variant === 'ghost' ? theme.colors.primary :
      $variant === 'danger'   ? '#c82333' :
      'transparent'};
    color: ${({ $variant }) =>
      $variant === 'danger'   ? '#fff' :
      $variant === 'outline' || $variant === 'ghost' ? '#fff' :
      theme.colors.primary};
    border-color: ${({ $variant }) =>
      $variant === 'danger' ? '#c82333' : theme.colors.primary};
    text-decoration: none;
  }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
`;

// ── Card — white with original border ─────────────────────────
export const Card = styled.article<{ $hover?: boolean }>`
  background: white;
  border: 1px solid ${theme.colors.border};
  transition: all 0.3s ease;
  overflow: hidden;

  ${({ $hover }) => $hover && css`
    &:hover {
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      transform: translateY(-4px);
    }
  `}
`;

// ── Badge — original status pill ──────────────────────────────
export const Badge = styled.span<{ $variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 30px;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.light};

  background: ${({ $variant }) =>
    $variant === 'success' ? 'rgba(130,174,70,0.12)' :
    $variant === 'warning' ? 'rgba(255,193,7,0.15)' :
    $variant === 'danger'  ? 'rgba(220,53,69,0.12)' :
    $variant === 'info'    ? 'rgba(23,162,184,0.12)' :
    theme.colors.primary};

  color: ${({ $variant }) =>
    $variant === 'success' ? theme.colors.primary :
    $variant === 'warning' ? '#856404' :
    $variant === 'danger'  ? '#dc3545' :
    $variant === 'info'    ? '#17a2b8' :
    '#fff'};
`;

// ── Tag chips ─────────────────────────────────────────────────
export const Tag = styled.button<{ $active?: boolean }>`
  padding: 8px 20px;
  border-radius: 30px;
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.base};
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${({ $active }) => ($active ? theme.colors.primary : '#dee2e6')};
  background: ${({ $active }) => ($active ? theme.colors.primary : 'white')};
  color: ${({ $active }) => ($active ? 'white' : theme.colors.text)};

  &:hover {
    background: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
    color: white;
  }
`;

// ── Input — original rounded ──────────────────────────────────
export const Input = styled.input`
  width: 100%;
  padding: 10px 20px;
  border: 1px solid #dee2e6;
  border-radius: 30px;
  font-family: ${theme.fonts.body};
  font-size: ${theme.fontSizes.base};
  color: ${theme.colors.textDark};
  background: white;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder { color: rgba(0,0,0,0.3); }
  &:focus { border-color: ${theme.colors.primary}; }
`;

// ── Divider ───────────────────────────────────────────────────
export const Divider = styled.div<{ $my?: string }>`
  border: none;
  border-top: 1px solid #dee2e6;
  margin: ${({ $my }) => $my ?? '20px'} 0;
  height: 0;
`;

// ── Quantity Controls ─────────────────────────────────────────
export const QuantityWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const QuantityBtn = styled.button`
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 1px solid #dee2e6;
  display: flex; align-items: center; justify-content: center;
  background: white;
  color: ${theme.colors.primary};
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: all 0.3s ease;
  &:hover {
    background: ${theme.colors.primary};
    color: white;
    border-color: ${theme.colors.primary};
  }
`;

export const QuantityNum = styled.span`
  min-width: 30px;
  text-align: center;
  font-weight: ${theme.fontWeights.medium};
  color: ${theme.colors.textDark};
  font-size: ${theme.fontSizes.base};
`;

// ── StarRow ───────────────────────────────────────────────────
export const StarRow = styled.div`
  display: flex;
  gap: 2px;
  color: #ffc107;
  font-size: 14px;
`;
