# Abu Tha2er el Mo9ale7: Premium Video Experience™

A video player website with the **worst user experience we could design, on purpose**.
Built with HTML, TypeScript, Sass and Bootstrap. No bundler, no framework.

## How to run it

The compiled CSS and JS are committed, so there is nothing to build:

- open `index.html` in a browser, **or**
- enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

Put the videos in `media/`: `video.mp4`, `ad1.mp4` and `ad2.mp4`.
If a file is missing, the player says so instead of breaking.

To start from scratch (e.g. to see the first-time loading bar again), open `index.html?reset`.

## The experience

1. **"Captcha" questions.** *Are you a robot?* → *Are you sure?* → *Are you REALLY sure?*
   The buttons swap places and styles between steps. A wrong answer starts you over.
2. **Brainrot sorting.** Drag the characters (or click one, then a bin) into
   *Sea creature*, *Food-based* or *Flying thing*. Any mistake sends you back to step 1.
   The big shiny button is **CANCEL**.
3. **Login.** The login button runs away from the cursor (sometimes it trips).
   - Catch it once or twice: *Incorrect username or password.*
   - Catch it a third time: *I'm shy 🥺*, and it disappears.
   - **Forgot password?** Whatever you type: *You cannot use your old password.*
4. **First time only:** a 35-second loading bar that stalls and jumps backwards, then
   the page refreshes itself and **all progress resets**. Every later run goes straight
   to the player.
5. **The player.**
   - **Pause button:** 1st click → Instagram, 2nd click → a very famous music video, 3rd click → plays. Repeats forever.
   - **Progress bar** fills right-to-left (and seeks right-to-left).
   - **Fullscreen** makes the video smaller.
   - **Volume knob:** each click changes the volume by a random 0–5%, alternating
     counter-clockwise (down) and clockwise (up).
   - **Resolution follows your mouse speed.** Flick faster for HD/4K; stop and it drops to 144p.
     (Faked with a pixelated canvas, since it's one video file.)
   - **Two ads** at random times, each with a skip countdown that goes back to 5 once.
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
  components/circularVolume.ts
  screens/             captchaQuestions, captchaSort, login, loading, player
  main.ts              decides the first screen
scss/                  Bootstrap variable overrides + the "design system"
js/, css/              compiled output (committed for GitHub Pages)
assets/brainrot/       placeholder characters (replace the SVGs with real images)
media/                 video.mp4, ad1.mp4, ad2.mp4
```

To use real character images, replace the files in `assets/brainrot/`, or edit the list
at the top of `ts/screens/captchaSort.ts` and run `npm run build`.
