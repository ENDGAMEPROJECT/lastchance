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
    begin: '▶ Step inside',
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
    rewardLabel: 'Added to your Bag — you’ll need it next',
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

  /* Pre-test / post-test conversation (diagnostic story with {friend}).
     The 3 rounds are shared; pre/post differ only in framing + responses. */
  story: {
    /* The scam "deal" shown as a phone / influencer post beside the chat. */
    product: {
      handle: 'luna.deals',
      sponsored: 'Sponsored',
      url: 'tech-bargalns.com',
      name: 'NovaPad X',
      saleBadge: '⚡ FLASH SALE',
      wasPrice: '$600',
      nowPrice: '$49',
      endsIn: 'Ends in',
      buy: 'BUY NOW',
      caption: 'OMG they dropped the NovaPad X to $49?! 😱🔥 Grab it before it’s gone! #deal #ad',
      likes: '12.4k likes',
    },
    roundLabel: 'Round {n} · {title}',
    respondPrompt: 'Respond to {friend}',
    you: 'You',
    diagnosticNote: 'No wrong answers here — just tell me what you think.',
    rounds: [
      {
        title: 'The Timer',
        options: [
          { k: 'A', text: "A company can't profit selling a $600 NovaPad X for $49. They'd go bankrupt, so it's fake.", correct: false },
          { k: 'B', text: 'That 30-minute countdown is just a high-pressure tactic to make you panic and buy without thinking.', correct: true },
          { k: 'C', text: "Look at the comments first. If people in the thread say it's a scam, don't buy it.", correct: false },
          { k: 'D', text: "For $49, it's probably just a cheap, broken knockoff anyway.", correct: false },
        ],
        why: 'Exactly — the ticking clock is manufactured urgency, built to make you act before you think.',
        nudge: 'Think about what that ticking clock is really doing to you.',
      },
      {
        title: 'The Source & Feed',
        options: [
          { k: 'A', text: "Your phone is listening to us. We talked about tablets yesterday and the app used the mic.", correct: false },
          { k: 'B', text: "Does her profile have a verified checkmark? If not, it's a fake clone account impersonating her.", correct: false },
          { k: 'C', text: 'Your phone must have a virus or spyware forcing these specific ads onto your screen.', correct: false },
          { k: 'D', text: "The platform's algorithm is tracking you. It fed your search history straight to predatory ad networks.", correct: true },
        ],
        why: "Right — it's not the mic or magic. Your search history was profiled and sold to ad networks.",
        nudge: "It's not the mic or a virus — think about what the platform already knows about you.",
      },
      {
        title: 'The Destination',
        options: [
          { k: 'A', text: "Look at the address bar. The URL says tech-bargalns.com — an 'l' instead of an 'i'. It's a spoofed domain.", correct: true },
          { k: 'B', text: "Check the lock icon. No https:// means your connection isn't encrypted, so it's a scam.", correct: false },
          { k: 'C', text: "Don't type your card in. As long as you use Apple Pay or PayPal, you're 100% safe.", correct: false },
          { k: 'D', text: "Scroll to the bottom. No 'Copyright 2026' text is how you know it's fake.", correct: false },
        ],
        why: "Yes — read the URL letter by letter. 'bargalns' with an 'l' is a look-alike domain, not the real store.",
        nudge: 'The real tell is in the address bar itself — read it character by character.',
      },
    ],
    pretest: {
      eyebrow: 'The Deal',
      debugTag: 'Pre-test',
      title: 'A message from {friend}',
      opening:
        "Look at this! An influencer I follow just posted a flash sale — the $600 NovaPad X for only $49! There are just 30 minutes left on the countdown. I'm entering my card info right now.",
      responses: [
        "Whatever the reason for the setup, I don't want to miss out before the clock hits zero! Plus, she's a massive influencer — she wouldn't post something random. But the weird part is how this ad even knew I wanted a tablet. It popped up right at the top of my feed.",
        "Look, there are a million theories about how algorithms and accounts handle ads, but I'm looking at the actual store page right now. It has the official brand logo, great reviews, and a secure checkout.",
      ],
      endingFriend:
        "Look, you can dissect the page all you want, but everything seems fine to me! You're just being paranoid. The countdown's still running — you've got until it hits zero, thirty minutes, to prove this is actually a scam. Otherwise, I'm hitting buy.",
      endingYou: "Deal. Let's look behind the screen.",
      begin: '▶ Look behind the screen',
    },
    posttest: {
      eyebrow: 'The Final Call',
      debugTag: 'Post-test',
      title: '{friend} is having second thoughts',
      opening:
        "Wow, the countdown is down to the last 2 minutes! I'm staring at my card info, but everything we just went through has me second-guessing myself. Okay — I'm not sure I should buy it… help me out.",
      responses: [
        "I hear you, but the pressure feels so real with that clock ticking right in front of me. And it's not just the timer — I keep thinking it came from one of my favourite creators. But there's still the mystery of how it ended up on my radar.",
        "Man, the way everything's handled behind the scenes on these apps is wild. But at the end of the day, I'm still staring at this checkout page trying to decide if it's safe to type my details in.",
      ],
      endingFriend:
        "Ugh, you've given me a lot to process, but I need to choose right now — the timer's about to hit zero. Based on everything we looked at, give it to me straight: do I close this tab and protect my data, or take the risk and buy it?",
      choiceClose: 'Close the tab. It’s a scam.',
      choiceBuy: 'Hit buy. Let’s risk it.',
    },
    mastery: {
      banner: "One more time — I am still not convinced. Give me the strongest reason for each.",
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
      desc: 'Reveals the fine print hidden behind the glossy posters in the Ads Corridor.',
    },
  },

  /* Per-room copy, composed from ./en/<room>.js fragments.
     Keys are namespaced by room, e.g. rooms.link.*  */
  rooms: { link, roulette, influencer, algorithm, ads, persuasion, final },
}
