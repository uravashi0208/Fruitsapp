/**
 * src/admin/pages/dashboard/MonthlyTarget.tsx
 * Radial progress card showing revenue vs monthly target.
 * Data from useAdminDashboard. Styling from dashboardStyles.ts.
 *
 * Component structure:
 *   1. useState  (1a. dropdown open)
 *   2. Data hook (useAdminDashboard)
 *   3. Derived   (pct, todayRevenue)
 *   4. Chart options (ApexOptions radialBar)
 *   5. Render    (top card → bottom stats row)
 */

import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Dropdown }     from '../../theme-components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../theme-components/ui/dropdown/DropdownItem';
import { useAdminDashboard } from '../../../hooks/useAdminApi';
import {
  DashCard, CardHeaderRow, CardTitle, CardSubtitle,
  MoreBtn, MoreDotSVG,
  StatsRow, StatItem, StatLabel, StatValue, StatDivider,
  fmtCurrency,
} from './dashboardStyles';
import { adminTheme as t } from '../../styles/adminTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const ArrowUpGreen: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004V13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5V4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
      fill={t.colors.success}
    />
  </svg>
);

const ArrowDownRed: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M7.26816 13.6632C7.4056 13.8192 7.60686 13.9176 7.8311 13.9176C8.02445 13.9178 8.21671 13.8447 8.36339 13.6981L12.3635 9.70076C12.6565 9.40797 12.6567 8.9331 12.3639 8.6401C12.0711 8.34711 11.5962 8.34694 11.3032 8.63973L8.5811 11.36V2.5C8.5811 2.08579 8.24531 1.75 7.8311 1.75C7.41688 1.75 7.0811 2.08579 7.0811 2.5V11.3556L4.36354 8.63975C4.07055 8.34695 3.59568 8.3471 3.30288 8.64009C3.01008 8.93307 3.01023 9.40794 3.30321 9.70075L7.26816 13.6632Z"
      fill={t.colors.danger}
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MONTHLY_TARGET = 20_000;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const MonthlyTarget: React.FC = () => {
  // 1a. UI state
  const [isOpen, setIsOpen] = useState(false);

  // 2. Data hook
  const { data: stats } = useAdminDashboard();

  // 3. Derived values
  const totalRevenue     = stats?.revenue?.total ?? 0;
  const pct              = totalRevenue > 0 ? Math.min(Math.round((totalRevenue / MONTHLY_TARGET) * 100), 100) : 0;
  const currentMonth     = new Date().toLocaleString('en-US', { month: 'short' });
  const currentMonthData = stats?.revenueChart?.find((r: any) => r.month === currentMonth);
  const todayRevenue     = currentMonthData?.revenue ?? 0;

  // 4. Chart options
  const options: ApexOptions = {
    colors: [t.colors.primary],
    chart: {
      fontFamily: t.fonts.body,
      type:       'radialBar',
      height:     330,
      sparkline:  { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle:    85,
        hollow:     { size: '80%' },
        track:      { background: t.colors.border, strokeWidth: '100%', margin: 5 },
        dataLabels: {
          name:  { show: false },
          value: {
            fontSize:   '36px',
            fontWeight: '600',
            offsetY:    -40,
            color:      t.colors.textPrimary,
            formatter:  (val: number) => `${val}%`,
          },
        },
      },
    },
    fill:   { type: 'solid', colors: [t.colors.primary] },
    stroke: { lineCap: 'round' },
    labels: ['Progress'],
  };

  // 5. Render
  return (
    <DashCard $bg={t.colors.surfaceAlt} $overflow="hidden">
      {/* Top card with radial chart */}
      <div style={{
        background:   t.colors.surface,
        borderRadius: t.radii.xl,
        padding:      '20px 24px 44px',
        boxShadow:    t.shadows.sm,
      }}>
        <CardHeaderRow style={{ marginBottom: 4 }}>
          <div>
            <CardTitle>Monthly Target</CardTitle>
            <CardSubtitle>Target you've set for each month</CardSubtitle>
          </div>
          <div style={{ position: 'relative' }}>
            <MoreBtn className="dropdown-toggle" onClick={() => setIsOpen((v) => !v)}>
              <MoreDotSVG />
            </MoreBtn>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <div style={{ padding: 8, minWidth: 140 }}>
                <DropdownItem onItemClick={() => setIsOpen(false)}>View More</DropdownItem>
                <DropdownItem onItemClick={() => setIsOpen(false)}>Delete</DropdownItem>
              </div>
            </Dropdown>
          </div>
        </CardHeaderRow>

        <div style={{ position: 'relative' }}>
          <Chart options={options} series={[pct]} type="radialBar" height={330} />
          <span style={{
            position:  'absolute',
            left:      '50%',
            bottom:    0,
            transform: 'translateX(-50%) translateY(50%)',
            borderRadius: t.radii.full,
            background: t.colors.successBg,
            padding:   '3px 12px',
            fontSize:  '0.75rem',
            fontWeight: 500,
            color:     t.colors.success,
          }}>
            +10%
          </span>
        </div>

        <p style={{
          textAlign:  'center',
          margin:     '40px auto 0',
          fontSize:   '0.8125rem',
          color:      t.colors.textMuted,
          maxWidth:   380,
          lineHeight: 1.6,
        }}>
          You earn {fmtCurrency(totalRevenue || 3287)} today, it's higher than last month.
          Keep up your good work!
        </p>
      </div>

      {/* Bottom stats row */}
      <StatsRow>
        <StatItem>
          <StatLabel>Target</StatLabel>
          <StatValue>{fmtCurrency(MONTHLY_TARGET)} <ArrowDownRed /></StatValue>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatLabel>Revenue</StatLabel>
          <StatValue>{fmtCurrency(Math.round(totalRevenue) || 20000)} <ArrowUpGreen /></StatValue>
        </StatItem>
        <StatDivider />
        <StatItem>
          <StatLabel>Today</StatLabel>
          <StatValue>{fmtCurrency(Math.round(todayRevenue) || 3287)} <ArrowUpGreen /></StatValue>
        </StatItem>
      </StatsRow>
    </DashCard>
  );
};

export default MonthlyTarget;
