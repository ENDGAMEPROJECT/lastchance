/* ============================================================
   GAME DATA — the node graph, narrative, and all puzzle content.
   Rooms import the slices they need from here so content stays
   editable in one place.
   ============================================================ */

import { settings } from './settings.js'

/* Same value as the countdown, so the story text always matches the timer. */
export const GAME_MINUTES = settings.timerMinutes

export const NARRATIVE = {
  friend: 'Max',
  player: 'Mia',
  product: 'the "NovaPad X" tablet',
  hook:
    'Your friend Max just found a viral deal on the NovaPad X — 90% off, "today only". ' +
    'It looks incredible… which is exactly why you think it is a scam.',
  mission:
    'You have ' + GAME_MINUTES + ' minutes — the time before the offer expires — to travel through the Physical Internet, ' +
    'gather evidence about how ads and scams work, and convince Max not to buy. If the timer hits zero, Max buys it.',
}

/* Node graph. Order = travel order along the map path.
   type: 'puzzle' | 'corridor' | 'final'
   component: key resolved in App.jsx ROOMS map. */
export const NODES = [
  {
    id: 'link-district',
    index: 1,
    kind: 'puzzle',
    title: 'Link District',
    subtitle: 'Puzzle 1 · Fraudulent Links',
    blurb: 'A router-block of doors. Only one URL is the real store — block the fakes.',
    component: 'LinkDistrict',
    accent: 'cyan',
  },
  {
    id: 'roulette-corridor',
    index: 2,
    kind: 'corridor',
    title: 'Roulette Corridor',
    subtitle: 'Corridor · Gamified Bait',
    blurb: 'Prize wheels that always win. Prove they are rigged to pass.',
    component: 'RouletteCorridor',
    accent: 'magenta',
  },
  {
    id: 'influencer-avenue',
    index: 3,
    kind: 'puzzle',
    title: 'Influencer Avenue',
    subtitle: 'Puzzle 2 · Labels & Fakes',
    blurb: 'Decode the sponsorship labels, then check which products are actually real.',
    component: 'InfluencerAvenue',
    accent: 'purple',
  },
  {
    id: 'algorithm-room',
    index: 4,
    kind: 'puzzle',
    title: 'Algorithm Control Room',
    subtitle: 'Puzzle 3 · Personalization',
    blurb: 'Feed the targeting equations to see how the algorithm profiles a person.',
    component: 'AlgorithmRoom',
    accent: 'cyan',
  },
  {
    id: 'ads-corridor',
    index: 5,
    kind: 'corridor',
    title: 'Ads Corridor',
    subtitle: 'Corridor · The Truth Behind',
    blurb: 'Shine the Truth Light on the posters to read what the ad really says.',
    component: 'AdsCorridor',
    accent: 'amber',
  },
  {
    id: 'persuasion-room',
    index: 6,
    kind: 'puzzle',
    title: 'Persuasion Lab',
    subtitle: 'Puzzle 4 · Persuasion Techniques',
    blurb: 'Frame each ad with the trick it uses. Reveal the letters, form the password.',
    component: 'PersuasionRoom',
    accent: 'magenta',
  },
  // The finale is now the post-test conversation (see FinalDecision),
  // reached when the last district is cleared or the countdown ends.
]

/* Reward / inventory items (added as puzzles are solved). */
export const ITEMS = {
  emojiCard: {
    id: 'emojiCard',
    image: 'objects/emoji-decoding-card.png',
    name: 'Emoji Decoding Card',
    icon: '🔑',
    desc: 'A key that maps emojis to letters. Use it to read the sponsorship sticky-notes in Influencer Avenue.',
  },
  // The report is about the FRIEND, so it depends on who the player is: the
  // shown name/desc come from i18n (items.dataReport, with {friend}) and the
  // image from getNarrative().reportImage (objects/max-report.png or
  // objects/mia-report.png). No fixed image here on purpose.
  dataReport: {
    id: 'dataReport',
    name: 'Data Report on {friend}',
    icon: '📄',
    desc: 'A dossier of the data brokers hold on {friend}. The highlighted digits open the Algorithm Control Room.',
  },
  truthLight: {
    id: 'truthLight',
    image: 'objects/flashlight.png',
    name: 'Truth Flashlight',
    icon: '🔦',
    desc: 'Reveals the fine print hidden behind the glossy posters in the Ads Corridor.',
  },
}

/* Emoji → letter keys for the Influencer Avenue sticky-notes, one keypad per
   alphabet: the notes spell the post's label in the player's language
   (rooms.influencer.labels.*). Every keypad uses the same emoji for the
   letters they share; the extra letters take emojis that are already in the
   self-hosted emoji font subset (game/emojiFont.js UNICODE_RANGE), so they are
   drawn the same in every browser.

   Serbian Latin has three digraphs that are single letters (DŽ, LJ, NJ). Each
   is stored as its one-code-point Unicode form (Ǆ, Ǉ, Ǌ) so a word is still one
   character per key; keyLabel() turns them back into two letters for display. */
const LATIN_KEYS = [
  ['🤑', 'A'], ['🎁', 'B'], ['🤝', 'C'], ['⭐', 'D'], ['💰', 'E'], ['🔥', 'F'],
  ['🔋', 'G'], ['💡', 'H'], ['😎', 'I'], ['🎮', 'J'], ['🎯', 'K'], ['👥', 'L'],
  ['✉️', 'M'], ['📈', 'N'], ['✨', 'O'], ['🚀', 'P'], ['💬', 'Q'], ['🔍', 'R'],
  ['💊', 'S'], ['⚡', 'T'], ['🏋️', 'U'], ['🎬', 'V'], ['🌐', 'W'], ['📦', 'X'],
  ['🏆', 'Y'], ['❤️', 'Z'],
]
const latin = Object.fromEntries(LATIN_KEYS.map(([e, l]) => [l, e]))
const key = (letter) => [latin[letter], letter]

export const KEYPADS = {
  latin: LATIN_KEYS,
  // Finnish: A–Z with Ä and Å beside A, and Ö beside O.
  fi: LATIN_KEYS.flatMap((k) => k[1] === 'A' ? [k, ['🎉', 'Ä'], ['🔑', 'Å']]
    : k[1] === 'O' ? [k, ['🧁', 'Ö']] : [k]),
  // Spanish: A–Z with Ñ after N.
  es: LATIN_KEYS.flatMap((k) => k[1] === 'N' ? [k, ['🎒', 'Ñ']] : [k]),
  // Serbian Latin (Gaj's alphabet, in its own order): no Q, W, X, Y.
  sr: [
    key('A'), key('B'), key('C'), ['📢', 'Č'], ['🔗', 'Ć'], key('D'), ['🎥', 'Ǆ'],
    ['🐶', 'Đ'], key('E'), key('F'), key('G'), key('H'), key('I'), key('J'),
    key('K'), key('L'), ['💜', 'Ǉ'], key('M'), key('N'), ['📱', 'Ǌ'], key('O'),
    key('P'), key('R'), key('S'), ['🧠', 'Š'], key('T'), key('U'), key('V'),
    key('Z'), ['🐞', 'Ž'],
  ],
}

/* The keypad for a locale; languages without their own use the A–Z one. */
export const keypadFor = (locale) => KEYPADS[locale] || KEYPADS.latin

/* The digraph letters, as stored (one code point) and as shown. */
const DIGRAPHS = { 'Ǆ': 'DŽ', 'Ǉ': 'LJ', 'Ǌ': 'NJ' }
export const keyLabel = (letter) => DIGRAPHS[letter] || letter

/* Letters a keypad lacks and that Unicode will NOT decompose. NFD turns Ć
   into C + a combining mark, so stripping marks folds accented letters down to
   A–Z on its own. Letters built from a STROKE instead of a mark have no
   canonical decomposition, so they survive NFD and would then be dropped
   silently. Mapped by hand instead (only used when the keypad lacks them). */
const STROKE_LETTERS = {
  'Đ': 'D', 'Ð': 'D', 'Ł': 'L', 'Ø': 'O', 'Æ': 'AE', 'Œ': 'OE', 'Þ': 'TH', 'ẞ': 'SS', 'ß': 'SS',
  'Ǆ': 'DŽ', 'Ǉ': 'LJ', 'Ǌ': 'NJ',
}

/* A localised label as a keypad can spell it. Letters the keypad has are kept
   as they are (Ä on the Finnish one, Ć and the digraphs on the Serbian one);
   anything else has its accents folded away (COLABORACIÓN → COLABORACION) and
   spaces and punctuation go. Checked per language by `npm run check:i18n`: a
   label that folds to nothing (a Cyrillic one would) leaves a stage with no
   solution. */
export function toKeypadWord(label, keypad = KEYPADS.latin) {
  const letters = new Set(keypad.map(([, l]) => l))
  let text = String(label).normalize('NFC').toUpperCase()
  for (const [one, pair] of Object.entries(DIGRAPHS)) {
    if (letters.has(one)) text = text.split(pair).join(one)
  }
  let out = ''
  for (const ch of text) {
    if (letters.has(ch)) { out += ch; continue }
    out += (STROKE_LETTERS[ch] ?? ch).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '')
  }
  return out
}

/* Encode a keypad word back to its emojis. */
export function encodeWord(word, keypad = KEYPADS.latin) {
  const inv = Object.fromEntries(keypad.map(([e, l]) => [l, e]))
  return [...word].map((l) => inv[l] || '·')
}

export const CODES = {
  algorithmRoom: '274181', // shown on the Data Report, entered in Puzzle 3
  adsCorridor: 'SAVE', // revealed under the ad poster
  persuasion: 'FOOLED', // formed from revealed letters in Puzzle 4
  final: '072025',
}
