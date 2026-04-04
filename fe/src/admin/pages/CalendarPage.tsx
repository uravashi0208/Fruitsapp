/**
 * src/admin/pages/CalendarPage.tsx
 *
 * Full admin calendar — month view, add / edit / delete events,
 * auto-reminder info banner.
 *
 * Uses adminTheme tokens (blues / greys) that match the rest of
 * the Vegefoods admin panel — NOT the standalone green palette.
 */

import React, { useState, useEffect, useCallback } from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Bell,
} from "lucide-react";
import { adminTheme as t } from "../styles/adminTheme";
import {
  adminCalendarApi,
  CalendarEvent,
  CreateEventBody,
  EventType,
} from "../../api/calendar";
import { useAdminDispatch, showAdminToast } from "../store";
import AdminDatePicker from "../components/AdminDatePicker";
import AdminTimePicker from "../components/AdminTimePicker";
import AdminDropdown from "../components/AdminDropdown";

// ── Global keyframes ──────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  @keyframes calFadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1);    }
  }
`;

// ── Constants ─────────────────────────────────────────────────
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
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

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "meeting", label: "Meeting" },
  { value: "seminar", label: "Seminar" },
  { value: "submission", label: "Submission" },
  { value: "other", label: "Other" },
];

// Uses brand colours that fit the blue-based admin theme
const TYPE_COLORS: Record<
  EventType,
  { bg: string; text: string; border: string }
> = {
  event: { bg: "#ecf3ff", text: "#3641f5", border: "#465fff" },
  meeting: { bg: "#f0f9ff", text: "#026aa2", border: "#0ba5ec" },
  seminar: { bg: "#f3e8ff", text: "#6941c6", border: "#9e77ed" },
  submission: { bg: "#fffaeb", text: "#b54708", border: "#f79009" },
  other: { bg: "#f9fafb", text: "#475467", border: "#98a2b3" },
};

const COLOR_SWATCHES = [
  "#465fff",
  "#0ba5ec",
  "#9e77ed",
  "#f79009",
  "#f04438",
  "#12b76a",
];

// ── Styled components ─────────────────────────────────────────
const Wrap = styled.div`
  padding: 24px;
  font-family: ${t.fonts.body};
  min-height: 100vh;
  background: ${t.colors.bg};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 1.375rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  margin: 0 0 2px;
`;

const PageSub = styled.p`
  font-size: 0.8125rem;
  color: ${t.colors.textMuted};
  margin: 0;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
`;

const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: ${t.radii.md};
  border: 1px solid ${t.colors.border};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${t.colors.textSecondary};
  transition: all ${t.transitions.fast};
  &:hover {
    background: ${t.colors.primaryGhost};
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
  }
`;

const MonthTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  margin: 0;
  min-width: 160px;
  text-align: center;
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${t.colors.primary};
  color: white;
  border: none;
  border-radius: ${t.radii.md};
  padding: 0 16px;
  height: 38px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background ${t.transitions.fast};
  &:hover {
    background: ${t.colors.primaryDark};
  }
`;

// ── Calendar grid ─────────────────────────────────────────────
const Grid = styled.div`
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.lg};
  overflow: hidden;
  background: white;
  box-shadow: ${t.shadows.sm};
`;

const DayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid ${t.colors.border};
  background: ${t.colors.surfaceAlt};
`;

const DayName = styled.div`
  padding: 12px 0;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${t.colors.textMuted};
  letter-spacing: 0.8px;
`;

const CalBody = styled.div`
  display: flex;
  flex-direction: column;
`;

// Each week row
const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  position: relative;
`;

const Cell = styled.div<{ $other?: boolean; $today?: boolean }>`
  min-height: 140px;
  border-right: 1px solid ${t.colors.border};
  border-bottom: 1px solid ${t.colors.border};
  padding: 10px 8px 6px;
  background: ${({ $today, $other }) =>
    $today ? `${t.colors.primary}08` : $other ? t.colors.surfaceAlt : "white"};
  transition: background 0.1s;
  overflow: hidden;
  &:nth-child(7n) {
    border-right: none;
  }
`;

// Overlay for multi-day spanning bars inside each WeekRow
const WeekEventLayer = styled.div`
  position: absolute;
  top: 34px;
  left: 15px;
  right: 40px;
  pointer-events: none;
  z-index: 3;
`;

const SpanningBar = styled.div<{
  $bg: string;
  $text: string;
  $border: string;
  $colStart: number;
  $span: number;
  $track: number;
}>`
  position: absolute;
  pointer-events: all;
  cursor: pointer;
  height: 35px;
  top: ${({ $track }) => $track * 30}px;
  left: calc(${({ $colStart }) => $colStart} * (100% / 7) + 4px);
  width: calc(${({ $span }) => $span} * (100% / 7) - 8px);
  max-width: calc(${({ $span }) => $span} * (100% / 7) - 8px);
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px 0 12px;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.12s;
  box-sizing: border-box;
  letter-spacing: -0.01em;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ $border }) => $border};
    border-radius: 6px 0 0 6px;
    flex-shrink: 0;
  }
  &:hover {
    opacity: 0.8;
  }

  span.bar-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  span.bar-time {
    flex-shrink: 0;
    font-size: 0.6875rem;
    font-weight: 700;
    opacity: 0.65;
    margin-right: 2px;
  }
`;

const DayNum = styled.div<{ $today?: boolean }>`
  font-size: 0.92rem;
  font-weight: ${({ $today }) => ($today ? "700" : "500")};
  margin-bottom: 4px;
  ${({ $today }) =>
    $today
      ? css`
          background: ${t.colors.primary};
          color: white;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        `
      : css`
          color: ${t.colors.textSecondary};
        `}
`;

const EventPill = styled.div<{ $bg: string; $text: string; $border: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ $text }) => $text};
  background: ${({ $bg }) => $bg};
  border-left: 3px solid ${({ $border }) => $border};
  margin-bottom: 4px;
  cursor: pointer;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  animation: calFadeIn 0.2s ease;
  transition: opacity 0.12s;
  &:hover {
    opacity: 0.8;
  }

  span.pill-time {
    flex-shrink: 0;
    font-size: 0.6875rem;
    font-weight: 700;
    opacity: 0.7;
    white-space: nowrap;
  }
  span.pill-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
`;

const MoreLabel = styled.div`
  font-size: 0.625rem;
  color: ${t.colors.textMuted};
  margin-top: 2px;
  padding-left: 4px;
`;

// ── Info banner ───────────────────────────────────────────────
const InfoBanner = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${t.colors.warningBg};
  border: 1px solid #fec84b;
  border-radius: ${t.radii.md};
  padding: 10px 16px;
  font-size: 0.8125rem;
  color: #92400e;
`;

// ── Modal ─────────────────────────────────────────────────────
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(16, 24, 40, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${t.zIndex.modal};
  padding: 16px;
`;

const Modal = styled.div`
  background: white;
  border-radius: ${t.radii.lg};
  width: 100%;
  max-width: 520px;
  box-shadow: ${t.shadows.lg};
  animation: modalIn 0.2s ease;
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${t.colors.border};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
`;

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${t.radii.sm};
  border: none;
  background: ${t.colors.surfaceAlt};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${t.colors.textMuted};
  transition: background ${t.transitions.fast};
  &:hover {
    background: ${t.colors.border};
  }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
`;

const FormRow = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols || 1}, 1fr);
  gap: 12px;
  margin-bottom: 14px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${t.colors.textSecondary};
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.md};
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color ${t.transitions.fast},
    box-shadow ${t.transitions.fast};
  font-family: ${t.fonts.body};
  &:focus {
    border-color: ${t.colors.primary};
    box-shadow: ${t.shadows.focus};
  }
`;
const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.md};
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  resize: vertical;
  min-height: 72px;
  font-family: ${t.fonts.body};
  box-sizing: border-box;
  &:focus {
    border-color: ${t.colors.primary};
    box-shadow: ${t.shadows.focus};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px 20px;
  border-top: 1px solid ${t.colors.border};
`;

const BtnBase = styled.button`
  padding: 0 20px;
  height: 38px;
  border-radius: ${t.radii.md};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all ${t.transitions.fast};
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${t.fonts.body};
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BtnPrimary = styled(BtnBase)`
  background: ${t.colors.primary};
  color: white;
  border-color: ${t.colors.primary};
  &:hover:not(:disabled) {
    background: ${t.colors.primaryDark};
  }
`;

const BtnDanger = styled(BtnBase)`
  background: white;
  color: ${t.colors.danger};
  border-color: #fda29b;
  &:hover:not(:disabled) {
    background: ${t.colors.dangerBg};
  }
`;

const BtnGhost = styled(BtnBase)`
  background: white;
  color: ${t.colors.textSecondary};
  border-color: ${t.colors.border};
  &:hover {
    background: ${t.colors.surfaceAlt};
  }
`;

const BellBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${t.colors.warningBg};
  color: ${t.colors.warning};
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${t.radii.full};
  border: 1px solid #fec84b;
`;

const TypeBadge = styled.span<{ $bg: string; $text: string; $border: string }>`
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border: 1px solid ${({ $border }) => $border};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: ${t.radii.full};
`;

// ── Helpers ───────────────────────────────────────────────────
// ── Colour picker ─────────────────────────────────────────────
const SwatchGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  box-shadow: ${({ $active, $color }) =>
    $active
      ? `0 0 0 2px white, 0 0 0 4px ${$color}`
      : `0 1px 3px rgba(0,0,0,0.18)`};
  transform: ${({ $active }) => ($active ? "scale(1.13)" : "scale(1)")};

  &:hover {
    transform: scale(1.13);
    box-shadow:
      0 0 0 2px white,
      0 0 0 4px ${({ $color }) => $color};
  }

  &::after {
    content: ${({ $active }) => ($active ? "'✓'" : "''")};
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 800;
    line-height: 30px;
    pointer-events: none;
  }
`;

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTime = (t: string): string => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  const mStr = m > 0 ? ":" + String(m).padStart(2, "0") : "";
  return `${h12}${mStr}${ampm}`;
};

const buildCalendar = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { date: string; day: number; otherMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i);
    cells.push({ date: toYMD(d), day: prevDays - i, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: toYMD(new Date(year, month, d)),
      day: d,
      otherMonth: false,
    });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, next++);
    cells.push({ date: toYMD(d), day: next - 1, otherMonth: true });
  }
  return cells;
};

// Map each COLOR_SWATCH hex to a proper readable palette (bg tint, text, border)
// matching the same quality as TYPE_COLORS entries.
const SWATCH_PALETTES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "#465fff": { bg: "#ecf3ff", text: "#3641f5", border: "#465fff" },
  "#0ba5ec": { bg: "#f0f9ff", text: "#026aa2", border: "#0ba5ec" },
  "#9e77ed": { bg: "#f3e8ff", text: "#6941c6", border: "#9e77ed" },
  "#f79009": { bg: "#fffaeb", text: "#b54708", border: "#f79009" },
  "#f04438": { bg: "#fff1f0", text: "#b42318", border: "#f04438" },
  "#12b76a": { bg: "#ecfdf3", text: "#027a48", border: "#12b76a" },
};

// FIX: getColors now accepts an optional custom color (ev.color).
// Looks up the swatch palette for a proper readable bg/text/border combo —
// falls back to type-based palette if the color is not a known swatch.
const getColors = (type: EventType, color?: string) => {
  const base = TYPE_COLORS[type] ?? TYPE_COLORS.other;
  if (!color) return base;
  return SWATCH_PALETTES[color.toLowerCase()] ?? base;
};

const emptyForm = (): CreateEventBody => ({
  title: "",
  description: "",
  startDate: toYMD(new Date()),
  endDate: toYMD(new Date()),
  startTime: "",
  endTime: "",
  type: "event",
  color: "#465fff",
  allDay: false,
});

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
export const CalendarPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<CreateEventBody>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCalendarApi.list({ year, month: month + 1 });
      if (res.success) setEvents(res.data);
    } catch {
      dispatch(
        showAdminToast({ type: "error", message: "Failed to load events" }),
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, dispatch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Navigation ───────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // ── Modal helpers ────────────────────────────────────────────
  const openAdd = (date?: string) => {
    const base = date || toYMD(today);
    setForm({ ...emptyForm(), startDate: base, endDate: base });
    setShowAdd(true);
  };

  const openEvent = (e: CalendarEvent) => {
    setSelected(e);
    setEditMode(false);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      title: selected.title,
      description: selected.description,
      startDate: selected.startDate,
      endDate: selected.endDate,
      startTime: selected.startTime,
      endTime: selected.endTime,
      type: selected.type,
      color: selected.color,
      allDay: selected.allDay,
    });
    setEditMode(true);
  };

  const closeAll = () => {
    setShowAdd(false);
    setSelected(null);
    setEditMode(false);
    setForm(emptyForm());
  };

  const setField = (field: keyof CreateEventBody, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) {
      dispatch(showAdminToast({ type: "error", message: "Title is required" }));
      return;
    }
    setSaving(true);
    try {
      if (editMode && selected) {
        await adminCalendarApi.update(selected.id, form);
        dispatch(showAdminToast({ type: "success", message: "Event updated" }));
      } else {
        await adminCalendarApi.create(form);
        dispatch(showAdminToast({ type: "success", message: "Event created" }));
      }
      closeAll();
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      dispatch(showAdminToast({ type: "error", message: msg }));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.title}"?`)) return;
    setDeleting(true);
    try {
      await adminCalendarApi.delete(selected.id);
      dispatch(showAdminToast({ type: "success", message: "Event deleted" }));
      closeAll();
      fetchEvents();
    } catch {
      dispatch(showAdminToast({ type: "error", message: "Delete failed" }));
    } finally {
      setDeleting(false);
    }
  };

  // ── Grid ──────────────────────────────────────────────────────
  const cells = buildCalendar(year, month);
  const todayYMD = toYMD(today);

  // Build multi-day layout grouped by week row
  const multiDayByRow = React.useMemo(() => {
    const numRows = Math.ceil(cells.length / 7);
    const colTracks: Map<number, Set<number>>[] = Array.from(
      { length: numRows },
      () => new Map(),
    );

    const result: Map<
      number,
      { ev: CalendarEvent; colStart: number; span: number; track: number }[]
    > = new Map();
    for (let r = 0; r < numRows; r++) result.set(r, []);

    const multiDay = events.filter(
      (ev) => ev.endDate && ev.endDate !== ev.startDate,
    );

    for (const ev of multiDay) {
      const covered = cells
        .map((c, i) => ({ ...c, idx: i }))
        .filter(
          (c) =>
            c.date >= ev.startDate && c.date <= (ev.endDate || ev.startDate),
        );
      if (!covered.length) continue;

      const byRow: Record<number, typeof covered> = {};
      for (const c of covered) {
        const row = Math.floor(c.idx / 7);
        if (!byRow[row]) byRow[row] = [];
        byRow[row].push(c);
      }

      for (const [rowStr, rowCells] of Object.entries(byRow)) {
        const rowIdx = Number(rowStr);
        const colStart = rowCells[0].idx % 7;
        const span = rowCells.length;
        const rowColTracks = colTracks[rowIdx];

        let track = 0;
        outer: while (true) {
          for (let col = colStart; col < colStart + span; col++) {
            if (rowColTracks.get(col)?.has(track)) {
              track++;
              continue outer;
            }
          }
          break;
        }
        for (let col = colStart; col < colStart + span; col++) {
          if (!rowColTracks.has(col)) rowColTracks.set(col, new Set());
          rowColTracks.get(col)!.add(track);
        }
        result.get(rowIdx)!.push({ ev, colStart, span, track });
      }
    }
    return result;
  }, [cells, events]);

  // Single-day events per cell (excluding multi-day)
  const singleEventsForDate = (date: string) =>
    events.filter(
      (ev) =>
        ev.startDate === date && (!ev.endDate || ev.endDate === ev.startDate),
    );

  // ── Shared form JSX ───────────────────────────────────────────
  const EventForm = (
    <>
      <FormRow>
        <div>
          <Label>Title *</Label>
          <Input
            placeholder="Event title"
            value={form.title}
            autoFocus
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Start Date *</Label>
          <AdminDatePicker
            value={form.startDate}
            onChange={(val) => setField("startDate", val)}
            placeholder="Start date"
          />
        </div>
        <div>
          <Label>End Date</Label>
          <AdminDatePicker
            value={form.endDate}
            onChange={(val) => setField("endDate", val)}
            placeholder="End date"
          />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Start Time</Label>
          <AdminTimePicker
            value={form.startTime}
            onChange={(val) => setField("startTime", val)}
            placeholder="Start time"
          />
        </div>
        <div>
          <Label>End Time</Label>
          <AdminTimePicker
            value={form.endTime}
            onChange={(val) => setField("endTime", val)}
            placeholder="End time"
          />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Type</Label>
          <AdminDropdown
            style={{ minWidth: 230 }}
            value={form.type}
            onChange={(val) => setField("type", val as EventType)}
            options={EVENT_TYPES.map((et) => ({
              value: et.value,
              label: et.label,
            }))}
          />
        </div>
        <div>
          <Label>Color</Label>
          <SwatchGrid>
            {COLOR_SWATCHES.map((c) => (
              <Swatch
                key={c}
                type="button"
                $color={c}
                $active={form.color === c}
                onClick={() => setField("color", c)}
                title={c}
              />
            ))}
          </SwatchGrid>
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label>All Day</Label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <input
              type="checkbox"
              id="allDay"
              checked={form.allDay}
              onChange={(e) => setField("allDay", e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: t.colors.primary,
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="allDay"
              style={{
                fontSize: "0.875rem",
                color: t.colors.textSecondary,
                cursor: "pointer",
              }}
            >
              This is an all-day event
            </label>
          </div>
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="Optional details…"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>
      </FormRow>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.8125rem",
          color: t.colors.textMuted,
          background: t.colors.warningBg,
          border: "1px solid #fec84b",
          borderRadius: t.radii.md,
          padding: "8px 12px",
        }}
      >
        <Bell size={13} color={t.colors.warning} />
        Newsletter reminder auto-sent 2 days before this event at midnight UTC.
      </div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyle />
      <Wrap>
        {/* Page heading */}
        <PageHeader>
          <div>
            <PageTitle>Calendar</PageTitle>
            <PageSub>Manage events and schedule newsletter reminders.</PageSub>
          </div>
          <AddBtn onClick={() => openAdd()}>
            <Plus size={15} /> Add Event
          </AddBtn>
        </PageHeader>

        {/* Month nav */}
        <TopBar>
          <NavGroup>
            <NavBtn onClick={prevMonth} title="Previous month">
              <ChevronLeft size={16} />
            </NavBtn>
            <MonthTitle>
              {MONTH_NAMES[month]} {year}
            </MonthTitle>
            <NavBtn onClick={nextMonth} title="Next month">
              <ChevronRight size={16} />
            </NavBtn>
            <BtnGhost
              onClick={goToday}
              style={{ height: 34, padding: "0 14px", fontSize: "0.8125rem" }}
            >
              Today
            </BtnGhost>
          </NavGroup>

          {loading && (
            <div style={{ fontSize: "0.8125rem", color: t.colors.textMuted }}>
              Loading…
            </div>
          )}
        </TopBar>

        {/* Calendar grid */}
        <Grid>
          <DayHeader>
            {DAY_NAMES.map((d) => (
              <DayName key={d}>{d}</DayName>
            ))}
          </DayHeader>
          <CalBody>
            {Array.from(
              { length: Math.ceil(cells.length / 7) },
              (_, rowIdx) => {
                const weekCells = cells.slice(rowIdx * 7, rowIdx * 7 + 7);
                const rowBars = multiDayByRow.get(rowIdx) ?? [];
                const maxTrack = rowBars.reduce(
                  (m, b) => Math.max(m, b.track),
                  -1,
                );
                const extraPad = (maxTrack + 1) * 30;

                return (
                  <WeekRow key={rowIdx}>
                    {/* 7 day cells */}
                    {weekCells.map((cell) => {
                      const singleEvs = singleEventsForDate(cell.date);
                      return (
                        <Cell
                          key={cell.date}
                          $other={cell.otherMonth}
                          $today={cell.date === todayYMD}
                          onClick={() => !cell.otherMonth && openAdd(cell.date)}
                          style={{
                            cursor: cell.otherMonth ? "default" : "pointer",
                          }}
                        >
                          <DayNum $today={cell.date === todayYMD}>
                            {cell.day}
                          </DayNum>

                          {extraPad > 0 && (
                            <div
                              style={{ height: extraPad + 6, flexShrink: 0 }}
                            />
                          )}

                          {/* FIX: pass ev.color as second arg so custom colour is used */}
                          {singleEvs.slice(0, 3).map((ev) => {
                            const c = getColors(ev.type, ev.color);
                            return (
                              <EventPill
                                key={ev.id}
                                $bg={c.bg}
                                $text={c.text}
                                $border={c.border}
                                title={ev.title}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEvent(ev);
                                }}
                              >
                                {ev.startTime && !ev.allDay && (
                                  <span className="pill-time">
                                    {formatTime(ev.startTime)}
                                  </span>
                                )}
                                {/* FIX: removed stray "ss" typo */}
                                <span className="pill-title">{ev.title}</span>
                              </EventPill>
                            );
                          })}
                          {singleEvs.length > 3 && (
                            <MoreLabel>+{singleEvs.length - 3} more</MoreLabel>
                          )}
                        </Cell>
                      );
                    })}

                    {/* Multi-day spanning bars for this row */}
                    <WeekEventLayer>
                      {/* FIX: pass ev.color as second arg for spanning bars too */}
                      {rowBars.map(({ ev, colStart, span, track }) => {
                        const c = getColors(ev.type, ev.color);
                        return (
                          <SpanningBar
                            key={ev.id + "-" + rowIdx}
                            $bg={c.bg}
                            $text={c.text}
                            $border={c.border}
                            $colStart={colStart}
                            $span={span}
                            $track={track}
                            title={ev.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEvent(ev);
                            }}
                          >
                            {ev.startTime && !ev.allDay && (
                              <span className="bar-time">
                                {formatTime(ev.startTime)}
                              </span>
                            )}
                            <span className="bar-title">{ev.title}</span>
                          </SpanningBar>
                        );
                      })}
                    </WeekEventLayer>
                  </WeekRow>
                );
              },
            )}
          </CalBody>
        </Grid>

        {/* Reminder info */}
        <InfoBanner>
          <Bell size={14} color={t.colors.warning} style={{ flexShrink: 0 }} />
          <span>
            <strong>Auto-reminder active:</strong> All newsletter subscribers
            receive an email 2 days before each event, sent automatically at{" "}
            <strong>midnight UTC</strong>.
          </span>
        </InfoBanner>
      </Wrap>

      {/* ── Add Modal ── */}
      {showAdd && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Add New Event</ModalTitle>
              <CloseBtn onClick={closeAll}>
                <X size={16} />
              </CloseBtn>
            </ModalHead>
            <ModalBody>{EventForm}</ModalBody>
            <ModalFooter>
              <BtnGhost onClick={closeAll}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Event"}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}

      {/* ── View Modal ── */}
      {selected && !editMode && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* FIX: view modal colour dot now uses selected.color */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: getColors(selected.type, selected.color).border,
                    flexShrink: 0,
                  }}
                />
                <ModalTitle>{selected.title}</ModalTitle>
              </div>
              <CloseBtn onClick={closeAll}>
                <X size={16} />
              </CloseBtn>
            </ModalHead>

            <ModalBody>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* FIX: TypeBadge now uses selected.color */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <TypeBadge
                    $bg={getColors(selected.type, selected.color).bg}
                    $text={getColors(selected.type, selected.color).text}
                    $border={getColors(selected.type, selected.color).border}
                  >
                    {selected.type}
                  </TypeBadge>
                  {selected.notificationSent && (
                    <BellBadge>
                      <Bell size={11} /> Reminder sent
                    </BellBadge>
                  )}
                </div>

                {/* Date */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    color: t.colors.textSecondary,
                    fontSize: "0.875rem",
                  }}
                >
                  <Calendar
                    size={15}
                    color={t.colors.primary}
                    style={{ flexShrink: 0 }}
                  />
                  <span>
                    {selected.startDate}
                    {selected.endDate && selected.endDate !== selected.startDate
                      ? ` → ${selected.endDate}`
                      : ""}
                    {selected.allDay && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: "0.75rem",
                          color: t.colors.textMuted,
                        }}
                      >
                        (All day)
                      </span>
                    )}
                  </span>
                </div>

                {/* Time */}
                {selected.startTime && !selected.allDay && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      color: t.colors.textSecondary,
                      fontSize: "0.875rem",
                    }}
                  >
                    <Clock
                      size={15}
                      color={t.colors.primary}
                      style={{ flexShrink: 0 }}
                    />
                    <span>
                      {formatTime(selected.startTime)}
                      {selected.endTime
                        ? ` – ${formatTime(selected.endTime)}`
                        : ""}
                    </span>
                  </div>
                )}

                {/* Description */}
                {selected.description && (
                  <div
                    style={{
                      background: t.colors.surfaceAlt,
                      borderRadius: t.radii.md,
                      padding: "12px 14px",
                      fontSize: "0.875rem",
                      color: t.colors.textSecondary,
                      lineHeight: 1.65,
                    }}
                  >
                    {selected.description}
                  </div>
                )}

                <div style={{ fontSize: "0.75rem", color: t.colors.textMuted }}>
                  Created {new Date(selected.createdAt).toLocaleDateString()}
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <BtnDanger onClick={handleDelete} disabled={deleting}>
                <Trash2 size={14} />
                {deleting ? "Deleting…" : "Delete"}
              </BtnDanger>
              <BtnGhost onClick={closeAll}>Close</BtnGhost>
              <BtnPrimary onClick={openEdit}>
                <Edit2 size={14} /> Edit
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}

      {/* ── Edit Modal ── */}
      {selected && editMode && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Edit Event</ModalTitle>
              <CloseBtn onClick={closeAll}>
                <X size={16} />
              </CloseBtn>
            </ModalHead>
            <ModalBody>{EventForm}</ModalBody>
            <ModalFooter>
              <BtnGhost onClick={() => setEditMode(false)}>Back</BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Update Event"}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}
    </>
  );
};

export default CalendarPage;
