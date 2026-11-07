"use strict";
// Right after login: the 67 picture. Swap assets/67.svg for any image you like.
const SIX_SEVEN_MS = 4000;
function show67(onDone) {
    showScreen("sixseven");
    window.setTimeout(onDone, SIX_SEVEN_MS);
}
