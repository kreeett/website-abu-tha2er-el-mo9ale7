"use strict";
// Step 3: the login screen.
//  • The login button runs away ONCE (slowly), then stays put.
//    Catch 1 & 2 → "Incorrect username or password". Catch 3 → "I'm shy 🥺", it vanishes.
//  • A light switch in the corner turns the screen black; the cursor becomes a flashlight.
//    In the dark the button can't move, and it glows when the flashlight passes over it.
//  • A little monster hides in the dark. Find it with the flashlight and it ROARS.
//  • "Forgot password" never accepts anything.
const FLEE_RADIUS = 130; // px: how close the cursor may get before it runs (once)
const FLEE_DISTANCE = 320; // px: how far it runs
const FLASHLIGHT_RADIUS = 110; // px: lit circle around the cursor
const MONSTER_FIND_RADIUS = 75;
let loginWired = false;
let catches = 0;
let isFloating = false;
let hasFled = false;
let loginLocked = false;
let lightsOff = false;
let monsterBusy = false;
function startLogin() {
    if (!loginWired)
        wireLogin();
    showScreen("login");
}
function loginButton() {
    return byId("login-btn");
}
function wireLogin() {
    loginWired = true;
    const btn = loginButton();
    document.addEventListener("mousemove", onLoginMouseMove);
    btn.addEventListener("click", (e) => {
        // Keyboard "clicks" (Enter/Space) have detail 0. Mouse only, please.
        if (e.detail === 0) {
            flash("⌨️ Nice try. Use the mouse.");
            return;
        }
        onLoginCaught();
    });
    // Enter key doesn't count. Use the button like everyone else.
    byId("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        flash("⌨️ Keyboard login is a premium feature. Please click the button.");
    });
    byId("login-pass").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            flash("⌨️ Keyboard login is a premium feature. Please click the button.");
        }
    });
    byId("light-switch").addEventListener("click", () => setLights(lightsOff));
    byId("forgot-link").addEventListener("click", (e) => {
        e.preventDefault();
        setLights(true);
        byId("forgot-error").textContent = "";
        showScreen("forgot");
    });
    byId("forgot-back").addEventListener("click", (e) => {
        e.preventDefault();
        showScreen("login");
    });
    byId("forgot-form").addEventListener("submit", (e) => {
        e.preventDefault();
        byId("forgot-error").textContent = "⚠️ You cannot use your old password.";
        byId("forgot-new").value = "";
        byId("forgot-confirm").value = "";
    });
}
/* ---------- Runaway button (runs once) ---------- */
/** Detach the button from the form so it can roam the whole viewport. */
function makeFloating(btn) {
    if (isFloating)
        return;
    const r = btn.getBoundingClientRect();
    const slot = btn.parentElement;
    slot.style.height = `${r.height}px`;
    // Re-parent onto the (untransformed) screen section so position:fixed means the viewport,
    // not the tilted card.
    byId("screen-login").appendChild(btn);
    btn.classList.add("runaway");
    btn.style.left = `${r.left}px`;
    btn.style.top = `${r.top}px`;
    void btn.offsetWidth; // so the glide animates from here
    isFloating = true;
}
function moveButtonTo(btn, x, y) {
    const pad = 70;
    const maxX = window.innerWidth - btn.offsetWidth - pad;
    const maxY = window.innerHeight - btn.offsetHeight - pad;
    btn.style.left = `${Math.min(Math.max(pad, x), maxX)}px`;
    btn.style.top = `${Math.min(Math.max(pad, y), maxY)}px`;
}
function onLoginMouseMove(e) {
    if (loginLocked || !byId("screen-login").classList.contains("active"))
        return;
    const btn = loginButton();
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = cx - e.clientX;
    let dy = cy - e.clientY;
    const dist = Math.hypot(dx, dy);
    if (lightsOff) {
        updateFlashlight(e.clientX, e.clientY);
        btn.classList.toggle("lit", dist < FLASHLIGHT_RADIUS);
        checkMonster(e.clientX, e.clientY);
        return; // frozen in the dark
    }
    if (hasFled || dist >= FLEE_RADIUS)
        return;
    // Run away, once, slowly.
    hasFled = true;
    makeFloating(btn);
    if (dist < 1) {
        dx = 1;
        dy = 0;
    }
    const len = Math.hypot(dx, dy);
    requestAnimationFrame(() => {
        moveButtonTo(btn, r.left + (dx / len) * FLEE_DISTANCE, r.top + (dy / len) * FLEE_DISTANCE);
    });
}
function onLoginCaught() {
    if (loginLocked)
        return;
    const btn = loginButton();
    catches++;
    if (catches < 3) {
        byId("login-error").textContent = "❌ Incorrect username or password.";
        byId("login-pass").value = "";
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
        setLights(true);
        afterButtonDisappears();
    }, 2600);
}
function afterButtonDisappears() {
    show67(continueAfterLogin);
}
function continueAfterLogin() {
    if (store.get(STORAGE_KEYS.firstRunDone) === "1") {
        enterPlayer();
    }
    else {
        // First time ever: refresh the page and reset all progress.
        resetAllProgress(true);
        window.location.reload();
    }
}
/* ---------- Light switch + flashlight ---------- */
function setLights(on) {
    lightsOff = !on;
    document.body.classList.toggle("lights-off", lightsOff);
    byId("light-switch").classList.toggle("off", lightsOff);
    loginButton().classList.remove("lit");
    if (lightsOff) {
        unlockMonsterAudio();
        placeMonster();
        updateFlashlight(fakePointer.x, fakePointer.y);
    }
}
function updateFlashlight(x, y) {
    const dark = byId("darkness");
    dark.style.setProperty("--fx", `${x}px`);
    dark.style.setProperty("--fy", `${y}px`);
    dark.style.setProperty("--fr", `${FLASHLIGHT_RADIUS}px`);
}
/* ---------- The monster ---------- */
function placeMonster() {
    const m = byId("monster");
    const size = 90;
    let x = 0;
    let y = 0;
    // Somewhere on screen, but not right under the cursor or on the light switch.
    for (let i = 0; i < 30; i++) {
        x = randomBetween(40, window.innerWidth - size - 40);
        y = randomBetween(90, window.innerHeight - size - 40);
        const farFromCursor = Math.hypot(x + size / 2 - fakePointer.x, y + size / 2 - fakePointer.y) > 300;
        const farFromSwitch = x < window.innerWidth - 220 || y > 200;
        if (farFromCursor && farFromSwitch)
            break;
    }
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
}
function checkMonster(x, y) {
    if (monsterBusy)
        return;
    const r = byId("monster").getBoundingClientRect();
    if (Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y) > MONSTER_FIND_RADIUS)
        return;
    monsterBusy = true;
    const m = byId("monster");
    m.classList.add("scare");
    playMonsterRoar();
    flash("👹 RAAAAAWR!!!");
    window.setTimeout(() => {
        m.classList.remove("scare");
        placeMonster();
        monsterBusy = false;
    }, 2200);
}
let monsterAudio = null;
/** Audio needs a user click first: the light-switch click unlocks it. */
function unlockMonsterAudio() {
    try {
        if (!monsterAudio) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            monsterAudio = new Ctx();
        }
        void monsterAudio.resume();
    }
    catch { /* no audio, no roar */ }
}
/** A loud, nasty roar made from scratch with the Web Audio API (no sound file needed). */
function playMonsterRoar() {
    if (!monsterAudio)
        return;
    const ctx = monsterAudio;
    const now = ctx.currentTime;
    const len = 1.5;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(1, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.001, now + len);
    master.connect(ctx.destination);
    const voices = [
        ["sawtooth", 240, 60],
        ["square", 360, 90],
        ["sawtooth", 720, 160],
    ];
    for (const [type, from, to] of voices) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(from, now);
        osc.frequency.exponentialRampToValueAtTime(to, now + len);
        const wobble = ctx.createOscillator();
        wobble.frequency.value = 30;
        const wobbleAmount = ctx.createGain();
        wobbleAmount.gain.value = from * 0.2;
        wobble.connect(wobbleAmount).connect(osc.frequency);
        const g = ctx.createGain();
        g.gain.value = 0.35;
        osc.connect(g).connect(master);
        osc.start(now);
        wobble.start(now);
        osc.stop(now + len);
        wobble.stop(now + len);
    }
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.7), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
        data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const ng = ctx.createGain();
    ng.gain.value = 0.5;
    noise.connect(ng).connect(master);
    noise.start(now);
}
