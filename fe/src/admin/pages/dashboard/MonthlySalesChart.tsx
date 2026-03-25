import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Dropdown } from '../../theme-components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../theme-components/ui/dropdown/DropdownItem';
import { useAdminDashboard } from '../../../hooks/useAdminApi';

const MoreDotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" stroke="#98a2b3" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MonthlySalesChart: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: stats } = useAdminDashboard();

  // Build categories and series from API revenueChart, fallback to month names
  const chartData = stats?.revenueChart ?? [];
  const categories = chartData.length > 0
    ? chartData.map((d: any) => d.month)
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const revenueData = chartData.length > 0
    ? chartData.map((d: any) => d.revenue)
    : [0,0,0,0,0,0,0,0,0,0,0,0];
  const ordersData = chartData.length > 0
    ? chartData.map((d: any) => d.orders)
    : [0,0,0,0,0,0,0,0,0,0,0,0];

  const options: ApexOptions = {
    colors: ['#465fff', '#9CB9FF'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '39%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ['transparent'] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: true, position: 'top', horizontalAlign: 'left', fontFamily: 'Outfit' },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: false }, y: { formatter: (val: number) => `${val}` } },
  };

  const series = [
    { name: 'Revenue ($)', data: revenueData },
    { name: 'Orders', data: ordersData },
  ];

  return (
    <div style={{ overflow: 'hidden', borderRadius: 16, border: '1px solid #e4e7ec', background: '#ffffff', padding: '20px 24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#101828', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
          Monthly Sales
        </h3>
        <div style={{ position: 'relative' }}>
          <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <MoreDotIcon />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <div style={{ padding: 8, minWidth: 140 }}>
              <DropdownItem onItemClick={() => setIsOpen(false)}>View More</DropdownItem>
              <DropdownItem onItemClick={() => setIsOpen(false)}>Export</DropdownItem>
            </div>
          </Dropdown>
        </div>
      </div>
      <div>
        <div style={{ minWidth: 500 }}>
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
};

export default MonthlySalesChart;
