/**
 * routes/calendar.js
 *
 * PUBLIC:
 *   GET  /api/calendar              list events (optional ?year=&month=)
 *   GET  /api/calendar/:id          get single event
 *
 * ADMIN:
 *   POST   /api/admin/calendar       create event
 *   PUT    /api/admin/calendar/:id   update event
 *   DELETE /api/admin/calendar/:id   delete event
 */

const { Router }         = require('express');
const calendarService    = require('../services/calendarService');
const asyncHandler       = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate, requireEditor } = require('../middleware/auth');

/* ── Public router ─────────────────────────────────────────── */
const publicRouter = Router();

// List events (no auth required — for storefront display)
publicRouter.get('/', asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const events = await calendarService.listEvents({ year, month });
  success(res, events, 'Events fetched');
}));

// Single event
publicRouter.get('/:id', asyncHandler(async (req, res) => {
  const event = await calendarService.getEvent(req.params.id);
  success(res, event, 'Event fetched');
}));

/* ── Admin router ──────────────────────────────────────────── */
const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

// List events (admin — same as public but auth-gated)
adminRouter.get('/', asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const events = await calendarService.listEvents({ year, month });
  success(res, events, 'Events fetched');
}));

// Single event
adminRouter.get('/:id', asyncHandler(async (req, res) => {
  const event = await calendarService.getEvent(req.params.id);
  success(res, event, 'Event fetched');
}));

// Create
adminRouter.post('/', asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, startTime, endTime, type, color, allDay } = req.body;
  const event = await calendarService.createEvent({ title, description, startDate, endDate, startTime, endTime, type, color, allDay });
  created(res, event, 'Event created');
}));

// Update
adminRouter.put('/:id', asyncHandler(async (req, res) => {
  const event = await calendarService.updateEvent(req.params.id, req.body);
  success(res, event, 'Event updated');
}));

// Delete
adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await calendarService.deleteEvent(req.params.id);
  noContent(res, 'Event deleted');
}));

module.exports = { publicRouter, adminRouter };