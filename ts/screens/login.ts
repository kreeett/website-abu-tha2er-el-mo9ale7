// Step 3: the login button runs away from the cursor.
// Catch 1 & 2 → "Incorrect username or password". Catch 3 → "I'm shy 🥺" and it vanishes.
// Plus a "forgot password" form that never accepts anything.

const FLEE_RADIUS = 110;    // px: how close the cursor may get before it runs
const FLEE_DISTANCE = 170;  // px: how far it jumps away
const FREEZE_CHANCE = 0.18; // chance it "trips" on an approach and stays put

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
  btn.addEventListener("click", onLoginCaught);

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

function moveButtonTo(btn: HTMLButtonElement, x: number, y: number): void {
  const pad = 8;
  const maxX = window.innerWidth - btn.offsetWidth - pad;
  const maxY = window.innerHeight - btn.offsetHeight - pad;
  btn.style.left = `${Math.min(Math.max(pad, x), maxX)}px`;
  btn.style.top = `${Math.min(Math.max(pad, y), maxY)}px`;
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
  moveButtonTo(btn, nx, ny);
}

function onLoginCaught(): void {
  if (loginLocked) return;
  const btn = loginButton();
  catches++;

  if (catches < 3) {
    byId("login-error").textContent = "❌ Incorrect username or password.";
    byId<HTMLInputElement>("login-pass").value = "";
    makeFloating(btn);
    moveButtonTo(btn, randomBetween(0, window.innerWidth), randomBetween(0, window.innerHeight));
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
