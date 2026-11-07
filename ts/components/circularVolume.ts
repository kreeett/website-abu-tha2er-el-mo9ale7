// Circular volume knob.
// Each click moves the volume by a random decimal amount (0–5%),
// alternating counter-clockwise (down) and clockwise (up).

const VOLUME_MAX_STEP = 5;
const KNOB_CIRCUMFERENCE = 2 * Math.PI * 38;

class CircularVolume {
  private value = 50;
  private nextIsClockwise = false; // first click goes counter-clockwise
  private arc: SVGCircleElement;
  private dial: SVGGElement;
  private readout: SVGTextElement;
  private arrow: HTMLElement;

  constructor(private root: HTMLElement, private onChange: (volume01: number) => void) {
    root.innerHTML = `
      <svg viewBox="0 0 100 100" class="knob-svg" aria-hidden="true">
        <circle cx="50" cy="50" r="38" class="knob-track"/>
        <circle cx="50" cy="50" r="38" class="knob-arc"
                stroke-dasharray="${KNOB_CIRCUMFERENCE}" transform="rotate(-90 50 50)"/>
        <g class="knob-dial"><circle cx="50" cy="12" r="7" class="knob-dot"/></g>
        <text x="50" y="55" class="knob-text">50.00</text>
      </svg>
      <div class="knob-arrow"></div>`;
    this.arc = root.querySelector(".knob-arc") as SVGCircleElement;
    this.dial = root.querySelector(".knob-dial") as SVGGElement;
    this.readout = root.querySelector(".knob-text") as SVGTextElement;
    this.arrow = root.querySelector(".knob-arrow") as HTMLElement;

    root.addEventListener("click", () => this.turn());
    this.render();
    this.onChange(this.value / 100);
  }

  private turn(): void {
    const amount = Math.random() * VOLUME_MAX_STEP;
    const clockwise = this.nextIsClockwise;
    this.value = Math.min(100, Math.max(0, this.value + (clockwise ? amount : -amount)));
    this.nextIsClockwise = !clockwise;
    this.arrow.textContent = clockwise ? `↻ +${amount.toFixed(2)}` : `↺ −${amount.toFixed(2)}`;
    this.render();
    this.onChange(this.value / 100);
  }

  private render(): void {
    this.arc.style.strokeDashoffset = String(KNOB_CIRCUMFERENCE * (1 - this.value / 100));
    this.dial.style.transform = `rotate(${(this.value / 100) * 360}deg)`;
    this.readout.textContent = this.value.toFixed(2);
    this.root.title = `Volume: ${this.value.toFixed(2)}%`;
  }
}
