/* Link District (Puzzle 1 · Fraudulent Links) strings. */
export default {
  intro: 'A router with three doors. Each is a link claiming to be a store. Shut the fraudulent ones.',
  solvedTitle: 'Link District cleared · Emoji Decoding Card obtained 🔑',
  solvedText:
    'You blocked every fake and learned what makes a URL suspicious. The card unlocks the labels in Influencer Avenue.',

  routerBadge: 'Crossroads {current} / {total}',
  peek: '🔍 Open to peek inside',
  closeDoor: '✕ Close door',
  doorHelp: 'Open a door to peek at the site inside · read the address · use “Block” to shut the fraudulent ones',
  tapToBlock: 'Tap a door to block the link · tap again to unblock',
  addressHint: 'The padlock & “https” mean the connection is private — NOT that the site is trustworthy.',
  linkTip: 'A link — you can only check its real security once you open it',
  barNotSecure: 'Not secure',
  barLookalike: '⚠ Look-alike letters',
  secureConn: 'Encrypted connection (https)',
  insecureConn: 'Not secure — unencrypted http connection',
  blockThis: '🔒 Block this link',
  unblock: '↺ Unblock',
  inspect: 'Inspect the address & preview.',
  realStore: '↧ real store',
  blocked: 'BLOCKED',
  hint: 'Remember: block the fakes, keep the one real door open.',
  nextRouter: 'Advance to the next crossroads →',
  finalRouter: 'Advance →',

  errStillOpen: 'At least one fraudulent link is still open. Block every fake before continuing.',
  errBlockedSafe: 'You blocked the real store! That is the one safe door — leave it open.',

  justifyLeadLabel: 'Why did you block them?',
  justifyLead:
    'Being able to explain the red flags matters more than a lucky guess. Tick every real warning sign — and nothing that only looks reassuring.',
  justifyErrWrong:
    'Some of those are not actually red flags — https, padlocks and nice photos do NOT prove a site is safe.',
  justifyErrMissing: 'A few red flags are still unchecked. Look again at the fake URLs.',
  submitReasoning: 'Submit reasoning',

  /* Preview website labels (the fake/real storefronts on each door). */
  preview: {
    newArrivals: 'NEW ARRIVALS',
    storeCaption: 'Effortless style, every day.',
    megaSale: '⚠ MEGA SALE — TODAY ONLY! ⚠',
    shopNow: 'SHOP NOW!',
    shopBar: 'DISCOUNT SHOPZ ▤',
    limited: '⚠ LIMITED TIME!!! ⚠',
  },

  /* Notes are keyed a/b/c per door (see the ROUNDS data in
     LinkDistrict.jsx) so the URLs — including tricky look-alike
     characters — stay out of the translation strings. */
  rounds: [
    {
      category: 'Common suffixes',
      prompt: 'One is the real store. The others hide their true domain behind a familiar-looking name — read the whole address.',
      notes: {
        a: 'The genuine domain: lunawear.com',
        b: 'The real site is “com-official.shop” — “lunawear” is only a subdomain glued on to fool you.',
        c: '“-dealz” is an added, misspelled word tacked onto the brand.',
      },
    },
    {
      category: 'HTTP vs HTTPS',
      prompt: 'Look at the very start of each address. Which connection is actually secure?',
      notes: {
        a: 'https:// — an encrypted connection, and the real store.',
        b: 'http:// with no “s” — the connection is NOT encrypted.',
        c: 'http:// AND an odd “.free” ending — steer well clear.',
      },
    },
    {
      category: 'Phishing attempts',
      prompt: 'These look almost identical to the real store. Inspect them character by character.',
      notes: {
        a: 'The genuine magnumshop.com.',
        b: 'The “rn” is disguised as an “m” — read it slowly: r-n-agnumshop.',
        c: 'One letter is a foreign look-alike — the Cyrillic “и” swapped in for an “n”.',
      },
    },
  ],

  flags: {
    suffix: 'Extra words bolted on after the real name (…com-official.shop, -dealz)',
    httpNoS: 'The address uses http:// instead of the encrypted https://',
    weirdTld: 'Odd domain endings like .shop or .free instead of .com',
    homoglyph: 'Letters swapped for look-alikes — “rn” for “m”, or foreign characters',
    typo: 'Misspellings of the brand name (e.g. “dealz”)',
    httpsGood: 'It starts with https:// — so it must be trustworthy',
    lock: 'The browser shows a little padlock icon',
    looksReal: 'The name looks right at a first glance',
  },
}
