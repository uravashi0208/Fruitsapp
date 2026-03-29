/**
 * src/admin/pages/CalendarPage.tsx
 *
 * Full admin calendar — month view, add / edit / delete events,
 * auto-reminder info banner.
 *
 * Uses adminTheme tokens (blues / greys) that match the rest of
 * the Vegefoods admin panel — NOT the standalone green palette.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import {
  ChevronLeft, ChevronRight, Plus, X,
  Calendar, Clock, Trash2, Edit2, Bell,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import {
  adminCalendarApi,
  CalendarEvent,
  CreateEventBody,
  EventType,
} from '../../api/calendar';
import { useAdminDispatch, showAdminToast } from '../store';

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
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'event',      label: 'Event'      },
  { value: 'meeting',    label: 'Meeting'    },
  { value: 'seminar',    label: 'Seminar'    },
  { value: 'submission', label: 'Submission' },
  { value: 'other',      label: 'Other'      },
];

// Uses brand colours that fit the blue-based admin theme
const TYPE_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  event:      { bg: '#ecf3ff', text: '#3641f5', border: '#465fff' },
  meeting:    { bg: '#f0f9ff', text: '#026aa2', border: '#0ba5ec' },
  seminar:    { bg: '#f3e8ff', text: '#6941c6', border: '#9e77ed' },
  submission: { bg: '#fffaeb', text: '#b54708', border: '#f79009' },
  other:      { bg: '#f9fafb', text: '#475467', border: '#98a2b3' },
};

const COLOR_SWATCHES = [
  '#465fff', '#0ba5ec', '#9e77ed',
  '#f79009', '#f04438', '#12b76a',
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
  &:hover { background: ${t.colors.primaryDark}; }
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
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const Cell = styled.div<{ $other?: boolean; $today?: boolean }>`
  min-height: 150px;
  border-right: 1px solid ${t.colors.border};
  border-bottom: 1px solid ${t.colors.border};
  padding: 10px 15px 6px;
  background: ${({ $today, $other }) =>
    $today ? `${t.colors.primary}08` :
    $other ? t.colors.surfaceAlt :
    'white'};
  transition: background 0.1s;
  &:nth-child(7n) { border-right: none; }
`;

const DayNum = styled.div<{ $today?: boolean }>`
  font-size: 0.9200rem;
  font-weight: ${({ $today }) => $today ? '700' : '500'};
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
      : css`color: ${t.colors.textSecondary};`}
`;

const EventPill = styled.div<{ $bg: string; $text: string; $border: string }>`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${({ $text }) => $text};
  background: ${({ $bg }) => $bg};
  border-left: 3px solid ${({ $border }) => $border};
  margin-bottom: 3px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  animation: calFadeIn 0.2s ease;
  transition: opacity 0.12s;
  &:hover { opacity: 0.75; }
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
  &:hover { background: ${t.colors.border}; }
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
  transition: border-color ${t.transitions.fast}, box-shadow ${t.transitions.fast};
  font-family: ${t.fonts.body};
  &:focus {
    border-color: ${t.colors.primary};
    box-shadow: ${t.shadows.focus};
  }
`;

const Select = styled.select`
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid ${t.colors.border};
  border-radius: ${t.radii.md};
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
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
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const BtnPrimary = styled(BtnBase)`
  background: ${t.colors.primary};
  color: white;
  border-color: ${t.colors.primary};
  &:hover:not(:disabled) { background: ${t.colors.primaryDark}; }
`;

const BtnDanger = styled(BtnBase)`
  background: white;
  color: ${t.colors.danger};
  border-color: #fda29b;
  &:hover:not(:disabled) { background: ${t.colors.dangerBg}; }
`;

const BtnGhost = styled(BtnBase)`
  background: white;
  color: ${t.colors.textSecondary};
  border-color: ${t.colors.border};
  &:hover { background: ${t.colors.surfaceAlt}; }
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
const toYMD = (d: Date) => d.toISOString().slice(0, 10);

const formatTime = (t: string): string => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  const mStr = m > 0 ? ':' + String(m).padStart(2, '0') : '';
  return `${h12}${mStr}${ampm}`;
};

const buildCalendar = (year: number, month: number) => {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const cells: { date: string; day: number; otherMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i);
    cells.push({ date: toYMD(d), day: prevDays - i, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toYMD(new Date(year, month, d)), day: d, otherMonth: false });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, next++);
    cells.push({ date: toYMD(d), day: next - 1, otherMonth: true });
  }
  return cells;
};

const eventsForDate = (events: CalendarEvent[], date: string) =>
  events.filter(e => date >= e.startDate && date <= (e.endDate || e.startDate));

const getColors = (type: EventType) => TYPE_COLORS[type] ?? TYPE_COLORS.other;

const emptyForm = (): CreateEventBody => ({
  title:       '',
  description: '',
  startDate:   toYMD(new Date()),
  endDate:     toYMD(new Date()),
  startTime:   '',
  endTime:     '',
  type:        'event',
  color:       '#465fff',
  allDay:      false,
});

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
export const CalendarPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const today    = new Date();

  const [year,   setYear]   = useState(today.getFullYear());
  const [month,  setMonth]  = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd,  setShowAdd]  = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form,     setForm]     = useState<CreateEventBody>(emptyForm());
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCalendarApi.list({ year, month: month + 1 });
      if (res.success) setEvents(res.data);
    } catch {
      dispatch(showAdminToast({ type: 'error', message: 'Failed to load events' }));
    } finally {
      setLoading(false);
    }
  }, [year, month, dispatch]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Navigation ───────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // ── Modal helpers ────────────────────────────────────────────
  const openAdd = (date?: string) => {
    const base = date || toYMD(today);
    setForm({ ...emptyForm(), startDate: base, endDate: base });
    setShowAdd(true);
  };

  const openEvent = (e: CalendarEvent) => { setSelected(e); setEditMode(false); };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      title:       selected.title,
      description: selected.description,
      startDate:   selected.startDate,
      endDate:     selected.endDate,
      startTime:   selected.startTime,
      endTime:     selected.endTime,
      type:        selected.type,
      color:       selected.color,
      allDay:      selected.allDay,
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
    setForm(f => ({ ...f, [field]: value }));

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) {
      dispatch(showAdminToast({ type: 'error', message: 'Title is required' }));
      return;
    }
    setSaving(true);
    try {
      if (editMode && selected) {
        await adminCalendarApi.update(selected.id, form);
        dispatch(showAdminToast({ type: 'success', message: 'Event updated' }));
      } else {
        await adminCalendarApi.create(form);
        dispatch(showAdminToast({ type: 'success', message: 'Event created' }));
      }
      closeAll();
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      dispatch(showAdminToast({ type: 'error', message: msg }));
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
      dispatch(showAdminToast({ type: 'success', message: 'Event deleted' }));
      closeAll();
      fetchEvents();
    } catch {
      dispatch(showAdminToast({ type: 'error', message: 'Delete failed' }));
    } finally {
      setDeleting(false);
    }
  };

  // ── Grid ──────────────────────────────────────────────────────
  const cells    = buildCalendar(year, month);
  const todayYMD = toYMD(today);

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
            onChange={e => setField('title', e.target.value)}
          />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={e => setField('startDate', e.target.value)}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={e => setField('endDate', e.target.value)}
          />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Start Time</Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={e => setField('startTime', e.target.value)}
          />
        </div>
        <div>
          <Label>End Time</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={e => setField('endTime', e.target.value)}
          />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Type</Label>
          <Select
            value={form.type}
            onChange={e => setField('type', e.target.value as EventType)}
          >
            {EVENT_TYPES.map(et => (
              <option key={et.value} value={et.value}>{et.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Colour</Label>
          <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
            {COLOR_SWATCHES.map(c => (
              <div
                key={c}
                onClick={() => setField('color', c)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c,
                  cursor: 'pointer', flexShrink: 0,
                  border: form.color === c ? '3px solid #101828' : '2px solid transparent',
                  transition: 'border 0.12s', boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label>All Day</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="allDay"
              checked={form.allDay}
              onChange={e => setField('allDay', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: t.colors.primary, cursor: 'pointer' }}
            />
            <label htmlFor="allDay" style={{ fontSize: '0.875rem', color: t.colors.textSecondary, cursor: 'pointer' }}>
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
            onChange={e => setField('description', e.target.value)}
          />
        </div>
      </FormRow>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.8125rem', color: t.colors.textMuted,
        background: t.colors.warningBg, border: '1px solid #fec84b',
        borderRadius: t.radii.md, padding: '8px 12px',
      }}>
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
            <MonthTitle>{MONTH_NAMES[month]} {year}</MonthTitle>
            <NavBtn onClick={nextMonth} title="Next month">
              <ChevronRight size={16} />
            </NavBtn>
            <BtnGhost
              onClick={goToday}
              style={{ height: 34, padding: '0 14px', fontSize: '0.8125rem' }}
            >
              Today
            </BtnGhost>
          </NavGroup>

          {loading && (
            <div style={{ fontSize: '0.8125rem', color: t.colors.textMuted }}>
              Loading…
            </div>
          )}
        </TopBar>

        {/* Calendar grid */}
        <Grid>
          <DayHeader>
            {DAY_NAMES.map(d => <DayName key={d}>{d}</DayName>)}
          </DayHeader>
          <CalBody>
            {cells.map(cell => {
              const dayEvents = eventsForDate(events, cell.date);
              return (
                <Cell
                  key={cell.date}
                  $other={cell.otherMonth}
                  $today={cell.date === todayYMD}
                  onClick={() => !cell.otherMonth && openAdd(cell.date)}
                  style={{ cursor: cell.otherMonth ? 'default' : 'pointer' }}
                >
                  <DayNum $today={cell.date === todayYMD}>{cell.day}</DayNum>

                  {dayEvents.slice(0, 3).map(ev => {
                    const c = getColors(ev.type);
                    return (
                      <EventPill
                        key={ev.id + cell.date}
                        $bg={c.bg} $text={c.text} $border={c.border}
                        title={ev.title}
                        onClick={e => { e.stopPropagation(); openEvent(ev); }}
                      >
                        {ev.startTime && !ev.allDay && (
                          <span style={{ opacity: 0.65, flexShrink: 0 }}>
                            {formatTime(ev.startTime)}
                          </span>
                        )}
                        {ev.title}
                      </EventPill>
                    );
                  })}

                  {dayEvents.length > 3 && (
                    <MoreLabel>+{dayEvents.length - 3} more</MoreLabel>
                  )}
                </Cell>
              );
            })}
          </CalBody>
        </Grid>

        {/* Reminder info */}
        <InfoBanner>
          <Bell size={14} color={t.colors.warning} style={{ flexShrink: 0 }} />
          <span>
            <strong>Auto-reminder active:</strong> All newsletter subscribers receive an email
            2 days before each event, sent automatically at <strong>midnight UTC</strong>.
          </span>
        </InfoBanner>
      </Wrap>

      {/* ── Add Modal ── */}
      {showAdd && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Add New Event</ModalTitle>
              <CloseBtn onClick={closeAll}><X size={16} /></CloseBtn>
            </ModalHead>
            <ModalBody>{EventForm}</ModalBody>
            <ModalFooter>
              <BtnGhost onClick={closeAll}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Event'}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}

      {/* ── View Modal ── */}
      {selected && !editMode && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: getColors(selected.type).border, flexShrink: 0,
                }} />
                <ModalTitle>{selected.title}</ModalTitle>
              </div>
              <CloseBtn onClick={closeAll}><X size={16} /></CloseBtn>
            </ModalHead>

            <ModalBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Type badge + reminder badge */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <TypeBadge
                    $bg={getColors(selected.type).bg}
                    $text={getColors(selected.type).text}
                    $border={getColors(selected.type).border}
                  >
                    {selected.type}
                  </TypeBadge>
                  {selected.notificationSent && (
                    <BellBadge><Bell size={11} /> Reminder sent</BellBadge>
                  )}
                </div>

                {/* Date */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: t.colors.textSecondary, fontSize: '0.875rem' }}>
                  <Calendar size={15} color={t.colors.primary} style={{ flexShrink: 0 }} />
                  <span>
                    {selected.startDate}
                    {selected.endDate && selected.endDate !== selected.startDate
                      ? ` → ${selected.endDate}` : ''}
                    {selected.allDay && (
                      <span style={{ marginLeft: 6, fontSize: '0.75rem', color: t.colors.textMuted }}>(All day)</span>
                    )}
                  </span>
                </div>

                {/* Time */}
                {selected.startTime && !selected.allDay && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: t.colors.textSecondary, fontSize: '0.875rem' }}>
                    <Clock size={15} color={t.colors.primary} style={{ flexShrink: 0 }} />
                    <span>
                      {formatTime(selected.startTime)}
                      {selected.endTime ? ` – ${formatTime(selected.endTime)}` : ''}
                    </span>
                  </div>
                )}

                {/* Description */}
                {selected.description && (
                  <div style={{
                    background: t.colors.surfaceAlt,
                    borderRadius: t.radii.md,
                    padding: '12px 14px',
                    fontSize: '0.875rem',
                    color: t.colors.textSecondary,
                    lineHeight: 1.65,
                  }}>
                    {selected.description}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: t.colors.textMuted }}>
                  Created {new Date(selected.createdAt).toLocaleDateString()}
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <BtnDanger onClick={handleDelete} disabled={deleting}>
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete'}
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
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Edit Event</ModalTitle>
              <CloseBtn onClick={closeAll}><X size={16} /></CloseBtn>
            </ModalHead>
            <ModalBody>{EventForm}</ModalBody>
            <ModalFooter>
              <BtnGhost onClick={() => setEditMode(false)}>Back</BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Update Event'}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}
    </>
  );
};

export default CalendarPage;