// components/main-calendar.js
// Renders the calendar grid from event data (via calendar.js / events.js)
// and creates event-box + paired dialog elements programmatically.
//
// Structure:
//   this
//     .calendarBody   <- cleared and rebuilt on every render() (header + grid)
//     .addEventDialog <- built ONCE in connectedCallback, never touched by render()
//
// Keeping the add-event dialog out of calendarBody matters: render() wipes
// calendarBody's contents every time the month changes or an event is added,
// so anything with its own state (like an open form) can't live inside it.

import { getMonthGrid, getMonthLabel } from '../calendar.js';
import { createEvent, deleteEvent as removeStoredEvent } from '../events.js';
import { ALL_DAY_LABEL, DEFAULT_COLOR } from '../constants.js';
import './event-box.js';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export class MainCalendar extends HTMLElement {
  connectedCallback() {
    const today = new Date();
    this.year = today.getFullYear();
    this.month = today.getMonth();

    this.calendarBody = document.createElement('div');
    this.calendarBody.className = 'calendar-body';
    this.appendChild(this.calendarBody);

    this.addEventDialog = this.#buildAddEventDialog();
    this.appendChild(this.addEventDialog);

    this.render();
  }

  render() {
    const cells = getMonthGrid(this.year, this.month);
    const label = getMonthLabel(this.year, this.month);

    this.calendarBody.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
      <button type="button" data-nav="prev" aria-label="Previous month">&lsaquo;</button>
      <span class="calendar-month-label">${label}</span>
      <button type="button" data-nav="next" aria-label="Next month">&rsaquo;</button>
    `;
    header.querySelector('[data-nav="prev"]').addEventListener('click', () => this.goToPrevMonth());
    header.querySelector('[data-nav="next"]').addEventListener('click', () => this.goToNextMonth());
    this.calendarBody.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', label);

    const fragment = document.createDocumentFragment();

    for (const weekday of WEEKDAY_LABELS) {
      const weekdayEl = document.createElement('div');
      weekdayEl.className = 'calendar-weekday';
      weekdayEl.setAttribute('role', 'columnheader');
      weekdayEl.textContent = weekday;
      fragment.appendChild(weekdayEl);
    }

    for (const cell of cells) {
      const cellEl = document.createElement('div');
      cellEl.className = 'calendar-cell';
      cellEl.setAttribute('role', 'gridcell');

      if (cell) {
        cellEl.dataset.date = cell.isoDate;

        const dayLabel = document.createElement('span');
        dayLabel.className = 'day-number';
        dayLabel.textContent = cell.day;
        cellEl.appendChild(dayLabel);

        // Clicking the empty part of a day cell opens the add-event dialog,
        // pre-filled with that date. Clicking an existing event-box (which
        // opens its own detail dialog via commandfor) should NOT also
        // trigger this, so bail out if the click originated inside one.
        cellEl.addEventListener('click', (event) => {
          if (event.target.closest('event-box') || event.target.closest('dialog')) return;
          this.#openAddEventDialog(cell.isoDate);
        });

        for (const event of cell.events) {
          const eventBox = document.createElement('event-box');
          eventBox.eventData = event;
          cellEl.appendChild(eventBox);
          cellEl.appendChild(this.#buildDetailDialog(event));
        }
      } else {
        cellEl.classList.add('calendar-cell--empty');
      }

      fragment.appendChild(cellEl);
    }

    grid.appendChild(fragment);
    this.calendarBody.appendChild(grid);
  }

  // Detail dialog for an existing event (shown via its event-box button).
  #buildDetailDialog(event) {
    const dialog = document.createElement('dialog');
    dialog.id = `event-${event.id}`;
    dialog.className = 'active-event-dialog'
    dialog.innerHTML = `
      <h3>${event.title}</h3>
      ${event.time ? `<p>${event.time}</p>` : ''}
      ${event.notes ? `<p>${event.notes}</p>` : ''}
      <button type="button" data-action="delete">&#x1F5D1;</button>
      <button class="close-button" commandfor="${dialog.id}" command="close">X</button>
    `;

    dialog.querySelector('[data-action="delete"]').addEventListener('click', () => {
      // Close explicitly first — render() is about to remove this dialog
      // from the DOM entirely (it's rebuilt from scratch), and closing a
      // still-open <dialog> right before detaching it avoids leaving a
      // stray entry in the browser's top layer.
      dialog.close();
      this.deleteEvent(event.id);
    });

    return dialog;
  }

  // Form dialog for creating a new event. Built once and reused —
  // #openAddEventDialog() resets it and pre-fills the date each time.
  #buildAddEventDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'add-event-dialog';
    dialog.innerHTML = `
      <form method="dialog">
        <h3>Add Event</h3>

        <fieldset>
          <legend>Title</legend>
          <input type="text" name="title" required />
        </fieldset>

        <fieldset>
          <legend>Date</legend>
          <input type="date" name="date" required />
        </fieldset>

        <fieldset>
          <legend>Time</legend>
          <input type="time" name="time" />
        </fieldset>

        <fieldset>
          <legend>Color</legend>
          <input type="color" name="color" value="${DEFAULT_COLOR}" />
        </fieldset>

        <fieldset>
          <legend>Notes</legend>
          <textarea name="notes"></textarea>
        </fieldset>

        <div class="dialog-actions">
          <button type="button" data-action="cancel">Cancel</button>
          <button type="submit" data-action="add">Add Event</button>
        </div>
      </form>
    `;

    const form = dialog.querySelector('form');
    const cancelButton = dialog.querySelector('[data-action="cancel"]');

    cancelButton.addEventListener('click', () => {
      form.reset();
      dialog.close();
    });

    // method="dialog" closes the dialog automatically on submit, but the
    // submit event still fires first — read the data before it closes.
    // Native `required` on title/date already blocks submission until
    // both are filled, so by the time this runs they're guaranteed present.
    form.addEventListener('submit', () => {
      const data = new FormData(form);

      const title = data.get('title').trim();
      const date = data.get('date');
      const time = data.get('time') || ALL_DAY_LABEL;
      const color = data.get('color') || DEFAULT_COLOR;
      const notes = data.get('notes') || '';

      this.addEvent({ title, date, time, color, notes });
      form.reset();
    });

    return dialog;
  }

  #openAddEventDialog(isoDate) {
    const form = this.addEventDialog.querySelector('form');
    form.reset();
    form.elements.date.value = isoDate;
    this.addEventDialog.showModal();
  }

  addEvent(eventInput) {
    createEvent(eventInput);
    this.render();
  }

  deleteEvent(id) {
    removeStoredEvent(id);
    this.render();
  }

  goToNextMonth() {
    this.month++;
    if (this.month > 11) {
      this.month = 0;
      this.year++;
    }
    this.render();
  }

  goToPrevMonth() {
    this.month--;
    if (this.month < 0) {
      this.month = 11;
      this.year--;
    }
    this.render();
  }
}

customElements.define('main-calendar', MainCalendar);