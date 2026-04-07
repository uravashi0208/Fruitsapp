/**
 * src/admin/pages/dashboard/StatisticsChart.tsx
 *
 * Area chart — orders & revenue with period toggle + custom date-range picker.
 * Selecting Monthly / Quarterly / Annually re-fetches from the API using the
 * correct period param.  Picking a date range sends startDate + endDate and
 * overrides the period, showing daily (or weekly for long ranges) buckets.
 *
 * Component structure:
 *   1. useState   (1a. period  1b. dateRange  1c. rangeLabel)
 *   2. Refs       (datePickerRef, flatpickr instance ref)
 *   3. Data hook  (useAdminDashboard — re-fetches on period / range change)
 *   4. useEffect  (flatpickr init + cleanup)
 *   5. Derived    (categories + series from revenueChart)
 *   6. Chart options
 *   7. Render
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import ChartTab from "./ChartTab";
import { useAdminDashboard } from "../../../hooks/useAdminApi";
import type { ChartPeriod, ChartPoint } from "../../../api/admin";
import {
  DashCard,
  CardPadding,
  CardHeaderRow,
  CardTitle,
  CardSubtitle,
  DatePickerWrap,
  DatePickerIcon,
  DatePickerInput,
} from "./dashboardStyles";
import { adminTheme as t } from "../../styles/adminTheme";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const CalendarIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a3 3 0 013 3v12a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h1V3a1 1 0 011-1zm-2 6a1 1 0 000 2h14a1 1 0 000-2H5z"
      fill="currentColor"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
/** Extract the x-axis label from a ChartPoint regardless of period shape */
const getLabel = (p: ChartPoint): string =>
  p.date ?? p.month ?? p.quarter ?? p.year ?? "";

/** Format ISO date to yyyy-MM-dd for the API */
const toISO = (d: Date): string => d.toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const StatisticsChart: React.FC = () => {
  // 1a. Period tab
  const [period, setPeriod] = useState<ChartPeriod>("monthly");

  // 1b. Custom date range (null = not active)
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  // 1c. Human-readable label shown in the date picker input
  const [rangeLabel, setRangeLabel] = useState<string>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} to ${today.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}`;
  });

  // 2. Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

  // 3. Data hook — re-fetches whenever period / dates change
  const params = startDate && endDate ? { startDate, endDate } : { period };

  const { data: stats, loading } = useAdminDashboard(params);

  // 4. flatpickr init
  useEffect(() => {
    if (!inputRef.current) return;

    const today = new Date();
    const sevenAgo = new Date();
    sevenAgo.setDate(today.getDate() - 6);

    fpRef.current = flatpickr(inputRef.current, {
      mode: "range",
      static: true,
      monthSelectorType: "static",
      dateFormat: "M d",
      defaultDate: [sevenAgo, today],
      clickOpens: true,
      onClose(selected) {
        if (selected.length === 2) {
          const [s, e] = selected;
          setStartDate(toISO(s));
          setEndDate(toISO(e));
          setRangeLabel(
            `${s.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} to ` +
              `${e.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}`,
          );
        }
      },
    }) as flatpickr.Instance;

    return () => {
      fpRef.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle period tab change — clear custom range so period takes effect
  const handlePeriodChange = useCallback((p: ChartPeriod) => {
    setPeriod(p);
    setStartDate(undefined);
    setEndDate(undefined);
    // Reset flatpickr display
    fpRef.current?.clear();
    setRangeLabel("Select date range");
  }, []);

  // 5. Derived chart data from API response
  const chartPoints: ChartPoint[] = stats?.revenueChart ?? [];

  const categories = chartPoints.map(getLabel);
  const series = [
    { name: "Orders", data: chartPoints.map((p) => p.orders) },
    { name: "Revenue", data: chartPoints.map((p) => p.revenue) },
  ];

  // 6. Chart options
  const options: ApexOptions = {
    legend: { show: false },
    colors: [t.colors.primary, t.colors.primaryLight],
    chart: {
      fontFamily: t.fonts.body,
      height: 310,
      type: "line",
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeinout", speed: 400 },
    },
    stroke: { curve: "smooth", width: [2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 5 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number, opts) =>
          opts?.seriesIndex === 1
            ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : String(val),
      },
    },
    xaxis: {
      type: "category",
      categories: categories.length > 0 ? categories : ["—"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        rotate: categories.length > 12 ? -45 : 0,
        style: { fontSize: "11px", colors: t.colors.textMuted },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: [t.colors.textMuted] },
        formatter: (val: number) => val.toFixed(2),
      },
      title: { text: "", style: { fontSize: "0px" } },
    },
    noData: {
      text: loading ? "Loading…" : "No data for this period",
      style: { color: t.colors.textMuted, fontSize: "13px" },
    },
  };

  // 7. Render
  return (
    <DashCard>
      <CardPadding>
        <CardHeaderRow>
          <div>
            <CardTitle>Statistics</CardTitle>
            <CardSubtitle>
              {startDate && endDate
                ? `Custom range: ${rangeLabel}`
                : `${period.charAt(0).toUpperCase() + period.slice(1)} orders and revenue trend`}
            </CardSubtitle>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Period tabs */}
            <ChartTab value={period} onChange={handlePeriodChange} />

            {/* Date range picker */}
            <DatePickerWrap>
              <DatePickerIcon>
                <CalendarIcon />
              </DatePickerIcon>
              <DatePickerInput
                ref={inputRef}
                readOnly
                value={rangeLabel}
                onChange={() => {}}
                placeholder="Select date range"
                title="Pick a custom date range"
              />
            </DatePickerWrap>
          </div>
        </CardHeaderRow>

        {/* Chart */}
        <div style={{ overflow: "hidden" }}>
          <div style={{ minWidth: 500 }}>
            <Chart
              key={`${period}-${startDate}-${endDate}`}
              options={options}
              series={series}
              type="area"
              height={310}
            />
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            { color: t.colors.primary, label: "Orders" },
            { color: t.colors.primaryLight, label: "Revenue" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  display: "inline-block",
                }}
              />
              <span
                style={{ fontSize: "0.8125rem", color: t.colors.textMuted }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </CardPadding>
    </DashCard>
  );
};

export default StatisticsChart;
