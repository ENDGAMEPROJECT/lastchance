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
    feedbackTitle: 'Equation solved: why this ad?',
    badge: 'Targeting engine · solve every equation',
    prompt:
      'Each row is a person. Fill the empty slot so the machine can output the ad it would show them.',
    resultCol: '→ Targeted ad',
    adFlag: 'AD ACTIVATED',
    slotPlaceholder: '＋ drop tile',

    /* One-equation-at-a-time flow */
    stepBadge: 'Equation {n} / {total}',
    profileBadge: 'Profile complete',
    dragHint: 'Drag the missing factor into the equation — the one that fits this exact person.',
    wrongHint: 'That factor doesn’t fit this person. Look at what the ad is really selling.',
    nextBtn: 'Next equation →',
    lastBtn: 'See {friend}’s profile →',
    trayLabel: 'DATA TILES — drag one into each empty slot (or tap a tile, then tap a slot)',
    runBtn: '⚡ Run the algorithm',
    fillHint: 'Fill every slot, then run the algorithm.',
    wrongBanner: 'The algorithm rejected some inputs. Fix the rows marked in red and run it again.',

    /* Control-room stations (RoomNav) */
    navHint: 'Use ◀ ▶ or the arrow keys to move around the control room.',
    navMainframe: 'Mainframe',
    navDataWall: 'Data Wall',
    navTerminal: 'Ad Terminal',
    dataWallTitle: 'DATA-BROKER · LIVE FEED',
    dataWallSub: 'Everything the machine already bought about {friend}:',
    dataWallFeed: [
      'AGE — 15',
      'FOLLOWS — gaming · new tech · fitness',
      'SEARCHED — “NovaPad X cheapest”',
      'LOCATION — home + school, daily',
      'SCREEN TIME — 6.2 h / day',
      'INSECURITY FLAGS — fitting in · FOMO',
      'PAYMENT — card on file ✓',
    ],
    terminalTitle: 'AD-OUTPUT TERMINAL',
    terminalIdle: 'Awaiting profile… assemble the equations at the Mainframe, then run the algorithm.',
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

  /* Column headings (order matches COLS in the component):
     Demographic → Follows / likes → Insecurities. */
  cols: ['Demographic', 'Follows / likes', 'Insecurities'],

  /* Per-row labels: keyed by row id, joined to ROWS in the component.
     `ad` is the targeted-ad label; `slots` holds the locked (non-blank)
     factor labels keyed by column index. */
  rows: {
    r1: {
      feedbackData: "Why a skincare cream? This profile combines a teenage girl, an interest in beauty influencers and a worry about her skin. A cream promising perfect skin is chosen because it offers a solution to that specific worry.",
      feedbackLesson: "How does the algorithm build this profile? It can combine age entered at sign-up with followed accounts, likes and time spent on skincare videos. It uses that activity to infer an interest in skin products and select an ad designed to turn that interest into a purchase.",
      ad: 'Miracle skincare cream',
      slots: { 0: 'Girl, 13–17', 1: 'Follows beauty influencers' },
      explain:
        'A 13-year-old who follows beauty accounts and worries about her skin is served a “miracle” cream. The algorithm didn’t guess — it matched her age and her follows to an insecurity, then sold straight to it.',
    },
    r2: {
      feedbackData: "Why a muscle-gain supplement? This person follows fitness influencers and feels too skinny. The ad promises bigger muscles: exactly the change he wants. His age range also helps place him in the audience the advertiser wants to reach.",
      feedbackLesson: "The algorithm can use account details, followed fitness pages and interactions with workout content to build an advertising profile. In this equation, the supplement is matched to that profile because its promise of more muscle appeals to his concern about being skinny.",
      ad: 'Muscle-gain supplement',
      slots: { 1: 'Follows fitness influencers', 2: 'Insecure about being skinny' },
      explain:
        'A teen boy who follows fitness pages and feels too skinny is handed a muscle-gain supplement. His insecurity is the exact reason the ad reached him.',
    },
    r3: {
      feedbackData: "Why a baldness cream? The decisive clue is his worry about losing hair. A product promising to stop hair loss speaks directly to that concern. Following tech channels is part of his profile, but the hair-loss concern explains this particular ad.",
      feedbackLesson: "For example, clicks on hair-loss products or repeated views of related content can suggest that concern. An algorithm can use these recorded actions to put someone in an audience for hair-loss ads. The advertiser then offers a supposed solution to the worry.",
      ad: 'Baldness cream',
      slots: { 0: 'Man, 25–35', 1: 'Follows tech channels' },
      explain:
        'A man who fears going bald — flagged by his age and browsing — is shown a baldness “cure”. Same recipe: a private worry turned into a target.',
    },
    r4: {
      feedbackData: "Why weight-loss pills? This person follows diet and lifestyle pages and worries about her weight. The ad offers weight loss as a quick solution, linking the product to both her interests and her concern about her body.",
      feedbackLesson: "Following diet pages, liking weight-loss posts and watching related videos can feed an advertising profile. The algorithm uses those traces to select a matching ad. That is the mechanism behind personalised advertising: your activity helps decide which sales pitch you see.",
      ad: 'Weight-loss pills',
      slots: { 0: 'Woman, 30–45', 2: 'Insecure about her weight' },
      explain:
        'A woman who follows diet pages and feels bad about her weight is aimed at with weight-loss pills. The feed she scrolls quietly feeds the very fear it then sells to.',
    },
  },

  /* Tray tile labels, keyed by tile id (joined to TRAY in the component). */
  tiles: {
    't-skin': 'Insecure about her skin',
    't-boy': 'Boy, 15–25',
    't-bald': 'Worried about going bald',
    't-diet': 'Follows diet & lifestyle pages',
    // demographic distractors
    't-retiree': 'Retired, 65+',
    't-tween': 'Kid, 8–12',
    't-gran': 'Woman, 60+',
    't-dad': 'Dad, in his 40s',
    // follows distractors
    't-pets': 'Follows pet accounts',
    't-gamer': 'Follows gaming channels',
    't-cook': 'Follows cooking pages',
    't-travel': 'Follows travel bloggers',
    // insecurity distractors
    't-money': 'Anxious about money',
    't-lonely': 'Afraid of being left out',
    't-height': 'Self-conscious about height',
    't-teeth': 'Worried about their teeth',
  },
}
