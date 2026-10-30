// Validate DYNAMIC t(`...${id}...`) keys by importing the real id
// lists (gameData) and each room's fragment, then checking membership.
import { readFileSync } from 'node:fs'
import dictionaries from '../src/i18n/dictionaries.js'
const { en } = dictionaries
import { NODES, ITEMS } from '../src/game/gameData.js'
import { ROULETTE_WHEELS, ROULETTE_SEGMENTS } from '../src/game/rouletteData.js'
import { TEST_ITEMS } from '../src/game/testItems.js'

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

// link: flags.<id> (7) + rounds[] (3, each with a/b/c notes)
// Keep this list in sync with FLAG_IDS in rooms/LinkDistrict.jsx — only ids the
// quiz actually renders. ('looksReal' was a decoy that has since been dropped
// from FLAG_IDS and from the imported sheet, so it is no longer required.)
for (const id of ['suffix', 'httpNoS', 'weirdTld', 'homoglyph', 'typo', 'httpsGood', 'lock'])
  ok(has(R.link.flags, id), `rooms.link.flags.${id} missing`)
ok(Array.isArray(R.link.rounds) && R.link.rounds.length === 3, 'rooms.link.rounds should have 3 entries')
for (const [i, r] of (R.link.rounds || []).entries())
  for (const k of ['a', 'b', 'c']) ok(has(r.notes, k), `rooms.link.rounds[${i}].notes.${k} missing`)

// roulette: inspect the same wheel IDs used by the game. Only verdicts are chosen.
for (const wheel of ROULETTE_WHEELS) {
  const prefix = `rooms.roulette.investigation.wheels.${wheel.id}`
  const w = R.roulette.investigation?.wheels?.[wheel.id]
  for (const field of ['name', 'rules', 'feedback'])
    ok(typeof w?.[field] === 'string', `${prefix}.${field} missing`)
  ok(Array.isArray(w?.segments) && w.segments.length === ROULETTE_SEGMENTS, `${prefix}.segments must contain eight labels`)
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

// --- xAPI test-item slugs must track story.rounds (game/testItems.js) ---
// These name the pre/post-test questions and answers in the LRS, in English.
// If a question or option is added, reordered or removed in the sheet without
// updating testItems.js, statements would be filed under the wrong item.
ok(TEST_ITEMS.length === en.story.rounds.length,
  `testItems.js has ${TEST_ITEMS.length} items but story.rounds has ${en.story.rounds.length}`)
for (const [i, round] of en.story.rounds.entries()) {
  const item = TEST_ITEMS[i]
  if (!item) continue
  ok(item.slug && item.name, `testItems[${i}] needs a slug and a name`)
  for (const option of round.options)
    ok(has(item.options, option.k),
      `testItems[${i}] (${item.slug}) has no slug for option ${option.k}`)
  const correct = round.options.filter((o) => o.correct === true)
  ok(correct.length === 1, `story.rounds[${i}] should have exactly one correct option, has ${correct.length}`)
}
const slugs = TEST_ITEMS.map((t) => t.slug)
ok(new Set(slugs).size === slugs.length, 'testItems.js slugs must be unique')
for (const [i, item] of TEST_ITEMS.entries()) {
  const vals = Object.values(item.options || {})
  ok(new Set(vals).size === vals.length, `testItems[${i}] (${item.slug}) has duplicate option slugs`)
}

if (problems.length) {
  console.log(`❌ ${problems.length} dynamic-key problems:`)
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
} else {
  console.log('✅ Dynamic i18n namespaces (nodes, items, and all room collections) look consistent.')
}
