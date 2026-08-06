// storage.js
// The only file that talks to localStorage directly.
// If persistence ever moves to IndexedDB or a backend, this is the only file that changes.

const STORAGE_KEY = 'events';

export function getEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read events from localStorage:', err);
    return [];
  }
}

export function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}