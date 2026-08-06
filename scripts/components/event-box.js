// components/event-box.js
// A "dumb" presentational element: it just displays whatever event data
// it's given. main-calendar creates these and sets .eventData on them —
// event-box never reads localStorage or calls events.js itself.

import { DEFAULT_COLOR } from '../constants.js';

// Rough perceived-brightness check (standard luma weighting) checks the brightness
// if light — gets dark text/border 
// if dark - gets a light border
function getLuminance(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return false;

  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if(luminance < 0.1){
    return 'dark';
  } else if (luminance > 0.8){
    return 'light';
  } else {
    return ''
  }
}

export class EventBox extends HTMLElement {
  #data = null;

  set eventData(data) {
    this.#data = data;
    this.dataset.id = data.id;

    const color = data.color || DEFAULT_COLOR;
    const luminance = getLuminance(color);
    const borderColor = (luminance == 'light') ? '#000' : '#fff';

    this.style.setProperty('--event-color', color);
    this.style.setProperty('--event-text-color', (luminance == 'light') ? '#000' : '#fff');
    this.style.setProperty('--event-border-color', luminance ? borderColor : 'transparent');

    this.render();
  }

  get eventData() {
    return this.#data;
  }

  render() {
    if (!this.#data) return;
    const { id, title, time } = this.#data;
    const dialogId = `event-${id}`;

    this.innerHTML = `
      <button commandfor="${dialogId}" command="show-modal">
        ${time ? `<span class="event-time">${time}</span>` : ''}
        <span class="event-title">${title}</span>
      </button>
    `;

    // A click here is interacting with THIS event, not the empty cell
    // behind it — stop it from bubbling up to the day cell's "open
    // add-event dialog" listener.
    this.querySelector('button').addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }
}

customElements.define('event-box', EventBox);