import React, { useEffect, useRef } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import ChartTab from './ChartTab';
import { useAdminDashboard } from '../../../hooks/useAdminApi';

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#667085' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a3 3 0 013 3v12a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h1V3a1 1 0 011-1zm-2 6a1 1 0 000 2h14a1 1 0 000-2H5z" fill="currentColor"/>
  </svg>
);

const StatisticsChart: React.FC = () => {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const { data: stats } = useAdminDashboard();

  useEffect(() => {
    if (!datePickerRef.current) return;
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const fp = flatpickr(datePickerRef.current, {
      mode: 'range',
      static: true,
      monthSelectorType: 'static',
      dateFormat: 'M d',
      defaultDate: [sevenDaysAgo, today],
      clickOpens: true,
    });
    return () => { if (!Array.isArray(fp)) fp.destroy(); };
  }, []);

  const chartData = stats?.revenueChart ?? [];
  const categories = chartData.length > 0
    ? chartData.map((d: any) => d.month)
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const options: ApexOptions = {
    legend: { show: false },
    colors: ['#465FFF', '#9CB9FF'],
    chart: { fontFamily: 'Outfit, sans-serif', height: 310, type: 'line', toolbar: { show: false } },
    stroke: { curve: 'straight', width: [2, 2] },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true, x: { format: 'dd MMM yyyy' } },
    xaxis: {
      type: 'category',
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', colors: ['#6B7280'] } },
      title: { text: '', style: { fontSize: '0px' } },
    },
  };

  const series = [
    { name: 'Orders',  data: chartData.length > 0 ? chartData.map((d: any) => d.orders)  : [] },
    { name: 'Revenue', data: chartData.length > 0 ? chartData.map((d: any) => d.revenue) : [] },
  ];

  return (
    <div style={{ borderRadius: 16, border: '1px solid #e4e7ec', background: '#ffffff', padding: '20px 24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#101828', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Statistics
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#667085', fontFamily: 'Outfit, sans-serif' }}>
            Target you've set for each month
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ChartTab />
          {/* Date range picker */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}>
              <CalendarIcon />
            </span>
            <input
              ref={datePickerRef}
              readOnly
              style={{
                height: 40,
                width: 160,
                paddingLeft: 36,
                paddingRight: 12,
                borderRadius: 8,
                border: '1px solid #e4e7ec',
                background: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                color: '#344054',
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                outline: 'none',
              }}
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <div style={{ minWidth: 700 }}>
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart;
