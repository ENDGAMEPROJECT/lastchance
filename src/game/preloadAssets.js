/* Warm every background image into the browser cache up front, so moving
   between the map, rooms and corridors never stalls to fetch a big PNG/GIF
   mid-transition. Paths match exactly how the app requests them (bare
   `/bg/...`, see RoomFrame / the screen components) so preloading hits the
   same cache entries the app will later use. */

export const GAME_IMAGES = [
  '/bg/welcome.gif',
  '/bg/map.png',
  '/bg/link.gif',
  '/bg/link_transition.gif',
  '/bg/roulette.png',
  '/bg/influencer.png',
  '/bg/algorithm.png',
  '/bg/ads.png',
  '/bg/persuasion.png',
  '/bg/conversation.png',
]

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
