// events.js
// Owns the shape of an "event" and all create/read/update/delete logic.
// Doesn't know or care how the calendar renders things.

import { getEvents, saveEvents } from './storage.js';

export function createEvent({ title, date, time = null, color = '#3b82f6', notes = '' }) {
  const events = getEvents();
  const event = {
    id: crypto.randomUUID(),
    title,
    date,   // ISO string, e.g. "2026-08-05"
    time,   // e.g. "14:30", or null for all-day events
    color,
    notes,
  };
  events.push(event);
  saveEvents(events);
  return event;
}

export function updateEvent(id, changes) {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  events[index] = { ...events[index], ...changes };
  saveEvents(events);
  return events[index];
}

export function deleteEvent(id) {
  const events = getEvents().filter((e) => e.id !== id);
  saveEvents(events);
}

export function getAllEvents() {
  return getEvents();
}

export function getEventsForDate(isoDate) {
  return getEvents().filter((e) => e.date === isoDate);
}