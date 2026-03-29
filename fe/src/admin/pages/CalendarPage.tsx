/**
 * admin/pages/CalendarPage.tsx
 *
 * Full admin calendar — month view, add/edit/delete events, cron reminder info.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar,
  Clock, Trash2, Edit2, Bell,
} from 'lucide-react';
import { adminTheme as t } from '../styles/adminTheme';
import { adminCalendarApi, CalendarEvent, CreateEventBody, EventType } from '../../api/calendar';
import { useAdminDispatch, showAdminToast } from '../store';

// ── Global animation ──────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  @keyframes calFadeIn { from { opacity:0;transform:translateY(-8px); } to { opacity:1;transform:translateY(0); } }
  @keyframes modalIn   { from { opacity:0;transform:scale(0.96);      } to { opacity:1;transform:scale(1);     } }
`;

// ── Constants ──────────────────────────────────────────────────
const DAY_NAMES   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'event',      label: 'Event'      },
  { value: 'meeting',    label: 'Meeting'    },
  { value: 'seminar',    label: 'Seminar'    },
  { value: 'submission', label: 'Submission' },
  { value: 'other',      label: 'Other'      },
];

const TYPE_COLORS: Record<EventType, { bg: string; text: string; border: string }> = {
  event:      { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
  meeting:    { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
  seminar:    { bg: '#f3e5f5', text: '#6a1b9a', border: '#9c27b0' },
  submission: { bg: '#fff3e0', text: '#e65100', border: '#ff9800' },
  other:      { bg: '#f5f5f5', text: '#546e7a', border: '#90a4ae' },
};

const COLOR_SWATCHES = ['#4caf50','#2196f3','#9c27b0','#ff9800','#f44336','#00bcd4'];

// ── Styled Components ──────────────────────────────────────────
const Wrap = styled.div`
  padding: 24px;
  font-family: ${t.fonts.body};
  min-height: 100vh;
  background: ${t.colors.surface};
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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
  border-radius: 8px;
  border: 1px solid ${t.colors.border};
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${t.colors.textSecondary};
  transition: all 0.15s;
  &:hover {
    background: ${t.colors.surfaceAlt};
    border-color: ${t.colors.primary};
    color: ${t.colors.primary};
  }
`;

const MonthTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${t.colors.textPrimary};
  margin: 0;
  min-width: 140px;
  text-align: center;
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${t.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  height: 36px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #388e3c; }
`;

const ViewToggle = styled.div`display: flex;`;

const ViewBtn = styled.button<{ $active?: boolean }>`
  padding: 6px 14px;
  border: 1px solid ${t.colors.border};
  background: ${({ $active }) => $active ? t.colors.primary : 'white'};
  color: ${({ $active }) => $active ? 'white' : t.colors.textSecondary};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:first-child { border-radius: 8px 0 0 8px; }
  &:last-child  { border-radius: 0 8px 8px 0; }
  &:not(:last-child) { border-right: none; }
`;

const Grid = styled.div`
  border: 1px solid ${t.colors.border};
  border-radius: 12px;
  overflow: hidden;
  background: white;
`;

const DayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid ${t.colors.border};
`;

const DayName = styled.div`
  padding: 10px 0;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${t.colors.textMuted};
  letter-spacing: 0.5px;
`;

const CalBody = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const Cell = styled.div<{ $other?: boolean; $today?: boolean }>`
  min-height: 110px;
  border-right: 1px solid ${t.colors.border};
  border-bottom: 1px solid ${t.colors.border};
  padding: 8px 6px 6px;
  background: ${({ $today, $other }) => $today ? '#f0fdf4' : $other ? t.colors.surfaceAlt : 'white'};
  &:nth-child(7n) { border-right: none; }
`;

const DayNum = styled.div<{ $today?: boolean }>`
  font-size: 0.8125rem;
  font-weight: ${({ $today }) => $today ? '700' : '500'};
  margin-bottom: 4px;
  ${({ $today }) => $today
    ? css`
        background: #4caf50;
        color: white;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
      `
    : css`color: ${t.colors.textSecondary};`
  }
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
  &:hover { opacity: 0.8; }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
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
  border-radius: 8px;
  border: none;
  background: ${t.colors.surfaceAlt};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${t.colors.textMuted};
  transition: background 0.15s;
  &:hover { background: ${t.colors.border}; }
`;

const ModalBody = styled.div`padding: 20px 24px;`;

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
  border-radius: 8px;
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus { border-color: ${t.colors.primary}; }
`;

const Select = styled.select`
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid ${t.colors.border};
  border-radius: 8px;
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
  &:focus { border-color: ${t.colors.primary}; }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${t.colors.border};
  border-radius: 8px;
  font-size: 0.875rem;
  color: ${t.colors.textPrimary};
  background: white;
  outline: none;
  resize: vertical;
  min-height: 72px;
  font-family: inherit;
  box-sizing: border-box;
  &:focus { border-color: ${t.colors.primary}; }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px 20px;
`;

// Split into separate button variants to avoid nested template literals
const BtnBase = styled.button`
  padding: 0 20px;
  height: 38px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const BtnPrimary = styled(BtnBase)`
  background: #4caf50;
  color: white;
  border-color: #4caf50;
  &:hover:not(:disabled) { background: #388e3c; }
`;

const BtnDanger = styled(BtnBase)`
  background: white;
  color: #e53935;
  border-color: #e57373;
  &:hover:not(:disabled) { background: #ffebee; }
`;

const BtnGhost = styled(BtnBase)`
  background: white;
  color: #546e7a;
  border-color: #e0e0e0;
  &:hover { background: #f5f5f5; }
`;

const BellBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff3e0;
  color: #e65100;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid #ffcc02;
`;

const InfoBanner = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbf0;
  border: 1px solid #ffe082;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.8125rem;
  color: #795548;
`;

// ── Helpers ────────────────────────────────────────────────────
const toYMD = (d: Date) => d.toISOString().slice(0, 10);

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  const ampm = h >= 12 ? 'p' : 'a';
  const h12 = h % 12 || 12;
  const mStr = m > 0 ? ':' + String(m).padStart(2, '0') : '';
  return h12 + mStr + ampm;
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

const getColors = (type: EventType) => TYPE_COLORS[type] || TYPE_COLORS.other;

const emptyForm = (): CreateEventBody => ({
  title: '',
  description: '',
  startDate: toYMD(new Date()),
  endDate:   toYMD(new Date()),
  startTime: '',
  endTime:   '',
  type:      'event',
  color:     '#4caf50',
  allDay:    false,
});

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════
export const CalendarPage: React.FC = () => {
  const dispatch = useAdminDispatch();
  const today    = new Date();

  const [view,    setView]    = useState<'month' | 'week' | 'day'>('month');
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [events,  setEvents]  = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd,  setShowAdd]  = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [form,     setForm]     = useState<CreateEventBody>(emptyForm());
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);

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

  // ── Modal helpers ────────────────────────────────────────────
  const openAdd = () => { setForm(emptyForm()); setShowAdd(true); };

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

  const closeAll = () => { setShowAdd(false); setSelected(null); setEditMode(false); setForm(emptyForm()); };

  const setField = (field: keyof CreateEventBody, value: any) =>
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
    } catch (err: any) {
      dispatch(showAdminToast({ type: 'error', message: err?.message || 'Save failed' }));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    const title = selected.title;
    if (!window.confirm('Delete "' + title + '"?')) return;
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

  // ── Grid data ─────────────────────────────────────────────────
  const cells    = buildCalendar(year, month);
  const todayYMD = toYMD(today);

  // ── Shared form JSX ───────────────────────────────────────────
  const EventFormJSX = (
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
          <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Start Time</Label>
          <Input type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
        </div>
        <div>
          <Label>End Time</Label>
          <Input type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
        </div>
      </FormRow>

      <FormRow $cols={2}>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onChange={e => setField('type', e.target.value as EventType)}>
            {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
          </Select>
        </div>
        <div>
          <Label>Color</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {COLOR_SWATCHES.map(c => (
              <div
                key={c}
                onClick={() => setField('color', c)}
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: c,
                  cursor: 'pointer',
                  border: form.color === c ? '3px solid #333' : '2px solid transparent',
                  transition: 'border 0.12s',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
        </div>
      </FormRow>

      <FormRow>
        <div>
          <Label>Description</Label>
          <Textarea
            placeholder="Optional details..."
            value={form.description}
            onChange={e => setField('description', e.target.value)}
          />
        </div>
      </FormRow>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: t.colors.textMuted }}>
        <Bell size={13} color="#f59e0b" />
        Newsletter reminder auto-sent 2 days before this event at midnight.
      </div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyle />
      <Wrap>

        <TopBar>
          <NavGroup>
            <AddBtn onClick={openAdd}>
              <Plus size={15} /> Add Event
            </AddBtn>
            <NavBtn onClick={prevMonth}><ChevronLeft size={16} /></NavBtn>
            <MonthTitle>{MONTH_NAMES[month]} {year}</MonthTitle>
            <NavBtn onClick={nextMonth}><ChevronRight size={16} /></NavBtn>
          </NavGroup>

          <ViewToggle>
            {(['month', 'week', 'day'] as const).map(v => (
              <ViewBtn key={v} $active={view === v} onClick={() => setView(v)}>{v}</ViewBtn>
            ))}
          </ViewToggle>
        </TopBar>

        <Grid>
          <DayHeader>
            {DAY_NAMES.map(d => <DayName key={d}>{d}</DayName>)}
          </DayHeader>
          {loading && (
                <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10, fontSize: '0.875rem', color: t.colors.textMuted,
                }}>
                Loading…
                </div>
            )}

          <CalBody>
            {cells.map(cell => {
              const dayEvents = eventsForDate(events, cell.date);
              return (
                <Cell key={cell.date} $other={cell.otherMonth} $today={cell.date === todayYMD}>
                  <DayNum $today={cell.date === todayYMD}>{cell.day}</DayNum>

                  {dayEvents.slice(0, 3).map(ev => {
                    const c = getColors(ev.type);
                    return (
                      <EventPill
                        key={ev.id + cell.date}
                        $bg={c.bg} $text={c.text} $border={c.border}
                        onClick={() => openEvent(ev)}
                        title={ev.title}
                      >
                        {ev.startTime && !ev.allDay && (
                          <span style={{ opacity: 0.7 }}>{formatTime(ev.startTime)}</span>
                        )}
                        {ev.title}
                      </EventPill>
                    );
                  })}

                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: '0.625rem', color: t.colors.textMuted, marginTop: 2, paddingLeft: 4 }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </Cell>
              );
            })}
          </CalBody>
        </Grid>

        <InfoBanner>
          <Bell size={14} color="#f59e0b" />
          <span>
            <strong>Auto-reminder active:</strong> All newsletter subscribers receive an email
            2 days before each event, sent automatically at <strong>midnight UTC</strong>.
          </span>
        </InfoBanner>
      </Wrap>

      {/* Add Modal */}
      {showAdd && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Add New Event</ModalTitle>
              <CloseBtn onClick={closeAll}><X size={16} /></CloseBtn>
            </ModalHead>
            <ModalBody>{EventFormJSX}</ModalBody>
            <ModalFooter>
              <BtnGhost onClick={closeAll}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Event'}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}

      {/* View Modal */}
      {selected && !editMode && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: getColors(selected.type).border }} />
                <ModalTitle>{selected.title}</ModalTitle>
              </div>
              <CloseBtn onClick={closeAll}><X size={16} /></CloseBtn>
            </ModalHead>
            <ModalBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    background: getColors(selected.type).bg,
                    color: getColors(selected.type).text,
                    border: '1px solid ' + getColors(selected.type).border,
                    fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                  }}>
                    {selected.type}
                  </span>
                  {selected.notificationSent && (
                    <BellBadge><Bell size={11} /> Reminder sent</BellBadge>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: t.colors.textSecondary, fontSize: '0.875rem' }}>
                  <Calendar size={15} color={t.colors.primary} />
                  <span>
                    {selected.startDate}
                    {selected.endDate && selected.endDate !== selected.startDate
                      ? ' to ' + selected.endDate : ''}
                  </span>
                </div>

                {selected.startTime && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: t.colors.textSecondary, fontSize: '0.875rem' }}>
                    <Clock size={15} color={t.colors.primary} />
                    <span>{selected.startTime}{selected.endTime ? ' - ' + selected.endTime : ''}</span>
                  </div>
                )}

                {selected.description && (
                  <div style={{
                    background: t.colors.surfaceAlt, borderRadius: 8,
                    padding: '12px 14px', fontSize: '0.875rem',
                    color: t.colors.textSecondary, lineHeight: 1.6,
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
                <Trash2 size={14} />{deleting ? 'Deleting...' : 'Delete'}
              </BtnDanger>
              <BtnGhost onClick={closeAll}>Close</BtnGhost>
              <BtnPrimary onClick={openEdit}><Edit2 size={14} />Edit</BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}

      {/* Edit Modal */}
      {selected && editMode && (
        <Backdrop onClick={closeAll}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Edit Event</ModalTitle>
              <CloseBtn onClick={closeAll}><X size={16} /></CloseBtn>
            </ModalHead>
            <ModalBody>{EventFormJSX}</ModalBody>
            <ModalFooter>
              <BtnGhost onClick={() => setEditMode(false)}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Update Event'}
              </BtnPrimary>
            </ModalFooter>
          </Modal>
        </Backdrop>
      )}
    </>
  );
};

export default CalendarPage;