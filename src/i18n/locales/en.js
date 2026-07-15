/* English locale. This is the single source of truth for all
   user-facing copy. To add a language, copy this file and translate
   the values (keep the keys), then register it in ../index.jsx.

   Per-room copy lives in ./en/<room>.js fragments and is composed
   under `rooms.*` below, so each room's text can be edited in one
   focused file. */

import link from './en/link.js'
import roulette from './en/roulette.js'
import influencer from './en/influencer.js'
import algorithm from './en/algorithm.js'
import ads from './en/ads.js'
import persuasion from './en/persuasion.js'
import final from './en/final.js'

export default {
  common: {
    continue: 'Continue →',
    submit: 'Submit',
    enter: 'Enter',
    next: 'Next',
    locked: 'Locked',
    cleared: '✓ Cleared',
    enterNode: '▶ Enter',
    back: 'Back',
    close: 'Close',
  },

  welcome: {
    eyebrow: 'Player Setup',
    titleLead: 'LAST CHANCE',
    titleAccent: 'TO ESCAPE',
    tagline: '// an escape room about ads, scams & fraudulent websites',
    subtitle: 'Set up your player, then jack into the Physical Internet.',
    aliasLabel: 'Choose an alias',
    aliasPlaceholder: 'e.g. Ne0nRunner',
    ageLabel: 'Your age',
    agePlaceholder: 'e.g. 14',
    languageLabel: 'Language',
    start: '⏻ Enter',
    aliasError: 'Enter an alias to continue.',
    ageError: 'Enter a valid age (1–120).',
  },

  hud: {
    logo: 'LAST CHANCE TO ESCAPE',
    expires: 'offer expires in',
    tminus: 'T-MINUS',
    map: '🗺 Map',
    bag: '🎒 Bag',
    inventoryTitle: 'Inventory & Evidence',
    tools: 'Tools & Rewards',
    noTools: 'Nothing collected yet. Solve puzzles to earn tools.',
    evidenceHeading: 'Evidence on the deal',
    noEvidence: 'Collect proof in each district to convince {friend} at the end.',
  },

  intro: {
    eyebrow: 'Educational Escape Room',
    titleLead: 'THE',
    titleAccent: 'PHYSICAL INTERNET',
    tagline: '// ads · scams · fraudulent websites — decoded',
    situationTitle: 'The situation',
    hook:
      'Your friend {friend} just found a viral deal on {product} — 90% off, "today only". ' +
      'It looks incredible… which is exactly why you think it is a scam.',
    context:
      'To show {friend} how scams and advertising really work, you both jack into a physical version of ' +
      'the Internet — a neon city where shops, social platforms and ads become districts you can walk through.',
    clock: '⏱ {minutes}:00 on the clock',
    mission:
      'You have {minutes} minutes — the time before the offer expires — to travel through the Physical Internet, ' +
      'gather evidence about how ads and scams work, and convince {friend} not to buy. If the timer hits zero, {friend} buys it.',
    steps: [
      { title: '1 · Explore', text: 'Four districts, two corridors. Each teaches one trick advertisers use.' },
      { title: '2 · Gather', text: 'Earn tools and evidence. Track them in your Bag and on the Map.' },
      { title: '3 · Convince', text: 'Reach the Final Decision and use your evidence before time runs out.' },
    ],
    start: '⏻ Jack in — start the clock',
    pretest: 'Pre-test: first, tell {friend} what you already think about this deal. Then enter the Internet.',
  },

  map: {
    eyebrow: 'Physical Internet · District Map',
    titleLead: 'Choose your next',
    titleAccent: 'district',
    subtitle: 'Travel the network, gather evidence, and reach the Final Decision before the offer expires.',
    start: '▶ START · Pre-test with {friend}',
    lockedTip: 'Locked — finish the previous district',
  },

  roomframe: {
    clearedDefaultTitle: 'District cleared',
    clearedDefaultText: 'Nice work. The next node is unlocked on the map.',
  },

  end: {
    win: {
      eyebrow: 'Mission Complete',
      titleLead: '{friend}',
      titleAccent: "DIDN'T BUY IT",
      tag: '// offer expired with {time} to spare',
      heading: 'You made the case',
      body:
        'With the evidence you gathered across the Physical Internet, you showed {friend} how {product} was ' +
        'engineered to feel irresistible — fake links, rigged wheels, undisclosed sponsorships, algorithmic ' +
        'targeting and pure persuasion. {friend} closed the tab.',
      evidenceHeading: 'Evidence presented',
      posttest:
        'Post-test: talk to {friend} again. What did you learn about spotting scams, disclosure, and why ' +
        '"too good to be true" usually is?',
      again: '↻ Play again',
    },
    lose: {
      eyebrow: 'Time Expired',
      titleLead: '{friend}',
      titleAccent: 'HIT "BUY NOW"',
      tag: '// the countdown reached zero',
      heading: 'The offer got them first',
      body:
        'Before you could finish gathering proof, the fake "today only" countdown did its job and {friend} ' +
        'bought {product}. That urgency was the whole trick.',
      lessonLabel: 'Lesson:',
      lesson:
        'artificial urgency ("only 3 left!", "offer ends in 5:00") is designed to stop you from thinking. ' +
        'Slow down — a real deal will still be there tomorrow.',
      again: '↻ Try again',
    },
  },

  /* Node display text (map cards + room headers pull from here). */
  nodes: {
    'link-district': {
      title: 'Link District',
      subtitle: 'Puzzle 1 · Fraudulent Links',
      blurb: 'A router-block of doors. Only one URL is the real store — block the fakes.',
      kind: 'puzzle',
    },
    'roulette-corridor': {
      title: 'Roulette Corridor',
      subtitle: 'Corridor · Gamified Bait',
      blurb: 'Prize wheels that always win. Prove they are rigged to pass.',
      kind: 'corridor',
    },
    'influencer-avenue': {
      title: 'Influencer Avenue',
      subtitle: 'Puzzle 2 · Labels & Fakes',
      blurb: 'Decode the sponsorship labels, then check which products are actually real.',
      kind: 'puzzle',
    },
    'algorithm-room': {
      title: 'Algorithm Control Room',
      subtitle: 'Puzzle 3 · Personalization',
      blurb: 'Feed the targeting equations to see how the algorithm profiles a person.',
      kind: 'puzzle',
    },
    'ads-corridor': {
      title: 'Ads Corridor',
      subtitle: 'Corridor · The Truth Behind',
      blurb: 'Shine the Truth Light on the posters to read what the ad really says.',
      kind: 'corridor',
    },
    'persuasion-room': {
      title: 'Persuasion Lab',
      subtitle: 'Puzzle 4 · Persuasion Techniques',
      blurb: 'Frame each ad with the trick it uses. Reveal the letters, form the password.',
      kind: 'puzzle',
    },
    'final-decision': {
      title: 'Final Decision',
      subtitle: 'Convince {friend}',
      blurb: 'Present your evidence before the offer countdown runs out.',
      kind: 'final',
    },
  },

  /* Inventory item display text (keyed by item id). */
  items: {
    emojiCard: {
      name: 'Emoji Decoding Card',
      desc: 'A key that maps emojis to letters. Use it to read the sponsorship sticky-notes in Influencer Avenue.',
    },
    dataReport: {
      name: 'Data Report on {friend}',
      desc: 'A dossier of the data brokers hold on {friend}. The highlighted digits open the Algorithm Control Room.',
    },
    truthLight: {
      name: 'Truth Flashlight',
      desc: 'Reveals the fine print hidden behind glossy ad posters.',
    },
  },

  /* Per-room copy, composed from ./en/<room>.js fragments.
     Keys are namespaced by room, e.g. rooms.link.*  */
  rooms: { link, roulette, influencer, algorithm, ads, persuasion, final },
}
