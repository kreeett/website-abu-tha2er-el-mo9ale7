// Step 5: the video player.
//  • Pause button cycles: Instagram → Rick Roll → play → (repeat), same tab.
//  • Progress bar fills right-to-left.
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

function resolutionForSpeed(speed: number): number {
  const t = Math.min(1, Math.max(0, speed / SPEED_FOR_MAX_RES));
  return Math.round(MIN_RES + Math.pow(t, 0.8) * (MAX_RES - MIN_RES));
}

function resolutionLabel(height: number): string {
  const emoji = height >= 2000 ? "🚀" : height >= 1080 ? "🔥" : height >= 720 ? "😎" : height >= 360 ? "🙂" : height > 144 ? "🫤" : "🥔";
  return `${height}p ${emoji}`;
}
const MOUSE_IDLE_MS = 90;

// Each ad lands somewhere between 10% and 90% of the video, at least 15% apart.
const AD_WINDOW: [number, number] = [0.1, 0.9];
const AD_MIN_GAP = 0.15;
const SKIP_COUNTDOWN = [5, 4, 3, 2, 1, 5, 4, 3, 2, 1]; // jumps back to 5 once

interface AdBreak { video: HTMLVideoElement; at: number; played: boolean; broken: boolean; index: number; }

let playerReady = false;
let mainVideo: HTMLVideoElement;
let activeVideo: HTMLVideoElement;
let adBreaks: AdBreak[] = [];
let currentAd: AdBreak | null = null;
let skipTimer: number | undefined;
let fullscreenScale = 1;
let volume01 = 0.5;

let mouseSpeed = 0;
let lastMouse = { x: 0, y: 0, t: 0 };
let lastMouseMoveAt = 0;
let currentResolution = MIN_RES;

function enterPlayer(): void {
  store.sessionSet(STORAGE_KEYS.inPlayer, "1");
  showScreen("player");
  if (!playerReady) initPlayer();
}

function initPlayer(): void {
  playerReady = true;
  mainVideo = byId<HTMLVideoElement>("vid-main");
  activeVideo = mainVideo;

  adBreaks = [byId<HTMLVideoElement>("vid-ad1"), byId<HTMLVideoElement>("vid-ad2")].map((video, i) => {
    const ad: AdBreak = { video, at: 0, played: false, broken: false, index: i + 1 };
    const markBroken = () => { ad.broken = true; };
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) markBroken();
    video.addEventListener("error", markBroken);
    video.addEventListener("ended", () => endAd());
    video.addEventListener("timeupdate", () => { if (activeVideo === video) updateProgress(); });
    return ad;
  });

  // Missing main video → friendly message instead of a broken player.
  const showMissing = () => {
    const box = byId("missing-overlay");
    box.innerHTML = "🎞️ <b>video missing</b><br>Put your video at <code>media/video.mp4</code>";
    box.classList.add("show");
  };
  if (mainVideo.error || mainVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) showMissing();
  mainVideo.addEventListener("error", showMissing);

  if (mainVideo.readyState >= 1) scheduleAds();
  mainVideo.addEventListener("loadedmetadata", scheduleAds);
  mainVideo.addEventListener("timeupdate", onMainTimeUpdate);
  mainVideo.addEventListener("ended", () => flash("🎬 The end. Thank you for suffering with us."));

  new CircularVolume(byId("volume-knob"), (v) => {
    volume01 = v;
    mainVideo.volume = v;
    adBreaks.forEach((a) => { a.video.volume = v; });
  });

  byId("btn-pause").addEventListener("click", onPauseClicked);
  byId("btn-fullscreen").addEventListener("click", onFullscreenClicked);
  byId("progress-track").addEventListener("click", onProgressClicked);
  byId("ad-skip").addEventListener("click", () => endAd());

  document.addEventListener("mousemove", onPlayerMouseMove);
  requestAnimationFrame(renderFrame);
}

/* ---------- Pause button: link, link, play, repeat ---------- */

function onPauseClicked(): void {
  const count = (Number(store.get(STORAGE_KEYS.pauseCount) || "0") % 3) + 1;
  store.set(STORAGE_KEYS.pauseCount, String(count));

  if (count === 1 || count === 2) {
    window.location.href = PAUSE_LINKS[count - 1];
    return;
  }
  activeVideo.play().catch(() => flash("Couldn't play. Is the video file there?"));
}

/* ---------- Fullscreen button: makes it smaller ---------- */

function onFullscreenClicked(): void {
  if (fullscreenScale <= 0.2) {
    flash("This is as full as the screen gets.");
    return;
  }
  fullscreenScale = Math.max(0.2, fullscreenScale * 0.8);
  byId("player-wrap").style.width = `${fullscreenScale * 100}%`;
  flash("Entering fullscreen…");
}

/* ---------- Progress bar (right-to-left) ---------- */

function updateProgress(): void {
  const v = activeVideo;
  const pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
  byId("progress-fill").style.width = `${pct}%`;
  byId("time-label").textContent = `${currentAd ? "AD · " : ""}${formatTime(v.currentTime)} / ${formatTime(v.duration)}`;
}

function onProgressClicked(e: MouseEvent): void {
  if (currentAd) {
    flash("No skipping ads 😇");
    return;
  }
  if (!mainVideo.duration) return;
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const fraction = (r.right - e.clientX) / r.width; // reversed, of course
  mainVideo.currentTime = Math.min(Math.max(fraction, 0), 1) * mainVideo.duration;
  updateProgress();
}

/* ---------- Ads ---------- */

function scheduleAds(): void {
  const [lo, hi] = AD_WINDOW;
  const first = randomBetween(lo, hi);
  let second = randomBetween(lo, hi);
  for (let tries = 0; Math.abs(second - first) < AD_MIN_GAP && tries < 50; tries++) {
    second = randomBetween(lo, hi);
  }
  const times = [first, second].sort((a, b) => a - b);
  adBreaks.forEach((ad, i) => { ad.at = times[i]; ad.played = false; });
}

function onMainTimeUpdate(): void {
  updateProgress();
  if (currentAd || !mainVideo.duration) return;
  const progress = mainVideo.currentTime / mainVideo.duration;
  const due = adBreaks.find((ad) => !ad.played && progress >= ad.at);
  if (due) startAd(due);
}

function startAd(ad: AdBreak): void {
  ad.played = true;
  if (ad.broken) return; // ad file missing: lucky you

  currentAd = ad;
  mainVideo.pause();
  activeVideo = ad.video;
  ad.video.currentTime = 0;
  ad.video.volume = volume01;
  ad.video.play().catch(() => endAd());

  byId("ad-index").textContent = String(ad.index);
  byId("ad-overlay").classList.add("show");

  const skip = byId<HTMLButtonElement>("ad-skip");
  skip.disabled = true;
  let step = 0;
  skip.textContent = `Skip in ${SKIP_COUNTDOWN[step]}`;
  window.clearInterval(skipTimer);
  skipTimer = window.setInterval(() => {
    step++;
    if (step < SKIP_COUNTDOWN.length) {
      skip.textContent = `Skip in ${SKIP_COUNTDOWN[step]}`;
    } else {
      window.clearInterval(skipTimer);
      skip.textContent = "Skip ad ▶▶";
      skip.disabled = false;
    }
  }, 1000);
  updateProgress();
}

function endAd(): void {
  if (!currentAd) return;
  window.clearInterval(skipTimer);
  currentAd.video.pause();
  currentAd = null;
  activeVideo = mainVideo;
  byId("ad-overlay").classList.remove("show");
  mainVideo.play().catch(() => { /* user can press "pause" to play, obviously */ });
  updateProgress();
}

/* ---------- Mouse-speed resolution ---------- */

function onPlayerMouseMove(e: MouseEvent): void {
  if (!byId("screen-player").classList.contains("active")) return;
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

function renderFrame(now: number): void {
  if (now - lastMouseMoveAt > MOUSE_IDLE_MS) mouseSpeed = 0; // stopped → straight to potato

  const resolution = resolutionForSpeed(mouseSpeed);
  if (resolution !== currentResolution) {
    currentResolution = resolution;
    byId("res-badge").textContent = resolutionLabel(resolution);
  }

  const canvas = byId<HTMLCanvasElement>("player-canvas");
  const ctx = canvas.getContext("2d")!;
  const src = activeVideo;

  if (src && src.readyState >= 2 && src.videoWidth > 0) {
    const vw = src.videoWidth;
    const vh = src.videoHeight;
    if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }

    if (resolution >= vh) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(src, 0, 0, vw, vh);
    } else {
      const sh = resolution;
      const sw = Math.max(1, Math.round((vw / vh) * sh));
      lowResCanvas.width = sw;
      lowResCanvas.height = sh;
      lowResCanvas.getContext("2d")!.drawImage(src, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(lowResCanvas, 0, 0, sw, sh, 0, 0, vw, vh);
    }
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(renderFrame);
}
