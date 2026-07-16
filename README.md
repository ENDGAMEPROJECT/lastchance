# The Physical Internet — Educational Escape Room

An interactive, cyberpunk-styled escape room that teaches young people how online
**advertising, scams and fraudulent websites** actually work. The player has 30 minutes
to travel a "physical internet" city, gather evidence, and convince their friend **Max**
not to buy a too-good-to-be-true viral deal before the fake "today only" countdown expires.

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
npm run check:i18n # verify every referenced i18n key exists (static + dynamic)
```

## The game

The whole game runs inside a fixed **1280×720 (16:9) stage** that is scaled as a single unit
to fit the window and letterboxed (`components/Stage.jsx`), so the layout never reflows.

Flow of screens (see the `screen` state in `GameContext`, routed in `App.jsx`):

1. **Welcome** — pick an alias + age and a language.
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
| 2 | **Roulette Corridor** | Corridor | Gamified "prize wheels" are rigged bait — the guaranteed win is worthless. |
| 3 | **Influencer Avenue** | Puzzle | Decode sponsorship labels (PAID/COLLAB/GIFTED) + simulated reverse-image-search to spot fake/AI products. Reward: *Data Report*. |
| 4 | **Algorithm Control Room** | Puzzle | How personalization equations target ads using your demographics, follows & insecurities. |
| 5 | **Ads Corridor** | Corridor | A cursor-tracked "Truth Flashlight" burns away the gloss to reveal the fine print (and a hidden exit code). |
| 6 | **Persuasion Lab** | Puzzle | Name the persuasion technique on each poster (FOMO, social proof, urgency…) by dragging frames onto them → spells the exit password. |

The finale is the **Post-test** conversation (there is no separate "Final Decision" node).

## Debug mode

Handy for jumping straight to a screen or unlocking every node while building.

- Turn on with `npm run dev:debug`, or append **`?debug`** to the URL (`localhost:5173/?debug`).
- **`?screen=<name>`** jumps straight to a screen (implies debug): `pretest`, `posttest`, `win`, `lose`.
- When on, the Map shows all nodes unlocked plus "jump to" buttons for the test/end screens.
- Flags live in `src/game/settings.js` (`DEBUG`, `DEBUG_SCREEN`).

## Project structure

```
src/
  main.jsx                 App bootstrap (wraps I18nProvider + GameProvider)
  App.jsx                  Screen router + ROOMS registry + startup image preload
  game/
    gameData.js            Node graph, items, codes, emoji key, narrative (structure)
    GameContext.jsx        Run state: screen, progress, inventory, evidence, timer
    settings.js            Tunables + DEBUG / DEBUG_SCREEN flags
    assets.js              bgUrl() — resolves public asset paths against the base URL
    preloadAssets.js       Warms every background image into cache at startup
  i18n/
    index.jsx              useT()/useI18n() hooks, provider, {var} interpolation, locale registry
    locales/
      en.js                English dictionary (shell + composes room fragments)
      en/*.js              Per-room string fragments (link, roulette, ads, persuasion, …)
  components/
    Stage.jsx              Fixed 1280×720 stage, scaled to fit (exposes useStage().scale)
    HUD.jsx                Top bar: countdown, Bag, Map
    GameMap.jsx            Oval "racetrack" district map / progress tracker
    RoomFrame.jsx          Shared room chrome (briefing gate, bg slot, dim overlay, "cleared" bar)
    RoomNav.jsx            In-room viewpoint navigator (◀ ▶ stations, e.g. Algorithm Room)
    Conversation.jsx       Messaging-app chat UI (typewriter, online/typing status) for the tests
    ProductPreview.jsx     Phone flash-sale post: spoofed non-clickable URL + live countdown
    Modal.jsx              Reusable neon modal
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
4. Add the file name to `GAME_IMAGES` in `src/game/preloadAssets.js` so it's cached up front
   and transitions never stall.
5. Tune opacity/blend in `.bg-slot` (global.css) if the image competes with the UI.

Notes: PNGs render best around **1376×768**; animated **GIFs** are supported (browsers clamp
very short frame delays, so encode e.g. 50 frames × 20 ms to play a 1 s loop). Prompt files
for generating these backgrounds live in `junk/bg_prompts/` (gitignored).

## Editing text / adding a language

All user-facing text lives in `src/i18n/locales/`. Nothing is hard-coded in components.

- **Edit copy**: change values in `en.js` (shell) or `en/<room>.js` (a room).
- **Add a language**: copy `en.js` + the `en/` folder to e.g. `fr.js` + `fr/`, translate the
  values (keep the keys), then register it in `src/i18n/index.jsx` (`LOCALES`). The Welcome
  screen's picker is populated automatically from `AVAILABLE_LOCALES`; `useI18n().setLocale('fr')`
  switches at runtime.
- **Validate**: run `npm run check:i18n` to catch any key referenced in code but missing from a locale.

Interpolation uses `{name}` placeholders, e.g. `t('intro.hook', { friend: 'Max' })`.

## Deploying

`npm run build` sets the base path to `/lastchance/`. On push to `main`, a GitHub Actions
workflow (`.github/workflows/deploy.yml`) rebuilds and publishes `dist/` to the `gh-pages`
branch. Because of the base path, always reference assets through `bgUrl()` (above) — bare
absolute paths work in dev but break on the deployed site.
