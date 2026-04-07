import React from 'react';
/**
 * src/admin/pages/dashboard/dashboardStyles.ts
 *
 * Single source of truth for ALL dashboard widget styled-components and
 * raw CSSProperties constants.  Every dashboard component imports from here
 * instead of duplicating styles inline.
 *
 * Exports
 * ───────
 *   Styled-components  : DashCard, CardHeader, CardTitle, CardSubtitle,
 *                        CardHeaderRow, MoreBtn, SkeletonBox, SkeletonCard,
 *                        ProgressBar, ProgressFill, StatRow, StatDivider,
 *                        StatItem, StatLabel, StatValue,
 *                        DashTable, DashThead, DashTbody, DashTr,
 *                        DashTh, DashTd
 *   CSSProperties consts: iconBoxStyle, chartWrapStyle
 *   Helper fns         : fmtCurrency, fmtNumber, statusBadgeColor
 */

import styled, { keyframes } from 'styled-components';
import { adminTheme as t } from '../../styles/adminTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Card shell
// ─────────────────────────────────────────────────────────────────────────────
export const DashCard = styled.div<{ $bg?: string; $overflow?: string }>`
  border-radius: ${t.radii.xl};
  border: 1px solid ${t.colors.border};
  background: ${({ $bg }) => $bg ?? t.colors.surface};
  overflow: ${({ $overflow }) => $overflow ?? 'visible'};
  font-family: ${t.fonts.body};
`;

export const CardPadding = styled.div`
  padding: 20px 24px;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Card header
// ─────────────────────────────────────────────────────────────────────────────
export const CardHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
`;

export const CardTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 1.0625rem;
  font-weight: 600;
  color: ${t.colors.textPrimary};
  font-family: ${t.fonts.heading};
  letter-spacing: -0.2px;
`;

export const CardSubtitle = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: ${t.colors.textMuted};
`;

// Three-dot menu trigger
export const MoreBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: ${t.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${t.colors.textMuted};
  transition: background ${t.transitions?.fast ?? '0.15s'};
  &:hover { background: ${t.colors.surfaceAlt}; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Metric / icon box (used in EcommerceMetrics)
// ─────────────────────────────────────────────────────────────────────────────
export const IconBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: ${t.colors.surfaceAlt};
  border-radius: ${t.radii.lg};
  flex-shrink: 0;
`;

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const MetricCard = styled(DashCard)`
  padding: 20px 24px;
`;

export const MetricBottom = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 20px;
`;

export const MetricLabel = styled.span`
  font-size: 0.8125rem;
  color: ${t.colors.textMuted};
  display: block;
`;

export const MetricValue = styled.h4`
  margin: 8px 0 0;
  font-weight: 700;
  font-size: 1.75rem;
  color: ${t.colors.textPrimary};
  letter-spacing: -0.5px;
  line-height: 1;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────────────────────
export const SkeletonBox = styled.div<{ $w?: number | string; $h?: number; $r?: number }>`
  width: ${({ $w }) => (typeof $w === 'number' ? `${$w}px` : ($w ?? '100%'))};
  height: ${({ $h }) => $h ?? 16}px;
  background: ${t.colors.surfaceAlt};
  border-radius: ${({ $r }) => $r ?? 6}px;
  animation: ${pulse} 1.5s ease infinite;
`;

export const SkeletonCard = styled(DashCard)`
  padding: 20px 24px;
  animation: ${pulse} 1.5s ease infinite;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar (used in DemographicCard)
// ─────────────────────────────────────────────────────────────────────────────
export const ProgressTrack = styled.div`
  position: relative;
  height: 8px;
  width: 100px;
  border-radius: ${t.radii.full};
  background: ${t.colors.border};
  flex-shrink: 0;
`;

export const ProgressFill = styled.div<{ $pct: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  border-radius: ${t.radii.full};
  background: ${t.colors.primary};
  transition: width 0.4s ease;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Bottom stats row (used in MonthlyTarget)
// ─────────────────────────────────────────────────────────────────────────────
export const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 14px 24px;
`;

export const StatDivider = styled.div`
  width: 1px;
  height: 28px;
  background: ${t.colors.border};
  flex-shrink: 0;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const StatLabel = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
`;

export const StatValue = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1rem;
  font-weight: 600;
  color: ${t.colors.textPrimary};
`;

// ─────────────────────────────────────────────────────────────────────────────
// Table primitives (used in RecentOrders)
// ─────────────────────────────────────────────────────────────────────────────
export const DashTable = styled.table`
  min-width: 100%;
  border-collapse: collapse;
`;

export const DashThead = styled.thead`
  border-top: 1px solid ${t.colors.border};
  border-bottom: 1px solid ${t.colors.border};
`;

export const DashTbody = styled.tbody``;

export const DashTr = styled.tr<{ $noBottom?: boolean }>`
  border-bottom: ${({ $noBottom }) => $noBottom ? 'none' : `1px solid ${t.colors.surfaceAlt}`};
`;

export const DashTh = styled.th`
  padding: 12px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${t.colors.textMuted};
  text-align: left;
  white-space: nowrap;
`;

export const DashTd = styled.td`
  padding: 12px 8px;
  font-size: 0.8125rem;
  color: ${t.colors.textSecondary};
  text-align: left;
  white-space: nowrap;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Chart tab toggle (used in ChartTab / StatisticsChart)
// ─────────────────────────────────────────────────────────────────────────────
export const TabGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: ${t.colors.surfaceAlt};
  border-radius: ${t.radii.md};
  padding: 2px;
`;

export const TabBtn = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: ${t.radii.sm};
  border: none;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: ${t.fonts.body};
  transition: all 0.15s ease;
  white-space: nowrap;
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  color: ${({ $active }) => ($active ? t.colors.textPrimary : t.colors.textMuted)};
  box-shadow: ${({ $active }) => ($active ? t.shadows.xs : 'none')};
`;

// Date range picker trigger wrapper (used in StatisticsChart)
export const DatePickerWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

export const DatePickerIcon = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
  color: ${t.colors.textMuted};
  display: flex;
`;

export const DatePickerInput = styled.input`
  height: 40px;
  width: 160px;
  padding-left: 36px;
  padding-right: 12px;
  border-radius: ${t.radii.md};
  border: 1px solid ${t.colors.border};
  background: ${t.colors.surface};
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${t.colors.textSecondary};
  font-family: ${t.fonts.body};
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: ${t.colors.primary}; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Country stat row (used in DemographicCard)
// ─────────────────────────────────────────────────────────────────────────────
export const CountryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const CountryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const CountryFlag = styled.span`
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
`;

export const CountryName = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 0.8125rem;
  color: ${t.colors.textPrimary};
`;

export const CountryCustomers = styled.span`
  font-size: 0.75rem;
  color: ${t.colors.textMuted};
`;

export const CountryBarWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 130px;
`;

export const CountryPct = styled.p`
  margin: 0;
  font-weight: 500;
  font-size: 0.8125rem;
  color: ${t.colors.textPrimary};
  min-width: 30px;
`;

export const MapBox = styled.div`
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.xl};
  overflow: hidden;
  padding: 24px 16px;
  margin-bottom: 24px;
  height: 220px;
`;

export const CountryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Badge (inline variant — used across all cards)
// ─────────────────────────────────────────────────────────────────────────────
export type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark';

export const BADGE_COLORS: Record<BadgeColor, { bg: string; text: string }> = {
  primary: { bg: '#ecf3ff', text: t.colors.primary },
  success: { bg: t.colors.successBg, text: t.colors.success },
  error:   { bg: t.colors.dangerBg,  text: t.colors.danger  },
  warning: { bg: t.colors.warningBg, text: t.colors.warning },
  info:    { bg: t.colors.infoBg,    text: t.colors.info    },
  light:   { bg: t.colors.surfaceAlt, text: t.colors.textSecondary },
  dark:    { bg: '#667085',           text: '#ffffff'        },
};

export const DashBadge = styled.span<{ $color: BadgeColor; $sm?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: ${({ $sm }) => ($sm ? '2px 8px' : '3px 10px')};
  border-radius: ${t.radii.full};
  font-size: ${({ $sm }) => ($sm ? '0.75rem' : '0.8125rem')};
  font-weight: 500;
  white-space: nowrap;
  background: ${({ $color }) => BADGE_COLORS[$color].bg};
  color: ${({ $color }) => BADGE_COLORS[$color].text};
`;

// ─────────────────────────────────────────────────────────────────────────────
// Error / empty state
// ─────────────────────────────────────────────────────────────────────────────
export const ErrorState = styled.div`
  padding: 24px;
  text-align: center;
  color: ${t.colors.danger};
  font-size: 0.8125rem;
  border: 1px solid #fecdca;
  border-radius: ${t.radii.xl};
  background: ${t.colors.surface};
`;

export const EmptyCell = styled.td`
  text-align: center;
  padding: 24px 0;
  color: ${t.colors.textMuted};
  font-size: 0.8125rem;
`;

// ─────────────────────────────────────────────────────────────────────────────
// RecentOrders header action buttons
// ─────────────────────────────────────────────────────────────────────────────
export const OutlineBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${t.radii.md};
  border: 1px solid ${t.colors.border};
  background: ${t.colors.surface};
  padding: 8px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${t.colors.textSecondary};
  cursor: pointer;
  font-family: ${t.fonts.body};
  transition: background 0.15s ease;
  text-decoration: none;
  &:hover { background: ${t.colors.surfaceAlt}; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper functions
// ─────────────────────────────────────────────────────────────────────────────

/** Format a number as a compact currency string. e.g. 1234 → "$1.2K" */
export const fmtCurrency = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}K`
  : `$${n.toFixed(0)}`;

/** Format a plain number with locale separators. */
export const fmtNumber = (n: number): string => n.toLocaleString();

/** Map an order status string to a BadgeColor. */
export const statusBadgeColor = (status: string): BadgeColor => {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'shipped':   return 'success';
    case 'processing':
    case 'pending':   return 'warning';
    case 'cancelled':
    case 'canceled':  return 'error';
    default:          return 'light';
  }
};

/** Shared three-dot SVG icon used across chart cards */
export const MoreDotSVG: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"
      stroke="#98a2b3" strokeWidth="2" strokeLinecap="round"
    />
  </svg>
);
