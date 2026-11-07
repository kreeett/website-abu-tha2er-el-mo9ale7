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
    if (!isFinite(seconds) || seconds < 0)
        seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}
