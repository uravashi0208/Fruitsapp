import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Dropdown } from '../../theme-components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../theme-components/ui/dropdown/DropdownItem';
import { useAdminDashboard } from '../../../hooks/useAdminApi';

const MoreDotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ArrowUpGreen = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004V13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5V4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z" fill="#039855"/>
  </svg>
);

const ArrowDownRed = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.26816 13.6632C7.4056 13.8192 7.60686 13.9176 7.8311 13.9176C8.02445 13.9178 8.21671 13.8447 8.36339 13.6981L12.3635 9.70076C12.6565 9.40797 12.6567 8.9331 12.3639 8.6401C12.0711 8.34711 11.5962 8.34694 11.3032 8.63973L8.5811 11.36V2.5C8.5811 2.08579 8.24531 1.75 7.8311 1.75C7.41688 1.75 7.0811 2.08579 7.0811 2.5V11.3556L4.36354 8.63975C4.07055 8.34695 3.59568 8.3471 3.30288 8.64009C3.01008 8.93307 3.01023 9.40794 3.30321 9.70075L7.26816 13.6632Z" fill="#D92D20"/>
  </svg>
);

const MonthlyTarget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: stats } = useAdminDashboard();

  // Calculate revenue from API stats — safe defaults when stats not yet loaded
  const totalRevenue = stats?.revenue?.total ?? 0;
  const target = 20000;
  const pct = totalRevenue > 0 ? Math.min(Math.round((totalRevenue / target) * 100), 100) : 0;

  // Today's revenue from the latest revenueChart entry
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const currentMonthData = stats?.revenueChart?.find((r: any) => r.month === currentMonth);
  const todayRevenue = currentMonthData?.revenue ?? 0;

  const options: ApexOptions = {
    colors: ['#465FFF'],
    chart: { fontFamily: 'Outfit, sans-serif', type: 'radialBar', height: 330, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: '80%' },
        track: { background: '#E4E7EC', strokeWidth: '100%', margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: '36px', fontWeight: '600', offsetY: -40, color: '#1D2939',
            formatter: (val: number) => val + '%',
          },
        },
      },
    },
    fill: { type: 'solid', colors: ['#465FFF'] },
    stroke: { lineCap: 'round' },
    labels: ['Progress'],
  };

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;

  const statStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  };
  const statLabel: React.CSSProperties = {
    fontSize: 12, color: '#667085', fontFamily: 'Outfit, sans-serif',
  };
  const statVal: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 16, fontWeight: 600, color: '#101828',
    fontFamily: 'Outfit, sans-serif',
  };
  const divider: React.CSSProperties = {
    width: 1, height: 28, background: '#e4e7ec',
  };

  return (
    <div style={{ borderRadius: 16, border: '1px solid #e4e7ec', background: '#f2f4f7', overflow: 'hidden' }}>
      {/* Top card with chart */}
      <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px 44px', boxShadow: '0px 1px 3px rgba(16,24,40,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#101828', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Monthly Target
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#667085', fontFamily: 'Outfit, sans-serif' }}>
              Target you've set for each month
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <MoreDotIcon />
            </button>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <div style={{ padding: 8, minWidth: 140 }}>
                <DropdownItem onItemClick={() => setIsOpen(false)}>View More</DropdownItem>
                <DropdownItem onItemClick={() => setIsOpen(false)}>Delete</DropdownItem>
              </div>
            </Dropdown>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Chart options={options} series={[pct]} type="radialBar" height={330} />
          <span style={{
            position: 'absolute', left: '50%', bottom: 0,
            transform: 'translateX(-50%) translateY(50%)',
            borderRadius: 9999, background: '#ecfdf3',
            padding: '3px 12px', fontSize: 12, fontWeight: 500,
            color: '#039855', fontFamily: 'Outfit, sans-serif',
          }}>
            +10%
          </span>
        </div>

        <p style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#667085', fontFamily: 'Outfit, sans-serif', maxWidth: 380, margin: '40px auto 0' }}>
          You earn {fmt(totalRevenue || 3287)} today, it's higher than last month. Keep up your good work!
        </p>
      </div>

      {/* Bottom stats row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '14px 24px' }}>
        <div style={statStyle}>
          <p style={statLabel}>Target</p>
          <p style={statVal}>{fmt(target)} <ArrowDownRed /></p>
        </div>
        <div style={divider} />
        <div style={statStyle}>
          <p style={statLabel}>Revenue</p>
          <p style={statVal}>{fmt(Math.round(totalRevenue) || 20000)} <ArrowUpGreen /></p>
        </div>
        <div style={divider} />
        <div style={statStyle}>
          <p style={statLabel}>Today</p>
          <p style={statVal}>{fmt(Math.round(todayRevenue) || 3287)} <ArrowUpGreen /></p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTarget;
