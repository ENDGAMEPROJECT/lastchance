/* Algorithm Control Room (Puzzle 3 · targeting algorithm) strings.

   Structural data (row/tile ids, which slot is blank, correctness
   matching) lives in AlgorithmRoom.jsx; only display text is here.
   Rows/tray tiles are arrays that mirror the ROWS/TRAY order in the
   component and are joined by shared id. The access code is compared
   against CODES.algorithmRoom in the component — never stored here. */
export default {
  intro: 'A humming mainframe crunches data into targeted ads. Get inside, then teach it to profile a person.',
  solvedTitle: 'Algorithm Control Room cracked · Evidence logged 🧠',
  solvedText:
    "You watched the machine turn {friend}'s age, interests and insecurities into a single ad. That is not luck — it is a profile.",

  evidence: 'The ad was hand-picked by an algorithm using {friend}’s age, interests and insecurities.',

  /* ---- PHASE: unlock ---- */
  unlock: {
    badge: 'ACCESS · Algorithm Control Room',
    prompt: 'Enter the 6-digit access code to boot the targeting engine.',
    error: 'Access denied — that code is wrong.',
    submit: 'Unlock →',
    skip: 'skip — I don’t have the report',
    hint: 'Hint: the highlighted digits on your Data Report.',
  },

  /* ---- PHASE: choice ---- */
  choice: {
    badge: 'System question · privacy trade-off',
    prompt: 'The mainframe offers you a deal. Which future do you want?',
    optionATag: 'Option A',
    optionABefore: 'See ',
    optionABold: 'fewer, personalised',
    optionAAfter: ' ads — but your personal data is collected.',
    optionBTag: 'Option B',
    optionBBefore: 'See ',
    optionBBold: 'many more',
    optionBAfter: ' ads and ad-breaks — but far less of your data is collected.',
    wrongTitle: 'Wrong answer.',
    wrongText:
      'You just traded your privacy for convenience. “Personalised” is the algorithm — fewer ads means it is collecting and profiling more of your data to pick them.',
    goodTitle: 'Good answer.',
    goodText:
      'More ads is annoying, but you kept your data and partly slipped the personalisation algorithm. Convenience is the bait it uses to make profiling feel like a favour.',
    afterNote: 'Either way, the machine still tries to profile everyone. Let’s see how.',
    continue: 'Enter the targeting engine →',
  },

  /* ---- PHASE: equations ---- */
  equations: {
    badge: 'Targeting engine · solve every equation',
    prompt:
      'Each row is a person. Fill the empty slot so the machine can output the ad it would show them.',
    resultCol: '→ Targeted ad',
    adFlag: 'AD ACTIVATED',
    slotPlaceholder: '＋ drop tile',
    trayLabel: 'DATA TILES — drag one into each empty slot (or tap a tile, then tap a slot)',
    runBtn: '⚡ Run the algorithm',
    fillHint: 'Fill every slot, then run the algorithm.',
    wrongBanner: 'The algorithm rejected some inputs. Fix the rows marked in red and run it again.',
    profileTitle: '▚ PROFILE RECONSTRUCTED ▚',
    profileP1: 'The engine cross-referenced ',
    profileB1: '{friend}’s age',
    profileP2: ' (a teen boy),',
    profileB2: ' his interests',
    profileP3: ' (gaming, new tech, the NovaPad X he keeps searching) and ',
    profileB3: 'his insecurities',
    profileP4:
      ' (fitting in, fear of missing the deal). Out came one perfectly-aimed ad — the exact NovaPad X “90% off” offer. It was never a coincidence {friend} saw it.',
    logEvidence: 'Log this evidence ✓',
    learnTitle: 'How personalised ads work:',
    learnBefore:
      ' the algorithm combines many data points — your age, what you follow, how you behave and even your insecurities — to guess what you’ll click. And beware the trade: “fewer ads” almost always means ',
    learnItalic: 'more of your data collected',
    learnAfter: '.',
  },

  /* Column headings (order matches COLS in the component). */
  cols: ['Age / identity', 'Follows / likes', 'Other data'],

  /* Per-row labels: keyed by row id, joined to ROWS in the component.
     `ad` is the targeted-ad label; `slots` holds the locked (non-blank)
     factor labels keyed by column index. */
  rows: {
    r1: {
      ad: 'Swimsuits on sale',
      slots: { 0: 'Girl, 13–17', 1: 'Follows lifestyle influencers' },
    },
    r2: {
      ad: 'New online game',
      slots: { 1: 'Follows gaming accounts', 2: 'Watches videogame videos' },
    },
    r3: {
      ad: 'Risky "get rich" investment',
      slots: { 0: 'Low income', 1: 'Boy, 15–25' },
    },
    r4: {
      ad: 'Baldness cream',
      slots: { 0: 'Man, 25–35', 2: 'Hours in front of screen' },
    },
  },

  /* Tray tile labels, keyed by tile id (joined to TRAY in the component). */
  tiles: {
    't-beach': 'Liked beach photos',
    't-boy': 'Boy, 15–25',
    't-crypto': 'Follows crypto influencers',
    't-tech': 'Technology enthusiast',
    't-pets': 'Follows pet accounts',
    't-retiree': 'Woman, 65+',
  },
}
