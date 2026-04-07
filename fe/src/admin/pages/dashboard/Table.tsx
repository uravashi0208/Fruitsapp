/**
 * src/admin/pages/dashboard/Table.tsx
 * Thin re-export wrappers so existing callers (RecentOrders) keep their paths.
 * All actual table styled-components live in dashboardStyles.ts.
 *
 * Component structure:
 *   Re-exports: Table, TableHeader, TableBody, TableRow, TableCell
 */

import React from 'react';
import { DashTable, DashThead, DashTbody, DashTr, DashTh, DashTd } from './dashboardStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper components (preserve original API)
// ─────────────────────────────────────────────────────────────────────────────
export const Table: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <DashTable style={style}>{children}</DashTable>
);

export const TableHeader: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <DashThead style={style}>{children}</DashThead>
);

export const TableBody: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <DashTbody>{children}</DashTbody>
);

export const TableRow: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <DashTr style={style}>{children}</DashTr>
);

export const TableCell: React.FC<{
  children?: React.ReactNode;
  isHeader?: boolean;
  style?: React.CSSProperties;
  colSpan?: number;
}> = ({ children, isHeader = false, style, colSpan }) =>
  isHeader
    ? <DashTh style={style} colSpan={colSpan}>{children}</DashTh>
    : <DashTd style={style} colSpan={colSpan}>{children}</DashTd>;
