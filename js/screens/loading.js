"use strict";
// Step 4 (first visit only): a 35-second loading bar that stalls, jumps backwards
// and sits at 99% for ages.
const LOADING_DURATION_MS = 35000;
// [seconds, percent]. Two entries at the same time = an instant jump.
const LOADING_KEYFRAMES = [
    [0, 0], [1.5, 8], [3, 9], [4, 31], [6, 47], [6, 22], // jump back!
    [9, 40], [10, 41], [13, 68], [14, 66], [16, 83], [17, 91],
    [18, 97], [19, 99], [33.5, 99], [33.5, 12], // nope
    [34.6, 100], [35, 100],
];
const LOADING_MESSAGES = [
    "Warming up the hamsters",
    "Downloading more RAM",
    "Teaching the video to swim",
    "Asking Tostapane Volante for permission",
    "Untangling the internet cables",
    "Almost there (we are lying)",
    "Calibrating the shyness of buttons",
    "Rewinding the tape by hand",
    "Still 99%. Patience is a virtue.",
    "Waking up the server guy",
    "Done! Just kidding",
];
function loadingPercentAt(t) {
    for (let i = 1; i < LOADING_KEYFRAMES.length; i++) {
        const [t0, p0] = LOADING_KEYFRAMES[i - 1];
        const [t1, p1] = LOADING_KEYFRAMES[i];
        if (t < t1) {
            if (t1 === t0)
                return p1;
            return p0 + ((t - t0) / (t1 - t0)) * (p1 - p0);
        }
    }
    return 100;
}
function startLoading(onDone) {
    showScreen("loading");
    const fill = byId("loading-fill");
    const pct = byId("loading-pct");
    const msg = byId("loading-msg");
    const start = Date.now();
    let lastMsg = -1;
    let finished = false;
    const finish = () => {
        if (finished)
            return;
        finished = true;
        window.clearInterval(ticker);
        fill.style.width = "100%";
        pct.textContent = "100%";
        onDone();
    };
    // A plain interval (not requestAnimationFrame) so it keeps going in background tabs.
    const tick = () => {
        const elapsed = Date.now() - start;
        const p = loadingPercentAt(elapsed / 1000);
        fill.style.width = `${p}%`;
        pct.textContent = `${Math.floor(p)}%`;
        const m = Math.min(LOADING_MESSAGES.length - 1, Math.floor(elapsed / 3200));
        if (m !== lastMsg) {
            msg.textContent = LOADING_MESSAGES[m] + "…";
            lastMsg = m;
        }
        if (elapsed >= LOADING_DURATION_MS)
            finish();
    };
    const ticker = window.setInterval(tick, 50);
    tick();
    window.setTimeout(finish, LOADING_DURATION_MS + 200); // safety net
}
