/**
 * src/admin/pages/DashboardPage.tsx
 * Admin dashboard — overview metrics, sales charts, recent orders.
 *
 * Page structure:
 *   1. Suspense boundary wrapping all lazy sub-components
 *   2. Responsive 12-column grid layout
 */

import React, { Suspense } from 'react';
import EcommerceMetrics from './dashboard/EcommerceMetrics';
import MonthlySalesChart from './dashboard/MonthlySalesChart';
import StatisticsChart from './dashboard/StatisticsChart';
import MonthlyTarget from './dashboard/MonthlyTarget';
import RecentOrders from './dashboard/RecentOrders';
import DemographicCard from './dashboard/DemographicCard';

const Spinner: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
    <div style={{ width: 32, height: 32, border: '3px solid #e4e7ec', borderTopColor: '#465fff', borderRadius: '50%', animation: 'adminSpin 0.7s linear infinite' }} />
  </div>
);

export const DashboardPage: React.FC = () => {
  return (
    <Suspense fallback={<Spinner />}>
      {/* Responsive 12-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>

        {/* Left column: metrics + bar chart  (7 cols on xl, full on smaller) */}
        <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: 24 }} className="xl-col-7">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>

        {/* Right column: radial target  (5 cols on xl, full on smaller) */}
        <div style={{ gridColumn: 'span 12' }} className="xl-col-5">
          <MonthlyTarget />
        </div>

        {/* Full-width: area statistics chart */}
        <div style={{ gridColumn: 'span 12' }}>
          <StatisticsChart />
        </div>

        {/* Demographic map  (5 cols xl) */}
        <div style={{ gridColumn: 'span 12' }} className="xl-col-5">
          <DemographicCard />
        </div>

        {/* Recent orders table  (7 cols xl) */}
        <div style={{ gridColumn: 'span 12' }} className="xl-col-7">
          <RecentOrders />
        </div>

      </div>
    </Suspense>
  );
};
