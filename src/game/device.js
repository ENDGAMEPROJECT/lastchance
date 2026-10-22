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
