import React from 'react';
import Badge from './Badge';
import { useAdminDashboard } from '../../../hooks/useAdminApi';

const card: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e4e7ec',
  background: '#ffffff',
  padding: '20px 24px',
  fontFamily: 'Outfit, sans-serif',
};

const iconBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  background: '#f2f4f7',
  borderRadius: 12,
};

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 7a4 4 0 1 1 8 0A4 4 0 0 1 8 7zm-5 9a7 7 0 0 1 14 0v1H3v-1zm16-2a5 5 0 0 1 2 4v1h-3v-1a7 7 0 0 0-1.5-4.33A5 5 0 0 1 19 14z" fill="#344054"/>
  </svg>
);

const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 6l9-4 9 4v1L12 11 3 7V6zm0 2.5l9 4 9-4V17l-9 4-9-4V8.5z" fill="#344054"/>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 19V5m-7 7 7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const skeletonCard: React.CSSProperties = {
  ...card,
  animation: 'adminPulse 1.5s ease infinite',
};

const skeletonBar = (w: number, h: number): React.CSSProperties => ({
  width: w, height: h, background: '#f2f4f7', borderRadius: 6,
});

const EcommerceMetrics: React.FC = () => {
  const { data: stats, loading, error } = useAdminDashboard();

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000    ? `$${(n / 1000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

  if (loading || !stats) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={skeletonCard}>
            <div style={{ ...skeletonBar(48, 48), borderRadius: 12 }} />
            <div style={{ marginTop: 20 }}>
              <div style={skeletonBar(70, 12)} />
              <div style={{ ...skeletonBar(100, 28), marginTop: 10 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#f04438', fontSize: 13, fontFamily: 'Outfit, sans-serif', border: '1px solid #fecdca', borderRadius: 16, background: '#fff' }}>
        Failed to load metrics. Please refresh.
      </div>
    );
  }

  const metrics = [
    {
      icon: <UsersIcon />,
      label: 'Customers',
      value: (stats.users?.total ?? 0).toLocaleString(),
      badge: <><ArrowUpIcon /> {stats.users?.active ?? 0} active</>,
      badgeColor: 'success' as const,
    },
    {
      icon: <BoxIcon />,
      label: 'Orders',
      value: (stats.orders?.total ?? 0).toLocaleString(),
      badge: <>{stats.orders?.pending ?? 0} pending</>,
      badgeColor: 'warning' as const,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M11.5 2C6.26 2 2 6.26 2 11.5S6.26 21 11.5 21 21 16.74 21 11.5 16.74 2 11.5 2zm.5 15h-1v-1h1v1zm0-3h-1V7h1v7z" fill="#344054"/>
        </svg>
      ),
      label: 'Revenue',
      value: fmt(stats.revenue?.total ?? 0),
      badge: <><ArrowUpIcon /> {stats.orders?.paid ?? 0} paid</>,
      badgeColor: 'success' as const,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M20 7l-8-4-8 4v10l8 4 8-4V7zm-8 1.5L5.5 7 12 3.5 18.5 7 12 8.5zm-7 2.27l6 3V19.5l-6-3v-6.73zm8 3v6.23l6-3v-6.23l-6 3z" fill="#344054"/>
        </svg>
      ),
      label: 'Products',
      value: (stats.products?.total ?? 0).toLocaleString(),
      badge: <>{stats.products?.outOfStock ?? 0} out of stock</>,
      badgeColor: (stats.products?.outOfStock ?? 0) > 0 ? 'error' as const : 'success' as const,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {metrics.map((m) => (
        <div key={m.label} style={card}>
          <div style={iconBox}>{m.icon}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 20 }}>
            <div>
              <span style={{ fontSize: 13, color: '#667085' }}>{m.label}</span>
              <h4 style={{ margin: '8px 0 0', fontWeight: 700, fontSize: 28, color: '#101828', letterSpacing: -0.5 }}>
                {m.value}
              </h4>
            </div>
            <Badge color={m.badgeColor}>{m.badge}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EcommerceMetrics;
