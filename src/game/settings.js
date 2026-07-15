/* ============================================================
   GAME SETTINGS — tweak how the game looks and plays here.
   This is intentionally a plain, well-commented config object so
   it can be edited without touching component code.
   ============================================================ */

/* Debug mode: unlocks every district and drops you straight on the map,
   so any puzzle can be opened without solving the earlier ones.
   Enable with `npm run dev:debug`, or append ?debug to the URL
   (e.g. http://localhost:5173/?debug). Off in normal builds.

   ?screen=<name> jumps straight to a screen (and implies debug), e.g.
   ?screen=posttest, ?screen=pretest, ?screen=win, ?screen=lose. */
const _params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
export const DEBUG_SCREEN = (_params && _params.get('screen')) || null
export const DEBUG =
  (import.meta.env && import.meta.env.VITE_DEBUG === 'true') ||
  (_params ? _params.has('debug') || !!DEBUG_SCREEN : false)

export const settings = {
  /* The fixed design resolution. The whole game is composed at this
     size and scaled as one unit to fit the window (16:9, letterboxed).
     Change to 1920x1080 for a larger authoring canvas if you prefer. */
  design: {
    width: 1280,
    height: 720,
  },

  /* Minutes on the offer countdown. */
  timerMinutes: 30,

  /* ---------------- Puzzle 1 · Link District ---------------- */
  linkDistrict: {
    /* Shuffle the on-screen order of the doors every round so the
       correct one is never in a fixed position. */
    randomizePositions: true,

    /* Ambiguous mode: render every door with the SAME neutral browser
       chrome and no colour-coding, so the player must actually read
       and reason about the URL to decide which is legit — instead of
       spotting the obviously-red "SALE" door. Set false to restore the
       old, more obvious look-and-feel (good for younger players). */
    ambiguous: true,

    /* When true, after a wrong confirmation the correct door is briefly
       highlighted as a teaching aid. When false, only an error shows. */
    revealCorrectOnError: false,

    /* Show the per-door explanation note after a door is blocked. */
    showNotesAfterBlock: true,
  },

  /* ---------------- Interaction ---------------- */
  interaction: {
    /* Master switch for the drag-and-drop puzzles (Influencer labels,
       Algorithm tiles, Persuasion frames). If a device can't drag,
       the puzzles still accept a tap-to-select then tap-to-place
       fallback built into the DnD primitive. */
    dragAndDrop: true,
  },

  /* ---------------- Accessibility ---------------- */
  a11y: {
    /* Respect prefers-reduced-motion automatically; this is an extra
       manual override the player can toggle in the HUD. */
    reducedMotionDefault: false,
  },
}

export default settings
