// The drifting cursor.
// The real cursor is hidden. A fake one follows your hand, but its sensitivity is
// constantly changing (sometimes 0.2×, sometimes 2.6×). Every mouse event is
// intercepted and re-sent at the FAKE cursor's position, so clicks land where the
// fake cursor is, not where the real one would be.
//
// The first click locks the real pointer (Pointer Lock API) so the fake cursor can
// travel anywhere; the browser shows "Press Esc to show your cursor". Click again
// to re-lock after Esc.

const SENSITIVITY_MIN = 0.2;
const SENSITIVITY_MAX = 2.6;

const fakePointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let cursorSensitivity = 1;
let lastRealPointer: { x: number; y: number } | null = null;
let fakeCursorReady = false;

const fakeCursorDot = document.createElement("div");
fakeCursorDot.className = "fake-cursor";
document.body.appendChild(fakeCursorDot);

/** A few out-of-sync sine waves → a sensitivity that never sits still. */
function sensitivityAt(ms: number): number {
  const s = 1.05
    + 0.75 * Math.sin(ms / 1900)
    + 0.45 * Math.sin(ms / 670 + 1.3)
    + 0.25 * Math.sin(ms / 233 + 0.4);
  return Math.min(SENSITIVITY_MAX, Math.max(SENSITIVITY_MIN, s));
}

function pointerIsLocked(): boolean {
  return document.pointerLockElement === document.body;
}

function tryLockPointer(): void {
  if (pointerIsLocked()) return;
  try {
    const result = document.body.requestPointerLock() as unknown;
    if (result instanceof Promise) result.catch(() => { /* not allowed right now */ });
  } catch { /* unsupported */ }
}

function renderFakeCursor(): void {
  fakeCursorDot.style.left = `${fakePointer.x}px`;
  fakeCursorDot.style.top = `${fakePointer.y}px`;
}

function elementUnderFakeCursor(): Element {
  return document.elementFromPoint(fakePointer.x, fakePointer.y) ?? document.body;
}

function onRealMouseMove(e: MouseEvent): void {
  if (!e.isTrusted) return; // our own re-sent events pass straight through
  e.stopImmediatePropagation();

  let dx = 0;
  let dy = 0;
  if (pointerIsLocked()) {
    dx = e.movementX;
    dy = e.movementY;
  } else {
    if (!fakeCursorReady) {
      // Very first movement: start the fake cursor where the real one is.
      fakePointer.x = e.clientX;
      fakePointer.y = e.clientY;
      fakeCursorReady = true;
    } else if (lastRealPointer) {
      dx = e.clientX - lastRealPointer.x;
      dy = e.clientY - lastRealPointer.y;
    }
    lastRealPointer = { x: e.clientX, y: e.clientY };
  }

  cursorSensitivity = sensitivityAt(performance.now());
  fakePointer.x = Math.min(window.innerWidth - 1, Math.max(0, fakePointer.x + dx * cursorSensitivity));
  fakePointer.y = Math.min(window.innerHeight - 1, Math.max(0, fakePointer.y + dy * cursorSensitivity));
  renderFakeCursor();

  elementUnderFakeCursor().dispatchEvent(new MouseEvent("mousemove", {
    bubbles: true, cancelable: true, view: window,
    clientX: fakePointer.x, clientY: fakePointer.y,
    movementX: dx * cursorSensitivity, movementY: dy * cursorSensitivity,
  }));
}

function onRealButtonEvent(e: MouseEvent): void {
  if (!e.isTrusted) return;
  e.preventDefault();
  e.stopImmediatePropagation();

  const target = elementUnderFakeCursor();
  if (e.type === "mousedown") {
    tryLockPointer();
    // Focus whatever is under the FAKE cursor (inputs need this to be typed in).
    const focusable = target.closest<HTMLElement>("input, textarea, select, button, a, [tabindex]");
    if (focusable) focusable.focus();
    else (document.activeElement as HTMLElement | null)?.blur?.();
  }

  target.dispatchEvent(new MouseEvent(e.type, {
    bubbles: true, cancelable: true, view: window,
    clientX: fakePointer.x, clientY: fakePointer.y,
    button: e.button, buttons: e.buttons, detail: e.detail || 1,
  }));
}

window.addEventListener("mousemove", onRealMouseMove, true);
for (const type of ["mousedown", "mouseup", "click", "dblclick"]) {
  window.addEventListener(type, onRealButtonEvent as EventListener, true);
}
// Leaving and re-entering the window shouldn't make the fake cursor jump.
document.documentElement.addEventListener("mouseleave", () => { lastRealPointer = null; });
renderFakeCursor();
