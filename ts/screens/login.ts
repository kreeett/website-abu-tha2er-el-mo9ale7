// Step 3: the login button runs away from the cursor.
// Catch 1 & 2 → "Incorrect username or password". Catch 3 → "I'm shy 🥺" and it vanishes.
// Plus a "forgot password" form that never accepts anything.

const FLEE_RADIUS = 170;      // px: how close the cursor may get before it runs
const FLEE_DISTANCE = 230;    // px: how far it jumps away
const FREEZE_CHANCE = 0.07;   // chance it "trips" on an approach and stays put
const CORNERED_ESCAPE = 0.75; // when pinned against an edge, chance it teleports away instead
const DODGE_CHANCE = 0.45;    // chance it dodges at the very moment you press the mouse
const SHRINK_PER_CATCH = 0.75;

let loginWired = false;
let catches = 0;
let isFloating = false;
let cursorWasNear = false;
let frozenThisApproach = false;
let loginLocked = false;

function startLogin(): void {
  if (!loginWired) wireLogin();
  showScreen("login");
}

function loginButton(): HTMLButtonElement {
  return byId<HTMLButtonElement>("login-btn");
}

function wireLogin(): void {
  loginWired = true;
  const btn = loginButton();

  document.addEventListener("mousemove", onLoginMouseMove);
  btn.addEventListener("mousedown", (e) => {
    // Last-second dodge: the click never completes because the button isn't there anymore.
    if (!loginLocked && Math.random() < DODGE_CHANCE) {
      e.preventDefault();
      teleportButton(btn);
    }
  });
  btn.addEventListener("click", (e) => {
    // Keyboard "clicks" (Enter/Space) have detail 0. Mouse only, please.
    if (e.detail === 0) {
      flash("⌨️ Nice try. Use the mouse.");
      return;
    }
    onLoginCaught();
  });

  // Enter key doesn't count. Use the button like everyone else.
  byId<HTMLFormElement>("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    flash("⌨️ Keyboard login is a premium feature. Please click the button.");
  });
  byId<HTMLInputElement>("login-pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); flash("⌨️ Keyboard login is a premium feature. Please click the button."); }
  });

  byId("forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    byId("forgot-error").textContent = "";
    showScreen("forgot");
  });
  byId("forgot-back").addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("login");
  });
  byId<HTMLFormElement>("forgot-form").addEventListener("submit", (e) => {
    e.preventDefault();
    byId("forgot-error").textContent = "⚠️ You cannot use your old password.";
    byId<HTMLInputElement>("forgot-new").value = "";
    byId<HTMLInputElement>("forgot-confirm").value = "";
  });
}

/** Detach the button from the form so it can roam the whole viewport. */
function makeFloating(btn: HTMLButtonElement): void {
  if (isFloating) return;
  const r = btn.getBoundingClientRect();
  const slot = btn.parentElement as HTMLElement;
  slot.style.height = `${r.height}px`;
  // Re-parent onto the (untransformed) screen section so position:fixed means the viewport,
  // not the tilted card.
  byId("screen-login").appendChild(btn);
  btn.classList.add("runaway");
  btn.style.left = `${r.left}px`;
  btn.style.top = `${r.top}px`;
  isFloating = true;
}

/** Moves the button, clamped to the screen. Returns true if it got pinned against an edge. */
function moveButtonTo(btn: HTMLButtonElement, x: number, y: number): boolean {
  const pad = 8;
  const maxX = window.innerWidth - btn.offsetWidth - pad;
  const maxY = window.innerHeight - btn.offsetHeight - pad;
  const cx = Math.min(Math.max(pad, x), maxX);
  const cy = Math.min(Math.max(pad, y), maxY);
  btn.style.left = `${cx}px`;
  btn.style.top = `${cy}px`;
  return cx !== x || cy !== y;
}

function teleportButton(btn: HTMLButtonElement): void {
  makeFloating(btn);
  moveButtonTo(btn, randomBetween(0, window.innerWidth), randomBetween(0, window.innerHeight));
}

function onLoginMouseMove(e: MouseEvent): void {
  if (loginLocked || !byId("screen-login").classList.contains("active")) return;
  const btn = loginButton();
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = cx - e.clientX;
  let dy = cy - e.clientY;
  const dist = Math.hypot(dx, dy);
  const near = dist < FLEE_RADIUS;

  if (near && !cursorWasNear) {
    // A fresh approach: sometimes the button trips and you get a chance.
    frozenThisApproach = Math.random() < FREEZE_CHANCE;
  }
  cursorWasNear = near;
  if (!near || frozenThisApproach) return;

  makeFloating(btn);
  if (dist < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
  const len = Math.hypot(dx, dy);
  const nx = r.left + (dx / len) * FLEE_DISTANCE + randomBetween(-30, 30);
  const ny = r.top + (dy / len) * FLEE_DISTANCE + randomBetween(-30, 30);
  const pinned = moveButtonTo(btn, nx, ny);
  if (pinned && Math.random() < CORNERED_ESCAPE) teleportButton(btn);
}

function onLoginCaught(): void {
  if (loginLocked) return;
  const btn = loginButton();
  catches++;

  if (catches < 3) {
    byId("login-error").textContent = "❌ Incorrect username or password.";
    byId<HTMLInputElement>("login-pass").value = "";
    // It gets smaller every time you catch it.
    btn.style.transform = `scale(${Math.pow(SHRINK_PER_CATCH, catches)})`;
    teleportButton(btn);
    return;
  }

  // Third catch: it's shy now.
  loginLocked = true;
  byId("login-error").textContent = "";
  btn.textContent = "I'm shy 🥺";
  btn.disabled = true;
  window.setTimeout(() => btn.classList.add("shy"), 900);
  window.setTimeout(() => {
    btn.style.display = "none";
    afterButtonDisappears();
  }, 2600);
}

function afterButtonDisappears(): void {
  show67(continueAfterLogin);
}

function continueAfterLogin(): void {
  if (store.get(STORAGE_KEYS.seenLoading) === "1") {
    enterPlayer();
  } else {
    // First time ever: 35 seconds of loading, then refresh and reset all progress.
    startLoading(() => {
      resetAllProgress(true);
      window.location.reload();
    });
  }
}
