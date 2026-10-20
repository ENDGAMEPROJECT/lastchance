import { useEffect, useState } from 'react'

/* How long a feedback text stays up before its continue button appears: the
   same ~260 wpm pace as the dialogues, with a floor for very short texts. */
export function readingTime(text) {
  const words = [].concat(text).join(' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(3000, words * 230 + 600)
}

/* True once the player has had time to read `text` (a string or an array of
   strings). Restarts whenever the text changes or `active` turns on, so a
   feedback panel can't be skipped before it has been read. `ms` overrides
   the computed reading time with a fixed wait. */
export function useReadingGate(text, active = true, ms) {
  const key = active ? [].concat(text).join('\n') : null
  const [readKey, setReadKey] = useState(null)
  useEffect(() => {
    if (key === null) return
    const timer = window.setTimeout(() => setReadKey(key), ms ?? readingTime(key))
    return () => window.clearTimeout(timer)
  }, [key, ms])
  return key !== null && readKey === key
}
