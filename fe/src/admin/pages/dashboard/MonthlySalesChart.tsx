/**
 * src/admin/pages/dashboard/MonthlySalesChart.tsx
 * Grouped bar chart — monthly revenue vs orders.
 * Data from useAdminDashboard. Styling from dashboardStyles.ts.
 *
 * Component structure:
 *   1. useState  (1a. dropdown open)
 *   2. Data hook (useAdminDashboard)
 *   3. Derived   (chart categories + series from API)
 *   4. Chart options (ApexOptions)
 *   5. Render
 */

import React, { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../../theme-components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../theme-components/ui/dropdown/DropdownItem";
import { useAdminDashboard } from "../../../hooks/useAdminApi";
import {
  DashCard,
  CardPadding,
  CardHeaderRow,
  CardTitle,
  MoreBtn,
  MoreDotSVG,
} from "./dashboardStyles";
import { adminTheme as t } from "../../styles/adminTheme";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const FALLBACK_ZEROES = new Array(12).fill(0);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const MonthlySalesChart: React.FC = () => {
  // 1a. UI state
  const [isOpen, setIsOpen] = useState(false);

  // 2. Data hook
  const { data: stats } = useAdminDashboard();

  // 3. Derived chart data
  const chartData = stats?.revenueChart ?? [];
  const hasData = chartData.length > 0;
  const categories = hasData
    ? chartData.map((d: any) => d.month)
    : FALLBACK_MONTHS;
  const revenue = hasData
    ? chartData.map((d: any) => d.revenue)
    : FALLBACK_ZEROES;
  const orders = hasData
    ? chartData.map((d: any) => d.orders)
    : FALLBACK_ZEROES;

  // 4. Chart options
  const options: ApexOptions = {
    colors: ["#465fff", "#9CB9FF"],
    chart: {
      fontFamily: t.fonts.body,
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: t.fonts.body,
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `${val}` },
    },
  };

  const series = [
    { name: "Revenue ($)", data: revenue },
    { name: "Orders", data: orders },
  ];

  // 5. Render
  return (
    <DashCard $overflow="hidden">
      <CardPadding style={{ paddingBottom: 0 }}>
        <CardHeaderRow style={{ marginBottom: 4 }}>
          <CardTitle>Monthly Sales</CardTitle>
          <div style={{ position: "relative" }}>
            <MoreBtn
              className="dropdown-toggle"
              onClick={() => setIsOpen((v) => !v)}
            >
              <MoreDotSVG />
            </MoreBtn>
            <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <div style={{ padding: 8, minWidth: 140 }}>
                <DropdownItem onItemClick={() => setIsOpen(false)}>
                  View More
                </DropdownItem>
                <DropdownItem onItemClick={() => setIsOpen(false)}>
                  Export
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </CardHeaderRow>

        <div style={{ overflow: "hidden" }}>
          <div style={{ minWidth: 500 }}>
            <Chart options={options} series={series} type="bar" height={180} />
          </div>
        </div>
      </CardPadding>
    </DashCard>
  );
};

export default MonthlySalesChart;
