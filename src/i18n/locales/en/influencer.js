/* Influencer Avenue (Puzzle 2) strings.

   Structural data (post handles, hues, correctLabel answer keys, product
   verdicts, hints) lives in the component; all display text comes from here.
   The PAID / COLLAB / GIFTED answer keys stay in component logic — the copy
   below is display only. */
export default {
  intro:
    'A neon avenue of billboards and influencer feeds. Read past the gloss: label the sponsorships, then check what the products really are.',
  solvedTitle: 'Influencer Avenue cleared — Data Report obtained 📄',
  solvedText:
    'You exposed the hidden ads and the fake product photo. The highlighted digits on the Data Report — 748392 — open the Algorithm Control Room next.',

  evidenceLabel:
    'The posts hid paid promotions, and the product photo was AI-generated with zero real results.',

  /* ---- Stage 1: content labelling ---- */
  stage1: {
    badge: 'Stage 1 / 2',
    tag: 'Content labelling',
    prompt:
      'Decode each emoji sticky-note, then drag the matching label onto its post: {paid}, {collab} or {gifted}.',
    openDecoder: '🔑 Open Decoder Card',
    verified: 'Verified',
    followersSuffix: 'followers',
    cluesTitle: 'Disclosure clues',
    decodeMe: 'decode me →',
    trayTitle: 'Drag a label onto each post',
    dropPlaceholder: 'drop label',
    correct: '✓ {label}',
    wrong: '✗ wrong label',
    learnLabel: 'Why it matters:',
    learn:
      'sponsored content must be clearly labelled. A #ad, a gifted product, an affiliate link or a discount code all signal advertising — even when it is dressed up as a personal recommendation.',
    hint: 'Tap or drag a label chip, then drop it on the matching post.',
  },

  /* Display copy for the PAID / COLLAB / GIFTED labels. */
  labels: {
    paid: 'PAID',
    collab: 'COLLAB',
    gifted: 'GIFTED',
  },

  posts: [
    {
      caption: 'my forever glow routine 💧 use code LUNA20',
      product: 'skincare serum',
      clues: [
        'Discount code “LUNA20” in the caption',
        'Affiliate link in bio',
        'Long-term paid brand ambassador',
      ],
    },
    {
      caption: 'new flavour drop with the team 🔋 #ad',
      product: 'energy drink',
      clues: [
        'Tagged the brand as a creative partner',
        'Co-designed the flavour together',
        '“#ad” — worked jointly on the launch',
      ],
    },
    {
      caption: 'sent this shaker to try 🎁 thoughts?',
      product: 'protein shaker',
      clues: [
        'Received the product for free',
        'No payment, no discount code',
        '“gifted” disclosure in the corner',
      ],
    },
  ],

  /* ---- Stage 2: product legitimacy ---- */
  stage2: {
    stage1Cleared: 'Stage 1 cleared ✓',
    badge: 'Stage 2 / 2',
    tag: 'Product legitimacy',
    prompt:
      'These sellers all claim their products are “real”. Run a reverse image search on each photo, then classify what it actually is.',
    runSearch: '🔍 Run reverse image search',
    resultTitle: 'Search result',
    errRunAll: 'Run the reverse image search on every product before classifying it.',
    errClassifyAll: 'Classify all three products first.',
    errWrong: 'One or more classifications are wrong. Re-read what each search returned.',
    learnLabel: 'Real tool, real habit:',
    learn:
      'a reverse image search checks whether a “handmade”, “unique” or “real” product photo is actually stolen, mass-produced across dozens of dropshipping stores, or AI-generated. No results at all can mean the image is fake.',
    hint: 'Search first, then classify all three.',
    confirm: 'Confirm classifications →',
  },

  products: [
    {
      name: '“Handmade ceramic mug”',
      result: '1,240+ identical listings on 12 dropshipping sites.',
      hint: 'The exact same photo appears on dozens of cheap stores.',
    },
    {
      name: '“NovaPad X” promo shot',
      result: '0 results found anywhere.',
      hint: 'A real product photo shows up somewhere. Zero matches is a red flag.',
    },
    {
      name: 'Local bakery cupcakes',
      result: '3 consistent results, all the same small business.',
      hint: 'Matches trace back to one genuine local bakery.',
    },
  ],

  classify: {
    mass: 'Mass-produced (fake “handmade”)',
    ai: 'AI-generated / fake',
    legit: 'Legit',
  },

  /* ---- Emoji Decoding Card modal ---- */
  decoder: {
    title: '🔑 Emoji Decoding Card',
    noCard: 'You would normally have earned this card back in Link District — here it is anyway.',
    help: 'Match each emoji on a sticky-note to its letter to read the hidden label.',
  },
}
