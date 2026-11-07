"use strict";
// Circular volume knob.
// Each click moves the volume by a random decimal amount (0–5%),
// alternating counter-clockwise (down) and clockwise (up).
const VOLUME_MAX_STEP = 5;
const KNOB_CIRCUMFERENCE = 2 * Math.PI * 38;
class CircularVolume {
    constructor(root, onChange) {
        this.root = root;
        this.onChange = onChange;
        this.value = 50;
        this.nextIsClockwise = false; // first click goes counter-clockwise
        root.innerHTML = `
      <svg viewBox="0 0 100 100" class="knob-svg" aria-hidden="true">
        <circle cx="50" cy="50" r="38" class="knob-track"/>
        <circle cx="50" cy="50" r="38" class="knob-arc"
                stroke-dasharray="${KNOB_CIRCUMFERENCE}" transform="rotate(-90 50 50)"/>
        <g class="knob-dial"><circle cx="50" cy="12" r="7" class="knob-dot"/></g>
        <text x="50" y="55" class="knob-text">50.00</text>
      </svg>
      <div class="knob-arrow"></div>`;
        this.arc = root.querySelector(".knob-arc");
        this.dial = root.querySelector(".knob-dial");
        this.readout = root.querySelector(".knob-text");
        this.arrow = root.querySelector(".knob-arrow");
        root.addEventListener("click", () => this.turn());
        this.render();
        this.onChange(this.value / 100);
    }
    turn() {
        const amount = Math.random() * VOLUME_MAX_STEP;
        const clockwise = this.nextIsClockwise;
        this.value = Math.min(100, Math.max(0, this.value + (clockwise ? amount : -amount)));
        this.nextIsClockwise = !clockwise;
        this.arrow.textContent = clockwise ? `↻ +${amount.toFixed(2)}` : `↺ −${amount.toFixed(2)}`;
        this.render();
        this.onChange(this.value / 100);
    }
    render() {
        this.arc.style.strokeDashoffset = String(KNOB_CIRCUMFERENCE * (1 - this.value / 100));
        this.dial.style.transform = `rotate(${(this.value / 100) * 360}deg)`;
        this.readout.textContent = this.value.toFixed(2);
        this.root.title = `Volume: ${this.value.toFixed(2)}%`;
    }
}
