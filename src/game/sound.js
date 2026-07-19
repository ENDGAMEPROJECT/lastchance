/* Tiny sound helper. Resolves files in public/sounds against Vite's base URL
   (so it works under '/lastchance/' in production) and plays them on demand.
   Best-effort: any failure (autoplay policy, missing file) is swallowed so it
   never interrupts the game. */
const BASE = import.meta.env.BASE_URL

export const soundUrl = (name) => `${BASE}sounds/${name}`

// One reusable Audio per file, so repeated plays don't spin up new elements.
const cache = {}

/* ---- Global mute, persisted across reloads. ---- */
const MUTE_KEY = 'er3.muted'
let muted = false
try { muted = localStorage.getItem(MUTE_KEY) === '1' } catch { /* ignore */ }

export function isMuted() { return muted }

export function setMuted(value) {
  muted = !!value
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* ignore */ }
  // Silence anything already playing when muting.
  if (muted) {
    for (const k in cache) {
      try { cache[k].pause(); cache[k].currentTime = 0 } catch { /* ignore */ }
    }
  }
  return muted
}

export function toggleMuted() { return setMuted(!muted) }
function get(name) {
  let a = cache[name]
  if (!a) {
    a = new Audio(soundUrl(name))
    a.preload = 'auto'
    cache[name] = a
  }
  return a
}

/* Warm a sound so the first play has no load delay (call on mount). */
export function preloadSound(name) {
  try { get(name).load() } catch { /* ignore */ }
}

/* Play a sound. volume in [0,1]; startAt skips the first N seconds (e.g. to
   trim a lead-in silence without editing the file). */
export function playSound(name, volume = 1, startAt = 0) {
  if (muted) return
  try {
    const a = get(name)
    a.currentTime = startAt
    a.volume = volume
    a.play().catch(() => {}) // ignore autoplay rejections
  } catch {
    /* ignore */
  }
}

/* Stop a sound (e.g. a looping/long clip) and rewind it. */
export function stopSound(name) {
  try {
    const a = cache[name]
    if (a) { a.pause(); a.currentTime = 0 }
  } catch {
    /* ignore */
  }
}
