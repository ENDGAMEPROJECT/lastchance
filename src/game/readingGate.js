import { useEffect, useState } from 'react'

/* How long a feedback text stays up before its continue button becomes
   clickable. Paced at ~315 wpm rather than the dialogues' ~260: unlike a
   dialogue line, a gated panel's text is fully on screen the whole time, so the
   player is re-reading at their own speed rather than waiting for words to
   arrive — and the button's fill now shows how much of the wait is left, so it
   no longer has to be generous enough to feel safe. A floor keeps very short
   texts from flashing past. */
export function readingTime(text) {
  const words = [].concat(text).join(' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(2500, words * 190 + 500)
}

/* A reading gate for `text` (a string or an array of strings). Returns:
     ready    — true once the player has had time to read it
     waitMs   — how long that takes, so the button can show the wait filling
     gateKey  — identity of the current text; remount a button on this and its
                fill animation restarts when the text changes

   The gate restarts whenever the text changes or `active` turns on, so a
   feedback panel can't be skipped before it has been read. `ms` overrides the
   computed reading time with a fixed wait.

   Render gated buttons with components/GateButton.jsx, which keeps them on
   screen (disabled, filling) rather than popping in once the wait is over. */
export function useReadingGate(text, active = true, ms) {
  const gateKey = active ? [].concat(text).join('\n') : null
  const [readKey, setReadKey] = useState(null)
  const waitMs = gateKey === null ? 0 : (ms ?? readingTime(gateKey))
  useEffect(() => {
    if (gateKey === null) return
    const timer = window.setTimeout(() => setReadKey(gateKey), waitMs)
    return () => window.clearTimeout(timer)
  }, [gateKey, waitMs])
  return { ready: gateKey !== null && readKey === gateKey, waitMs, gateKey }
}
