/* ============================================================
   Run persistence — a refresh should not cost a run.

   The whole reducer state is JSON (screen, player, progress, inventory,
   evidence, timeLeft…), so it is stored as-is and restored by the RESTORE
   action. Nothing here decides whether to resume: GameContext offers the
   choice, because silently restoring would strand a player who wanted a
   fresh start on someone else's half-finished run.

   sessionStorage, not localStorage, on purpose. It survives a refresh —
   which is the point — but not closing the tab, so the next person to sit
   at a shared classroom machine starts their own run instead of inheriting
   the previous one, and their xAPI statements stay their own. It also
   matches where xapi.js already keeps the actor (ACTOR_KEY), so the run
   and the identity reporting it expire together. Swap the two lines marked
   below for localStorage if a run should outlive the tab.

   The clock does not run while the page is closed: timeLeft is restored as
   it was saved. A player who refreshes loses no time, which is the kind
   thing to do and removes any incentive to refresh for more.
   ============================================================ */

import { DEBUG } from './settings.js'

const KEY = 'er3:run'
/* The feedback survey is offered once per run: remembering it means a
   refresh on the end screen does not ask again, and "start over" (which
   clears the run) makes the next run's survey a fresh ask. */
const SURVEY_KEY = 'er3:survey-done'
const VERSION = 1

/* Debug entry points (?debug, ?screen=) build their own state, so persisting
   them would mean a stale debug run greets the next normal load. */
const enabled = !DEBUG

const store = () => sessionStorage // ← localStorage to outlive the tab

export function saveRun(state) {
  if (!enabled) return
  // 'welcome' is not a run: saving it would offer to "resume" a game that
  // has not started, and overwrite a real run with an empty one.
  if (!state || state.screen === 'welcome') return
  try {
    store().setItem(KEY, JSON.stringify({ v: VERSION, savedAt: Date.now(), state }))
  } catch { /* private mode, quota — a lost save must never break the game */ }
}

/* The saved run, or null when there is nothing worth offering. */
export function loadRun() {
  if (!enabled) return null
  try {
    const raw = store().getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.v !== VERSION) return null       // older shape: ignore
    const { state } = parsed
    if (!state || typeof state !== 'object') return null
    if (!state.screen || state.screen === 'welcome') return null
    if (!state.progress || typeof state.progress !== 'object') return null
    return state
  } catch {
    return null
  }
}

export function clearRun() {
  try {
    store().removeItem(KEY)
    store().removeItem(SURVEY_KEY)
  } catch { /* ignore */ }
}

export function isSurveyDone() {
  try { return store().getItem(SURVEY_KEY) === '1' } catch { return false }
}

export function markSurveyDone() {
  try { store().setItem(SURVEY_KEY, '1') } catch { /* ignore */ }
}

/* The chosen language, kept beside the run. Without this a refresh would
   restore the run but revert the interface to English — and the language
   picker only exists on the welcome screen, which a resumed run never
   returns to. Not gated on DEBUG and not cleared by clearRun(): it is a
   preference, not part of the run, and a debug reload should not silently
   switch language either. */
const LOCALE_KEY = 'er3:locale'

export function loadLocale() {
  try { return sessionStorage.getItem(LOCALE_KEY) || null } catch { return null }
}

export function saveLocale(code) {
  try { sessionStorage.setItem(LOCALE_KEY, code) } catch { /* ignore */ }
}
