/* ============================================================
   TEST ITEMS — stable, English, analytics-only names for the
   pre-test / post-test question bank.

   The pre-test and the post-test ask the SAME items (i18n
   `story.rounds`), which is what makes them comparable; these slugs
   are therefore shared by both.

   Why this file exists at all: the questions and options themselves are
   localised, so they cannot name an xAPI activity — an activity id and
   its definition name must mean the same thing in every language. Each
   item here gets a slug and an English label that never change with the
   player's locale, and each option a slug naming the REASONING it
   represents rather than its on-screen letter (letters move if the
   options are ever reordered; the idea does not).

   Indexed by position in `story.rounds`. Keep in sync with it — the
   `npm run check:i18n` dynamic pass fails if the two drift.
   ============================================================ */

export const TEST_ITEMS = [
  {
    // i18n title: "The Timer"
    slug: 'q1-artificial-urgency',
    name: 'Spotting artificial urgency (the countdown)',
    correct: 'A',
    options: {
      A: 'countdown-can-be-fake',          // CORRECT
      B: 'countdown-is-pressure-tactic',   // true of THIS deal, but not yet knowable
      C: 'social-ad-means-safe-shop',
      D: 'real-shops-ask-card-in-chat',
    },
  },
  {
    // i18n title: "The Source & Feed"
    slug: 'q2-ad-targeting',
    name: 'Why the ad appeared: algorithmic targeting vs. folk theories',
    correct: 'D',
    options: {
      A: 'phone-mic-listening',
      B: 'everyone-sees-the-same-ads',
      C: 'celebrity-means-safe',
      D: 'algorithm-tracked-search-history', // CORRECT
    },
  },
  {
    /* i18n title: "The Destination".

       Renamed from `q3-url-inspection` / "Judging a link by its full URL": the
       November 2026 rewrite of the sheet turned this item from URL reading into
       distinguishing a genuine warning sign (an implausible price) from false
       trust signals (reviews, a brand logo, a look-alike domain that "is the
       same site"). The old id named a question that is no longer asked, so
       keeping it would have pooled two different items under one activity —
       worse than a visible break. Answers recorded before 17 Nov 2026 belong
       to the old item and are not comparable with these. */
    slug: 'q3-trust-signals',
    name: 'Telling a genuine warning sign from false trust signals',
    correct: 'C',
    options: {
      A: 'lookalike-domain-is-same-site',
      B: 'five-star-reviews-mean-real',
      C: 'implausible-price-is-warning',   // CORRECT
      D: 'brand-logo-means-official',
    },
  },
]

/* The item at a position in `story.rounds`, with a safe fallback so an added
   question reports as `qN-unnamed` rather than crashing a run. */
export function testItem(index) {
  return TEST_ITEMS[index] || {
    slug: `q${index + 1}-unnamed`,
    name: `Question ${index + 1}`,
    options: {},
  }
}

/* The slug for the option the player picked, by its i18n option key (A–D).
   Falls back to the raw key so an added option is still identifiable. */
export function optionSlug(index, key) {
  return testItem(index).options[key] || `option-${key}`
}
