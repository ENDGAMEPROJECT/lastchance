// Validate DYNAMIC t(`...${id}...`) keys by importing the real id
// lists (gameData) and each room's fragment, then checking membership.
import { readFileSync } from 'node:fs'
import en from '../src/i18n/locales/en.js'
import { NODES, ITEMS } from '../src/game/gameData.js'
import { ROULETTE_WHEELS, ROULETTE_SEGMENTS } from '../src/game/rouletteData.js'

const problems = []
const ok = (cond, msg) => { if (!cond) problems.push(msg) }
const has = (obj, k) => obj != null && Object.prototype.hasOwnProperty.call(obj, k)

// --- Shell: nodes.<id>.{title,subtitle,blurb,kind} (GameMap + RoomFrame) ---
// 'start' and 'final-decision' are map-only stations (no NODES entry), but the
// map labels them through the same nodes.<id>.title lookup.
for (const id of ['start', ...NODES.map((n) => n.id), 'final-decision']) {
  const node = en.nodes[id]
  ok(node, `nodes.${id} missing`)
  for (const f of ['title', 'subtitle', 'blurb', 'kind']) ok(node && has(node, f), `nodes.${id}.${f} missing`)
}

// --- Shell: items.<id>.{name,desc} (HUD bag) ---
for (const id of Object.keys(ITEMS)) {
  const it = en.items[id]
  ok(it, `items.${id} missing`)
  for (const f of ['name', 'desc']) ok(it && has(it, f), `items.${id}.${f} missing`)
}

// --- Helper: pull single-quoted `id: '...'` values from a room file ---
const idsIn = (file) => {
  const src = readFileSync(file, 'utf8')
  const out = []
  const re = /\bid:\s*'([\w-]+)'/g
  let m
  while ((m = re.exec(src))) out.push(m[1])
  return [...new Set(out)]
}

// --- Room-by-room dynamic namespaces ---
const R = en.rooms

// link: flags.<id> (8) + rounds[] (3, each with a/b/c notes)
for (const id of ['suffix', 'httpNoS', 'weirdTld', 'homoglyph', 'typo', 'httpsGood', 'lock', 'looksReal'])
  ok(has(R.link.flags, id), `rooms.link.flags.${id} missing`)
ok(Array.isArray(R.link.rounds) && R.link.rounds.length === 3, 'rooms.link.rounds should have 3 entries')
for (const [i, r] of (R.link.rounds || []).entries())
  for (const k of ['a', 'b', 'c']) ok(has(r.notes, k), `rooms.link.rounds[${i}].notes.${k} missing`)

// roulette: inspect the same wheel IDs and answer IDs used by the game.
for (const wheel of ROULETTE_WHEELS) {
  const prefix = `rooms.roulette.investigation.wheels.${wheel.id}`
  const w = R.roulette.investigation?.wheels?.[wheel.id]
  for (const field of ['name', 'rules', 'feedback'])
    ok(typeof w?.[field] === 'string', `${prefix}.${field} missing`)
  ok(Array.isArray(w?.segments) && w.segments.length === ROULETTE_SEGMENTS, `${prefix}.segments must contain eight labels`)
  for (const id of wheel.options)
    ok(typeof w?.options?.[id] === 'string', `${prefix}.options.${id} missing`)
}
for (const verdict of ['rigged', 'fair'])
  ok(typeof R.roulette.investigation?.verdicts?.[verdict] === 'string', `roulette verdict ${verdict} missing`)
for (const field of ['context', 'prompts', 'items'])
  ok(has(en.hints.room.rouletteInvestigation, field), `hints.room.rouletteInvestigation.${field} missing`)

// algorithm: tiles.<id>, rows.<id>.{slots,ad}
ok(R.algorithm.tiles && Object.keys(R.algorithm.tiles).length > 0, 'rooms.algorithm.tiles empty')
ok(R.algorithm.rows && Object.keys(R.algorithm.rows).length > 0, 'rooms.algorithm.rows empty')
for (const id of idsIn('src/rooms/AlgorithmRoom.jsx').filter((id) => /^r\d+$/.test(id))) {
  ok(typeof R.algorithm.rows?.[id]?.feedbackLesson === 'string', `rooms.algorithm.rows.${id}.feedbackLesson missing`)
}

// persuasion: techniques.<id> + posters[]
ok(R.persuasion.techniques && Object.keys(R.persuasion.techniques).length === 6, 'rooms.persuasion.techniques should have 6')
ok(Array.isArray(R.persuasion.posters) && R.persuasion.posters.length === 6, 'rooms.persuasion.posters should have 6')

// influencer: posts[], products[], classify.<value>
ok(Array.isArray(R.influencer.posts) && R.influencer.posts.length === 3, 'rooms.influencer.posts should have 3')
ok(Array.isArray(R.influencer.products) && R.influencer.products.length === 3, 'rooms.influencer.products should have 3')
ok(R.influencer.classify && Object.keys(R.influencer.classify).length >= 3, 'rooms.influencer.classify looks empty')

// ads: posters[]
ok(Array.isArray(R.ads.posters) && R.ads.posters.length >= 2, 'rooms.ads.posters should have >=2')

if (problems.length) {
  console.log(`❌ ${problems.length} dynamic-key problems:`)
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
} else {
  console.log('✅ Dynamic i18n namespaces (nodes, items, and all room collections) look consistent.')
}
