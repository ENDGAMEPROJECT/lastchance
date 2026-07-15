# The Physical Internet — Educational Escape Room

An interactive, cyberpunk-styled escape room that teaches young people how online
**advertising, scams and fraudulent websites** actually work. The player has 30 minutes
to travel a "physical internet" city, gather evidence, and convince their friend **Max**
not to buy a too-good-to-be-true viral deal (the *NovaPad X* tablet) before the fake
"today only" countdown expires.

Built with **React 18 + Vite**. All interactive elements are hand-built with HTML/CSS/SVG
(no game engine, no external UI libraries). All copy runs through a lightweight i18n layer.

## Run it

```bash
npm install     # installs into ./node_modules only
npm run dev      # dev server at http://localhost:5173
npm run build    # production build into ./dist
npm run preview  # preview the production build
```

## The game

Narrative → four puzzle districts and two corridors, tracked on a progress **Map**, with a
30-minute countdown, an inventory **Bag** (tools + evidence), and intro / win / lose screens.

| # | Node | Type | Teaches |
|---|------|------|---------|
| 1 | **Link District** | Puzzle | Spot & block fraudulent look-alike URLs (typosquatting, odd TLDs, fake discounts). Reward: *Emoji Decoding Card*. |
| 2 | **Roulette Corridor** | Corridor | Gamified "prize wheels" are rigged bait. |
| 3 | **Influencer Avenue** | Puzzle | Decode sponsorship labels (PAID/COLLAB/GIFTED) + simulated reverse-image-search to spot fake/AI products. Reward: *Data Report*. |
| 4 | **Algorithm Control Room** | Puzzle | How personalization equations target ads using your data & insecurities. |
| 5 | **Ads Corridor** | Corridor | A "Truth Flashlight" reveals the fine print behind glossy ads. |
| 6 | **Persuasion Lab** | Puzzle | Identify persuasion techniques (FOMO, social proof, urgency…) → password. |
| 7 | **Final Decision** | Finale | Present the gathered evidence to convince Max before time runs out. |

## Project structure

```
src/
  main.jsx                 App bootstrap (wraps I18nProvider + GameProvider)
  App.jsx                  Screen router + ROOMS registry
  game/
    gameData.js            Node graph, items, codes, emoji key, narrative (structure)
    GameContext.jsx        Run state: screen, progress, inventory, evidence, timer
  i18n/
    index.jsx              useT() hook, provider, {var} interpolation
    locales/
      en.js                English dictionary (shell + composes room fragments)
      en/*.js              Per-room string fragments (link, roulette, …)
  components/
    HUD.jsx                Top bar: countdown, Bag, Map
    GameMap.jsx            District map / progress tracker
    RoomFrame.jsx          Shared room chrome (header, bg slot, "cleared" bar)
    Modal.jsx              Reusable neon modal
    screens/               Intro, Win, Lose
  rooms/                   One component per district/corridor (+ co-located CSS)
  styles/global.css        Cyberpunk design system (tokens + utilities)
```

## Dropping in your own background images

Every room is rendered inside `RoomFrame`, which accepts a `bgImage` prop and paints it
behind the interactive layer via the `.bg-slot` style (see `global.css`).

1. Put an image in `public/` (e.g. `public/bg/influencer.png`).
2. In that room's component, pass it: `<RoomFrame node={node} bgImage="/bg/influencer.png" …>`.
3. Tune opacity/blend in `.bg-slot` (global.css) if it competes with the UI.

## Editing text / adding a language

All user-facing text lives in `src/i18n/locales/`. Nothing is hard-coded in components.

- **Edit copy**: change values in `en.js` (shell) or `en/<room>.js` (a room).
- **Add a language**: copy `en.js` + the `en/` folder to e.g. `fr.js` + `fr/`, translate the
  values (keep the keys), then register it in `src/i18n/index.jsx` (`LOCALES`). A language
  switcher can call `useI18n().setLocale('fr')`.

Interpolation uses `{name}` placeholders, e.g. `t('intro.hook', { friend: 'Max' })`.
