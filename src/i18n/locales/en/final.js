/* Final Decision (finale) strings.
   {friend} and {product} are interpolated from NARRATIVE. */
export default {
  intro: '{friend}\'s thumb is on "Buy Now" for {product}. Present the evidence you gathered and talk them down.',
  solvedTitle: '{friend} is convinced — close the deal',
  solvedText: 'Present your case and end the run.',

  /* Max's per-evidence reactions, keyed by evidence id. */
  replies: {
    'ev-links': '“Wait… the link wasn\'t even the real store? I didn\'t look at the address.”',
    'ev-roulette': '“The spin-to-win wheel was rigged? I thought I got lucky…”',
    'ev-influencer': '“So that influencer was paid and the photo was AI? It looked so real.”',
    'ev-algo': '“They targeted me on purpose? That\'s why it kept following me around.”',
    'ev-ads': '“Hidden €59 a month?! The ad only ever showed me the 90% off.”',
    'ev-persuasion': '“\'Today only\', \'2 left\'… it was all just pressure tricks on me.”',
    generic: '“Huh… okay, that one actually makes me stop and think.”',
  },

  /* {friend}'s escalating pushback while still unconvinced. */
  pushback: [
    '“Come on, it\'s 90% off — TODAY ONLY. If I wait, it\'s gone!”',
    '“Okay, but… everybody in the group chat is buying it. It has 12k reviews!”',
    '“Alright, alright, maybe. But the timer says 4 minutes left…”',
  ],

  convincedLine: '“…okay. I\'m not buying it. Thanks for stopping me — I nearly clicked it.”',

  /* Fallback arguments used only when no field evidence was collected. */
  fallbackArguments: [
    'The store link is a look-alike domain, not the official shop.',
    'A 90%-off "today only" price is the classic too-good-to-be-true bait.',
    'The real cost is hidden — a small "subscription" buried in the fine print.',
    'Countdown timers and "only 2 left" are manufactured pressure, not facts.',
  ],

  moodHyped: 'HYPED',
  moodConvinced: 'convinced',

  doubtLabel: '{friend}\'s doubt',
  doubtConvinced: ' · convinced',

  deckTitle: 'Make your case',
  deckFallback: 'No field evidence on record — argue from the fundamentals below.',
  deckEvidence: 'These are the clues you collected across the Physical Internet.',
  deckSelect: 'Select the arguments to present ({chosen}/{required} minimum).',

  actionsReady: 'Strong case. Hit them with it.',
  actionsNeed: 'Stack at least {required} arguments before you confront {friend}.',
  convinceButton: '🛑 Convince {friend}',

  learnLabel: 'The real defence:',
  learnPre: 'no single trick catches every scam — slowing down does. Before you buy, stack the checks: read the ',
  learnUrl: 'URL',
  learnMid1: ', look for the ',
  learnDisclosure: 'disclosure',
  learnMid2: ', find the ',
  learnPrice: 'true price',
  learnMid3: ', and name the ',
  learnPressure: 'pressure tactic',
  learnPost: '. Evidence beats urgency every time.',
}
