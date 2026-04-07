/**
 * src/admin/pages/dashboard/EcommerceMetrics.tsx
 * 2×2 grid of KPI cards: Customers, Orders, Revenue, Products.
 * Data from useAdminDashboard hook. All styling from dashboardStyles.ts.
 *
 * Component structure:
 *   1. Data hook  (useAdminDashboard)
 *   2. Derived    (metrics array built from stats)
 *   3. Render     (loading skeleton → error state → metric grid)
 */

import React from 'react';
import { useAdminDashboard } from '../../../hooks/useAdminApi';
import {
  MetricGrid, MetricCard, IconBox, MetricBottom, MetricLabel, MetricValue,
  SkeletonBox, SkeletonCard, ErrorState, DashBadge,
  fmtCurrency, fmtNumber,
} from './dashboardStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Icons (local — presentational only)
// ─────────────────────────────────────────────────────────────────────────────
const UsersIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8 7a4 4 0 1 1 8 0A4 4 0 0 1 8 7zm-5 9a7 7 0 0 1 14 0v1H3v-1zm16-2a5 5 0 0 1 2 4v1h-3v-1a7 7 0 0 0-1.5-4.33A5 5 0 0 1 19 14z"
      fill="#344054"
    />
  </svg>
);

const BoxIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M3 6l9-4 9 4v1L12 11 3 7V6zm0 2.5l9 4 9-4V17l-9 4-9-4V8.5z"
      fill="#344054"
    />
  </svg>
);

const RevenueIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 15h-1v-1h1v1zm0-3h-1V7h1v7z" fill="#344054"/>
  </svg>
);

const ProductIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M20 7l-8-4-8 4v10l8 4 8-4V7zm-8 1.5L5.5 7 12 3.5 18.5 7 12 8.5zm-7 2.27l6 3V19.5l-6-3v-6.73zm8 3v6.23l6-3v-6.23l-6 3z"
      fill="#344054"
    />
  </svg>
);

const ArrowUpIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5m-7 7 7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const EcommerceMetrics: React.FC = () => {
  // 1. Data hook
  const { data: stats, loading, error } = useAdminDashboard();

  // Loading skeleton
  if (loading || !stats) {
    return (
      <MetricGrid>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <SkeletonBox $w={48} $h={48} $r={12} />
            <div style={{ marginTop: 20 }}>
              <SkeletonBox $w={70} $h={12} />
              <SkeletonBox $w={100} $h={28} style={{ marginTop: 10 }} />
            </div>
          </SkeletonCard>
        ))}
      </MetricGrid>
    );
  }

  if (error) {
    return <ErrorState>Failed to load metrics. Please refresh.</ErrorState>;
  }

  // 2. Derived metrics array
  const metrics = [
    {
      icon:        <UsersIcon />,
      label:       'Customers',
      value:       fmtNumber(stats.users?.total ?? 0),
      badge:       <><ArrowUpIcon /> {stats.users?.active ?? 0} active</>,
      badgeColor:  'success' as const,
    },
    {
      icon:        <BoxIcon />,
      label:       'Orders',
      value:       fmtNumber(stats.orders?.total ?? 0),
      badge:       <>{stats.orders?.pending ?? 0} pending</>,
      badgeColor:  'warning' as const,
    },
    {
      icon:        <RevenueIcon />,
      label:       'Revenue',
      value:       fmtCurrency(stats.revenue?.total ?? 0),
      badge:       <><ArrowUpIcon /> {stats.orders?.paid ?? 0} paid</>,
      badgeColor:  'success' as const,
    },
    {
      icon:        <ProductIcon />,
      label:       'Products',
      value:       fmtNumber(stats.products?.total ?? 0),
      badge:       <>{stats.products?.outOfStock ?? 0} out of stock</>,
      badgeColor:  ((stats.products?.outOfStock ?? 0) > 0 ? 'error' : 'success') as 'error' | 'success',
    },
  ];

  // 3. Render
  return (
    <MetricGrid>
      {metrics.map((m) => (
        <MetricCard key={m.label}>
          <IconBox>{m.icon}</IconBox>
          <MetricBottom>
            <div>
              <MetricLabel>{m.label}</MetricLabel>
              <MetricValue>{m.value}</MetricValue>
            </div>
            <DashBadge $color={m.badgeColor}>{m.badge}</DashBadge>
          </MetricBottom>
        </MetricCard>
      ))}
    </MetricGrid>
  );
};

export default EcommerceMetrics;
