/* Tiny sound helper. Resolves files in public/sounds against Vite's base URL
   (so it works under '/lastchance/' in production) and plays them on demand.
   Best-effort: any failure (autoplay policy, missing file) is swallowed so it
   never interrupts the game. */
import { settings } from './settings.js'

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
    for (const k in fadeTimers) window.clearInterval(fadeTimers[k])
    for (const k in cache) {
      try { cache[k].pause(); cache[k].currentTime = 0 } catch { /* ignore */ }
    }
  } else startAmbience() // unmuted: the current background track comes back
  return muted
}

export function toggleMuted() { return setMuted(!muted) }

/* ---- Background ambience ----
   Looped tracks from settings.ambience.tracks (the Physical Internet's hum,
   the school), one at a time and faded in and out. Screens name the one that
   should play with setAmbience('internet' | 'school' | null); muting pauses
   it and unmuting brings it back. */
let ambience = null // key of the track that should be playing
const fadeTimers = {}
function fadeTo(name, target, ms, done) {
  const a = get(name)
  window.clearInterval(fadeTimers[name])
  const steps = Math.max(1, Math.round(ms / 50))
  const from = a.volume
  let i = 0
  fadeTimers[name] = window.setInterval(() => {
    i += 1
    a.volume = Math.min(1, Math.max(0, from + (target - from) * (i / steps)))
    if (i >= steps) { window.clearInterval(fadeTimers[name]); done?.() }
  }, 50)
}
function startAmbience() {
  const track = ambience && settings.ambience.tracks[ambience]
  if (muted || !track) return
  try {
    const a = get(track.file)
    a.loop = true
    if (a.paused) { a.volume = 0; a.play().catch(() => {}) }
    fadeTo(track.file, track.volume, settings.ambience.fadeMs)
  } catch { /* ignore */ }
}
export function setAmbience(key) {
  const next = key || null
  if (next === ambience) return
  const prev = ambience && settings.ambience.tracks[ambience]
  ambience = next
  // Fade the old track out (and pause it once silent, unless it's wanted again).
  if (prev) {
    try {
      const a = cache[prev.file]
      if (a && !a.paused) {
        fadeTo(prev.file, 0, settings.ambience.fadeMs, () => {
          if (settings.ambience.tracks[ambience]?.file !== prev.file) a.pause()
        })
      }
    } catch { /* ignore */ }
  }
  startAmbience()
}
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
   trim a lead-in silence without editing the file); loop repeats it until
   stopSound(). `loop` is set on every play, so a file looped once does not stay
   looping the next time it is fired as a one-shot. */
export function playSound(name, volume = 1, startAt = 0, loop = false) {
  if (muted) return
  try {
    const a = get(name)
    a.loop = loop
    a.currentTime = startAt
    a.volume = volume
    a.play().catch(() => {}) // ignore autoplay rejections
  } catch {
    /* ignore */
  }
}

/* Loop a short seamless clip for a bounded time, then stop — for sounds
   authored as loops rather than one-shots (the countdown alarm). Returns a
   cancel function so a caller that unmounts early can silence it. Bounded on
   purpose: an alarm that never stops is worse than no alarm. */
export function playLoopFor(name, ms, volume = 1) {
  playSound(name, volume, 0, true)
  const timer = window.setTimeout(() => stopSound(name), ms)
  return () => { window.clearTimeout(timer); stopSound(name) }
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
