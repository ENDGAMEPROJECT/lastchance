/* AUTO-GENERATED from the translation Google Sheet by `npm run i18n:import`. Do not edit by hand. */
export default {
  "common": {
    "continue": "Continue →",
    "begin": "▶ Step inside",
    "submit": "Submit",
    "enter": "Enter",
    "next": "Next",
    "locked": "Locked",
    "cleared": "✓ Cleared",
    "enterNode": "▶ Enter",
    "back": "Back",
    "close": "Close"
  },
  "welcome": {
    "eyebrow": "Player Setup",
    "titleLead": "LAST CHANCE",
    "titleAccent": "TO ESCAPE",
    "tagline": "// an escape room about ads, scams & fraudulent websites",
    "subtitle": "Set up your player, then jack into the Physical Internet.",
    "aliasLabel": "Choose an alias",
    "aliasPlaceholder": "e.g. Ne0nRunner",
    "ageLabel": "Your age",
    "agePlaceholder": "e.g. 14",
    "languageLabel": "Language",
    "start": "⏻ Enter",
    "aliasError": "Enter an alias to continue.",
    "ageError": "Enter a valid age (1–120)."
  },
  "hud": {
    "logo": "LAST CHANCE TO ESCAPE",
    "expires": "offer expires in",
    "tminus": "T-MINUS",
    "map": "🗺 Map",
    "bag": "🎒 Bag",
    "muteSound": "Mute sound",
    "unmuteSound": "Unmute sound",
    "inventoryTitle": "Inventory & Evidence",
    "tools": "Tools & Rewards",
    "noTools": "Nothing collected yet. Solve puzzles to earn tools.",
    "evidenceHeading": "Evidence on the deal",
    "noEvidence": "Collect proof in each district to convince {friend} at the end."
  },
  "intro": {
    "eyebrow": "Educational Escape Room",
    "titleLead": "THE",
    "titleAccent": "PHYSICAL INTERNET",
    "tagline": "// ads · scams · fraudulent websites — decoded",
    "situationTitle": "The situation",
    "hook": "Your friend {friend} just found a viral deal on {product} — 90% off, \"today only\". It looks incredible… which is exactly why you think it is a scam.",
    "context": "To show {friend} how scams and advertising really work, you both jack into a physical version of the Internet — a neon city where shops, social platforms and ads become districts you can walk through.",
    "clock": "⏱ {minutes}:00 on the clock",
    "mission": "You have {minutes} minutes — the time before the offer expires — to travel through the Physical Internet, gather evidence about how ads and scams work, and convince {friend} not to buy. If the timer hits zero, {friend} buys it.",
    "steps": [
      {
        "title": "1 · Explore",
        "text": "Four districts, two corridors. Each teaches one trick advertisers use."
      },
      {
        "title": "2 · Gather",
        "text": "Earn tools and evidence. Track them in your Bag and on the Map."
      },
      {
        "title": "3 · Convince",
        "text": "Reach the Final Decision and use your evidence before time runs out."
      }
    ],
    "start": "⏻ Jack in — start the clock",
    "pretest": "Pre-test: first, tell {friend} what you already think about this deal. Then enter the Internet."
  },
  "map": {
    "eyebrow": "Physical Internet · District Map",
    "titleLead": "Choose your next",
    "titleAccent": "district",
    "subtitle": "Travel the network, gather evidence, and reach the Final Decision before the offer expires.",
    "start": "▶ START · Pre-test with {friend}",
    "lockedTip": "Locked — finish the previous district"
  },
  "roomframe": {
    "clearedDefaultTitle": "District cleared",
    "clearedDefaultText": "Nice work. The next node is unlocked on the map.",
    "rewardLabel": "Added to your Bag — you’ll need it next"
  },
  "end": {
    "win": {
      "eyebrow": "Mission Complete",
      "titleLead": "{friend}",
      "titleAccent": "DIDN'T BUY IT",
      "tag": "// offer expired with {time} to spare",
      "heading": "You made the case",
      "body": "With the evidence you gathered across the Physical Internet, you showed {friend} how {product} was engineered to feel irresistible — fake links, rigged wheels, undisclosed sponsorships, algorithmic targeting and pure persuasion. {friend} closed the tab.",
      "evidenceHeading": "Evidence presented",
      "posttest": "Post-test: talk to {friend} again. What did you learn about spotting scams, disclosure, and why \"too good to be true\" usually is?",
      "again": "↻ Play again"
    },
    "lose": {
      "eyebrow": "Time Expired",
      "titleLead": "{friend}",
      "titleAccent": "HIT \"BUY NOW\"",
      "tag": "// the countdown reached zero",
      "heading": "The offer got them first",
      "body": "Before you could finish gathering proof, the fake \"today only\" countdown did its job and {friend} bought {product}. That urgency was the whole trick.",
      "lessonLabel": "Lesson:",
      "lesson": "artificial urgency (\"only 3 left!\", \"offer ends in 5:00\") is designed to stop you from thinking. Slow down — a real deal will still be there tomorrow.",
      "again": "↻ Try again"
    }
  },
  "story": {
    "product": {
      "handle": "luna.deals",
      "sponsored": "Sponsored",
      "url": "tech-bargalns.com",
      "name": "NovaPad X",
      "saleBadge": "⚡ FLASH SALE",
      "wasPrice": "$600",
      "nowPrice": "$49",
      "endsIn": "Ends in",
      "buy": "BUY NOW",
      "caption": "OMG they dropped the NovaPad X to $49?! 😱🔥 Grab it before it’s gone! #deal #ad",
      "likes": "12.4k likes"
    },
    "roundLabel": "Round {n} · {title}",
    "respondPrompt": "Respond to {friend}",
    "you": "You",
    "diagnosticNote": "No wrong answers here — just tell me what you think.",
    "rounds": [
      {
        "title": "The Timer",
        "options": [
          {
            "k": "A",
            "text": "A company can't profit selling a $600 NovaPad X for $49. They'd go bankrupt, so it's fake.",
            "correct": false
          },
          {
            "k": "B",
            "text": "That 30-minute countdown is just a high-pressure tactic to make you panic and buy without thinking.",
            "correct": true
          },
          {
            "k": "C",
            "text": "Look at the comments first. If people in the thread say it's a scam, don't buy it.",
            "correct": false
          },
          {
            "k": "D",
            "text": "For $49, it's probably just a cheap, broken knockoff anyway.",
            "correct": false
          }
        ],
        "why": "Exactly — the ticking clock is manufactured urgency, built to make you act before you think.",
        "nudge": "Think about what that ticking clock is really doing to you."
      },
      {
        "title": "The Source & Feed",
        "options": [
          {
            "k": "A",
            "text": "Your phone is listening to us. We talked about tablets yesterday and the app used the mic.",
            "correct": false
          },
          {
            "k": "B",
            "text": "Does her profile have a verified checkmark? If not, it's a fake clone account impersonating her.",
            "correct": false
          },
          {
            "k": "C",
            "text": "Your phone must have a virus or spyware forcing these specific ads onto your screen.",
            "correct": false
          },
          {
            "k": "D",
            "text": "The platform's algorithm is tracking you. It fed your search history straight to predatory ad networks.",
            "correct": true
          }
        ],
        "why": "Right — it's not the mic or magic. Your search history was profiled and sold to ad networks.",
        "nudge": "It's not the mic or a virus — think about what the platform already knows about you."
      },
      {
        "title": "The Destination",
        "options": [
          {
            "k": "A",
            "text": "Look at the address bar. The URL says tech-bargalns.com — an 'l' instead of an 'i'. It's a spoofed domain.",
            "correct": true
          },
          {
            "k": "B",
            "text": "Check the lock icon. No https:// means your connection isn't encrypted, so it's a scam.",
            "correct": false
          },
          {
            "k": "C",
            "text": "Don't type your card in. As long as you use Apple Pay or PayPal, you're 100% safe.",
            "correct": false
          },
          {
            "k": "D",
            "text": "Scroll to the bottom. No 'Copyright 2026' text is how you know it's fake.",
            "correct": false
          }
        ],
        "why": "Yes — read the URL letter by letter. 'bargalns' with an 'l' is a look-alike domain, not the real store.",
        "nudge": "The real tell is in the address bar itself — read it character by character."
      }
    ],
    "pretest": {
      "eyebrow": "The Deal",
      "debugTag": "Pre-test",
      "title": "A message from {friend}",
      "opening": "Look at this! An influencer I follow just posted a flash sale — the $600 NovaPad X for only $49! There are just 30 minutes left on the countdown. I'm entering my card info right now.",
      "responses": [
        "Whatever the reason for the setup, I don't want to miss out before the clock hits zero! Plus, she's a massive influencer — she wouldn't post something random. But the weird part is how this ad even knew I wanted a tablet. It popped up right at the top of my feed.",
        "Look, there are a million theories about how algorithms and accounts handle ads, but I'm looking at the actual store page right now. It has the official brand logo, great reviews, and a secure checkout."
      ],
      "endingFriend": "Look, you can dissect the page all you want, but everything seems fine to me! You're just being paranoid. The countdown's still running — you've got until it hits zero, thirty minutes, to prove this is actually a scam. Otherwise, I'm hitting buy.",
      "endingYou": "Deal. Let's look behind the screen.",
      "begin": "▶ Look behind the screen"
    },
    "posttest": {
      "eyebrow": "The Final Call",
      "debugTag": "Post-test",
      "title": "{friend} is having second thoughts",
      "opening": "Wow, the countdown is down to the last 2 minutes! I'm staring at my card info, but everything we just went through has me second-guessing myself. Okay — I'm not sure I should buy it… help me out.",
      "responses": [
        "I hear you, but the pressure feels so real with that clock ticking right in front of me. And it's not just the timer — I keep thinking it came from one of my favourite creators. But there's still the mystery of how it ended up on my radar.",
        "Man, the way everything's handled behind the scenes on these apps is wild. But at the end of the day, I'm still staring at this checkout page trying to decide if it's safe to type my details in."
      ],
      "endingFriend": "Ugh, you've given me a lot to process, but I need to choose right now — the timer's about to hit zero. Based on everything we looked at, give it to me straight: do I close this tab and protect my data, or take the risk and buy it?",
      "choiceClose": "Close the tab. It’s a scam.",
      "choiceBuy": "Hit buy. Let’s risk it."
    },
    "mastery": {
      "banner": "One more time — I am still not convinced. Give me the strongest reason for each."
    }
  },
  "nodes": {
    "start": {
      "title": "Start",
      "subtitle": "Pre-test · The message from {friend}",
      "blurb": "Where it began — {friend} sent you the deal and asked what you think.",
      "kind": "gate"
    },
    "link-district": {
      "title": "Link District",
      "subtitle": "Puzzle 1 · Fraudulent Links",
      "blurb": "A router-block of doors. Only one URL is the real store — block the fakes.",
      "kind": "puzzle"
    },
    "roulette-corridor": {
      "title": "Roulette Corridor",
      "subtitle": "Corridor · Gamified Bait",
      "blurb": "Prize wheels that always win. Prove they are rigged to pass.",
      "kind": "corridor"
    },
    "influencer-avenue": {
      "title": "Influencer Avenue",
      "subtitle": "Puzzle 2 · Labels & Fakes",
      "blurb": "Decode the sponsorship labels, then check which products are actually real.",
      "kind": "puzzle"
    },
    "algorithm-room": {
      "title": "Algorithm Control Room",
      "subtitle": "Puzzle 3 · Personalization",
      "blurb": "Feed the targeting equations to see how the algorithm profiles a person.",
      "kind": "puzzle"
    },
    "ads-corridor": {
      "title": "Ads Corridor",
      "subtitle": "Corridor · The Truth Behind",
      "blurb": "Shine the Truth Light on the posters to read what the ad really says.",
      "kind": "corridor"
    },
    "persuasion-room": {
      "title": "Persuasion Lab",
      "subtitle": "Puzzle 4 · Persuasion Techniques",
      "blurb": "Frame each ad with the trick it uses. Reveal the letters, form the password.",
      "kind": "puzzle"
    },
    "final-decision": {
      "title": "Final Decision",
      "subtitle": "Convince {friend}",
      "blurb": "Present your evidence before the offer countdown runs out.",
      "kind": "final"
    }
  },
  "items": {
    "emojiCard": {
      "name": "Emoji Decoding Card",
      "desc": "A key that maps emojis to letters. Use it to read the sponsorship sticky-notes in Influencer Avenue."
    },
    "dataReport": {
      "name": "Data Report on {friend}",
      "desc": "A dossier of the data brokers hold on {friend}. The highlighted digits open the Algorithm Control Room."
    },
    "truthLight": {
      "name": "Truth Flashlight",
      "desc": "Reveals the fine print hidden behind the glossy posters in the Ads Corridor."
    }
  },
  "rooms": {
    "link": {
      "intro": "A router with three doors. Each is a link claiming to be a store. Shut the fraudulent ones.",
      "solvedTitle": "Link District cleared · Emoji Decoding Card obtained 🔑",
      "solvedText": "You blocked every fake and learned what makes a URL suspicious. The card unlocks the labels in Influencer Avenue.",
      "routerBadge": "Crossroads {current} / {total}",
      "peek": "🔍 Open to peek inside",
      "closeDoor": "✕ Close door",
      "doorHelp": "Open a door to peek at the site inside · read the address · use “Block” to shut the fraudulent ones",
      "tapToBlock": "Tap a door to block the link · tap again to unblock",
      "addressHint": "The padlock & “https” mean the connection is private — NOT that the site is trustworthy.",
      "linkTip": "A link — you can only check its real security once you open it",
      "barNotSecure": "Not secure",
      "barLookalike": "⚠ Look-alike letters",
      "secureConn": "Encrypted connection (https)",
      "insecureConn": "Not secure — unencrypted http connection",
      "blockThis": "🔒 Block this link",
      "unblock": "↺ Unblock",
      "inspect": "Inspect the address & preview.",
      "realStore": "↧ real store",
      "blocked": "BLOCKED",
      "hint": "Remember: block the fakes, keep the one real door open.",
      "nextRouter": "Advance to the next crossroads →",
      "finalRouter": "Advance →",
      "reviewTitle": "Why those doors?",
      "errStillOpen": "At least one fraudulent link is still open. Block every fake before continuing.",
      "errBlockedSafe": "You blocked the real store! That is the one safe door — leave it open.",
      "justifyLeadLabel": "Why did you block them?",
      "justifyLead": "Being able to explain the red flags matters more than a lucky guess. Tick every real warning sign — and nothing that only looks reassuring.",
      "justifyErrWrong": "Some of those are not actually red flags — https, padlocks and nice photos do NOT prove a site is safe.",
      "justifyErrMissing": "A few red flags are still unchecked. Look again at the fake URLs.",
      "submitReasoning": "Submit reasoning",
      "preview": {
        "newArrivals": "NEW ARRIVALS",
        "storeCaption": "Effortless style, every day.",
        "megaSale": "⚠ MEGA SALE — TODAY ONLY! ⚠",
        "shopNow": "SHOP NOW!",
        "shopBar": "DISCOUNT SHOPZ ▤",
        "limited": "⚠ LIMITED TIME!!! ⚠"
      },
      "rounds": [
        {
          "category": "Common suffixes",
          "prompt": "One is the real store. The others hide their true domain behind a familiar-looking name — read the whole address.",
          "notes": {
            "a": "The genuine domain: lunawear.com",
            "b": "The real site is “com-official.shop” — “lunawear” is only a subdomain glued on to fool you.",
            "c": "“-dealz” is an added, misspelled word tacked onto the brand."
          }
        },
        {
          "category": "HTTP vs HTTPS",
          "prompt": "Look at the very start of each address. Which connection is actually secure?",
          "notes": {
            "a": "https:// — an encrypted connection, and the real store.",
            "b": "http:// with no “s” — the connection is NOT encrypted.",
            "c": "http:// AND an odd “.free” ending — steer well clear."
          }
        },
        {
          "category": "Phishing attempts",
          "prompt": "These look almost identical to the real store. Inspect them character by character.",
          "notes": {
            "a": "The genuine magnumshop.com.",
            "b": "The “rn” is disguised as an “m” — read it slowly: r-n-agnumshop.",
            "c": "One letter is a foreign look-alike — the Cyrillic “и” swapped in for an “n”."
          }
        }
      ],
      "flags": {
        "suffix": "Extra words bolted on after the real name (…com-official.shop, -dealz)",
        "httpNoS": "The address uses http:// instead of the encrypted https://",
        "weirdTld": "Odd domain endings like .shop or .free instead of .com",
        "homoglyph": "Letters swapped for look-alikes — “rn” for “m”, or foreign characters",
        "typo": "Misspellings of the brand name (e.g. “dealz”)",
        "httpsGood": "It starts with https:// — so it must be trustworthy",
        "lock": "The browser shows a little padlock icon",
        "looksReal": "The name looks right at a first glance"
      }
    },
    "roulette": {
      "intro": "A corridor lined with dazzling prize wheels promising you win on every spin. Give them a whirl and watch what you actually get.",
      "solvedTitle": "Corridor cleared — you spotted the rigged wheels",
      "solvedText": "Every wheel “wins” every single time — but the prize is always a worthless 30¢ coupon. That is not luck or generosity; it is an ad designed to make you feel lucky and spend. You saw through it.",
      "spunBadge": "Wheels spun · {spun} / {total}",
      "riggedBadge": "Marked rigged · {rigged} / {total}",
      "spinAll": "🎰 Spin ALL",
      "spin": "🎰 Spin",
      "spinning": "Spinning…",
      "markRiggedLabel": "Mark as",
      "markRiggedWord": "Rigged",
      "won": "🎉 You won:",
      "wonSuffix": "!",
      "hintSpinFirst": "Spin a couple of wheels first — watch where they land before you decide.",
      "hintSpinThis": "Spin THIS wheel at least once before marking it. See what it does.",
      "learnLead": "A guaranteed “win”?",
      "learnBody": "Spin wheels, daily login bonuses and loot boxes are engagement and advertising tricks, not generosity. They are rigged so you almost always “win” something — usually a tiny discount like 30¢ off — because feeling lucky makes you keep playing, share the app, and spend more. A prize you always get, worth almost nothing, isn't a gift. It's bait.",
      "evidenceLabel": "The prize wheels were rigged to always land on a worthless 30¢ coupon — bait to make you spend.",
      "wheels": {
        "w1": {
          "name": "MEGA SPIN",
          "tag": "Daily bonus",
          "segments": [
            "Try again",
            "5 coins",
            "2% off",
            "30¢ OFF",
            "Try again",
            "1 coin",
            "No prize",
            "2 coins"
          ]
        },
        "w2": {
          "name": "LUCKY WHEEL",
          "tag": "Spin to win",
          "segments": [
            "1 coin",
            "Try again",
            "30¢ OFF",
            "No prize",
            "2 coins",
            "Try again",
            "5 coins",
            "2% off"
          ]
        },
        "w3": {
          "name": "GOLD RUSH",
          "tag": "Login reward",
          "segments": [
            "Try again",
            "2 coins",
            "No prize",
            "1 coin",
            "5 coins",
            "30¢ OFF",
            "Try again",
            "2% off"
          ]
        },
        "w4": {
          "name": "JACKPOT CITY",
          "tag": "Loot box",
          "segments": [
            "2 coins",
            "Try again",
            "1 coin",
            "No prize",
            "5 coins",
            "Try again",
            "30¢ OFF",
            "2% off"
          ]
        }
      }
    },
    "influencer": {
      "intro": "A neon avenue of billboards and influencer feeds. Read past the gloss: label the sponsorships, then check what the products really are.",
      "solvedTitle": "Influencer Avenue cleared — Data Report obtained 📄",
      "solvedText": "You exposed the hidden ads and the fake product photo. The highlighted digits on the Data Report — 748392 — open the Algorithm Control Room next.",
      "evidenceLabel": "The posts hid paid promotions, and the product photo was AI-generated with zero real results.",
      "stage1": {
        "badge": "Stage 1 / 2",
        "tag": "Content labelling",
        "prompt": "Decode each emoji sticky-note, then drag the matching label onto its post: {paid}, {collab} or {gifted}.",
        "openDecoder": "🔑 Open Decoder Card",
        "verified": "Verified",
        "followersSuffix": "followers",
        "cluesTitle": "Disclosure clues",
        "decodeMe": "decode me →",
        "trayTitle": "Drag a label onto each post",
        "dropPlaceholder": "drop label",
        "correct": "✓ {label}",
        "wrong": "✗ wrong label",
        "learnLabel": "Why it matters:",
        "learn": "sponsored content must be clearly labelled. A #ad, a gifted product, an affiliate link or a discount code all signal advertising — even when it is dressed up as a personal recommendation.",
        "hint": "Tap or drag a label chip, then drop it on the matching post."
      },
      "labels": {
        "paid": "PAID",
        "collab": "COLLAB",
        "gifted": "GIFTED"
      },
      "posts": [
        {
          "caption": "my forever glow routine 💧 use code LUNA20",
          "product": "skincare serum",
          "clues": [
            "Discount code “LUNA20” in the caption",
            "Affiliate link in bio",
            "Long-term paid brand ambassador"
          ]
        },
        {
          "caption": "new flavour drop with the team 🔋 #ad",
          "product": "energy drink",
          "clues": [
            "Tagged the brand as a creative partner",
            "Co-designed the flavour together",
            "“#ad” — worked jointly on the launch"
          ]
        },
        {
          "caption": "sent this shaker to try 🎁 thoughts?",
          "product": "protein shaker",
          "clues": [
            "Received the product for free",
            "No payment, no discount code",
            "“gifted” disclosure in the corner"
          ]
        }
      ],
      "stage2": {
        "stage1Cleared": "Stage 1 cleared ✓",
        "badge": "Stage 2 / 2",
        "tag": "Product legitimacy",
        "prompt": "These sellers all claim their products are “real”. Run a reverse image search on each photo, then classify what it actually is.",
        "runSearch": "🔍 Run reverse image search",
        "engineBar": "reverse-image-search.io",
        "engineDrop": "Drag a product image here to reverse-search it",
        "trayLabel": "Your saved images — drag one into the search engine →",
        "classifyPrompt": "So this product is…",
        "searching": "Searching the web",
        "matchesTitle": "Web matches found",
        "resultTitle": "Search result",
        "errRunAll": "Run the reverse image search on every product before classifying it.",
        "errClassifyAll": "Classify all three products first.",
        "errWrong": "One or more classifications are wrong. Re-read what each search returned.",
        "learnLabel": "Real tool, real habit:",
        "learn": "a reverse image search checks whether a “handmade”, “unique” or “real” product photo is actually stolen, mass-produced across dozens of dropshipping stores, or AI-generated. No results at all can mean the image is fake.",
        "hint": "Search first, then classify all three.",
        "confirm": "Confirm classifications →"
      },
      "products": [
        {
          "name": "“Handmade ceramic mug”",
          "matches": [
            {
              "site": "aliluxe-deals.shop",
              "title": "Ceramic Coffee Mug — bulk 500 pcs"
            },
            {
              "site": "dropmart.store",
              "title": "“Handmade” Mug · wholesale lot"
            },
            {
              "site": "quickship-goods.net",
              "title": "Artisan-style mug (factory direct)"
            },
            {
              "site": "mega-bazaar.shop",
              "title": "Same photo — €1.90 / unit"
            }
          ],
          "result": "1,240+ identical listings on 12 dropshipping sites.",
          "hint": "The exact same photo appears on dozens of cheap stores."
        },
        {
          "name": "“NovaPad X” promo shot",
          "matches": [
            {
              "site": "thisdevicedoesnotexist.ai",
              "title": "Generated device render · SDXL"
            },
            {
              "site": "promptgallery.art",
              "title": "Sci-fi tablet — AI artwork"
            }
          ],
          "result": "0 retail listings — image traced to AI generators.",
          "hint": "Only AI-art sites match. This photo was never a real product."
        },
        {
          "name": "Local bakery cupcakes",
          "matches": [
            {
              "site": "cornerst-bakery.com",
              "title": "Fresh cupcakes — Corner St. Bakery"
            },
            {
              "site": "localeats.review",
              "title": "Review: Corner St. Bakery ★★★★☆"
            },
            {
              "site": "instagram.com/cornerst",
              "title": "@cornerst · local bakery"
            }
          ],
          "result": "3 consistent results, all the same small business.",
          "hint": "Matches trace back to one genuine local bakery."
        }
      ],
      "classify": {
        "mass": "Mass-produced",
        "ai": "AI-generated",
        "legit": "Legit"
      },
      "decoder": {
        "title": "🔑 Emoji Decoding Card",
        "noCard": "You would normally have earned this card back in Link District — here it is anyway.",
        "help": "Match each emoji on a sticky-note to its letter to read the hidden label."
      }
    },
    "algorithm": {
      "intro": "A humming mainframe crunches data into targeted ads. Get inside, then teach it to profile a person.",
      "solvedTitle": "Algorithm Control Room cracked · Evidence logged 🧠",
      "solvedText": "You watched the machine turn {friend}'s age, interests and insecurities into a single ad. That is not luck — it is a profile.",
      "evidence": "The ad was hand-picked by an algorithm using {friend}’s age, interests and insecurities.",
      "unlock": {
        "badge": "ACCESS · Algorithm Control Room",
        "prompt": "Enter the 6-digit access code to boot the targeting engine.",
        "error": "Access denied — that code is wrong.",
        "submit": "Unlock →",
        "skip": "skip — I don’t have the report",
        "hint": "Hint: the highlighted digits on your Data Report."
      },
      "choice": {
        "badge": "System question · privacy trade-off",
        "prompt": "The mainframe offers you a deal. Which future do you want?",
        "optionATag": "Option A",
        "optionABefore": "See",
        "optionABold": "fewer, personalised",
        "optionAAfter": "ads — but your personal data is collected.",
        "optionBTag": "Option B",
        "optionBBefore": "See",
        "optionBBold": "many more",
        "optionBAfter": "ads and ad-breaks — but far less of your data is collected.",
        "wrongTitle": "Wrong answer.",
        "wrongText": "You just traded your privacy for convenience. “Personalised” is the algorithm — fewer ads means it is collecting and profiling more of your data to pick them.",
        "goodTitle": "Good answer.",
        "goodText": "More ads is annoying, but you kept your data and partly slipped the personalisation algorithm. Convenience is the bait it uses to make profiling feel like a favour.",
        "afterNote": "Either way, the machine still tries to profile everyone. Let’s see how.",
        "continue": "Enter the targeting engine →"
      },
      "equations": {
        "badge": "Targeting engine · solve every equation",
        "prompt": "Each row is a person. Fill the empty slot so the machine can output the ad it would show them.",
        "resultCol": "→ Targeted ad",
        "adFlag": "AD ACTIVATED",
        "slotPlaceholder": "＋ drop tile",
        "stepBadge": "Equation {n} / {total}",
        "profileBadge": "Profile complete",
        "dragHint": "Drag the missing factor into the equation — the one that fits this exact person.",
        "wrongHint": "That factor doesn’t fit this person. Look at what the ad is really selling.",
        "reflectTitle": "What just happened",
        "nextBtn": "Next equation →",
        "lastBtn": "See {friend}’s profile →",
        "trayLabel": "DATA TILES — drag one into each empty slot (or tap a tile, then tap a slot)",
        "runBtn": "⚡ Run the algorithm",
        "fillHint": "Fill every slot, then run the algorithm.",
        "wrongBanner": "The algorithm rejected some inputs. Fix the rows marked in red and run it again.",
        "navHint": "Use ◀ ▶ or the arrow keys to move around the control room.",
        "navMainframe": "Mainframe",
        "navDataWall": "Data Wall",
        "navTerminal": "Ad Terminal",
        "dataWallTitle": "DATA-BROKER · LIVE FEED",
        "dataWallSub": "Everything the machine already bought about {friend}:",
        "dataWallFeed": [
          "AGE — 15",
          "FOLLOWS — gaming · new tech · fitness",
          "SEARCHED — “NovaPad X cheapest”",
          "LOCATION — home + school, daily",
          "SCREEN TIME — 6.2 h / day",
          "INSECURITY FLAGS — fitting in · FOMO",
          "PAYMENT — card on file ✓"
        ],
        "terminalTitle": "AD-OUTPUT TERMINAL",
        "terminalIdle": "Awaiting profile… assemble the equations at the Mainframe, then run the algorithm.",
        "profileTitle": "▚ PROFILE RECONSTRUCTED ▚",
        "profileP1": "The engine cross-referenced",
        "profileB1": "{friend}’s age",
        "profileP2": " (a teen boy),",
        "profileB2": "his interests",
        "profileP3": " (gaming, new tech, the NovaPad X he keeps searching) and ",
        "profileB3": "his insecurities",
        "profileP4": " (fitting in, fear of missing the deal). Out came one perfectly-aimed ad — the exact NovaPad X “90% off” offer. It was never a coincidence {friend} saw it.",
        "logEvidence": "Log this evidence ✓",
        "learnTitle": "How personalised ads work:",
        "learnBefore": " the algorithm combines many data points — your age, what you follow, how you behave and even your insecurities — to guess what you’ll click. And beware the trade: “fewer ads” almost always means ",
        "learnItalic": "more of your data collected",
        "learnAfter": "."
      },
      "cols": [
        "Demographic",
        "Follows / likes",
        "Insecurities"
      ],
      "rows": {
        "r1": {
          "ad": "Miracle skincare cream",
          "slots": {
            "0": "Girl, 13–17",
            "1": "Follows beauty influencers"
          },
          "explain": "A 13-year-old who follows beauty accounts and worries about her skin is served a “miracle” cream. The algorithm didn’t guess — it matched her age and her follows to an insecurity, then sold straight to it."
        },
        "r2": {
          "ad": "Muscle-gain supplement",
          "slots": {
            "1": "Follows fitness influencers",
            "2": "Insecure about being skinny"
          },
          "explain": "A teen boy who follows fitness pages and feels too skinny is handed a muscle-gain supplement. His insecurity is the exact reason the ad reached him."
        },
        "r3": {
          "ad": "Baldness cream",
          "slots": {
            "0": "Man, 25–35",
            "1": "Follows tech channels"
          },
          "explain": "A man who fears going bald — flagged by his age and browsing — is shown a baldness “cure”. Same recipe: a private worry turned into a target."
        },
        "r4": {
          "ad": "Weight-loss pills",
          "slots": {
            "0": "Woman, 30–45",
            "2": "Insecure about her weight"
          },
          "explain": "A woman who follows diet pages and feels bad about her weight is aimed at with weight-loss pills. The feed she scrolls quietly feeds the very fear it then sells to."
        }
      },
      "tiles": {
        "t-skin": "Insecure about her skin",
        "t-boy": "Boy, 15–25",
        "t-bald": "Worried about going bald",
        "t-diet": "Follows diet & lifestyle pages",
        "t-retiree": "Retired, 65+",
        "t-tween": "Kid, 8–12",
        "t-gran": "Woman, 60+",
        "t-dad": "Dad, in his 40s",
        "t-pets": "Follows pet accounts",
        "t-gamer": "Follows gaming channels",
        "t-cook": "Follows cooking pages",
        "t-travel": "Follows travel bloggers",
        "t-money": "Anxious about money",
        "t-lonely": "Afraid of being left out",
        "t-height": "Self-conscious about height",
        "t-teeth": "Worried about their teeth"
      }
    },
    "ads": {
      "intro": "A neon service tunnel plastered with four glowing ad posters. They look generous. They are not.",
      "solvedTitle": "Corridor cleared — you read the fine print",
      "solvedText": "The exit hisses open. You logged the hidden €59/month auto-renewal as evidence against the deal.",
      "pickup": "You pick up the Truth Flashlight 🔦",
      "torchCharging": "🔦 Charging…",
      "torchOn": "🔦 Flashlight ON",
      "torchOff": "🔦 Truth Flashlight",
      "hintCharging": "The cheap torch flickers awake — bait ads love to waste a moment of your time…",
      "hintOn": "Sweep the beam across the dark wall — each poster lights up and reveals the truth.",
      "hintOff": "Switch it on, then sweep the beam over the posters to reveal what they really say.",
      "glossyCta": "TAP TO CLAIM →",
      "fineprint": "* terms & conditions apply",
      "truthTag": "THE TRUTH",
      "codeFragment": "hidden letter:",
      "shineRevealed": "✓ Revealed",
      "shineReady": "🔦 Shine light here",
      "shineOff": "Turn on the light first",
      "codeAssembled": "ACCESS CODE assembled:",
      "codeLetters": "S-A-V-E",
      "exitLabel": "Enter the 4-letter code to open the exit",
      "exitPlaceholder": "????",
      "exitButton": "Open exit →",
      "errCode": "That is not the code. Illuminate all four posters and read the letters hiding in the fine print.",
      "learnLabel": "Read the fine print.",
      "learn": "Ads shouting “free”, “you won” or “$0 today” usually hide the real cost in tiny print below — always read what you are actually agreeing to before you tap.",
      "evidence": "Behind the “free trial” ad was a hidden €59/month auto-renewing subscription.",
      "posters": [
        {
          "glossyTitle": "FREE 30-DAY TRIAL!",
          "glossyBody": "Try NovaCloud Premium — $0 today!",
          "glossyBadge": "$0",
          "truth": "…then auto-renews at €59/month. Cancelling requires calling a phone line open 2 hours a week."
        },
        {
          "glossyTitle": "🎉 CONGRATULATIONS!",
          "glossyBody": "You've WON a €1,000 gift card! Tap to claim.",
          "glossyBadge": "€1,000",
          "truth": "You did NOT win anything. This 'prize' harvests your personal data and card details."
        },
        {
          "glossyTitle": "📈 GET RICH QUICK!",
          "glossyBody": "Turn €100 into €10,000 in one week — guaranteed!",
          "glossyBadge": "×100",
          "truth": "A pure scam. Every euro you “invest” is gone, and the sky-high “returns” on screen are fake."
        },
        {
          "glossyTitle": "🛡️ VIRUS DETECTED!",
          "glossyBody": "Your device may be at risk — download SecureNow FREE!",
          "glossyBadge": "FREE",
          "truth": "The warning is fake and the “antivirus” IS the malware. Real alerts never come from an ad."
        }
      ]
    },
    "persuasion": {
      "intro": "A gallery of glossy ads. Each one leans on a single persuasion trick — name it by framing the poster.",
      "solvedTitle": "Persuasion Lab cleared — password FOOLED",
      "solvedText": "Once you can name the trick — FOMO, urgency, a borrowed celebrity — it stops working on you. That is the whole defence.",
      "learn": {
        "lead": "Spot the trick.",
        "body": "Ads persuade with named techniques: FOMO (fear of missing out), social proof (\"everyone's buying it\"), exaggeration, influencer endorsement, emotional appeal and urgency. Real campaigns often stack several of these at once to slip past your judgement."
      },
      "trayLabel": "TECHNIQUE FRAMES",
      "hints": {
        "start": "Drag a technique frame onto the poster it fits — or tap the frame, then tap the poster.",
        "allDone": "All six framed — the letters spell a password. Click the computer to type it in.",
        "correct": "Correct — a letter surfaced. Keep framing the rest.",
        "wrong": "That technique does not match this ad. Frame returned — try another."
      },
      "dragHint": "Drag onto its poster",
      "count": "Framed {matched} / {total}",
      "posters": [
        {
          "headline": "ONLY 3 LEFT IN STOCK!",
          "sub": "Don't miss out!"
        },
        {
          "headline": "Over 2 MILLION people already bought this!",
          "sub": "Join the crowd."
        },
        {
          "headline": "Lose 10kg in just 3 DAYS — guaranteed miracle!",
          "sub": "Results not typical."
        },
        {
          "headline": "As seen on @StarCeleb's page — she LOVES it!",
          "sub": "#ad"
        },
        {
          "headline": "Don't let your family down.",
          "sub": "They deserve better."
        },
        {
          "headline": "OFFER ENDS IN 04:59 — buy NOW before it's gone!",
          "sub": "Tick, tock…"
        }
      ],
      "techniques": {
        "fomo": "FOMO",
        "social": "Social Proof",
        "exagg": "Exaggeration",
        "influencer": "Influencer Endorsement",
        "emotional": "Emotional Appeal",
        "urgency": "Urgency"
      },
      "passwordLearn": {
        "lead": "Named and disarmed.",
        "body": "Six posters, six tricks. The letters they hid, read left to right, are the exit password — proof you saw through every one."
      },
      "openComputer": "Use the computer →",
      "closeComputer": "Close the screen",
      "termBar": "PERSUASION-LAB · EXIT TERMINAL",
      "termPrompt": "> Enter the password formed by the revealed letters:",
      "termLocked": "Frame all six posters to reveal the password letters.",
      "termPlaceholder": "type the password",
      "termInputLabel": "Exit password",
      "unlock": "Unlock →",
      "pwError": "Access denied. Read the glowing letters in poster order and try again.",
      "hiddenLetter": "hidden letter {letter}",
      "evidence": "Every poster used a named persuasion trick — FOMO, social proof, urgency and more."
    },
    "final": {
      "intro": "{friend}'s thumb is on \"Buy Now\" for {product}. Present the evidence you gathered and talk them down.",
      "solvedTitle": "{friend} is convinced — close the deal",
      "solvedText": "Present your case and end the run.",
      "replies": {
        "ev-links": "“Wait… the link wasn't even the real store? I didn't look at the address.”",
        "ev-roulette": "“The spin-to-win wheel was rigged? I thought I got lucky…”",
        "ev-influencer": "“So that influencer was paid and the photo was AI? It looked so real.”",
        "ev-algo": "“They targeted me on purpose? That's why it kept following me around.”",
        "ev-ads": "“Hidden €59 a month?! The ad only ever showed me the 90% off.”",
        "ev-persuasion": "“'Today only', '2 left'… it was all just pressure tricks on me.”",
        "generic": "“Huh… okay, that one actually makes me stop and think.”"
      },
      "pushback": [
        "“Come on, it's 90% off — TODAY ONLY. If I wait, it's gone!”",
        "“Okay, but… everybody in the group chat is buying it. It has 12k reviews!”",
        "“Alright, alright, maybe. But the timer says 4 minutes left…”"
      ],
      "convincedLine": "“…okay. I'm not buying it. Thanks for stopping me — I nearly clicked it.”",
      "fallbackArguments": [
        "The store link is a look-alike domain, not the official shop.",
        "A 90%-off \"today only\" price is the classic too-good-to-be-true bait.",
        "The real cost is hidden — a small \"subscription\" buried in the fine print.",
        "Countdown timers and \"only 2 left\" are manufactured pressure, not facts."
      ],
      "moodHyped": "HYPED",
      "moodConvinced": "convinced",
      "doubtLabel": "{friend}'s doubt",
      "doubtConvinced": "· convinced",
      "deckTitle": "Make your case",
      "deckFallback": "No field evidence on record — argue from the fundamentals below.",
      "deckEvidence": "These are the clues you collected across the Physical Internet.",
      "deckSelect": "Select the arguments to present ({chosen}/{required} minimum).",
      "actionsReady": "Strong case. Hit them with it.",
      "actionsNeed": "Stack at least {required} arguments before you confront {friend}.",
      "convinceButton": "🛑 Convince {friend}",
      "learnLabel": "The real defence:",
      "learnPre": "no single trick catches every scam — slowing down does. Before you buy, stack the checks: read the ",
      "learnUrl": "URL",
      "learnMid1": ", look for the ",
      "learnDisclosure": "disclosure",
      "learnMid2": ", find the ",
      "learnPrice": "true price",
      "learnMid3": ", and name the ",
      "learnPressure": "pressure tactic",
      "learnPost": ". Evidence beats urgency every time."
    }
  }
}
