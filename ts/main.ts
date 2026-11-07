// Entry point: decide which screen to show on page load.

function boot(): void {
  // Visit index.html?reset to start completely fresh (handy for testing/grading).
  if (new URLSearchParams(window.location.search).has("reset")) {
    resetAllProgress(false);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const firstRunDone = store.get(STORAGE_KEYS.firstRunDone) === "1";
  const cameBackFromPauseLink = store.sessionGet(STORAGE_KEYS.inPlayer) === "1";

  if (firstRunDone && cameBackFromPauseLink) {
    enterPlayer();
  } else {
    startRobotQuestions();
  }
}

boot();
