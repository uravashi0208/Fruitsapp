/**
 * AdminDataTable.tsx
 * Layout matches the screenshot exactly:
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │ Products List                    [Export ↓]  [+ Add Product] │  ← TitleRow
 *  │ Track your store's progress to boost your sales.             │
 *  ├──────────────────────────────────────────────────────────────┤
 *  │ [🔍 Search…              ]                    [⇄ Filter]    │  ← FilterRow
 *  ├──────────────────────────────────────────────────────────────┤
 *  │ □  Products ↑   Category ⇅  Brand ⇅  Price ⇅  Stock  …     │  ← THead
 *  ├──────────────────────────────────────────────────────────────┤
 *  │  …rows…                                                       │
 *  ├──────────────────────────────────────────────────────────────┤
 *  │ Showing 1 to 7 of 20                          [1] [2] [3] ›  │  ← Pagination
 *  └──────────────────────────────────────────────────────────────┘
 */
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { ChevronsUpDown } from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import { AdminCard, EmptyState, PageBtns, PageBtn } from '../styles/adminShared';

// ── Shell ──────────────────────────────────────────────────────
export const TableCard = styled(AdminCard)`
  padding: 0;
  overflow: hidden;
`;
export const TableScrollWrapper = styled.div`overflow-x: auto;`;

// ── Row 1: Title + action buttons ─────────────────────────────
const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 20px 7px;
  flex-wrap: wrap;
  border-bottom:1px solid #e4e7ec;
  margin-bottom:13px;
`;
const TitleBlock = styled.div``;
const TableTitle = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: ${t.colors.textPrimary};
  line-height: 1.3;
  html.dark & { color: #f0f4fa; }
`;
const TableSubtitle = styled.div`
  font-size: 0.8rem;
  color: ${t.colors.textMuted};
  margin-top: 3px;
  html.dark & { color: #6b7a99; }
`;
const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

// ── Row 2: Search + filter controls ───────────────────────────
const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 16px;
  flex-wrap: wrap;
`;
const FilterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
`;
const FilterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
`;

// ── Table ──────────────────────────────────────────────────────
export const Tbl = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: ${t.fonts.body};
`;
export const THead = styled.thead`
  background: ${t.colors.surfaceAlt};
  border-top: 1px solid ${t.colors.border};
  border-bottom: 1px solid ${t.colors.border};
  html.dark & { background: #252e42; border-color: #2a3347; }
`;
const ThInner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
`;
const SortIcon = styled.span`
  display: inline-flex;
  align-items: center;
  opacity: 0.4;
  flex-shrink: 0;
`;
export const TH = styled.th`
  padding: 11px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${t.colors.textSecondary};
  text-align: left;
  white-space: nowrap;
  html.dark & { color: #8b9ab5; }
`;
export const TR = styled.tr`
  border-bottom: 1px solid ${t.colors.border};
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${t.colors.surfaceAlt}; }
  html.dark & { border-bottom-color: #2a3347; }
  html.dark &:hover { background: #252e42; }
`;
export const TD = styled.td`
  padding: 14px 16px;
  font-size: 0.8125rem;
  color: ${t.colors.textSecondary};
  vertical-align: middle;
  html.dark & { color: #8b9ab5; }
`;
export const CheckBox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${t.colors.primary};
`;

// ── Pagination footer ──────────────────────────────────────────
const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid ${t.colors.border};
  flex-wrap: wrap;
  gap: 8px;
  html.dark & { border-top-color: #2a3347; }
`;
const PaginationInfo = styled.span`
  font-size: 0.8125rem;
  color: ${t.colors.textMuted};
  html.dark & { color: #6b7a99; }
`;

// ── Types ──────────────────────────────────────────────────────
export interface ColDef {
  key: string;
  label: ReactNode;
  /** Show the double-arrow sort icon — default true for non-empty labels */
  sortable?: boolean;
  /** Extra props forwarded to <th> */
  thProps?: {
    style?: React.CSSProperties;
    $check?: boolean;
    $center?: boolean;
    $width?: string;
  };
}

export interface AdminDataTableProps<T> {
  // Row 1
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Top-right buttons (Export, Add Product, etc.) */
  actions?: ReactNode;

  // Row 2
  /** Left side of the filter row: search input, dropdowns */
  searchArea?: ReactNode;
  /** Right side of the filter row: Filter button, etc. */
  filterArea?: ReactNode;

  /**
   * Legacy single toolbar prop — renders as filterArea for backwards-compat.
   * Prefer actions + searchArea + filterArea.
   */
  toolbar?: ReactNode;

  columns: ColDef[];

  selectable?: boolean;
  allChecked?: boolean;
  onToggleAll?: () => void;

  rows: T[];
  renderRow: (row: T, index: number) => ReactNode;

  loading?: boolean;
  loadingText?: string;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyText?: string;
  emptyAction?: ReactNode;

  showPagination?: boolean;
  paginationInfo?: ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  colSpan?: number;
}

// ── Component ──────────────────────────────────────────────────
export function AdminDataTable<T>({
  title,
  subtitle,
  actions,
  searchArea,
  filterArea,
  toolbar,
  columns,
  selectable,
  allChecked,
  onToggleAll,
  rows,
  renderRow,
  loading,
  loadingText = 'Loading…',
  emptyIcon,
  emptyTitle = 'No data found',
  emptyText,
  emptyAction,
  showPagination = true,
  paginationInfo,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  colSpan,
}: AdminDataTableProps<T>) {  

  const colspan = colSpan ?? columns.length + (selectable ? 1 : 0);
  // backwards-compat: old `toolbar` → filterArea slot
  const resolvedFilterArea = filterArea ?? toolbar;
  const hasTitle   = title || subtitle || actions;
  const hasFilters = searchArea || resolvedFilterArea;

  return (
    <TableCard>

      {/* Row 1 — Title + action buttons */}
      {hasTitle && (
        <TitleRow>
          <TitleBlock>
            {title    && <TableTitle>{title}</TableTitle>}
            {subtitle && <TableSubtitle>{subtitle}</TableSubtitle>}
          </TitleBlock>
          {actions && <ActionButtons>{actions}</ActionButtons>}
        </TitleRow>
      )}

      {/* Row 2 — Search + filter controls */}
      {hasFilters && (
        <FilterRow>
          <FilterLeft>{searchArea}</FilterLeft>
          {resolvedFilterArea && <FilterRight>{resolvedFilterArea}</FilterRight>}
        </FilterRow>
      )}

      {/* Table */}
      <TableScrollWrapper>
        <Tbl>
          <THead>
            <tr>
              {selectable && (
                <TH style={{ width: 40, paddingLeft: 16, paddingRight: 8 }}>
                  <CheckBox checked={!!allChecked} onChange={onToggleAll} />
                </TH>
              )}
              {columns.map(col => {
                const showSort = col.sortable !== false && !!col.label;
                const extraStyle: React.CSSProperties = {
                  ...(col.thProps?.$center ? { textAlign: 'center' } : {}),
                  ...(col.thProps?.$width  ? { width: col.thProps.$width } : {}),
                  ...(col.thProps?.$check  ? { width: 40, paddingLeft: 16, paddingRight: 8 } : {}),
                  ...(col.thProps?.style ?? {}),
                };
                return (
                  <TH key={col.key} style={extraStyle}>
                    {showSort ? (
                      <ThInner>
                        {col.label}
                        <SortIcon><ChevronsUpDown size={12} /></SortIcon>
                      </ThInner>
                    ) : col.label}
                  </TH>
                );
              })}
            </tr>
          </THead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colspan} style={{ textAlign: 'center', padding: '2.5rem', color: t.colors.textMuted, fontSize: '0.875rem' }}>
                  {loadingText}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colspan}>
                  <EmptyState>
                    {emptyIcon}
                    {emptyTitle && <h3>{emptyTitle}</h3>}
                    {emptyText  && <p>{emptyText}</p>}
                    {emptyAction}
                  </EmptyState>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <React.Fragment key={i}>{renderRow(row, i)}</React.Fragment>
              ))
            )}
          </tbody>
        </Tbl>
      </TableScrollWrapper>

      {/* Pagination */}
      {showPagination && (
        <PaginationRow>
          <PaginationInfo>{paginationInfo}</PaginationInfo>
          {totalPages >= 1 && onPageChange && (
            <PageBtns>
              <PageBtn disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>‹</PageBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PageBtn key={p} $active={p === currentPage} onClick={() => onPageChange(p)}>{p}</PageBtn>
              ))}
              <PageBtn disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>›</PageBtn>
            </PageBtns>
          )}
        </PaginationRow>
      )}

    </TableCard>
  );
}

export default AdminDataTable;