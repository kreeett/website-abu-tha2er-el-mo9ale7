# Abu Tha2er el Mo9ale7: Premium Video Experience™

A video player website with the **worst user experience we could design, on purpose**.
House rules: **no right angles anywhere** (everything is round), washed-out low-contrast
pastels, and a **drifting cursor**: the real cursor is hidden and a faint fake one follows your
hand at a constantly changing speed (0.2× to 2.6×). All clicks land where the fake cursor is.
The first click locks the pointer so the fake cursor can go anywhere; press Esc to get your
real cursor back, click again to re-lock.
Built with HTML, TypeScript, Sass and Bootstrap. No bundler, no framework.

## How to run it

The compiled CSS and JS are committed, so there is nothing to build:

- open `index.html` in a browser, **or**
- enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

The videos live in `media/`: `video.mp4` (main) and `ad1.mp4` (the ad). An optional
`ad2.mp4` is used for the second ad break; without it, `ad1.mp4` plays again.
If the main video is missing, the player says so instead of breaking.

The first-time reset only happens **once per browser**. To start completely fresh, click
**start over** in the footer (or open `index.html?reset`).

## The experience

1. **"Captcha" questions.** *Are you a robot?* → *Are you sure?* → *Are you REALLY sure?*
   The buttons swap places and styles between steps. A wrong answer starts you over.
2. **Brainrot sorting.** Click a character, then a bin, to sort the six Italian brainrot
   characters into *Wears shoes* (Tralalero Tralala, Lirilì Larilà), *Made of food*
   (Ballerina Cappuccina, Chimpanzini Bananini) or *Armed & dangerous* (Tung Tung Tung Sahur,
   Bombardiro Crocodilo). Any mistake sends you back to step 1.
   The big shiny button is **CANCEL**.
3. **Login.** The tiny, nearly invisible login button runs away **once** (slowly), then stays put.
   - **Light switch** (top-right corner): turns the screen black and your cursor becomes a
     flashlight. In the dark the button can't move, and it glows when the flashlight hits it.
   - A **monster** hides in the dark. Find it with the flashlight and it roars (loud!).
   - Catch it once or twice: *Incorrect username or password.*
   - Catch it a third time: *I'm shy 🥺*, and it disappears.
   - **Forgot password?** Whatever you type: *You cannot use your old password.*
4. **First time only:** the page refreshes itself and **all progress resets**.
   Every later run goes straight to the player.
5. **The player.** Over the player, the cursor turns into a duck 🦆.
   - **Pause button:** 1st click → Instagram, 2nd click → a very famous music video, 3rd click → plays. Repeats forever.
   - **Skip button (↻):** same deal: Instagram, the music video, then it finally skips 10 seconds. Repeats forever.
   - **Progress bar** fills right-to-left (and seeks right-to-left), and it **lies**: every few
     seconds it invents a new current time (sometimes running backwards), a new video length,
     a warped bar position, and the bar randomly "skips" ahead or back.
   - **Fullscreen** makes the video smaller.
   - **Volume knob:** each click changes the volume by a random 0–5%, alternating
     counter-clockwise (down) and clockwise (up).
   - **Resolution is a continuous function of your mouse speed**: any value from 144p to 2160p
     (e.g. "731p"). Flick faster for more pixels; stop and it drops to 144p.
     (Faked with a pixelated canvas, since it's one video file.)
   - **Two ads** at random times, each with a skip countdown that goes back to 5 once.
     The ad loops until Skip appears, so even a short ad can't dodge the countdown.
     No seeking during ads.

## Development

```bash
npm install
npm run build        # ts/ → js/, scss/ → css/
npm run watch:ts     # recompile TypeScript on save
npm run watch:css    # recompile Sass on save
```

```
index.html
ts/                    TypeScript source (plain scripts, loaded in order by index.html)
  storage.ts           localStorage/sessionStorage state
  ui.ts                helpers: screens, flash messages
  components/          driftingCursor.ts, circularVolume.ts
  screens/             captchaQuestions, captchaSort, login, player
  main.ts              decides the first screen
scss/                  Bootstrap variable overrides + the "design system"
js/, css/              compiled output (committed for GitHub Pages)
assets/brainrot/       the six brainrot character images
media/                 video.mp4, ad1.mp4 (+ optional ad2.mp4)
```

To change the characters or bins, edit the list at the top of `ts/screens/captchaSort.ts`
(and the bin labels in `index.html`), then run `npm run build`.
