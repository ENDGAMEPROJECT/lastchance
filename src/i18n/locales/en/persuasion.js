/* Persuasion Lab (Puzzle 4 · Persuasion Techniques) strings.

   Structural data (poster ids, hidden letters, tints, the FOOLED answer
   that lives in CODES.persuasion) stays in the component. Only display
   text lives here. Posters and technique frames are arrays; correctness
   is matched on stable ids in the component, never on these labels. */
export default {
  intro:
    'A gallery of glossy ads. Each one leans on a single persuasion trick — name it by framing the poster.',
  solvedTitle: 'Persuasion Lab cleared — password FOOLED',
  solvedText:
    'Once you can name the trick — FOMO, urgency, a borrowed celebrity — it stops working on you. That is the whole defence.',

  /* Match phase. */
  learn: {
    lead: 'Spot the trick.',
    body:
      'Ads persuade with named techniques: FOMO (fear of missing out), social proof ("everyone\'s buying it"), exaggeration, influencer endorsement, emotional appeal and urgency. Real campaigns often stack several of these at once to slip past your judgement.',
  },
  trayLabel: 'TECHNIQUE FRAMES',

  hints: {
    start: 'Drag a technique frame onto the poster it fits — or tap the frame, then tap the poster.',
    allDone: 'All six framed — the letters spell a password. Head to the terminal.',
    correct: 'Correct — a letter surfaced. Keep framing the rest.',
    wrong: 'That technique does not match this ad. Frame returned — try another.',
  },
  dragHint: 'Drag onto its poster',

  count: 'Framed {matched} / {total}',

  /* Poster headlines & subtitles, in fixed display order (ids in component). */
  posters: [
    { headline: 'ONLY 3 LEFT IN STOCK!', sub: "Don't miss out!" },
    { headline: 'Over 2 MILLION people already bought this!', sub: 'Join the crowd.' },
    { headline: 'Lose 10kg in just 3 DAYS — guaranteed miracle!', sub: 'Results not typical.' },
    { headline: "As seen on @StarCeleb's page — she LOVES it!", sub: '#ad' },
    { headline: "Don't let your family down.", sub: 'They deserve better.' },
    { headline: "OFFER ENDS IN 04:59 — buy NOW before it's gone!", sub: 'Tick, tock…' },
  ],

  /* Technique frame labels, keyed by stable poster id. */
  techniques: {
    fomo: 'FOMO',
    social: 'Social Proof',
    exagg: 'Exaggeration',
    influencer: 'Influencer Endorsement',
    emotional: 'Emotional Appeal',
    urgency: 'Urgency',
  },

  /* Password phase. */
  passwordLearn: {
    lead: 'Named and disarmed.',
    body:
      'Six posters, six tricks. The letters they hid, read left to right, are the exit password — proof you saw through every one.',
  },
  termBar: 'PERSUASION-LAB · EXIT TERMINAL',
  termPrompt: '> Enter the password formed by the revealed letters:',
  termLocked: 'Frame all six posters to reveal the password letters.',
  termPlaceholder: 'type the password',
  termInputLabel: 'Exit password',
  unlock: 'Unlock →',
  pwError: 'Access denied. Read the glowing letters in poster order and try again.',

  hiddenLetter: 'hidden letter {letter}',

  evidence: 'Every poster used a named persuasion trick — FOMO, social proof, urgency and more.',
}
