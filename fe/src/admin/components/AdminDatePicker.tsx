/**
 * AdminDatePicker.tsx
 * Custom date picker — matches the clean calendar style in the design.
 * Replaces native <input type="date"> with a styled portal calendar.
 *
 * Usage:
 *   <AdminDatePicker
 *     value="2026-04-04"           // YYYY-MM-DD string
 *     onChange={val => setDate(val)}
 *     placeholder="Start Date"
 *   />
 */
import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { adminTheme as t } from "../styles/adminTheme";

// ── Singleton: close all open pickers when one opens ───────────
const PICKER_OPEN_EVENT = "vf:datepicker:open";
const broadcastPickerOpen = (id: string) =>
  document.dispatchEvent(new CustomEvent(PICKER_OPEN_EVENT, { detail: id }));

// ── Constants ──────────────────────────────────────────────────
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── Helpers ────────────────────────────────────────────────────
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseYMD = (s: string) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatDisplay = (ymd: string) => {
  const d = parseYMD(ymd);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const buildCells = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const cells: { ymd: string; day: number; other: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevTotal - i);
    cells.push({ ymd: toYMD(d), day: prevTotal - i, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ ymd: toYMD(new Date(year, month, d)), day: d, other: false });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, next++);
    cells.push({ ymd: toYMD(d), day: next - 1, other: true });
  }
  return cells;
};

// ── Styled ─────────────────────────────────────────────────────
const TriggerBtn = styled.button<{ $open: boolean; $hasValue: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 38px;
  padding: 0 12px 0 12px;
  background: #ffffff;
  border: 1.5px solid
    ${({ $open }) => ($open ? t.colors.primary : t.colors.border)};
  border-radius: 10px;
  font-family: ${t.fonts.body};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ $hasValue }) =>
    $hasValue ? t.colors.textPrimary : t.colors.textMuted};
  cursor: pointer;
  outline: none;
  box-shadow: ${({ $open }) =>
    $open ? `0 0 0 3px rgba(70,95,255,0.12)` : `0 1px 3px rgba(16,24,40,0.06)`};
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  user-select: none;
  box-sizing: border-box;

  &:hover {
    border-color: ${({ $open }) => ($open ? t.colors.primary : "#c8cdd6")};
  }

  html.dark & {
    background: #1e293b;
    border-color: ${({ $open }) => ($open ? t.colors.primary : "#334155")};
    color: #f0f4fa;
  }
`;

const TriggerText = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CalIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${t.colors.textMuted};
  flex-shrink: 0;
`;

// ── Portal calendar panel ──────────────────────────────────────
const Panel = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: 280px;
  background: #ffffff;
  border: 1.5px solid #e4e7ec;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -2px rgba(16, 24, 40, 0.04),
    0 16px 40px -4px rgba(16, 24, 40, 0.14);
  z-index: 99999;
  padding: 16px;
  animation: dpFadeIn 0.16s cubic-bezier(0.34, 1.4, 0.64, 1) both;

  @keyframes dpFadeIn {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  html.dark & {
    background: #1e2d3d;
    border-color: #2a3347;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const MonthLabel = styled.span`
  font-size: 0.9375rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  html.dark & {
    color: #f0f4fa;
  }
`;

const NavBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid ${t.colors.border};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${t.colors.textSecondary};
  transition: all 0.12s;
  padding: 0;

  &:hover {
    background: ${t.colors.primaryGhost};
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
  }

  html.dark & {
    background: #252e42;
    border-color: #2a3347;
    color: #8b9ab5;
  }
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const DayName = styled.div`
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${t.colors.textMuted};
  padding: 4px 0 8px;
  letter-spacing: 0.3px;
`;

const DayCell = styled.button<{
  $other: boolean;
  $today: boolean;
  $selected: boolean;
  $inRange?: boolean;
}>`
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: 50%;
  font-size: 0.8125rem;
  font-weight: ${({ $selected, $today }) => ($selected || $today ? 700 : 500)};
  cursor: ${({ $other }) => ($other ? "default" : "pointer")};
  transition:
    background 0.1s,
    color 0.1s;
  font-family: ${t.fonts.body};
  display: flex;
  align-items: center;
  justify-content: center;

  background: ${({ $selected, $today, $other }) =>
    $selected
      ? t.colors.primary
      : $today
        ? `${t.colors.primary}14`
        : "transparent"};

  color: ${({ $selected, $today, $other }) =>
    $selected
      ? "#ffffff"
      : $other
        ? t.colors.textMuted
        : $today
          ? t.colors.primary
          : t.colors.textPrimary};

  opacity: ${({ $other }) => ($other ? 0.45 : 1)};

  &:hover:not(:disabled) {
    background: ${({ $selected, $other }) =>
      $other
        ? "transparent"
        : $selected
          ? t.colors.primary
          : `${t.colors.primary}14`};
    color: ${({ $selected, $other }) =>
      $other ? t.colors.textMuted : $selected ? "#ffffff" : t.colors.primary};
  }

  html.dark & {
    color: ${({ $selected, $other, $today }) =>
      $selected ? "#fff" : $other ? "#4a5568" : $today ? "#7c9dff" : "#e2e8f0"};
  }
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${t.colors.border};
`;

const FooterBtn = styled.button`
  background: none;
  border: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${t.colors.primary};
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  font-family: ${t.fonts.body};
  transition: background 0.12s;

  &:hover {
    background: ${t.colors.primaryGhost};
  }
`;

// ── Props ──────────────────────────────────────────────────────
export interface AdminDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (ymd: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Allow clearing the value */
  clearable?: boolean;
}

// ── Component ──────────────────────────────────────────────────
export const AdminDatePicker: React.FC<AdminDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  style,
  className,
  clearable = true,
}) => {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const today = new Date();
  const todayYMD = toYMD(today);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Sync calendar view to selected value
  useEffect(() => {
    const d = parseYMD(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Close when another picker opens
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail !== id) setOpen(false);
    };
    document.addEventListener(PICKER_OPEN_EVENT, handler);
    return () => document.removeEventListener(PICKER_OPEN_EVENT, handler);
  }, [id]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      const target = e.target as Element;
      if (triggerRef.current?.contains(target)) return;
      if (target.closest?.("[data-admindatepicker]")) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onMouse, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onMouse, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const openPicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      const rect = triggerRef.current!.getBoundingClientRect();
      // Check if there's room below, otherwise open above
      const spaceBelow = window.innerHeight - rect.bottom;
      const panelH = 310;
      const top = spaceBelow > panelH ? rect.bottom + 4 : rect.top - panelH - 4;
      setPos({ top, left: rect.left });
      const next = !open;
      setOpen(next);
      if (next) broadcastPickerOpen(id);
    },
    [disabled, open, id],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  const handleSelect = (ymd: string, other: boolean) => {
    if (other) return;
    onChange(ymd);
    setOpen(false);
  };

  const cells = buildCells(viewYear, viewMonth);

  return (
    <>
      <TriggerBtn
        ref={triggerRef}
        type="button"
        $open={open}
        $hasValue={!!value}
        style={style}
        className={className}
        onClick={openPicker}
        disabled={disabled}
      >
        <TriggerText>{value ? formatDisplay(value) : placeholder}</TriggerText>
        <CalIcon>
          <Calendar size={15} />
        </CalIcon>
      </TriggerBtn>

      {open &&
        ReactDOM.createPortal(
          <Panel
            $top={pos.top}
            $left={pos.left}
            data-admindatepicker
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <PanelHeader>
              <NavBtn type="button" onClick={prevMonth}>
                <ChevronLeft size={14} />
              </NavBtn>
              <MonthLabel>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </MonthLabel>
              <NavBtn type="button" onClick={nextMonth}>
                <ChevronRight size={14} />
              </NavBtn>
            </PanelHeader>

            {/* Day grid */}
            <DayGrid>
              {DAY_NAMES.map((d) => (
                <DayName key={d}>{d}</DayName>
              ))}
              {cells.map((cell) => (
                <DayCell
                  key={cell.ymd}
                  type="button"
                  $other={cell.other}
                  $today={cell.ymd === todayYMD}
                  $selected={cell.ymd === value}
                  onClick={() => handleSelect(cell.ymd, cell.other)}
                >
                  {cell.day}
                </DayCell>
              ))}
            </DayGrid>

            {/* Footer */}
            <FooterRow>
              {clearable && value ? (
                <FooterBtn
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  Clear
                </FooterBtn>
              ) : (
                <span />
              )}
              <FooterBtn
                type="button"
                onClick={() => {
                  onChange(todayYMD);
                  setOpen(false);
                }}
              >
                Today
              </FooterBtn>
            </FooterRow>
          </Panel>,
          document.body,
        )}
    </>
  );
};

export default AdminDatePicker;
