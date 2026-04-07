/**
 * src/admin/pages/dashboard/ChartTab.tsx
 * Segmented control for switching chart time periods.
 * Controlled component — parent owns the selected value.
 *
 * Component structure:
 *   1. Props interface
 *   2. Render (TabGroup → TabBtn × 3)
 */

import React from 'react';
import { TabGroup, TabBtn } from './dashboardStyles';
import type { ChartPeriod } from '../../../api/admin';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ChartTabProps {
  value:    ChartPeriod;
  onChange: (period: ChartPeriod) => void;
}

const LABELS: { value: ChartPeriod; label: string }[] = [
  { value: 'monthly',    label: 'Monthly'  },
  { value: 'quarterly',  label: 'Quarterly'},
  { value: 'annually',   label: 'Annually' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const ChartTab: React.FC<ChartTabProps> = ({ value, onChange }) => (
  <TabGroup>
    {LABELS.map((opt) => (
      <TabBtn
        key={opt.value}
        $active={value === opt.value}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </TabBtn>
    ))}
  </TabGroup>
);

export default ChartTab;
