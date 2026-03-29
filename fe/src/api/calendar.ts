/**
 * api/calendar.ts
 *
 * Calendar API — public reads + admin CRUD
 * Add this file to src/api/
 */

import api from "./client";


// ── Types ──────────────────────────────────────────────────────
export type EventType = 'event' | 'meeting' | 'seminar' | 'submission' | 'other';

export interface CalendarEvent {
  id:               string;
  title:            string;
  description:      string;
  startDate:        string;   // YYYY-MM-DD
  endDate:          string;   // YYYY-MM-DD
  startTime:        string;   // HH:MM (24h) or ''
  endTime:          string;
  type:             EventType;
  color:            string;   // hex
  allDay:           boolean;
  notificationSent: boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface CreateEventBody {
  title:        string;
  description?: string;
  startDate:    string;
  endDate?:     string;
  startTime?:   string;
  endTime?:     string;
  type?:        EventType;
  color?:       string;
  allDay?:      boolean;
}

interface ApiOk<T> { success: boolean; data: T; message?: string }

// ── Public API (no auth) ───────────────────────────────────────
export const calendarPublicApi = {
  list: (params: { year?: number; month?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return api.get<ApiOk<CalendarEvent[]>>(`/api/calendar${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) =>
    api.get<ApiOk<CalendarEvent>>(`/api/calendar/${id}`),
};

// ── Admin API (requires auth) ──────────────────────────────────
export const adminCalendarApi = {
  list: (params: { year?: number; month?: number } = {}) =>
    calendarPublicApi.list(params),

  create: (body: CreateEventBody) =>
    api.post<ApiOk<CalendarEvent>>('/api/admin/calendar', body),

  update: (id: string, body: Partial<CreateEventBody>) =>
    api.put<ApiOk<CalendarEvent>>(`/api/admin/calendar/${id}`, body),

  delete: (id: string) =>
    api.delete<ApiOk<null>>(`/api/admin/calendar/${id}`),
};