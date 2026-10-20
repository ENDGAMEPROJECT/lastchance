import { bgUrl, assetUrl } from './assets.js'
import { getNarrative } from './characters.js'

// Keep only the current screen and its next destination warm. The catalogue is
// also exported for asset checks; it is never downloaded as one big batch.
const MAP_IMAGES = [
  'map/map-bg.png', 'map/lock-closed.png', 'map/stand.png',
  ...['start', 'link', 'roulette', 'influencer', 'algorithm', 'ads', 'persuasion', 'final']
    .map((name) => `map/${name}.png`),
].map(bgUrl)

const ROOM_IMAGES = {
  'link-district': [
    'link.gif', 'link_transition.gif', 'objects/emoji-decoding-card.png',
    ...['lights', 'luna', 'shoes'].flatMap((product) => [1, 2, 3].map((i) =>
      `link-district/ad-${product}-${i}.${product === 'shoes' && i === 2 ? 'jpeg' : 'png'}`)),
  ].map(bgUrl),
  'roulette-corridor': [bgUrl('roulette.png')],
  'influencer-avenue': [
    bgUrl('influencer.png'), bgUrl('objects/emoji-decoding-card.png'),
    ...['cupcakes', 'cupcakes1', 'cupcakes2', 'cupcakes3', 'mug', 'novapad', 'novapad1', 'novapad2']
      .map((name) => assetUrl(`products/${name}.png`)),
  ],
  'algorithm-room': [
    'algorithm-door.jpg', 'algorithm-keypad.jpg', 'algorithm.png',
    'objects/flashlight.png',
    ...[1, 2, 3, 4].map((i) => `algorithm-room/r${i}.png`),
  ].map(bgUrl),
  'ads-corridor': [
    bgUrl('ads.png'), bgUrl('objects/flashlight.png'),
    ...['1-get-offer', '2-get-gift', '3-get-rich', '4-get-protection']
      .flatMap((name) => [name, `${name}-truth`])
      .map((name) => assetUrl(`ads-corridor/${name}.png`)),
  ],
  'persuasion-room': [
    ...['persuasion.png', 'computer.png', 'persuasion_animation.gif', 'persuasion_end.png'].map(bgUrl),
    ...['emotional', 'exagg', 'fomo', 'influencer', 'social', 'urgency']
      .map((name) => assetUrl(`persuasion-lab/${name}.png`)),
  ],
}

const conversationImages = (narrative) => [
  narrative.friendTalkingImage, narrative.playerTalkingImage, 'phone-with-ad.png',
].map(bgUrl)

const arrivalImages = (narrative) => [
  'initial-ph-internet.png', narrative.friendInternetImage, narrative.playerInternetImage,
].map(bgUrl)

function roomImages(nodeId, narrative, locale) {
  const images = ROOM_IMAGES[nodeId] || []
  if (nodeId === 'influencer-avenue') {
    // Matches InfluencerAvenue's language fallback (Finnish uses English art).
    const language = ['es', 'sr'].includes(locale) ? locale : 'en'
    return [...images, bgUrl(narrative.reportImage), ...['paid', 'collab', 'gifted'].map((label) =>
      bgUrl(`influencers/${label}_${language}.${language === 'en' && label !== 'collab' ? 'jpg' : 'png'}`))]
  }
  if (nodeId === 'algorithm-room') {
    return [...images, bgUrl(narrative.reportImage), bgUrl(narrative.friendProfileImage)]
  }
  return images
}

const ENDING_IMAGES = [assetUrl('ending/player-won.png')]
const PORTAL_VIDEO = 'transitions-videos/abduction-scene.mp4'

// Debug jumps, character changes and locale changes use the same resource
// selection as a normal playthrough.
export function getAssetPreloadPlan({ screen, character = 'mia', locale = 'en', nodeId, nextNodeId }) {
  const narrative = getNarrative(character)
  const conversation = conversationImages(narrative)
  const arrival = arrivalImages(narrative)
  const nextRoom = roomImages(nextNodeId, narrative, locale)
  switch (screen) {
    case 'welcome':
      return { current: [bgUrl('welcome.gif'), bgUrl('algorithm-room/mia-figure-nobg.png'), bgUrl('algorithm-room/max-figure-nobg.png')], next: conversation }
    case 'pretest':
      return { current: conversation, next: [...arrival, ...MAP_IMAGES], video: PORTAL_VIDEO }
    case 'enter':
      return { current: arrival, next: [...MAP_IMAGES, ...nextRoom], video: PORTAL_VIDEO }
    case 'map':
      return { current: MAP_IMAGES, next: nextRoom }
    case 'room':
    case 'review':
      return {
        current: roomImages(nodeId, narrative, locale),
        next: nextNodeId ? nextRoom : arrival,
        video: nextNodeId ? undefined : PORTAL_VIDEO,
      }
    case 'return':
      return { current: arrival, next: [...conversation, bgUrl('conversation.png')], video: PORTAL_VIDEO }
    case 'posttest':
      return { current: [...conversation, bgUrl('conversation.png')], next: ENDING_IMAGES }
    case 'win':
      return { current: ENDING_IMAGES, next: [] }
    default:
      return { current: [], next: [] }
  }
}

export const GAME_IMAGES = [...new Set([
  bgUrl('welcome.gif'), bgUrl('conversation.png'), ...MAP_IMAGES, ...ENDING_IMAGES,
  ...['mia', 'max'].flatMap((character) => {
    const narrative = getNarrative(character)
    return [
      ...conversationImages(narrative), ...arrivalImages(narrative),
      ...Object.keys(ROOM_IMAGES).flatMap((id) =>
        ['en', 'es', 'sr'].flatMap((locale) => roomImages(id, narrative, locale))),
    ]
  }),
])]

// Reuse the same <video> and buffer in EnterScreen; never fetch it separately.
const videoCache = new Map()
export function getPreloadedVideo(path) {
  if (!videoCache.has(path)) {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = assetUrl(path)
    video.load()
    videoCache.set(path, video)
  }
  return videoCache.get(path)
}

const MAX_CONCURRENT = 3
const LOAD_TIMEOUT_MS = 15000
const loaded = new Set()
const inFlight = new Map()
let queue = []
let currentKeys = new Set()

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    const finish = (success) => {
      window.clearTimeout(timeout)
      img.onload = null
      img.onerror = null
      resolve(success)
    }
    // A stalled/missing resource must never hold up the rest of the queue.
    const timeout = window.setTimeout(() => finish(false), LOAD_TIMEOUT_MS)
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.src = src
  })
}

function loadVideo(path) {
  return new Promise((resolve) => {
    const video = getPreloadedVideo(path)
    if (video.readyState >= 4) return resolve(true)
    const finish = (success) => {
      window.clearTimeout(timeout)
      video.removeEventListener('canplaythrough', onReady)
      video.removeEventListener('error', onError)
      resolve(success)
    }
    const onReady = () => finish(true)
    const onError = () => finish(false)
    const timeout = window.setTimeout(() => finish(false), LOAD_TIMEOUT_MS)
    video.addEventListener('canplaythrough', onReady)
    video.addEventListener('error', onError)
    if (video.error) finish(false)
  })
}

function pumpQueue() {
  while (inFlight.size < MAX_CONCURRENT && queue.length) {
    // Finish this screen's requests before spending bandwidth on the next one.
    const index = queue.findIndex((job) => currentKeys.has(job.key))
    if (index === -1 && [...inFlight.keys()].some((key) => currentKeys.has(key))) return
    const [job] = queue.splice(index === -1 ? 0 : index, 1)
    const promise = job.video ? loadVideo(job.video) : loadImage(job.key)
    inFlight.set(job.key, promise)
    promise.then((success) => {
      if (success) loaded.add(job.key)
    }).finally(() => {
      inFlight.delete(job.key)
      pumpQueue()
    })
  }
}

export function preloadGameAssets(stage) {
  const { current, next, video } = getAssetPreloadPlan(stage)
  currentKeys = new Set(current)
  const jobs = [
    ...current.map((key) => ({ key })),
    ...(video ? [{ key: assetUrl(video), video }] : []),
    ...next.map((key) => ({ key })),
  ]
  // Rebuild pending work on navigation. In-progress requests can finish and be
  // reused, but outdated rooms/languages/characters do not keep draining data.
  const seen = new Set()
  queue = jobs.filter(({ key }) => {
    if (seen.has(key) || loaded.has(key) || inFlight.has(key)) return false
    seen.add(key)
    return true
  })
  pumpQueue()
}
