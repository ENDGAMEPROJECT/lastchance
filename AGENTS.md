# Agent handoff

Practical notes for an AI agent (or new dev) picking up this repo. Read `README.md` first
for the product/feature overview; this file is about **how to work here without breaking things**.

## What this is

An educational, cyberpunk escape-room web app (React 18 + Vite) that teaches teens how online
ads/scams/fraud work. Fixed 1280×720 stage, hand-built HTML/CSS/SVG interactions, in-house i18n.
No game engine, **zero runtime UI dependencies** — keep it that way.

## Standing constraints (do NOT violate)

These are hard rules from the repo owner. Breaking them is worse than not finishing a task.

1. **No system-level installs.** `npm install` into the project's `./node_modules` is fine.
   Do **not** install anything globally or add new npm dependencies.
2. **Stay inside the project directory.** Do not read or write files outside this repo. (Scratch
   files go in `junk/`, which is gitignored.)
3. **Commits use the owner's name ONLY.** Author is `Sonsoles López Pernas`. **Never** add a
   `Co-Authored-By:` trailer or any other attribution.
4. **Only commit/push when explicitly asked.** Then keep commits scoped and messages factual.
5. **Every image path must go through `bgUrl()`** (see Gotchas) — bare `/bg/...` breaks in prod.

## Commands

```bash
npm run dev         # dev server (base '/')
npm run dev:debug   # dev + debug mode (unlock all nodes, jump buttons)
npm run build       # prod build into ./dist (base '/lastchance/')
npm run preview     # serve the prod build
npm run check:i18n  # MUST pass — verifies every referenced i18n key exists
```

Always `npm run build` after CSS/JSX changes to catch breakage, and `npm run check:i18n`
after touching any `t('...')` key or locale file.

## Architecture in 30 seconds

- `main.jsx` → `I18nProvider` + `GameProvider` → `App.jsx`.
- `App.jsx` is a **screen router** (`screen` state): `welcome | pretest | posttest | win | lose | room`.
  In `room`, it looks up the active node's component in the `ROOMS` registry.
- `components/Stage.jsx` renders a fixed **1280×720** box scaled with `transform: scale()` to fit
  the window. `useStage().scale` exposes the factor — needed for any pointer-coordinate math.
- `game/GameContext.jsx` holds all run state: screen, node progress, inventory, evidence, timer.
- `game/gameData.js` is the **structure** (6 nodes, items, codes, emoji key, narrative). Display
  text is NOT here — it's in i18n.
- `game/settings.js` = tunables + `DEBUG`/`DEBUG_SCREEN`.
- `rooms/*` = one component (+ co-located CSS) per district/corridor.
- `components/` = shared UI: `RoomFrame` (room chrome), `HUD`, `GameMap` (oval progress map),
  `Conversation` (chat), `ProductPreview` (phone post), `RoomNav`, `Modal`, `dnd/Dnd`.
- `i18n/` = `useT()`/`useI18n()`, `{var}` interpolation, `en.js` + per-room `en/*.js` fragments.

## Gotchas & conventions (the stuff that bites)

- **Asset paths / base URL.** Prod is served under `/lastchance/`. Use `bgUrl('file.png')` from
  `game/assets.js` (prefixes `import.meta.env.BASE_URL`) for **every** image — room `bgImage`
  props, `.bg-slot` backgrounds, gifs. Bare `/bg/...` works in dev but 404s in prod. Add new
  backgrounds to `GAME_IMAGES` in `game/preloadAssets.js` too.
- **i18n is mandatory.** No hard-coded user-facing strings in components. Add keys to `en.js`
  (shell) or `en/<room>.js` (a room), reference via `t('...')`, then run `check:i18n`.
- **Fixed stage + scale.** Any drag/hit-test/cursor math must divide screen coords by
  `useStage().scale` to get design pixels (see `rooms/PersuasionRoom.jsx` `toLocal`, `dnd/Dnd.jsx`,
  `rooms/AdsCorridor.jsx` `moveBeam`). Don't assume 1:1 pixels.
- **`.bg-slot` stacking.** The background slot sits at `z-index:-1` inside a `.scene`/`.room-scene`
  that has `isolation: isolate`. To darken the background image, render a sibling overlay at the
  same `-1` layer (see `RoomFrame`'s `dimBackground` → `.bg-blackout`). Avoid `position: fixed`
  overlays inside the scaled stage — stacking gets unpredictable.
- **CSS perspective.** `rotateY`/perspective only apply through direct children of the element
  holding `perspective`. If a tilt looks flat, the transform is probably on too deep a descendant
  (this bit the Persuasion Lab frames — fixed by moving the transform up to the direct child).
- **GIF frame delays.** Browsers clamp very short delays; to "play a whole gif in ~1s" re-encode
  to many frames × ~20ms (e.g. 50×20ms), not one frame with delay=1.
- **Non-breaking spaces.** Copy pasted into `en.js` has occasionally introduced U+00A0, which
  breaks exact-match string edits. Normalize to plain spaces if an edit won't match.
- **Debug jumps.** `?debug`, `?screen=pretest|posttest|win|lose`, or `npm run dev:debug`.

## Deploy

Push to `main` → `.github/workflows/deploy.yml` rebuilds and publishes `dist/` to `gh-pages`
(GitHub Pages). `dist/` is gitignored — never commit build output. If the deployed site loads but
images are missing, suspect a bare `/bg/...` path that skipped `bgUrl()`.

## Scratch / working files

`junk/` is gitignored — put brainstorming, test images, and generated background prompts there
(`junk/bg_prompts/`). `.claude/settings.local.json` allows writing `junk/**/*.md`.

## Current state (as of this handoff)

- Six map nodes wired and playable; pre-test and post-test conversations in place (post-test is
  the finale — there is no separate "Final Decision" node/screen).
- Backgrounds are user-supplied PNG/GIF in `public/bg/`; all references go through `bgUrl()`.
- Recent polish work: Ads Corridor (4-poster row, taller posters, lights-out blackout + spilling
  flashlight beam), Persuasion Lab (tilted poster wall + matching frames), map status badges,
  Max chat avatars, Link District note spacing, Roulette wheel placement, image preloading.
- Open cosmetic threads the owner iterates on live: exact perspective match of Persuasion frames
  to posters, and background-image sizing/blur (assets are owner-provided). Confirm before large
  refactors of these.
