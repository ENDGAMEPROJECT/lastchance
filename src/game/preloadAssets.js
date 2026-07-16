import { bgUrl } from './assets.js'

/* Warm every background image into the browser cache up front, so moving
   between the map, rooms and corridors never stalls to fetch a big PNG/GIF
   mid-transition. Paths are resolved through bgUrl() (which respects Vite's
   base URL) so preloading hits the same cache entries the app later uses —
   including in production under '/lastchance/'. */

export const GAME_IMAGES = [
  'welcome.gif',
  'map.png',
  'link.gif',
  'link_transition.gif',
  'roulette.png',
  'influencer.png',
  'algorithm.png',
  'ads.png',
  'persuasion.png',
  'conversation.png',
].map(bgUrl)

let started = false

/* Kick off loading of every image once. Returns a promise that settles when
   all have loaded (or errored — a missing file must never block the game). */
export function preloadGameImages() {
  if (started) return Promise.resolve()
  started = true
  return Promise.all(
    GAME_IMAGES.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve // ignore failures — preloading is best-effort
          img.src = src
        }),
    ),
  )
}
