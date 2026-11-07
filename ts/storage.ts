// Persistent state. localStorage survives refreshes; sessionStorage survives
// leaving the site in the same tab (the pause-button links) and coming back.

const STORAGE_KEYS = {
  firstRunDone: "abuThaer.firstRunDone", // the first-time refresh/reset already happened
  pauseCount: "abuThaer.pauseCount",   // where we are in the pause-button cycle
  skipCount: "abuThaer.skipCount",     // where we are in the skip-button cycle
  inPlayer: "abuThaer.inPlayer",       // (session) user already reached the player this tab
} as const;

const store = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* storage blocked: suffer anyway */ }
  },
  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
  sessionGet(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  sessionSet(key: string, value: string): void {
    try { sessionStorage.setItem(key, value); } catch { /* ignore */ }
  },
  sessionClear(): void {
    try { sessionStorage.clear(); } catch { /* ignore */ }
  },
};

/** Wipe everything (used by the first-time reset and by ?reset in the URL). */
function resetAllProgress(keepFirstRunDone: boolean): void {
  store.remove(STORAGE_KEYS.pauseCount);
  store.remove(STORAGE_KEYS.skipCount);
  store.sessionClear();
  if (keepFirstRunDone) {
    store.set(STORAGE_KEYS.firstRunDone, "1");
  } else {
    store.remove(STORAGE_KEYS.firstRunDone);
  }
}
