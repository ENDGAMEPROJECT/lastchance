/* ============================================================
   GAME DATA — the node graph, narrative, and all puzzle content.
   Rooms import the slices they need from here so content stays
   editable in one place.
   ============================================================ */

export const GAME_MINUTES = 30

export const NARRATIVE = {
  friend: 'Max',
  product: 'the "NovaPad X" tablet',
  hook:
    'Your friend Max just found a viral deal on the NovaPad X — 90% off, "today only". ' +
    'It looks incredible… which is exactly why you think it is a scam.',
  mission:
    'You have 30 minutes — the time before the offer expires — to travel through the Physical Internet, ' +
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
  {
    id: 'final-decision',
    index: 7,
    kind: 'final',
    title: 'Final Decision',
    subtitle: 'Convince Max',
    blurb: 'Present your evidence before the offer countdown runs out.',
    component: 'FinalDecision',
    accent: 'green',
  },
]

/* Reward / inventory items (added as puzzles are solved). */
export const ITEMS = {
  emojiCard: {
    id: 'emojiCard',
    name: 'Emoji Decoding Card',
    icon: '🔑',
    desc: 'A key that maps emojis to letters. Use it to read the sponsorship sticky-notes in Influencer Avenue.',
  },
  dataReport: {
    id: 'dataReport',
    name: 'Data Report on Max',
    icon: '📄',
    desc: 'A dossier of the data brokers hold on Max. The highlighted digits open the Algorithm Control Room.',
  },
  truthLight: {
    id: 'truthLight',
    name: 'Truth Flashlight',
    icon: '🔦',
    desc: 'Reveals the fine print hidden behind glossy ad posters.',
  },
}

/* Emoji → letter key. Kept small: only the letters needed for the
   words PAID, COLLAB, GIFTED plus a few decoys. */
export const EMOJI_KEY = {
  '🤑': 'A', '🎁': 'B', '🤝': 'C', '⭐': 'D', '💰': 'E', '🔥': 'F',
  '🔋': 'G', '💡': 'H', '😎': 'I', '🎮': 'J', '🎯': 'K', '👥': 'L',
  '✉️': 'M', '📈': 'N', '✨': 'O', '🚀': 'P', '💬': 'Q', '🔍': 'R',
  '💊': 'S', '⚡': 'T', '🏋️': 'U', '🎬': 'V', '🌐': 'W', '📦': 'X',
  '🏆': 'Y', '❤️': 'Z',
}

/* Convenience: encode a word back to its emoji string using EMOJI_KEY. */
export function encodeWord(word) {
  const inv = Object.fromEntries(Object.entries(EMOJI_KEY).map(([e, l]) => [l, e]))
  return word.toUpperCase().split('').map((l) => inv[l] || '·')
}

export const CODES = {
  algorithmRoom: '748392', // shown on the Data Report, entered in Puzzle 3
  adsCorridor: 'SAVE', // revealed under the ad poster
  persuasion: 'FOOLED', // formed from revealed letters in Puzzle 4
  final: '072025',
}
