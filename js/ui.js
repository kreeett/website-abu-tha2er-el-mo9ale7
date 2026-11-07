"use strict";
// Small DOM helpers shared by every screen.
function byId(id) {
    const found = document.getElementById(id);
    if (!found)
        throw new Error(`Missing element #${id}`);
    return found;
}
function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    byId(`screen-${id}`).classList.add("active");
    window.scrollTo(0, 0);
}
let flashTimer;
/** Pop a message at the top of the page for a few seconds. */
function flash(message, ms = 2600) {
    const box = byId("flash");
    box.textContent = message;
    box.classList.add("show");
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => box.classList.remove("show"), ms);
}
function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}
function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
function formatTime(seconds) {
    if (!isFinite(seconds))
        seconds = 0;
    const sign = seconds < 0 ? "-" : "";
    const t = Math.floor(Math.abs(seconds));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = (t % 60).toString().padStart(2, "0");
    return h > 0 ? `${sign}${h}:${m.toString().padStart(2, "0")}:${s}` : `${sign}${m}:${s}`;
}
