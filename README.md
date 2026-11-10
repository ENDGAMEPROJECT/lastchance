# The Physical Internet — Educational Escape Room

An interactive, cyberpunk-styled escape room that teaches young people how online
**advertising, scams and fraudulent websites** actually work. The player has 30 minutes
to travel a "physical internet" city, gather evidence, and convince their friend — **Mia**
or **Max**, whichever they did not pick — not to buy a too-good-to-be-true viral deal before
the fake "today only" countdown expires.

Built with **React 18 + Vite**. All interactive elements are hand-built with HTML/CSS/SVG
(no game engine, no external UI libraries — zero runtime UI dependencies). All copy runs
through a lightweight in-house i18n layer.

## Run it

```bash
npm install       # installs into ./node_modules only
npm run dev        # dev server at http://localhost:5173
npm run dev:debug  # dev server with debug mode on (all nodes unlocked, jump buttons)
npm run build      # production build into ./dist (base path /lastchance/)
npm run preview    # preview the production build
npm run check:i18n   # every referenced i18n key exists (static + dynamic)
npm run check:xapi   # every track() call names a real verb, object and parent
npm run check:assets # every catalogued image exists, every used image is catalogued
npm run check:all    # all three, then a production build
npm run i18n:import  # pull translations from the Google Sheet into src/i18n/locales
npm run i18n:export  # mirror the Sheet to docs/translations/*.csv, validating placeholders
```

Run `npm run check:all` before pushing: the three checks catch the mistakes a build
cannot see — a missing translation key, a `track()` call naming a verb that does not
exist, an image the preloader promises but nobody shipped.

## The game

The whole game runs inside a fixed **1280×720 (16:9) stage** that is scaled as a single unit
to fit the window and letterboxed (`components/Stage.jsx`), so the layout never reflows.

Flow of screens (see the `screen` state in `GameContext`, routed in `App.jsx`):

1. **Welcome** — pick an alias, age, language, and character (Mia or Max). Mia helps Max spot the NovaPad scam; Max helps Mia instead. This choice controls the speakers, hints, data report and ending throughout the run. The Algorithm Control Room displays the friend's figure: `max-figure-nobg.png` when playing Mia, `mia-figure-nobg.png` when playing Max.
2. **Pre-test chat** — a messaging-app conversation with **Max**, who shows a viral flash-sale
   post (a live phone **Product Preview** with a spoofed URL and a ticking "today only" timer)
   and asks whether he should buy. This diagnoses the player's starting instincts.
3. **The Map** — four puzzle districts + two corridors on an oval "racetrack" progress map,
   under a 30-minute countdown, with an inventory **Bag** (tools + evidence).
4. **Post-test chat** — the finale: the player returns to the conversation with Max and must
   use the evidence they gathered to talk him out of the purchase before time runs out.
5. **Win / Lose** — based on whether Max is convinced (or the timer expires).

| # | Node | Type | Teaches |
|---|------|------|---------|
| 1 | **Link District** | Puzzle | Spot & block fraudulent look-alike URLs (typosquatting, homoglyphs, http vs https, odd TLDs). Doors open to reveal the site; order is shuffled. Reward: *Emoji Decoding Card*. |
| 2 | **Roulette Corridor** | Corridor | Spin two rigged wheels at least twice each and choose Rigged or Not rigged. Correct choices reveal two short lessons: what gamification is and how feeling lucky can lead to more spending and playing. Icons accompany the translated labels; there are no extra reasoning choices. |
| 3 | **Influencer Avenue** | Puzzle | Decode sponsorship labels (PAID/COLLAB/GIFTED) + simulated reverse-image-search to spot fake/AI products. Reward: *Data Report*. |
| 4 | **Algorithm Control Room** | Puzzle | How personalization equations target ads using your demographics, follows & insecurities. Reward: *Truth Flashlight*. |
| 5 | **Ads Corridor** | Corridor | A cursor-tracked "Truth Flashlight" (carried in from the Algorithm Room) burns away the gloss to reveal the fine print + a hidden exit code. |
| 6 | **Persuasion Lab** | Puzzle | Name the persuasion technique on each poster (FOMO, social proof, urgency…) by dragging frames onto them; then click the computer to type the revealed password. |

The finale is the **Post-test** conversation (there is no separate "Final Decision" node).

**Reward chain.** Solving a puzzle grants the tool the next one needs, revealed on the "cleared"
bar (`RoomFrame`'s `reward` prop): Link District → 🔑 *Emoji Card* (Influencer Avenue) →
📄 *Data Report* (opens the Algorithm Room) → 🔦 *Truth Flashlight* (Ads Corridor). Items live in
`ITEMS` (`gameData.js`); their names/descriptions are i18n'd under `items.*`.

## Debug mode

Handy for jumping straight to a screen or unlocking every node while building.

- Turn on with `npm run dev:debug`, or append **`?debug`** to the URL (`localhost:5173/?debug`).
- **`?screen=<name>`** jumps straight to a screen (implies debug): `pretest`, `enter` (portal arrival, intro skipped), `posttest`, `win`, `lose`. The **Skip intro → Portal** button (welcome/pre-test HUD and the map jump bar) does the same.
- **`?screen=posttest&scenario=inTime`**: all puzzles completed, 5 minutes left.
- **`?screen=posttest&scenario=timeout`**: time expired before all puzzles were completed; the post-test runs without a countdown.
- Debug buttons **Test · 5:00** and **Test · 0:00** on the Map and post-test/end-screen HUD restart either case with fresh answers.
- When on, the Map shows all nodes unlocked plus "jump to" buttons for the test/end screens.
- Flags live in `src/game/settings.js` (`DEBUG`, `DEBUG_SCREEN`).

## Project structure

```
src/
  main.jsx                 App bootstrap (wraps I18nProvider + GameProvider)
  App.jsx                  Screen router + ROOMS registry + staged asset preload
  game/
    gameData.js            Node graph, items, codes, emoji key, narrative (structure)
    GameContext.jsx        Run state: screen, progress, inventory, evidence, timer
    settings.js            Tunables (timer, typewriter pacing, reminders) + DEBUG flags
    session.js             Run persistence: save/restore a run, the survey flag, the locale
    xapi.js                Learning-analytics statements: verb/object catalogue + track()
    assets.js              bgUrl() — resolves public asset paths against the base URL
    preloadAssets.js       Preloads the current screen and its next destination
    sound.js               playSound()/preloadSound()/stopSound() + global mute (persisted); base-URL aware
  i18n/
    index.jsx              useT()/useI18n() hooks, provider, {var} interpolation, locale registry
    characterText.js       interpolate() + the character variables, incl. declined names
    dictionaries.js        Merges the generated locales with the local UI-copy files
    locales/
      en|es|fi|sr.js       Generated from the translation Sheet — do not edit by hand
      session.js           Resume-dialog copy, preserved across an import
      fullscreen.js        Fullscreen/timer button labels, preserved across an import
      orientation.js       "Turn your phone" copy, preserved across an import
  components/
    Stage.jsx              Fixed 1280×720 stage, scaled to fit (exposes useStage().scale)
    HUD.jsx                Top bar: countdown, Bag, Map, sound on/off toggle
    GameMap.jsx            Serpentine district map / progress tracker (3D station art)
    RoomFrame.jsx          Shared room chrome (briefing gate, bg slot, dim overlay, reward reveal, "cleared" bar)
    RoomNav.jsx            In-room viewpoint navigator (◀ ▶ stations, e.g. Algorithm Room)
    Conversation.jsx       Messaging-app chat UI (typewriter, online/typing status) for the tests
    ProductPreview.jsx     Phone flash-sale post: spoofed non-clickable URL + live countdown
    Modal.jsx              Reusable neon modal
    SessionDialog.jsx      Resume-or-restart choice when a saved run is found
    SurveyModal.jsx        End-of-run feedback survey (sections driven by the Sheet)
    screens/LandingCredits.jsx  EU funding + ENDGAME logos on the welcome screen
    dnd/Dnd.jsx            Pointer-based drag-and-drop primitive (scale-aware, tap-to-place)
    screens/               Welcome, Intro, Pretest, Posttest, EndScreens (Win/Lose)
  rooms/                   One component per district/corridor (+ co-located CSS)
  styles/global.css        Cyberpunk design system (tokens + utilities)
```

## Backgrounds & images

Every room is rendered inside `RoomFrame`, which accepts a `bgImage` prop and paints it
behind the interactive layer via the `.bg-slot` style (see `global.css`). Screens paint
their own `.bg-slot` directly.

**Important — use `bgUrl()` for every image path.** In production the app is served under
`/lastchance/`, so bare `/bg/...` paths 404. `src/game/assets.js` exposes `bgUrl(name)`,
which prefixes Vite's `import.meta.env.BASE_URL` (i.e. `/` in dev, `/lastchance/` in prod).

1. Put an image in `public/bg/` (e.g. `public/bg/influencer.png`).
2. In that room's component: `import { bgUrl } from '../game/assets.js'` and pass
   `<RoomFrame node={node} bgImage={bgUrl('influencer.png')} …>`.
3. For a raw CSS background, use ``style={{ backgroundImage: `url(${bgUrl('map.png')})` }}``.
4. Add the file name to the appropriate room/screen group in `src/game/preloadAssets.js`.
   `GAME_IMAGES` collects those groups; it is never downloaded as one batch.
   `npm run check:assets` enforces both directions — a catalogue entry naming a file that is
   not there (which fails silently at runtime, by design, and shows up as a blank frame), and
   an image the source uses that the catalogue never mentions (which then downloads
   mid-scene, the exact stutter the preloader exists to prevent). Paths built from data at
   runtime cannot be read statically, so the check lists them for a human instead.
5. Tune opacity/blend in `.bg-slot` (global.css) if the image competes with the UI.

**Map station art** lives in `public/bg/map/` — `map-bg.png` (the city backdrop, no path baked in;
the neon trail is SVG drawn in `GameMap.jsx`), plus a `node-<key>-color.png` / `node-<key>-gray.png`
pair per station (`start, link, roulette, influencer, algorithm, ads, persuasion, final`) and
`lock-closed.png`. The node art is transparent 512×512 PNGs of an icon on a podium; the color and
gray renders must stay pixel-aligned, since the map swaps one file name for the other. Reference
them as `bgUrl('map/node-link-color.png')` — the folder is part of the name.

Notes: PNGs render best around **1376×768**; animated **GIFs** are supported (browsers clamp
very short frame delays, so encode e.g. 50 frames × 20 ms to play a 1 s loop). Prompt files
for generating these backgrounds live in `junk/bg_prompts/` (gitignored).

**Staged preloading.** Welcome loads its background, then prepares only the selected
character's pre-test images. During the pre-test, the shared portal video, arrival art and
map warm up. The arrival prepares the first room; the map prepares the next uncleared
node; each room prepares its successor (or the post-test after the last room).
Influencer images use the selected language, and reports/profile art use the friend's
character. At most three preload requests run together, with the current screen first.
Navigation replaces pending work, already loaded files are reused, and failed/stalled
requests do not block the queue. Screens still render immediately.

## Sound

Sound effects live in `public/sounds/` and play through `src/game/sound.js`:

- `playSound(name, volume?, startAt?)` — best-effort play (autoplay/missing-file errors are
  swallowed); `preloadSound(name)` warms a clip on room entry; `stopSound(name)` halts a long
  clip (e.g. the roulette spin whir). Paths resolve via `soundUrl()` against `BASE_URL`, so
  they work under `/lastchance/` in production — the same base-path rule as images.
- **Global mute** — `isMuted()/setMuted()` back the 🔊/🔇 toggle in the HUD; the choice is
  persisted to `localStorage` and `playSound` short-circuits when muted.
- Wired in for tactile feedback: door open/close/blocked/rotate (Link District), roulette
  spin + win, a "correct" twinkle and a shared `wrong.mp3` on any incorrect answer, and an
  inventory chime fired centrally from `GameContext` whenever a new item is earned.

To add a sound: drop the file in `public/sounds/`, then `playSound('file.mp3')` (and optionally
`preloadSound('file.mp3')` on mount).

## Resuming a run

A refresh used to cost the whole run. The reducer state is plain JSON, so it is saved to
`sessionStorage` on every change and offered back on the next load: `SessionDialog` names
what is at stake — districts cleared, time left, where the run stands, what it is carrying
— and the player chooses **Resume** or **Start over**. Nothing is restored silently, which
would strand someone who wanted a fresh start on a stranger's half-finished game.

`sessionStorage` rather than `localStorage` on purpose, matching where the xAPI actor is
kept: on a shared classroom machine the next student starts their own run instead of
inheriting the previous one under a stale identity. One marked line in `session.js` switches
it. The clock does not advance while the page is closed, so a refresh costs no time — and
gives nobody a reason to refresh for more. Persistence is off in debug mode.

**Known limit:** rooms keep their puzzle state in their own components (blocked doors,
framed posters, a typed code), none of which is saved. A refresh mid-puzzle returns the
player to the district with the puzzle restarted. Lifting that state into the reducer would
make resuming seamless; it would touch all six rooms.

## Feedback survey

Both endings offer a short survey (`SurveyModal`), modelled on the one in the ECHO escape
room so results from the two rooms line up. Four sections — a 1–5 opinion, two 1–7 blocks,
and free text — are config rather than markup, so the item count is whatever the Sheet
holds, in every language: adding a question is a row, not a code change. Ratings are
required, the comment box is not. It is asked once per run and submitting opens the end
options: restart, or the ENDGAME project site.

## Learning analytics (xAPI)

`src/game/xapi.js` sends statements to an LRS. Configure it in `.env` (gitignored; see
`.env.example`) with `VITE_XAPI_ENDPOINT` and `VITE_XAPI_AUTH` — and as Actions secrets for
the deployed build (see **Deploying**). With either missing, tracking is silently disabled
and the game plays normally: no statement ever blocks or breaks gameplay.

Because failure is silent by design, **nothing is logged unless debug mode is on** — append
`?debug` to diagnose a deployed build. Verbs, objects and parent activities live in one
catalogue, and `npm run check:xapi` verifies every `track()` call names entries that exist,
which a build cannot see (most calls live in handlers that never run during a render).

## Editing text / adding a language

**A translation Google Sheet is the single source of truth.** `src/i18n/locales/{en,es,fi,sr}.js`
are generated from it and carry a "do not edit by hand" banner — an edit there survives until
the next import and then vanishes. The game ships in English, Spanish, Finnish and Serbian.

- **Edit copy**: change the cell in the Sheet, then `npm run i18n:import`.
- **Review copy**: `npm run i18n:export` mirrors every tab to `docs/translations/<Tab>.csv`,
  which is readable, diffable and easy to bulk-edit before pasting back.
- **Validate**: `npm run check:i18n`, and the export reports any placeholder problem.

Interpolation uses `{name}` placeholders, e.g. `t('intro.hook')` with `{friend}`.

**Never translate a variable name.** `interpolate()` substitutes by exact name and leaves
anything else in the string, so a Serbian `{okrug}` where the call site passes `{district}`
ships literal braces to the player. The export repairs the cases it can prove and fails
loudly on the rest.

**Declined names.** `{friend}` only works as a subject. Finnish and Serbian inflect the name
itself, so a `names.<character>.<form>` row in the Sheet becomes the variable
`{friend_<form>}` — `names.mia.genitive` makes `{friend_genitive}` render "Mian" in Finnish
and "Mije" in Serbian. One string then serves both characters, and a translator can add or
fix a case without a code change.

**UI copy that must survive an import** — the resume dialog, the fullscreen and rotate
prompts — lives in small local files (`src/i18n/locales/session.js`, `fullscreen.js`,
`orientation.js`) merged in `dictionaries.js`. A Sheet value of the same key takes priority.

**Adding a language**: add a column to the Sheet, register the code in
`scripts/i18n-import.mjs` (`LANGS`) and in `src/i18n/index.jsx` (`LOCALE_NAMES`), and drop
an EU funding logo at `public/logos/eu-cofunded-<code>.png`. The Welcome picker populates
itself from `AVAILABLE_LOCALES`.

## Deploying

`npm run build` sets the base path to `/lastchance/`. On push to `main`, a GitHub Actions
workflow (`.github/workflows/deploy.yml`) rebuilds and publishes `dist/` to the `gh-pages`
branch. Because of the base path, always reference assets through `bgUrl()` (above) — bare
absolute paths work in dev but break on the deployed site.

Vite inlines `VITE_`-prefixed variables at build time, so the deployed build needs the xAPI
credentials in the workflow's environment: they are repository **Actions secrets** named
`VITE_XAPI_ENDPOINT` and `VITE_XAPI_AUTH`, read by the build step. Without them the build
still succeeds and tracking is simply off — silently, which is the trap. After a deploy,
hard-reload before concluding anything is broken: the hashed bundle is new but a cached
`index.html` can still point at the old one.

## Funding & credits

<img src="docs/eu-cofunded-readme.png" alt="Co-funded by the European Union" height="60">

Produced within the **ENDGAME** project — *Escaping New Disinformation through Gamified
cross-border Media literacy Education* — at <https://endgameproject.github.io/>.

Funded by the European Union. Views and opinions expressed are however those of the
author(s) only and do not necessarily reflect those of the European Union or the European
Education and Culture Executive Agency (EACEA). Neither the European Union nor EACEA can be
held responsible for them.

The emblem above sits on a dark panel because the file is the *WHITE* variant — white
artwork, which would be invisible on a light README background. The welcome screen carries
the same two logos (`components/screens/LandingCredits.jsx`). The
EU emblem ships as one officially-issued file per language —
`public/logos/eu-cofunded-<locale>.png`, the horizontal RGB *WHITE* variants from the
Commission's co-funded logo packs, white artwork on transparent for a dark background. A
locale with no file falls back to English, so adding a language is a new file.
