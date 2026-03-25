import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <table style={{ minWidth: '100%', borderCollapse: 'collapse', ...style }}>{children}</table>
);

export const TableHeader: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <thead style={{ borderTop: '1px solid #e4e7ec', borderBottom: '1px solid #e4e7ec', ...style }}>{children}</thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody>{children}</tbody>
);

export const TableRow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <tr style={{ borderBottom: '1px solid #f2f4f7', ...style }}>{children}</tr>
);

export const TableCell: React.FC<{
  children: React.ReactNode;
  isHeader?: boolean;
  style?: React.CSSProperties;
}> = ({ children, isHeader = false, style }) => {
  const base: React.CSSProperties = {
    padding: '12px 8px',
    fontSize: 13,
    color: '#475467',
    textAlign: 'left',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: isHeader ? 500 : 400,
    whiteSpace: 'nowrap',
  };
  return isHeader
    ? <th style={{ ...base, color: '#98a2b3', fontSize: 12, ...style }}>{children}</th>
    : <td style={{ ...base, ...style }}>{children}</td>;
};
