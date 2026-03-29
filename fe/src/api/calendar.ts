/**
 * src/api/calendar.ts
 * Calendar event API — CRUD + monthly listing.
 * Follows the same pattern as src/api/admin.ts.
 */

import api from './client';

// ── Types ─────────────────────────────────────────────────────
export type EventType = 'event' | 'meeting' | 'seminar' | 'submission' | 'other';

export interface CalendarEvent {
  id:               string;
  title:            string;
  description:      string;
  startDate:        string;   // 'YYYY-MM-DD'
  endDate:          string;   // 'YYYY-MM-DD'
  startTime:        string;   // 'HH:MM' or ''
  endTime:          string;   // 'HH:MM' or ''
  type:             EventType;
  color:            string;
  allDay:           boolean;
  notificationSent: boolean;
  createdAt:        string;
  updatedAt:        string;
}

export interface CreateEventBody {
  title:       string;
  description: string;
  startDate:   string;
  endDate:     string;
  startTime:   string;
  endTime:     string;
  type:        EventType;
  color:       string;
  allDay:      boolean;
}

interface Ok<T> { success: boolean; data: T }

// ── API ───────────────────────────────────────────────────────
export const adminCalendarApi = {
  /** List events for a given year/month (1-based month). */
  list: (params: { year: number; month: number }) => {
    const qs = new URLSearchParams({
      year:  String(params.year),
      month: String(params.month),
    }).toString();
    return api.get<Ok<CalendarEvent[]>>(`/api/admin/calendar?${qs}`);
  },

  /** Get a single event by id. */
  getOne: (id: string) =>
    api.get<Ok<CalendarEvent>>(`/api/admin/calendar/${id}`),

  /** Create a new event. */
  create: (body: CreateEventBody) =>
    api.post<Ok<CalendarEvent>>('/api/admin/calendar', body),

  /** Full update of an existing event. */
  update: (id: string, body: Partial<CreateEventBody>) =>
    api.put<Ok<CalendarEvent>>(`/api/admin/calendar/${id}`, body),

  /** Delete an event. */
  delete: (id: string) =>
    api.delete<Ok<{ message: string }>>(`/api/admin/calendar/${id}`),
};