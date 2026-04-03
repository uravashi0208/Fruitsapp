/**
 * ExportDropdown.tsx
 *
 * Two usage modes:
 *
 * ── Mode A: Self-contained (simple pages) ────────────────────
 *   <ExportDropdown
 *     data={rows}
 *     columns={[{ key: 'name', label: 'Name' }, ...]}
 *     filename="products"
 *     title="Products Report"
 *   />
 *
 * ── Mode B: Callback (advanced pages with exportUtils) ───────
 *   <ExportDropdown
 *     loading={exportLoading}
 *     onExport={async (fmt) => { await exportData(fmt, ...); }}
 *   />
 */

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Download, FileSpreadsheet, FileText, File, Loader } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ExportFormat = 'excel' | 'csv' | 'pdf';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (val: unknown, row: Record<string, unknown>) => string;
}

type ModeA = {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename?: string;
  title?: string;
  disabled?: boolean;
  loading?: never;
  onExport?: never;
};

type ModeB = {
  loading?: boolean;
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
  data?: never;
  columns?: never;
  filename?: never;
  title?: never;
};

export type ExportDropdownProps = ModeA | ModeB;

// ── Styled ────────────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;
const spin = keyframes`to { transform: rotate(360deg); }`;

const Wrapper = styled.div`position: relative; display: inline-block;`;

const TriggerBtn = styled.button<{ $disabled?: boolean; $loading?: boolean }>`
  display: flex; align-items: center; gap: 6px;
  border: 1px solid ${t.colors.border}; border-radius: 10px;
  padding: 0 14px; height: 40px; background: white;
  font-size: 0.875rem; font-weight: 500; color: ${t.colors.textSecondary};
  cursor: ${({ $disabled, $loading }) => ($disabled || $loading ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  user-select: none; white-space: nowrap;
  &:hover:not(:disabled) {
    background: ${t.colors.surfaceAlt};
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
  }
  svg.chevron { margin-left: 2px; transition: transform 0.2s; }
  &[data-open='true'] svg.chevron { transform: rotate(180deg); }
  ${({ $loading }) => $loading && css`
    color: ${t.colors.primary};
    border-color: ${t.colors.primary};
    background: ${t.colors.primaryGhost};
  `}
`;

const SpinIcon = styled(Loader)`animation: ${spin} 0.8s linear infinite;`;

const Menu = styled.div`
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 9999;
  background: white; border: 1px solid ${t.colors.border}; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(16,24,40,0.12), 0 2px 8px rgba(16,24,40,0.06);
  min-width: 175px; overflow: hidden;
  animation: ${fadeIn} 0.18s cubic-bezier(0.34,1.56,0.64,1) both;
`;

const MenuHeader = styled.div`
  padding: 10px 14px 8px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: ${t.colors.textMuted};
  border-bottom: 1px solid ${t.colors.border};
`;

const MenuItem = styled.button<{ $color?: string }>`
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  background: none; border: none; cursor: pointer;
  font-size: 0.875rem; font-weight: 500;
  color: ${({ $color }) => $color ?? t.colors.textSecondary};
  transition: background 0.12s, color 0.12s; text-align: left;
  &:hover { background: ${t.colors.surfaceAlt}; color: ${({ $color }) => $color ?? t.colors.textPrimary}; }
`;

const Divider = styled.div`height: 1px; background: ${t.colors.border}; margin: 2px 0;`;

const Badge = styled.span`
  margin-left: auto; font-size: 0.65rem; font-weight: 700;
  padding: 1px 5px; border-radius: 4px;
  background: ${t.colors.surfaceAlt}; color: ${t.colors.textMuted};
  border: 1px solid ${t.colors.border};
`;

const ChevronDown: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg className="chevron" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={2.5}
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Mode A helpers ────────────────────────────────────────────────────────────
function getCellValue(row: Record<string, unknown>, col: ExportColumn): string {
  if (col.format) return col.format(row[col.key], row);
  const val = row[col.key];
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function trigger(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 200);
}
function doCSV(data: Record<string, unknown>[], columns: ExportColumn[], filename: string) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows   = data.map(row => columns.map(col => `"${getCellValue(row,col).replace(/"/g,'""')}"`).join(','));
  trigger(new Blob(['\uFEFF'+[header,...rows].join('\r\n')], { type:'text/csv;charset=utf-8;' }), `${filename}.csv`);
}
function doExcel(data: Record<string, unknown>[], columns: ExportColumn[], filename: string, title: string) {
  const th = 'background:#465fff;color:#fff;font-weight:700;padding:8px 12px;border:1px solid #3346cc;white-space:nowrap;font-size:11pt;';
  const td = 'padding:6px 10px;border:1px solid #e4e7ec;font-size:10pt;vertical-align:middle;';
  const hr = `<tr>${columns.map(c=>`<th style="${th}">${esc(c.label)}</th>`).join('')}</tr>`;
  const br = data.map((row,i)=>{
    const bg = i%2===0?'#ffffff':'#f5f7ff';
    return `<tr style="background:${bg};">${columns.map(col=>`<td style="${td}">${esc(getCellValue(row,col))}</td>`).join('')}</tr>`;
  }).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${esc(title)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>table{border-collapse:collapse;}td,th{mso-number-format:"\\@";}</style></head><body><div style="font-size:15px;font-weight:700;padding:8px 0;color:#101828;">${esc(title)}</div><table><thead>${hr}</thead><tbody>${br}</tbody></table></body></html>`;
  trigger(new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8;'}),`${filename}.xls`);
}
function doPDF(data: Record<string, unknown>[], columns: ExportColumn[], filename: string, title: string) {
  const tr = data.map((row,i)=>`<tr class="${i%2===0?'e':'o'}">${columns.map(col=>`<td>${esc(getCellValue(row,col))}</td>`).join('')}</tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(title)}</title><style>@page{margin:18mm;size:A4 landscape;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#101828;}.hd{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;border-bottom:2px solid #465fff;padding-bottom:8px;}.hd h1{font-size:18px;font-weight:700;}.meta{font-size:9px;color:#98a2b3;text-align:right;}.badge{background:#465fff;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;margin-left:6px;}table{width:100%;border-collapse:collapse;margin-top:6px;}thead tr{background:#465fff;color:#fff;}thead th{padding:7px 9px;text-align:left;font-weight:700;font-size:9px;letter-spacing:.04em;text-transform:uppercase;}tr.e{background:#f9fafb;}tr.o{background:#fff;}td{padding:6px 9px;border-bottom:1px solid #e4e7ec;vertical-align:top;}.ft{margin-top:14px;font-size:8px;color:#98a2b3;text-align:center;border-top:1px solid #e4e7ec;padding-top:7px;}@media print{button{display:none;}}</style></head><body><div class="hd"><div><h1>${esc(title)}<span class="badge">${data.length} records</span></h1></div><div class="meta">Exported: ${new Date().toLocaleString()}</div></div><table><thead><tr>${columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${tr}</tbody></table><div class="ft">${esc(title)} • ${new Date().toLocaleDateString()}</div><script>window.onload=function(){window.print();};</script></body></html>`;
  const win = window.open('','_blank','width=1100,height=750');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ExportDropdown: React.FC<ExportDropdownProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef      = useRef<HTMLDivElement>(null);

  const isLoading  = !!(props.loading || busy);
  const isDisabled = !!(props.disabled || isLoading ||
    ('data' in props && props.data !== undefined && (!props.data || props.data.length === 0)));

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleClick = async (fmt: ExportFormat) => {
    if (isLoading) return;
    setOpen(false);
    if ('onExport' in props && props.onExport) {
      setBusy(true);
      try { await props.onExport(fmt); } finally { setBusy(false); }
      return;
    }
    if ('data' in props && props.data && props.columns) {
      const { data, columns, filename = 'export', title = 'Export' } = props;
      if (fmt === 'csv')   doCSV(data, columns, filename);
      if (fmt === 'excel') doExcel(data, columns, filename, title);
      if (fmt === 'pdf')   doPDF(data, columns, filename, title);
    }
  };

  const count = 'data' in props && props.data ? props.data.length : null;

  return (
    <Wrapper ref={wrapperRef}>
      <TriggerBtn
        onClick={() => !isDisabled && setOpen(v => !v)}
        $disabled={isDisabled}
        $loading={isLoading}
        data-open={open ? 'true' : 'false'}
        title={count === 0 ? 'No data to export' : isLoading ? 'Exporting…' : 'Export data'}
      >
        {isLoading
          ? <><SpinIcon size={14} /> Exporting…</>
          : <><Download size={15} /> Export<ChevronDown size={13} /></>
        }
      </TriggerBtn>

      {open && !isLoading && (
        <Menu>
          <MenuHeader>Export as</MenuHeader>
          <MenuItem onClick={() => handleClick('excel')} $color="#12b76a">
            <FileSpreadsheet size={15} color="#12b76a" /> Excel <Badge>.xls</Badge>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleClick('csv')} $color="#0ba5ec">
            <FileText size={15} color="#0ba5ec" /> CSV <Badge>.csv</Badge>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleClick('pdf')} $color="#f04438">
            <File size={15} color="#f04438" /> PDF <Badge>print</Badge>
          </MenuItem>
        </Menu>
      )}
    </Wrapper>
  );
};

export default ExportDropdown;
