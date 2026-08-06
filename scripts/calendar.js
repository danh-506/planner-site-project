// calendar.js
// Owns date-grid math: which days belong in a month view, and month navigation.
// Reads events via events.js but has no idea localStorage exists.

import { getEventsForDate } from './events.js';
import { ALL_DAY_LABEL } from './constants.js';

function compareEventsByTime(a, b) {
  if (a.time === ALL_DAY_LABEL && b.time === ALL_DAY_LABEL) return 0;
  if (a.time === ALL_DAY_LABEL) return -1; // all-day always floats to the top
  if (b.time === ALL_DAY_LABEL) return 1;
  return a.time.localeCompare(b.time); // "HH:MM" strings sort correctly as-is
}

export function toISODate(date) {
  // Local calendar date as YYYY-MM-DD (avoids UTC offset shifting the day)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

// Returns an array of 42 cells (6 weeks) for a consistent grid size.
// Each cell is either null (padding from prev/next month) or
// { day, isoDate, events }.
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const isoDate = toISODate(dateObj);
    cells.push({
      day,
      isoDate,
      events: getEventsForDate(isoDate).sort(compareEventsByTime),
    });
  }

  while (cells.length < 42) {
    cells.push(null);
  }

  return cells;
}