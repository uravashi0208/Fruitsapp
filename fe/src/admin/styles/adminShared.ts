/**
 * adminShared.ts
 * Styled-components with TailAdmin visual style.
 * Color palette: brand-500 = #465fff, Outfit font, clean whites + gray-50 bg
 */
import styled, { css, createGlobalStyle } from 'styled-components';
import { adminTheme as t } from './adminTheme';

// ── Global ────────────────────────────────────────────────────
export const AdminGlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .admin-root *, .admin-root *::before, .admin-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .admin-root {
    font-family: ${t.fonts.body};
    font-size: 14px;
    color: ${t.colors.textPrimary};
    background: ${t.colors.bg};
    -webkit-font-smoothing: antialiased;
  }
  .admin-root h1, .admin-root h2, .admin-root h3,
  .admin-root h4, .admin-root h5, .admin-root h6 {
    font-family: ${t.fonts.heading};
    font-weight: 600;
    color: ${t.colors.textPrimary};
  }
  @keyframes adminFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes adminSlideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes adminScaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes adminSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes adminPulse {
    0%,100% { opacity: 1; }
    50%     { opacity: 0.4; }
  }
  @keyframes adminPing {
    75%,100% { transform: scale(2); opacity: 0; }
  }
`;

// ── Layout ────────────────────────────────────────────────────
export const AdminCard = styled.div<{ $p?: string; $animate?: boolean }>`
  background: ${t.colors.surface};
  border-radius: ${t.radii.xl};
  box-shadow: ${t.shadows.sm};
  border: 1px solid ${t.colors.border};
  padding: ${({ $p }) => $p ?? t.spacing.xl};
  transition: background 0.2s ease, border-color 0.2s ease;
  ${({ $animate }) => $animate && css`animation: adminFadeIn 0.3s ease both;`}
  html.dark & { background: #1e2533; border-color: #2a3347; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
`;

export const AdminGrid = styled.div<{ $cols?: number; $gap?: string; $colsMd?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 4}, 1fr);
  gap: ${({ $gap }) => $gap ?? t.spacing.lg};
  @media (max-width: 1200px) { grid-template-columns: repeat(${({ $colsMd }) => $colsMd ?? 2}, 1fr); }
  @media (max-width: 640px)  { grid-template-columns: 1fr; }
`;

export const AdminFlex = styled.div<{ $align?: string; $justify?: string; $gap?: string; $wrap?: boolean }>`
  display: flex;
  align-items: ${({ $align }) => $align ?? 'center'};
  justify-content: ${({ $justify }) => $justify ?? 'flex-start'};
  gap: ${({ $gap }) => $gap ?? '0'};
  flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};
`;

// ── Typography ────────────────────────────────────────────────
export const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  letter-spacing: -0.3px;
`;

export const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: ${t.colors.textPrimary};
  html.dark & { color: #f0f4fa; }
`;

export const BodyText = styled.p<{ $muted?: boolean; $size?: string }>`
  font-size: ${({ $size }) => $size ?? '0.875rem'};
  color: ${({ $muted }) => ($muted ? t.colors.textSecondary : t.colors.textPrimary)};
  line-height: 1.6;
  html.dark & { color: ${({ $muted }) => ($muted ? '#8b9ab5' : '#c4cfe0')}; }
`;

// ── Form elements ─────────────────────────────────────────────
export const AdminInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.lg};
  font-family: ${t.fonts.body};
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  transition: all ${t.transitions.fast}, background 0.2s ease;
  box-shadow: ${t.shadows.xs};

  &::placeholder { color: ${t.colors.textMuted}; }
  &:focus { border-color: ${t.colors.primary}; box-shadow: ${t.shadows.focus}; }
  &:disabled { background: ${t.colors.surfaceAlt}; cursor: not-allowed; opacity: 0.7; }
  html.dark & { background: #252e42; border-color: #2a3347; color: #f0f4fa; }
  html.dark &::placeholder { color: #6b7a99; }
  html.dark &:focus { border-color: #465fff; }
  html.dark &:disabled { background: #1e2533; }
`;

export const AdminSelect = styled.select`
  width: 100%;
  padding: 0.625rem 2rem 0.625rem 0.875rem;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.lg};
  font-family: ${t.fonts.body};
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2398a2b3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 8px center / 16px;
  appearance: none;
  outline: none;
  cursor: pointer;
  box-shadow: ${t.shadows.xs};
  transition: border-color ${t.transitions.fast}, background 0.2s ease;
  &:focus { border-color: ${t.colors.primary}; box-shadow: ${t.shadows.focus}; }
  html.dark & { background-color: #252e42; border-color: #2a3347; color: #f0f4fa; }
  html.dark &:focus { border-color: #465fff; }
`;

export const AdminTextarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.lg};
  font-family: ${t.fonts.body};
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  resize: vertical;
  min-height: 100px;
  box-shadow: ${t.shadows.xs};
  transition: border-color ${t.transitions.fast}, background 0.2s ease;
  &::placeholder { color: ${t.colors.textMuted}; }
  &:focus { border-color: ${t.colors.primary}; box-shadow: ${t.shadows.focus}; }
  html.dark & { background: #252e42; border-color: #2a3347; color: #f0f4fa; }
  html.dark &::placeholder { color: #6b7a99; }
  html.dark &:focus { border-color: #465fff; }
`;

export const FormGroup = styled.div<{ $span?: number }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  ${({ $span }) => $span && css`grid-column: span ${$span};`}
`;

export const FormLabel = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${t.colors.textSecondary};
  html.dark & { color: #a8b5cc; }
`;

export const FormGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols ?? 2}, 1fr);
  gap: ${t.spacing.md};
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

// ── Buttons ───────────────────────────────────────────────────
const btnBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: ${t.radii.lg};
  font-family: ${t.fonts.body};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all ${t.transitions.base};
  white-space: nowrap;
  text-decoration: none;
  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
`;

export const AdminBtn = styled.button<{
  $variant?: 'primary'|'secondary'|'outline'|'ghost'|'danger'|'warning'|'success';
  $size?: 'sm'|'md'|'lg';
}>`
  ${btnBase}
  ${({ $size = 'md' }) => {
    const s = { sm: '0.375rem 0.75rem', md: '0.55rem 1.1rem', lg: '0.75rem 1.5rem' };
    return css`padding: ${s[$size]};`;
  }}
  ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'primary':   return css`background:${t.colors.primary};color:white;border-color:${t.colors.primary};&:hover{background:${t.colors.primaryDark};border-color:${t.colors.primaryDark};box-shadow:0 4px 12px rgba(70,95,255,0.3);}`;
      case 'secondary': return css`background:#101828;color:white;&:hover{background:#1d2939;}`;
      case 'outline':   return css`background:transparent;color:${t.colors.textPrimary};border-color:${t.colors.border};&:hover{border-color:${t.colors.primary};color:${t.colors.primary};background:${t.colors.primaryGhost};}`;
      case 'ghost':     return css`background:${t.colors.surfaceAlt};color:${t.colors.textSecondary};&:hover{background:${t.colors.border};color:${t.colors.textPrimary};}`;
      case 'danger':    return css`background:${t.colors.dangerBg};color:${t.colors.danger};&:hover{background:${t.colors.danger};color:white;}`;
      case 'warning':   return css`background:${t.colors.warningBg};color:${t.colors.warning};&:hover{background:${t.colors.warning};color:white;}`;
      case 'success':   return css`background:${t.colors.successBg};color:${t.colors.success};&:hover{background:${t.colors.success};color:white;}`;
    }
  }}
`;

export const IconBtn = styled.button<{ $variant?: 'ghost'|'danger'|'warning'|'primary'; $size?: 'sm'|'md' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${t.radii.md};
  border: none;
  cursor: pointer;
  transition: all ${t.transitions.fast};
  ${({ $size = 'sm' }) => {
    const s = { sm: '30px', md: '36px' };
    return css`width:${s[$size]};height:${s[$size]};`;
  }}
  ${({ $variant = 'ghost' }) => {
    switch ($variant) {
      case 'ghost':   return css`background:transparent;color:${t.colors.textMuted};&:hover{background:${t.colors.surfaceAlt};color:${t.colors.textPrimary};}`;
      case 'danger':  return css`background:transparent;color:${t.colors.textMuted};&:hover{background:${t.colors.dangerBg};color:${t.colors.danger};}`;
      case 'warning': return css`background:transparent;color:${t.colors.textMuted};&:hover{background:${t.colors.warningBg};color:${t.colors.warning};}`;
      case 'primary': return css`background:${t.colors.primaryGhost};color:${t.colors.primary};&:hover{background:${t.colors.primary};color:white;}`;
    }
  }}
`;

// ── Badge / Status pill ───────────────────────────────────────
export const StatusPill = styled.span<{
  $variant: 'success'|'warning'|'danger'|'info'|'neutral'
}>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.2rem 0.65rem;
  border-radius: ${t.radii.full};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  ${({ $variant }) => {
    switch ($variant) {
      case 'success': return css`background:${t.colors.successBg};color:${t.colors.success};`;
      case 'warning': return css`background:${t.colors.warningBg};color:${t.colors.warning};`;
      case 'danger':  return css`background:${t.colors.dangerBg};color:${t.colors.danger};`;
      case 'info':    return css`background:${t.colors.infoBg};color:${t.colors.info};`;
      case 'neutral': return css`background:#f2f4f7;color:#475467;`;
    }
  }}
`;

// ── Table ─────────────────────────────────────────────────────
export const AdminTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

export const AdminTHead = styled.thead`
  background: ${t.colors.surfaceAlt};
  border-bottom: 1px solid ${t.colors.border};
  html.dark & { background: #252e42; border-bottom-color: #2a3347; }
`;

export const AdminTh = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${t.colors.textMuted};
  white-space: nowrap;
  user-select: none;
  &:hover { color: ${t.colors.textSecondary}; }
`;

export const AdminTr = styled.tr`
  border-bottom: 1px solid ${t.colors.border};
  transition: background ${t.transitions.fast};
  animation: adminFadeIn 0.2s ease both;
  &:last-child { border-bottom: none; }
  &:hover { background: ${t.colors.surfaceAlt}; }
  html.dark & { border-bottom-color: #2a3347; }
  html.dark &:hover { background: #252e42; }
`;

export const AdminTd = styled.td`
  padding: 0.875rem 1rem;
  color: ${t.colors.textPrimary};
  vertical-align: middle;
  html.dark & { color: #c4cfe0; }
`;

// ── Search bar ────────────────────────────────────────────────
export const SearchBar = styled.div`
  position: relative;
  flex: 1;
  max-width: 320px;
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${t.colors.textMuted};
    pointer-events: none;
  }
`;

export const SearchInput = styled(AdminInput)`
  padding-left: 2.2rem;
  font-size: 0.8125rem;
  border-radius: ${t.radii.full};
`;

// ── Pagination ────────────────────────────────────────────────
export const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${t.spacing.md} ${t.spacing.lg};
  border-top: 1px solid ${t.colors.border};
  font-size: 0.8125rem;
  color: ${t.colors.textSecondary};
  flex-wrap: wrap;
  gap: ${t.spacing.sm};
  html.dark & { border-top-color: #2a3347; color: #8b9ab5; }
`;

export const PageBtns = styled.div`display: flex; gap: 4px;`;

export const PageBtn = styled.button<{ $active?: boolean }>`
  width: 37px;
  height: 37px;
  border-radius: ${t.radii.md};
  border: 1px solid ${({ $active }) => ($active ? t.colors.primary : t.colors.border)};
  background: ${({ $active }) => ($active ? t.colors.primary : 'white')};
  color: ${({ $active }) => ($active ? 'white' : t.colors.textPrimary)};
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${t.transitions.fast};
  &:hover:not(:disabled) { border-color: ${t.colors.primary}; color: ${({ $active }) => $active ? 'white' : t.colors.primary}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  html.dark & { background: ${({ $active }) => $active ? t.colors.primary : '#252e42'}; border-color: ${({ $active }) => $active ? t.colors.primary : '#2a3347'}; color: ${({ $active }) => $active ? 'white' : '#c4cfe0'}; }
`;

// ── Modal ─────────────────────────────────────────────────────
export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: ${t.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${t.spacing.lg};
  animation: adminFadeIn 0.15s ease;
`;

export const ModalBox = styled.div<{ $width?: string }>`
  background: white;
  border-radius: ${t.radii.xl};
  box-shadow: ${t.shadows.lg};
  width: 100%;
  max-width: ${({ $width }) => $width ?? '540px'};
  max-height: 90vh;
  overflow-y: auto;
  animation: adminScaleIn 0.2s ease;
  border: 1px solid ${t.colors.border};
  html.dark & { background: #1e2533; border-color: #2a3347; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${t.spacing.lg} ${t.spacing.xl};
  border-bottom: 1px solid ${t.colors.border};
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
  border-radius: ${t.radii.xl} ${t.radii.xl} 0 0;
  html.dark & { background: #1e2533; border-bottom-color: #2a3347; }
`;

export const ModalBody = styled.div`padding: ${t.spacing.xl};`;

export const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${t.spacing.sm};
  padding: ${t.spacing.md} ${t.spacing.xl};
  border-top: 1px solid ${t.colors.border};
  background: ${t.colors.surfaceAlt};
  border-radius: 0 0 ${t.radii.xl} ${t.radii.xl};
  html.dark & { background: #252e42; border-top-color: #2a3347; }
`;


// ── Toggle Switch ─────────────────────────────────────────────
export const ToggleTrack = styled.label<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: ${({ $on }) => $on ? '#465fff' : '#d0d5dd'};
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
`;

export const ToggleThumb = styled.span<{ $on: boolean }>`
  position: absolute;
  left: ${({ $on }) => $on ? '22px' : '2px'};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: left 0.2s;
`;

// ── Misc ──────────────────────────────────────────────────────
export const AdminDivider = styled.hr`
  border: none;
  border-top: 1px solid ${t.colors.border};
  margin: ${t.spacing.lg} 0;
  html.dark & { border-top-color: #2a3347; }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: ${t.spacing['2xl']};
  color: ${t.colors.textMuted};
  svg { color: ${t.colors.border}; margin-bottom: ${t.spacing.md}; }
  h3 { font-size: 1rem; color: ${t.colors.textSecondary}; margin-bottom: 6px; }
  p  { font-size: 0.8125rem; }
  html.dark & { color: #6b7a99; }
  html.dark & svg { color: #3d4f6e; }
  html.dark & h3 { color: #8b9ab5; }
`;
