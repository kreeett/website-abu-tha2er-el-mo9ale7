"use strict";
// Step 5: the video player.
//  • Pause and skip buttons cycle: Instagram → Rick Roll → actually work → (repeat), same tab.
//  • Progress bar fills right-to-left and lies about the time, the length and the position.
//  • Fullscreen button makes the video smaller.
//  • Resolution is a continuous function of mouse speed (fake: pixelated canvas). Stop → 144p.
//  • Two ads at random times, each with a fake skip countdown.
const PAUSE_LINKS = [
    "https://www.instagram.com/codeflow.psut/",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
];
// Resolution is a continuous function of mouse speed (px per ms): any value from
// 144p to 2160p, e.g. "731p". No fixed steps.
const MIN_RES = 144;
const MAX_RES = 2160;
const SPEED_FOR_MAX_RES = 5.5; // px/ms needed for full 4K
function resolutionForSpeed(speed) {
    const t = Math.min(1, Math.max(0, speed / SPEED_FOR_MAX_RES));
    return Math.round(MIN_RES + Math.pow(t, 0.8) * (MAX_RES - MIN_RES));
}
function resolutionLabel(height) {
    const emoji = height >= 2000 ? "🚀" : height >= 1080 ? "🔥" : height >= 720 ? "😎" : height >= 360 ? "🙂" : height > 144 ? "🫤" : "🥔";
    return `${height}p ${emoji}`;
}
const MOUSE_IDLE_MS = 90;
// Each ad lands somewhere between 10% and 90% of the video, at least 15% apart.
const AD_WINDOW = [0.1, 0.9];
const AD_MIN_GAP = 0.15;
const SKIP_COUNTDOWN = [5, 4, 3, 2, 1, 5, 4, 3, 2, 1]; // jumps back to 5 once
const AD_FALLBACK_SRC = "media/ad1.mp4";
const SKIP_SECONDS = 10;
let playerReady = false;
let mainVideo;
let activeVideo;
let adBreaks = [];
let currentAd = null;
let skipTimer;
let skipReady = false;
let fullscreenScale = 1;
let volume01 = 0.5;
let mouseSpeed = 0;
let lastMouse = { x: 0, y: 0, t: 0 };
let lastMouseMoveAt = 0;
let currentResolution = MIN_RES;
function enterPlayer() {
    store.sessionSet(STORAGE_KEYS.inPlayer, "1");
    showScreen("player");
    if (!playerReady)
        initPlayer();
}
function initPlayer() {
    playerReady = true;
    mainVideo = byId("vid-main");
    activeVideo = mainVideo;
    adBreaks = [byId("vid-ad1"), byId("vid-ad2")].map((video, i) => {
        const ad = { video, at: 0, played: false, broken: false, index: i + 1 };
        const markBroken = () => {
            // No ad2.mp4? Then you get ad1 again. Twice the fun.
            if (!video.src.endsWith(AD_FALLBACK_SRC)) {
                video.src = AD_FALLBACK_SRC;
                video.load();
                return;
            }
            ad.broken = true;
        };
        if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)
            markBroken();
        video.addEventListener("error", markBroken);
        // While the fake countdown runs the ad loops, so a short ad can't end before
        // the Skip button shows up. Once Skip is available, it may end by itself.
        video.addEventListener("ended", () => { if (skipReady)
            endAd(); });
        video.addEventListener("timeupdate", () => { if (activeVideo === video)
            updateProgress(); });
        return ad;
    });
    // Missing main video → friendly message instead of a broken player.
    const showMissing = () => {
        const box = byId("missing-overlay");
        box.innerHTML = "🎞️ <b>video missing</b><br>Put your video at <code>media/video.mp4</code>";
        box.classList.add("show");
    };
    if (mainVideo.error || mainVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)
        showMissing();
    mainVideo.addEventListener("error", showMissing);
    if (mainVideo.readyState >= 1)
        scheduleAds();
    mainVideo.addEventListener("loadedmetadata", scheduleAds);
    mainVideo.addEventListener("timeupdate", onMainTimeUpdate);
    mainVideo.addEventListener("ended", () => flash("🎬 The end. Thank you for suffering with us."));
    new CircularVolume(byId("volume-knob"), (v) => {
        volume01 = v;
        mainVideo.volume = v;
        adBreaks.forEach((a) => { a.video.volume = v; });
    });
    byId("btn-pause").addEventListener("click", onPauseClicked);
    byId("btn-skip").addEventListener("click", onSkipClicked);
    byId("btn-fullscreen").addEventListener("click", onFullscreenClicked);
    byId("progress-track").addEventListener("click", onProgressClicked);
    byId("ad-skip").addEventListener("click", () => endAd());
    document.addEventListener("mousemove", onPlayerMouseMove);
    requestAnimationFrame(renderFrame);
}
/* ---------- Pause & skip buttons: link, link, then do the thing, repeat ---------- */
/** Advances a saved 1→2→3 cycle. Clicks 1 and 2 leave the site; returns true on click 3. */
function linkCycle(key) {
    const count = (Number(store.get(key) || "0") % 3) + 1;
    store.set(key, String(count));
    if (count === 1 || count === 2) {
        window.location.href = PAUSE_LINKS[count - 1];
        return false;
    }
    return true;
}
function onPauseClicked() {
    if (!linkCycle(STORAGE_KEYS.pauseCount))
        return;
    activeVideo.play().catch(() => flash("Couldn't play. Is the video file there?"));
}
function onSkipClicked() {
    if (!linkCycle(STORAGE_KEYS.skipCount))
        return;
    if (currentAd) {
        flash("No skipping ads 😇");
        return;
    }
    if (!mainVideo.duration)
        return;
    mainVideo.currentTime = Math.min(mainVideo.duration - 0.1, mainVideo.currentTime + SKIP_SECONDS);
    flash(`⏩ Skipped ${SKIP_SECONDS} seconds. You're welcome.`);
    updateProgress();
}
/* ---------- Fullscreen button: makes it smaller ---------- */
function onFullscreenClicked() {
    if (fullscreenScale <= 0.2) {
        flash("This is as full as the screen gets.");
        return;
    }
    fullscreenScale = Math.max(0.2, fullscreenScale * 0.8);
    byId("player-wrap").style.width = `${fullscreenScale * 100}%`;
    flash("Entering fullscreen…");
}
const lies = {
    until: 0, timeFactor: 1, timeOffset: 0, lengthFactor: 1, barCurve: 1, barGlitch: 0, glitchUntil: 0,
};
function rollLies(now) {
    lies.until = now + randomBetween(1800, 4200);
    lies.timeFactor = Math.random() < 0.2 ? -randomBetween(0.5, 2) : randomBetween(0.3, 3.5); // sometimes backwards
    lies.timeOffset = randomBetween(-40, 300);
    lies.lengthFactor = Math.random() < 0.1 ? randomBetween(20, 80) : randomBetween(0.2, 4);
    lies.barCurve = randomBetween(0.35, 2.6);
}
function updateProgress() {
    const v = activeVideo;
    const now = performance.now();
    if (now >= lies.until)
        rollLies(now);
    // Random "skips": the bar suddenly jumps ahead or back for a moment.
    if (now >= lies.glitchUntil) {
        lies.barGlitch = Math.random() < 0.015 ? randomBetween(-0.4, 0.4) : 0;
        lies.glitchUntil = now + (lies.barGlitch ? randomBetween(400, 1500) : 0);
    }
    const real = v.duration ? v.currentTime / v.duration : 0;
    const shown = Math.min(1, Math.max(0, Math.pow(real, lies.barCurve) + lies.barGlitch));
    byId("progress-fill").style.width = `${shown * 100}%`;
    const shownTime = v.currentTime * lies.timeFactor + lies.timeOffset;
    const shownLength = (v.duration || 0) * lies.lengthFactor;
    byId("time-label").textContent = `${currentAd ? "AD · " : ""}${formatTime(shownTime)} / ${formatTime(shownLength)}`;
}
function onProgressClicked(e) {
    if (currentAd) {
        flash("No skipping ads 😇");
        return;
    }
    if (!mainVideo.duration)
        return;
    const r = e.currentTarget.getBoundingClientRect();
    const fraction = (r.right - e.clientX) / r.width; // reversed, of course
    mainVideo.currentTime = Math.min(Math.max(fraction, 0), 1) * mainVideo.duration;
    updateProgress();
}
/* ---------- Ads ---------- */
function scheduleAds() {
    const [lo, hi] = AD_WINDOW;
    const first = randomBetween(lo, hi);
    let second = randomBetween(lo, hi);
    for (let tries = 0; Math.abs(second - first) < AD_MIN_GAP && tries < 50; tries++) {
        second = randomBetween(lo, hi);
    }
    const times = [first, second].sort((a, b) => a - b);
    adBreaks.forEach((ad, i) => { ad.at = times[i]; ad.played = false; });
}
function onMainTimeUpdate() {
    updateProgress();
    if (currentAd || !mainVideo.duration)
        return;
    const progress = mainVideo.currentTime / mainVideo.duration;
    const due = adBreaks.find((ad) => !ad.played && progress >= ad.at);
    if (due)
        startAd(due);
}
function startAd(ad) {
    ad.played = true;
    if (ad.broken)
        return; // ad file missing: lucky you
    currentAd = ad;
    mainVideo.pause();
    activeVideo = ad.video;
    ad.video.currentTime = 0;
    ad.video.loop = true;
    skipReady = false;
    ad.video.volume = volume01;
    ad.video.play().catch(() => endAd());
    byId("ad-index").textContent = String(ad.index);
    byId("ad-overlay").classList.add("show");
    const skip = byId("ad-skip");
    skip.disabled = true;
    let step = 0;
    skip.textContent = `Skip in ${SKIP_COUNTDOWN[step]}`;
    window.clearInterval(skipTimer);
    skipTimer = window.setInterval(() => {
        step++;
        if (step < SKIP_COUNTDOWN.length) {
            skip.textContent = `Skip in ${SKIP_COUNTDOWN[step]}`;
        }
        else {
            window.clearInterval(skipTimer);
            skip.textContent = "Skip ad ▶▶";
            skip.disabled = false;
            skipReady = true;
            ad.video.loop = false; // now it's allowed to finish on its own
        }
    }, 1000);
    updateProgress();
}
function endAd() {
    if (!currentAd)
        return;
    window.clearInterval(skipTimer);
    skipReady = false;
    currentAd.video.loop = false;
    currentAd.video.pause();
    currentAd = null;
    activeVideo = mainVideo;
    byId("ad-overlay").classList.remove("show");
    mainVideo.play().catch(() => { });
    updateProgress();
}
/* ---------- Mouse-speed resolution ---------- */
function onPlayerMouseMove(e) {
    if (!byId("screen-player").classList.contains("active"))
        return;
    const now = performance.now();
    const dt = now - lastMouse.t;
    if (dt > 0 && dt < 200) {
        const instant = Math.hypot(e.clientX - lastMouse.x, e.clientY - lastMouse.y) / dt;
        mouseSpeed = mouseSpeed * 0.6 + instant * 0.4;
    }
    lastMouse = { x: e.clientX, y: e.clientY, t: now };
    lastMouseMoveAt = now;
}
const lowResCanvas = document.createElement("canvas");
function renderFrame(now) {
    if (now - lastMouseMoveAt > MOUSE_IDLE_MS)
        mouseSpeed = 0; // stopped → straight to potato
    const resolution = resolutionForSpeed(mouseSpeed);
    if (resolution !== currentResolution) {
        currentResolution = resolution;
        byId("res-badge").textContent = resolutionLabel(resolution);
    }
    const canvas = byId("player-canvas");
    const ctx = canvas.getContext("2d");
    const src = activeVideo;
    // The canvas is always 16:9; portrait or odd-shaped videos get letterboxed.
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (src && src.readyState >= 2 && src.videoWidth > 0) {
        const vw = src.videoWidth;
        const vh = src.videoHeight;
        const scale = Math.min(canvas.width / vw, canvas.height / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        if (resolution >= vh) {
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(src, dx, dy, dw, dh);
        }
        else {
            const sh = resolution;
            const sw = Math.max(1, Math.round((vw / vh) * sh));
            lowResCanvas.width = sw;
            lowResCanvas.height = sh;
            lowResCanvas.getContext("2d").drawImage(src, 0, 0, sw, sh);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(lowResCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
        }
    }
    updateProgress(); // keep the lies moving every frame
    requestAnimationFrame(renderFrame);
}
