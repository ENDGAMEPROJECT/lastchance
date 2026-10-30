/* ============================================================
   xAPI — learning-analytics tracking for the Last Chance ER.

   Statements are POSTed to a Learning Record Store (LRS). The wire
   format, actor shape, extension URIs and env-var names are kept
   IDENTICAL to the ECHO escape room (../SocialMediaER2,
   src/contexts/XAPIProvider.jsx) so both ERs report into the same LRS
   and can be analysed together. The shape of this module is not: ECHO
   uses a React context, while this game keeps side-effectful helpers as
   plain modules (see sound.js, assets.js), so rooms can import `track`
   without threading a hook through every component.

   Configuration lives in .env (gitignored; see .env.example):
     VITE_XAPI_ENDPOINT  base LRS URL, e.g. https://host/data/xAPI
     VITE_XAPI_AUTH      base64 of "key:secret"
   With either missing, tracking is silently disabled and the game plays
   normally — no statement ever blocks or breaks gameplay.

   The statement catalogue this implements is the project's xAPI sheet
   ("ER3 - xAPI"): one `track()` call per row, parameterised.
   ============================================================ */

const ENDPOINT = import.meta.env.VITE_XAPI_ENDPOINT
const AUTH = import.meta.env.VITE_XAPI_AUTH
const IS_DEV = !!import.meta.env.DEV

/* Accept either a bare base64 blob or a full "Basic xxx" header. */
const AUTH_HEADER = AUTH
  ? (/^Basic\s+/i.test(AUTH.trim()) ? AUTH.trim() : `Basic ${AUTH.trim()}`)
  : ''

const CONFIGURED = !!(ENDPOINT && AUTH_HEADER)

if (!CONFIGURED && IS_DEV) {
  console.warn('[xAPI] Not configured — set VITE_XAPI_ENDPOINT and VITE_XAPI_AUTH in .env. Tracking disabled.')
}

/* ---- Base IRIs (shared with ECHO) ---- */
const ENDGAME = 'https://endgameproject.github.io/xapi'
const GAME = `${ENDGAME}/escape-rooms/lastchance`
const RWTH = 'https://xapi.elearn.rwth-aachen.de/definitions'

export const EXT = {
  playerAge: `${ENDGAME}/ext/playerAge`,
  lang: `${ENDGAME}/ext/lang`,
  // Puzzle 1 only: the shuffled on-screen slot a door appeared in, and the
  // red-flag ids (LinkDistrict FLAG_IDS) the door demonstrates.
  // The option letter as it was shown on screen, kept alongside the semantic
  // answer slug in result.response.
  optionKey: `${ENDGAME}/ext/optionKey`,
  doorPosition: `${ENDGAME}/ext/doorPosition`,
  redFlags: `${ENDGAME}/ext/redFlags`,
  durationMs: `${ENDGAME}/ext/durationMs`,
}

/* ---- Verbs. Keys are what call sites pass to track(). ---- */
export const VERBS = {
  started:     { id: `${RWTH}/ide/verbs/started`, display: { en: 'started' } },
  opened:      { id: `${RWTH}/ide/verbs/opened`, display: { en: 'opened' } },
  closed:      { id: `${RWTH}/ide/verbs/closed`, display: { en: 'closed' } },
  selected:    { id: `${RWTH}/ide/verbs/selected`, display: { en: 'selected' } },
  unselected:  { id: `${RWTH}/ide/verbs/unselected`, display: { en: 'unselected' } },
  answered:    { id: `${RWTH}/lms/verbs/answered`, display: { en: 'answered' } },
  submitted:   { id: `${RWTH}/lms/verbs/submitted`, display: { en: 'submitted' } },
  collected:   { id: `${RWTH}/generic/verbs/collected`, display: { en: 'collected' } },
  searched:    { id: `${RWTH}/generic/verbs/searched`, display: { en: 'searched' } },
  dropped:     { id: `${RWTH}/generic/verbs/dropped`, display: { en: 'dropped' } },
  asked:       { id: `${RWTH}/generic/verbs/asked`, display: { en: 'asked' } },
  played:      { id: `${RWTH}/generic/verbs/played`, display: { en: 'played' } },
  used:        { id: 'http://activitystrea.ms/schema/1.0/use', display: { en: 'used' } },
  liked:       { id: 'http://activitystrea.ms/schema/1.0/like', display: { en: 'liked' } },
  updated:     { id: 'http://activitystrea.ms/schema/1.0/update', display: { en: 'updated' } },
  viewed:      { id: 'http://id.tincanapi.com/verb/viewed', display: { en: 'viewed' } },
  launched:    { id: 'http://adlnet.gov/expapi/verbs/launched', display: { en: 'launched' } },
  experienced: { id: 'http://adlnet.gov/expapi/verbs/experienced', display: { en: 'experienced' } },
  attempted:   { id: 'http://adlnet.gov/expapi/verbs/attempted', display: { en: 'attempted' } },
  completed:   { id: 'http://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
  passed:      { id: 'http://adlnet.gov/expapi/verbs/passed', display: { en: 'passed' } },
  failed:      { id: 'http://adlnet.gov/expapi/verbs/failed', display: { en: 'failed' } },
  terminated:  { id: 'http://adlnet.gov/expapi/verbs/terminated', display: { en: 'terminated' } },
}

/* ---- Activity types ---- */
const T = {
  game:        `${RWTH}/seriousGames/activities/game`,
  asgame:      'http://activitystrea.ms/schema/1.0/game',
  choice:      `${RWTH}/lms/activities/choice`,
  solution:    `${RWTH}/generic/activities/solution`,
  image:       `${RWTH}/generic/activities/image`,
  tip:         `${RWTH}/generic/activities/tip`,
  reward:      'http://id.tincanapi.com/activitytype/reward',
  place:       'http://activitystrea.ms/schema/1.0/place',
  page:        'http://activitystrea.ms/schema/1.0/page',
  note:        'http://activitystrea.ms/schema/1.0/note',
  comment:     'http://activitystrea.ms/schema/1.0/comment',
  interaction: 'http://adlnet.gov/expapi/activities/interaction',
  question:    'http://adlnet.gov/expapi/activities/question',
  assessment:  'http://adlnet.gov/expapi/activities/assessment',
  document:    'http://id.tincanapi.com/activitytype/document',
}
export const TYPES = T

/* An activity object: `a('objects/bag', 'Bag', 'interaction')`. */
const a = (path, name, type) => ({
  id: path ? `${GAME}/${path}` : GAME,
  definition: { name: { en: name }, type: T[type] },
})

/* ---- The game itself (grouping on every statement) ---- */
export const GAME_ACTIVITY = a('', 'Last chance', 'game')

/* ---- Parent activities. Node ids map to the sheet's puzzle numbering,
   which follows gameData.js subtitles, not map position. ---- */
export const PARENTS = {
  intro:    a('intro', 'Intro', 'page'),
  pretest:  a('pre-test', 'Pre-test', 'assessment'),
  map:      a('map', 'Map', 'page'),
  posttest: a('post-test', 'Post-test', 'assessment'),
  'link-district':      a('rooms/puzzle-1', 'Puzzle 1', 'place'),
  'roulette-corridor':  a('rooms/corridor-1', 'Corridor 1', 'place'),
  'influencer-avenue':  a('rooms/puzzle-2', 'Puzzle 2', 'place'),
  'algorithm-room':     a('rooms/puzzle-3', 'Puzzle 3', 'place'),
  'ads-corridor':       a('rooms/corridor-2', 'Corridor 2', 'place'),
  'persuasion-room':    a('rooms/puzzle-4', 'Puzzle 4', 'place'),
}

/* Room as an object in its own right (started / completed), named like the map. */
const ROOM_NAMES = {
  'link-district': 'Puzzle 1 - Link District',
  'roulette-corridor': 'Corridor 1 - Roulette Corridor',
  'influencer-avenue': 'Puzzle 2 - Influencer Avenue',
  'algorithm-room': 'Puzzle 3 - Algorithm Control Room',
  'ads-corridor': 'Corridor 2 - Ads Corridor',
  'persuasion-room': 'Puzzle 4 - Persuasion Lab',
}

/* ---- Object catalogue, one entry per row-family in the xAPI sheet. ---- */
export const OBJ = {
  game: () => GAME_ACTIVITY,
  room: (nodeId) => ({
    id: PARENTS[nodeId]?.id || `${GAME}/rooms/${nodeId}`,
    definition: { name: { en: ROOM_NAMES[nodeId] || nodeId }, type: T.place },
  }),

  // Intro / setup
  language: () => a('objects/language', 'Language', 'choice'),
  character: () => a('objects/character', 'Character', 'choice'),
  playerProfile: () => a('objects/player-profile', 'Player profile', 'interaction'),
  portal: () => a('objects/portal', 'Physical Internet portal', 'page'),
  hudTour: (step) => a(`objects/hud-tour/${step}`, `HUD tour: ${step}`, 'interaction'),
  timer: () => a('objects/timer', 'Run timer', 'interaction'),

  // Tests
  pretest: () => a('objects/pre-test', 'Pre-test', 'choice'),
  posttest: () => a('objects/post-test', 'Post-test', 'choice'),
  posttestAssessment: () => a('objects/post-test', 'Post-test', 'assessment'),
  /* Question objects are named by what the item tests, in English, from
     game/testItems.js — the wording itself is localised and so cannot name an
     activity. The same item appears in both tests under its own test's path,
     so pre/post answers to one item line up. */
  pretestQ: (item) => a(`objects/pre-test/${item.slug}`, `Pre-test: ${item.name}`, 'question'),
  posttestQ: (item) => a(`objects/post-test/${item.slug}`, `Post-test: ${item.name}`, 'question'),
  phone: () => a('objects/phone', "Friend's phone", 'interaction'),

  // Map / shell
  map: () => a('objects/map', 'Map', 'interaction'),
  returnScene: () => a('objects/return', 'Return to the Physical Internet', 'page'),
  finalPortal: () => a('objects/final-portal', 'Final decision portal', 'page'),

  // HUD
  bag: () => a('objects/bag', 'Bag', 'interaction'),
  bagTab: () => a('objects/bag/tab', 'Bag tab', 'interaction'),
  hints: () => a('objects/hints', 'Hints', 'interaction'),
  hint: (nodeId, n) => a(`objects/hints/${nodeId}/${n}`, `Hint ${n}: ${nodeId}`, 'tip'),
  nudge: () => a('objects/nudge', 'Stuck nudge', 'interaction'),
  sound: () => a('objects/sound', 'Sound', 'interaction'),
  fullscreen: () => a('objects/fullscreen', 'Fullscreen', 'interaction'),
  reward: (itemId) => a(`rewards/${REWARD[itemId]?.path || itemId}`, REWARD[itemId]?.name || itemId, 'reward'),

  // Puzzle 1 — Link District. Doors are keyed on the RED FLAG they
  // demonstrate, not the domain (localised builds use different brands) and
  // not the position (shuffled every round).
  door: (round, slug, name) => a(`objects/doors/crossroad${round}/${slug}`, name, 'choice'),
  crossroad: (n) => a(`objects/crossroad${n}`, `Crossroads ${n}`, 'solution'),
  crossroadReview: (n) => a(`objects/crossroad${n}/review`, `Crossroads ${n} review`, 'tip'),
  linksQuiz: () => a('objects/links-quiz', 'Links quiz', 'solution'),
  linkFlag: (id) => a(`objects/links-quiz/${id}`, `Red flag: ${id}`, 'choice'),

  // Corridor 1 — Roulette
  roulette: (n) => a(`objects/roulette${n}`, `Roulette ${n}`, 'asgame'),
  rouletteFeedback: (n) => a(`objects/roulette${n}/feedback`, `Roulette ${n} feedback`, 'tip'),
  rouletteCoupon: (n) => a(`objects/roulette${n}/coupon`, 'Shop coupon offer', 'interaction'),
  rouletteRetryBait: (n) => a(`objects/roulette${n}/retry-bait`, 'Retry bait', 'interaction'),

  // Puzzle 2 — Influencer Avenue
  post: (id) => a(`objects/posts/${id}`, `Post: ${id}`, 'note'),
  postComment: (id, n) => a(`objects/posts/${id}/comments/${n}`, `Comment ${n} on post ${id}`, 'comment'),
  decoder: () => a('objects/decoder', 'Emoji decoder', 'interaction'),
  influencers: () => a('objects/influencers', 'Influencers', 'choice'),
  labels: () => a('objects/labels', 'Sponsorship labels', 'solution'),
  labelsRecap: () => a('objects/labels/recap', 'Sponsorship label recap', 'tip'),
  searchExplainer: () => a('objects/reverse-search/explainer', 'Reverse image search explainer', 'tip'),
  product: (id, name) => a(`objects/${id}`, name, 'image'),
  stamp: (value) => a(`objects/stamps/${value}`, `Stamp: ${value}`, 'choice'),
  verification: () => a('objects/verification', 'Product verification', 'solution'),

  // Puzzle 3 — Algorithm Control Room
  doorKeypad: () => a('objects/door-keypad', 'Control room door keypad', 'interaction'),
  roomCode: () => a('objects/room-code', 'Code', 'solution'),
  privacyChoice: () => a('objects/privacy-choice', 'Privacy trade-off', 'choice'),
  equation: (rid, name) => a(`objects/equations/${rid}`, name, 'choice'),
  equationLesson: (rid, name) => a(`objects/equations/${rid}/lesson`, `${name} lesson`, 'tip'),
  algoProfile: (friend) => a('objects/profile', `Algorithmic profile of ${friend}`, 'tip'),

  // Corridor 2 — Ads
  poster: (id, name) => a(`objects/posters/${id}`, name, 'image'),
  exitCode: () => a('objects/exit-code', 'Ads corridor exit code', 'solution'),

  // Puzzle 4 — Persuasion Lab
  frame: (id, label) => a(`objects/frames/${id}`, `Frame: ${label}`, 'choice'),
  computer: () => a('objects/computer', 'Lab computer', 'interaction'),
  password: () => a('objects/password', 'Terminal password', 'solution'),
}

/* Inventory ids (gameData ITEMS) → the reward paths and the stable English
   names used in the xAPI sheet. Deliberately NOT the i18n display names: an
   activity's definition name must not change with the player's language. */
const REWARD = {
  emojiCard: { path: 'emoji', name: 'Emoji decoding card' },
  dataReport: { path: 'report', name: 'Data report' },
  truthLight: { path: 'flashlight', name: 'Truth flashlight' },
}

/* ============================================================
   Actor
   ============================================================ */

const ACTOR_KEY = 'er3.xapiActor'
let actor = null

/* Restore across a reload so a refreshed session keeps one identity. */
try {
  const raw = sessionStorage.getItem(ACTOR_KEY)
  if (raw) actor = JSON.parse(raw)
} catch { /* ignore unavailable or corrupt storage */ }

function persist() {
  try { sessionStorage.setItem(ACTOR_KEY, JSON.stringify(actor)) } catch { /* ignore */ }
}

/* Called once the welcome form is submitted (alias + age + character + language).
   Mirrors ECHO's initializeActor: an Agent with an account whose name is a
   per-run unique id, plus the age/lang extensions that every later statement
   carries in its context. Returns the actor so the very next track() can use
   it before any state has propagated. */
export function initActor({ alias, age, character, lang }) {
  const name = String(alias || 'player').trim()
  actor = {
    objectType: 'Agent',
    name,
    account: {
      homePage: ENDGAME,
      name: `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    },
    extensions: {
      [EXT.playerAge]: Number.parseInt(age, 10),
      [EXT.lang]: lang,
    },
    character,
  }
  persist()
  flushPending()
  return actor
}

/* Statements fired before the welcome form is submitted (picking a language or
   a character) have no actor yet. Rather than drop them, hold them — with the
   timestamp of the moment they happened — and send them once the actor exists.
   Capped so a misconfigured run can't grow this without bound. */
const pending = []
const PENDING_MAX = 50
function flushPending() {
  const queued = pending.splice(0, pending.length)
  queued.forEach(({ verbKey, object, opts }) => track(verbKey, object, opts))
}

/* The player can switch language from the welcome screen after submitting, and
   debug can switch character; keep the actor's extensions truthful. */
export function setActorLang(lang) {
  if (!actor || !lang) return
  actor.extensions[EXT.lang] = lang
  persist()
}

export function getActor() { return actor }
export function isConfigured() { return CONFIGURED }

/* ============================================================
   Sending
   ============================================================ */

/* Lifecycle verbs can fire twice in a few ms (pagehide + beforeunload);
   collapse those. Keyed per verb, as in ECHO. */
const DEDUP_WINDOW_MS = { terminated: 5000, launched: 2000 }
function deduped(verbKey) {
  const windowMs = DEDUP_WINDOW_MS[verbKey]
  if (!windowMs) return false
  const key = `er3.xapiDedup.${verbKey}`
  try {
    const last = Number(sessionStorage.getItem(key))
    const now = Date.now()
    if (Number.isFinite(last) && now - last < windowMs) return true
    sessionStorage.setItem(key, String(now))
  } catch { /* ignore */ }
  return false
}

/* Fire a statement. Never throws, never blocks, never awaited by callers.

   track(verbKey, object, {
     node,        // node id or 'intro'|'pretest'|'map'|'posttest' → parent activity
     response, success, scaled, completion, duration,   // result fields
     ext,         // extra context extensions ({ [EXT.redFlags]: 'suffix' })
     resultExt,   // extra result extensions
     actor,       // override, for the call right after initActor()
     keepalive,   // true for page-exit statements
   })
*/
export function track(verbKey, object, opts = {}) {
  const verb = VERBS[verbKey]
  const who = opts.actor || actor

  if (!CONFIGURED) return null
  if (!verb) {
    if (IS_DEV) console.warn('[xAPI] Unknown verb:', verbKey)
    return null
  }
  if (!who) {
    // Before the welcome form there is no actor yet. Hold the statement with
    // the time it actually happened; initActor() flushes the queue.
    if (pending.length < PENDING_MAX) {
      pending.push({ verbKey, object, opts: { ...opts, ts: opts.ts || new Date().toISOString() } })
    }
    return null
  }
  if (deduped(verbKey)) return null

  const statement = {
    actor: { objectType: who.objectType, name: who.name, account: who.account },
    verb,
    object: { objectType: 'Activity', ...object },
    timestamp: opts.ts || new Date().toISOString(),
  }

  /* result — only the fields actually provided. */
  const result = {}
  if (opts.response !== undefined) result.response = String(opts.response)
  if (opts.success !== undefined) result.success = !!opts.success
  if (opts.completion !== undefined) result.completion = !!opts.completion
  if (opts.scaled !== undefined) result.score = { scaled: opts.scaled }
  if (opts.duration !== undefined) result.duration = opts.duration
  if (opts.resultExt) result.extensions = opts.resultExt
  if (Object.keys(result).length) statement.result = result

  /* context — parent + grouping, then the actor's age/lang on every
     statement (this is what carries the login data forward), then extras. */
  const parent = PARENTS[opts.node]
  statement.context = {
    contextActivities: {
      ...(parent ? { parent: [parent] } : {}),
      grouping: [GAME_ACTIVITY],
    },
    extensions: { ...who.extensions, ...(opts.ext || {}) },
  }
  // `character` is bookkeeping for this module, not an xAPI extension.
  delete statement.context.extensions.character

  if (IS_DEV) console.log('[xAPI]', verbKey, object?.id, result)

  return fetch(`${ENDPOINT}/statements`, {
    method: 'POST',
    keepalive: !!opts.keepalive,
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH_HEADER,
      'X-Experience-API-Version': '1.0.3',
    },
    body: JSON.stringify(statement),
  })
    .then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
      return r.json()
    })
    .catch((error) => {
      if (IS_DEV) console.error('[xAPI] Failed:', verbKey, error.message)
      return null
    })
}

/* ---- Duration helper: ms → ISO-8601, as ECHO's trackChallengeCompleted. ---- */
export function isoDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `PT${m}M${s}S` : `PT${s}S`
}

/* ---- Room timing: `completed` carries how long the room took. ---- */
const roomStartedAt = {}
export function markRoomStart(nodeId) { roomStartedAt[nodeId] = Date.now() }
export function roomDuration(nodeId) {
  const at = roomStartedAt[nodeId]
  if (!at) return {}
  delete roomStartedAt[nodeId]
  const ms = Date.now() - at
  return { duration: isoDuration(ms), resultExt: { [EXT.durationMs]: ms } }
}

/* ---- One-shot guard, so re-renders and double clicks can't double-send. ---- */
const fired = new Set()
export function once(key, fn) {
  if (fired.has(key)) return null
  fired.add(key)
  return fn()
}
export function resetOnce() { fired.clear() }
