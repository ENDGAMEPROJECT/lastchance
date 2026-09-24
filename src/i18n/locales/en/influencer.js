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
    'You exposed the hidden ads and the fake product photo. The highlighted digits on the Data Report — 274181 — open the Algorithm Control Room next.',

  evidenceLabel:
    'The posts hid paid promotions, and the product photo was AI-generated with zero real results.',

  /* ---- Stage 1: content labelling ---- */
  stage1: {
    badge: 'Stage 1 / 2',
    tag: 'Content labelling',
    prompt:
      'Decode the hidden sponsorship on each post with your Emoji Decoding Card.',
    selectPost: 'Select {name}',
    openDecoder: '🔑 Open Decoder Card',
    verified: 'Verified',
    followersSuffix: 'followers',
    cluesTitle: 'Disclosure clues',
    decodeMe: 'decode me →',
    correct: '✓ {label}',
    wrong: '✗ wrong label',
    learnLabel: 'Why it matters:',
    learn:
      'sponsored content must be clearly labelled. A #ad, a gifted product, an affiliate link or a discount code all signal advertising — even when it is dressed up as a personal recommendation.',
    hint: 'Open the Emoji Decoding Card from your bag, select a post and enter its hidden word one letter at a time.',
  },

  /* Display copy for the PAID / COLLAB / GIFTED labels. */
  labels: {
    paid: 'PAID',
    collab: 'COLLAB',
    gifted: 'GIFTED',
    nothing: 'NOTHING'
  },

  posts: [
    {
      "caption": "“Morning training feels so much better with GlowFuel. I’ve been using it before my workouts and I’m honestly obsessed. Use my code MIRA20 for 20% off your first order. Link in bio.”",
      "product": "Pre-workout drink",
      "username": "@MiraMoves",
      "followers": "482K",
      "comments": [
        {
          "username": "fitpaula",
          "text": "Omg I need to try this before my next workout!"
        },
        {
          "username": "runneralex",
          "text": "Does the code work in all Europe?"
        },
        {
          "username": "glowfuel_official",
          "text": "So happy you’re loving it 💜"
        },
        {
          "username": "martahealthy",
          "text": "This looks like an ad but I actually want it hahaha"
        },
        {
          "username": "gymtom",
          "text": "Just ordered with your code!"
        }
      ],
      "clues": [
        "Discount code “LUNA20” in the caption",
        "Affiliate link in bio",
        "Long-term paid brand ambassador"
      ]
    },
    {
      "caption": "new flavour drop with the team 🔋 #ad",
      "product": "energy drink",
      "username": "TechWithLeo",
      "followers": "219K",
      "comments": [
        {
          "username": "streamfan88",
          "text": "Can you test the mic quality?"
        },
        {
          "username": "novasoundaudio",
          "text": "Can’t wait to hear your thoughts!"
        },
        {
          "username": "lucagames",
          "text": "Gifted or sponsored?"
        },
        {
          "username": "TechWithLeo",
          "text": "Gifted. I’ll still be honest in the review."
        },
        {
          "username": "setupqueen",
          "text": "Please compare them with your old headset!"
        }
      ],
      "clues": [
        "Tagged the brand as a creative partner",
        "Co-designed the flavour together",
        "“#ad” — worked jointly on the launch"
      ]
    },
    {
      "caption": "NovaSound sent me their new AirBeat headphones to test this week. I’ll use them during tonight’s stream and share my honest thoughts after a few days. Thanks for the PR package!",
      "product": "Wireless headphones",
      "username": "ClaraSees",
      "followers": "312K ",
      "comments": [
        {
          "username": "artisan_wear",
          "text": "This looks incredible, can’t wait to see the details!"
        },
        {
          "username": "needle_ninja",
          "text": "Is there a waitlist? I need to get one."
        },
        {
          "username": "glowfuel_official",
          "text": "Obsessed with this texture! So unique 💜"
        },
        {
          "username": "martahealthy",
          "text": "Looks like an ad but I love supporting local. Ordering!"
        },
        {
          "username": "gymtom",
          "text": "Wait, I just ordered the other thing, can I combine? Lol."
        }
      ],
      "clues": [
        "Received the product for free",
        "No payment, no discount code",
        "“gifted” disclosure in the corner"
      ]
    },
    {
      "caption": "Okay, a mini haul because I was so excited about these discoveries! The ceramics are from a lovely small workshop, and I’m deeply in love with this book. Found some truly great pieces. Everything is genuinely just what I wanted to buy. #legithaul #smallbatch #curatedfinds #SpainFinds",
      "product": "Cercamics",
      "username": "RealSarahShares ",
      "followers": "285K ",
      "comments": [
        {
          "username": "artisan_wear",
          "text": "Those dishes are gorgeous! Where did you get them?"
        },
        {
          "username": "needle_ninja",
          "text": "Love that scarf. Perfect for autumn."
        },
        {
          "username": "glowfuel_official",
          "text": "Genuine finds are the best! Looks so cosy. 💜"
        },
        {
          "username": "martahealthy",
          "text": "Finally, an actual haul! I want that plant!"
        },
        {
          "username": "gymtom",
          "text": "Wait, so is it still Spain-based? Need recommendations!"
        }
      ],
      "clues": [
        "",
        "",
        ""
      ]
    }
  ],

  /* ---- Stage 2: product legitimacy ---- */
  stage2: {
    stage1Cleared: 'Stage 1 cleared ✓',
    badge: 'Stage 2 / 2',
    tag: 'Product legitimacy',
    prompt:
      'These sellers all claim their products are “real”. Run a reverse image search on each photo, then classify what it actually is.',
    runSearch: '🔍 Run reverse image search',
    engineBar: 'reverse-image-search.io',
    engineDrop: 'Drag a product image here to reverse-search it',
    trayLabel: 'Your saved images — drag one into the search engine →',
    classifyPrompt: 'So this product is…',
    searching: 'Searching the web',
    matchesTitle: 'Web matches found',
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
      matches: [
        { site: 'aliluxe-deals.shop', title: 'Ceramic Coffee Mug — bulk 500 pcs' },
        { site: 'dropmart.store', title: '“Handmade” Mug · wholesale lot' },
        { site: 'quickship-goods.net', title: 'Artisan-style mug (factory direct)' },
        { site: 'mega-bazaar.shop', title: 'Same photo — €1.90 / unit' },
      ],
      result: '1,240+ identical listings on 12 dropshipping sites.',
      hint: 'The exact same photo appears on dozens of cheap stores.',
    },
    {
      name: '“NovaPad X” promo shot',
      matches: [
        { site: 'thisdevicedoesnotexist.ai', title: 'Generated device render · SDXL' },
        { site: 'promptgallery.art', title: 'Sci-fi tablet — AI artwork' },
      ],
      result: '0 retail listings — image traced to AI generators.',
      hint: 'Only AI-art sites match. This photo was never a real product.',
    },
    {
      name: 'Local bakery cupcakes',
      matches: [
        { site: 'cornerst-bakery.com', title: 'Fresh cupcakes — Corner St. Bakery' },
        { site: 'localeats.review', title: 'Review: Corner St. Bakery ★★★★☆' },
        { site: 'instagram.com/cornerst', title: '@cornerst · local bakery' },
      ],
      result: '3 consistent results, all the same small business.',
      hint: 'Matches trace back to one genuine local bakery.',
    },
  ],

  classify: {
    mass: 'Mass-produced',
    ai: 'AI-generated',
    legit: 'Legit',
  },

  /* ---- Emoji Decoding Card keyboard ---- */
  decoder: {
    title: '🔑 Emoji Decoding Card',
    noSelection: 'No post selected',
    erase: 'Delete last letter',
    help: 'Match each emoji on a sticky-note to its letter to read the hidden label.',
  },
}
