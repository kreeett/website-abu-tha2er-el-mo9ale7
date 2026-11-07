// Entry point: decide which screen to show on page load.

function boot(): void {
  // Visit index.html?reset to start completely fresh (handy for testing/grading).
  if (new URLSearchParams(window.location.search).has("reset")) {
    resetAllProgress(false);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const seenLoading = store.get(STORAGE_KEYS.seenLoading) === "1";
  const cameBackFromPauseLink = store.sessionGet(STORAGE_KEYS.inPlayer) === "1";

  if (seenLoading && cameBackFromPauseLink) {
    enterPlayer();
  } else {
    startRobotQuestions();
  }
}

boot();
