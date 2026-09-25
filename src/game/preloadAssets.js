import { bgUrl, assetUrl } from './assets.js'

/* Warm every image into the browser cache up front, so moving between the map,
   rooms and corridors never stalls to fetch a big PNG/GIF mid-transition. Paths
   are resolved through bgUrl()/assetUrl() (which respect Vite's base URL) so
   preloading hits the same cache entries the app later uses — including in
   production under '/lastchance/'. */

/* Every station draws the shared stand with its own prop on top. */
const MAP_COMPOSITE = [
  'map/stand.png',
  'map/start.png',
  'map/link.png',
  'map/roulette.png',
  'map/influencer.png',
  'map/algorithm.png',
  'map/ads.png',
  'map/persuasion.png',
  'map/final.png',
]

/* Images in public/bg — resolved via bgUrl() (implied 'bg/' prefix). */
const BG_IMAGES = [
  'welcome.gif',
  'map.png',
  'map/map-bg.png',
  'map/lock-closed.png',
  ...MAP_COMPOSITE,
  'link.gif',
  'link.png',
  'link_transition.gif',
  'roulette.png',
  'influencer.png',
  'algorithm.png',
  'algorithm-door.jpg',
  'algorithm-keypad.jpg',
  'ads.png',
  'persuasion.png',
  'persuasion_animation.gif',
  'persuasion_end.png',
  'computer.png',
  'conversation.png',
  'max-talking.png',
  'player-talking.png',
  'phone-with-ad.png',
]

/* Images in other public/ subfolders — resolved via assetUrl() (full path). */
const ASSET_IMAGES = [
  // Ads Corridor posters + their revealed "truth" variants.
  'ads-corridor/1-get-offer.png',
  'ads-corridor/1-get-offer-truth.png',
  'ads-corridor/2-get-gift.png',
  'ads-corridor/2-get-gift-truth.png',
  'ads-corridor/3-get-rich.png',
  'ads-corridor/3-get-rich-2.png',
  'ads-corridor/3-get-rich-truth.png',
  'ads-corridor/4-get-protection.png',
  'ads-corridor/4-get-protection-truth.png',
  'ads-corridor/4-get-protection-truth-2.png',
  // Algorithm Room equation art.
  'algorithm-room/r1.png',
  'algorithm-room/r2.png',
  'algorithm-room/r3.png',
  'algorithm-room/r4.png',
  // Link District ad panels.
  'link-district/ad-lights-1.png',
  'link-district/ad-lights-2.png',
  'link-district/ad-lights-3.png',
  'link-district/ad-luna-1.png',
  'link-district/ad-luna-2.png',
  'link-district/ad-luna-3.png',
  'link-district/ad-shoes-1.png',
  'link-district/ad-shoes-2.jpeg',
  'link-district/ad-shoes-3.png',
  // Persuasion Lab poster art.
  'persuasion-lab/emotional.png',
  'persuasion-lab/exagg.png',
  'persuasion-lab/fomo.png',
  'persuasion-lab/influencer.png',
  'persuasion-lab/social.png',
  'persuasion-lab/urgency.png',
  // Influencer Avenue sponsorship labels (per-language variants).
  'influencers/paid_en.jpg',
  'influencers/paid_es.png',
  'influencers/paid_sr.png',
  'influencers/collab_en.png',
  'influencers/collab_es.png',
  'influencers/collab1_es.png',
  'influencers/collab_sr.png',
  'influencers/gifted_en.jpg',
  'influencers/gifted_es.png',
  'influencers/gifted_sr.png',
  'influencers/nothing_en.png',
  'influencers/nothing_es.png',
  'influencers/nothing_sr.png',
  // Product art.
  'products/cupcakes.png',
  'products/mug.png',
  'products/novapad.png',
]

export const GAME_IMAGES = [
  ...BG_IMAGES.map(bgUrl),
  ...ASSET_IMAGES.map(assetUrl),
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
