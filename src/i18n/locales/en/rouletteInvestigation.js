/* Roulette investigation display text. Structural rules live in game/rouletteData.js. */
export default {
  "intro": "Spin each wheel. Spot the trick and explain your choice.",
  "wheelProgress": "Wheel {n} / {total}",
  "spinAgain": "Spin again",
  "changeVerdict": "Change my decision",
  "solvedTitle": "Corridor cleared — claims checked",
  "solvedText": "You compared repeated spins, explained your suspicions and discovered how each wheel worked.",
  "evidence": "Rigged wheels can use conditional coupons to make you spend more, or promises of another chance to keep you playing longer.",
  "progress": "Cases justified · {n} / {total}",
  "result": "Result: {result}",
  "noSpin": "No spins yet",
  "checked": "✓ Checked",
  "inspect": "Inspect",
  "rulesLabel": "Advertised rules:",
  "historyLabel": "Spins: {n} · Latest results:",
  "verdictLabel": "Does the draw follow its advertised rules?",
  "verdictCorrectRigged": "Correct: this wheel is rigged. Now explain why.",
  "verdictCorrectFair": "Correct: this wheel is not rigged. Now explain why.",
  "verdictWrong": "Incorrect. Review the results and try again.",
  "verdicts": {
    "rigged": "Rigged",
    "fair": "Not rigged"
  },
  "reasonLabel": "Which explanation fits this offer?",
  "chooseReason": "Choose a reason…",
  "check": "Check my reasoning",
  "retry": "Try another spin and compare the results. You can change your decision. Repeated results can also happen by chance.",
  "correct": "Case explained",
  "next": "Next wheel →",
  "finish": "Log the evidence ✓",
  "wheels": {
    "w1": {
      "name": "MEGA SPIN",
      "segments": [
        "5% OFF",
        "10% OFF",
        "15% OFF",
        "50% OFF",
        "20% OFF",
        "25% OFF",
        "30% OFF",
        "No prize"
      ],
      "rules": "Spin to unlock a discount coupon — up to 50% off!",
      "feedback": "This wheel is rigged: it is programmed to land on the 50% coupon every time. The other discounts are decoration, making a fixed offer look like a lucky win. You must then make a purchase to unlock the coupon and another to use it. The aim is to make you spend more.",
      "options": {
        "wonOnce": "The coupon gives me 50% off the purchase needed to unlock it.",
        "forcedOffer": "It pushes me to buy once to unlock the coupon, then buy again to use it.",
        "colours": "I can add the coupon to my account without buying anything."
      }
    },
    "w2": {
      "name": "LUCKY WHEEL",
      "segments": [
        "1 coin",
        "2 coins",
        "3 coins",
        "4 coins",
        "5 coins",
        "6 coins",
        "10 coins",
        "No prize"
      ],
      "rules": "Free spin! Try your luck for up to 10 game coins.",
      "feedback": "The offer is a chance to win up to 10 game coins, not a promise of 10 coins every time or money to withdraw. Smaller prizes and the visible no-prize slice fit that offer. This simulated wheel selects randomly; a few spins alone would not prove that a real wheel is fair.",
      "options": {
        "equalChance": "It offers a chance at up to 10 game coins, so smaller prizes or no prize fit the offer.",
        "smallPrize": "Every free spin should give me the advertised 10 coins.",
        "different": "The coins I win can be withdrawn as real money."
      }
    },
    "w3": {
      "name": "GOLD RUSH",
      "segments": [
        "Phone",
        "Tablet",
        "€100",
        "Console",
        "Headset",
        "Laptop",
        "€50",
        "No prize"
      ],
      "rules": "Win a phone, a laptop or up to €100 — give it a spin!",
      "feedback": "This wheel forces “No prize”, then tempts you with another chance. The aim is to keep you spending time on the game. On a site with ads, that can mean more adverts seen. Another spin does not bring you closer to a win: in this simulated wheel, the prizes cannot be selected.",
      "options": {
        "lostOnce": "Seven prize slices guarantee I will win within eight spins.",
        "expensive": "Each loss makes the next spin more likely to win a big prize.",
        "forcedLoss": "It keeps giving me nothing while using big prizes and “try again” to keep me playing."
      }
    },
    "w4": {
      "name": "BONUS DROP",
      "segments": [
        "1 point",
        "2 points",
        "3 points",
        "4 points",
        "8 points",
        "5 points",
        "6 points",
        "No prize"
      ],
      "rules": "Your free bonus spin: win up to 8 game points!",
      "feedback": "The offer is for game points, not cash or a shopping discount. Eight is the largest prize; smaller amounts and no prize are also shown on the wheel. This simulated draw is random. Winning or losing a few spins does not establish whether a real draw is fair.",
      "options": {
        "manyPrizes": "These points give me a discount on my next purchase.",
        "honestLoss": "The offer is for game points, and the wheel openly includes a no-prize outcome.",
        "lostOnce": "“Up to 8 points” means I must receive at least 8 points."
      }
    }
  },
  "observe": "Spin at least {count} times. Does it keep landing on the same slice, or do the results change? You can spin again if you are unsure.",
  "shop": {
    "badge": "MEGA SPIN · STORE",
    "title": "You won a discount coupon!",
    "coupon": "50% OFF",
    "terms": "To add your coupon to your account, first make a purchase of at least €{amount}. Your 50% discount will be available for a later order.",
    "dismiss": "Back to the wheel",
    "reminder": "Store offer: spend at least €{amount} first to unlock your coupon for a later order."
  },
  "retryBait": "“No prize this time! Keep spinning — your next try could be the big win!”"
}
