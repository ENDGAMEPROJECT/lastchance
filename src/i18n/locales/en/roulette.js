/* Roulette Corridor (Gamified Bait) strings. */
export default {
  intro:
    'A corridor lined with dazzling prize wheels promising you win on every spin. Give them a whirl and watch what you actually get.',
  solvedTitle: 'Corridor cleared — you spotted the rigged wheels',
  solvedText:
    'Every wheel “wins” every single time — but the prize is always a worthless 30¢ coupon. That is not luck or generosity; it is an ad designed to make you feel lucky and spend. You saw through it.',

  spunBadge: 'Wheels spun · {spun} / {total}',
  riggedBadge: 'Marked rigged · {rigged} / {total}',
  spinAll: '🎰 Spin ALL',
  spin: '🎰 Spin',
  spinning: 'Spinning…',
  markRiggedLabel: 'Mark as',
  markRiggedWord: 'Rigged',

  won: '🎉 You won: ',
  wonSuffix: '!',

  hintSpinFirst: 'Spin a couple of wheels first — watch where they land before you decide.',
  hintSpinThis: 'Spin THIS wheel at least once before marking it. See what it does.',

  learnLead: 'A guaranteed “win”?',
  learnBody:
    'Spin wheels, daily login bonuses and loot boxes are engagement and advertising tricks, not generosity. They are rigged so you almost always “win” something — usually a tiny discount like 30¢ off — because feeling lucky makes you keep playing, share the app, and spend more. A prize you always get, worth almost nothing, isn\'t a gift. It\'s bait.',

  evidenceLabel: 'The prize wheels were rigged to always land on a worthless 30¢ coupon — bait to make you spend.',

  /* Wheel display names, tags and the 8 segment labels (clockwise from top).
     Prizes are deliberately modest; the wheel always lands on “30¢ OFF”. */
  wheels: {
    w1: {
      name: 'MEGA SPIN',
      tag: 'Daily bonus',
      segments: ['Try again', '5 coins', '2% off', '30¢ OFF', 'Try again', '1 coin', 'No prize', '2 coins'],
    },
    w2: {
      name: 'LUCKY WHEEL',
      tag: 'Spin to win',
      segments: ['1 coin', 'Try again', '30¢ OFF', 'No prize', '2 coins', 'Try again', '5 coins', '2% off'],
    },
    w3: {
      name: 'GOLD RUSH',
      tag: 'Login reward',
      segments: ['Try again', '2 coins', 'No prize', '1 coin', '5 coins', '30¢ OFF', 'Try again', '2% off'],
    },
    w4: {
      name: 'JACKPOT CITY',
      tag: 'Loot box',
      segments: ['2 coins', 'Try again', '1 coin', 'No prize', '5 coins', 'Try again', '30¢ OFF', '2% off'],
    },
  },
}
