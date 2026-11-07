import { useEffect, useState } from 'react'
import { settings } from './settings.js'

/* Phone detection, for the orientation rules (welcome in portrait, the rest of
   the game in landscape). A phone = a touch-first device whose short screen
   side is under 600px — this leaves desktops and tablets alone. `?phone` in the
   URL forces it on (handy for checking the phone flow on a desktop). */
const forced = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('phone')

export const IS_PHONE = typeof window !== 'undefined' && (forced || (
  window.matchMedia('(pointer: coarse)').matches
  && Math.min(window.screen.width, window.screen.height) < 600
))

/* Is the device currently held in landscape? */
export const isLandscape = () => window.innerWidth > window.innerHeight

/* True while the viewport is at or under the mobile breakpoint — the same
   ≤1180px rule as the CSS `@media (max-width: 1180px)` blocks. */
export function useMobileView() {
  const query = `(max-width: ${settings.mobile.breakpoint}px)`
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const sync = () => setMobile(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [query])
  return mobile
}
