/* Ads Corridor (between Puzzle 3 and 4) strings. */
export default {
  intro:
    'A neon service tunnel plastered with four glowing ad posters. They look generous. They are not.',
  solvedTitle: 'Corridor cleared — you read the fine print',
  solvedText:
    'The exit hisses open. You logged the hidden €59/month auto-renewal as evidence against the deal.',

  pickup: 'You pick up the Truth Flashlight 🔦',

  torchCharging: '🔦 Charging…',
  torchOn: '🔦 Flashlight ON',
  torchOff: '🔦 Truth Flashlight',
  hintCharging:
    'The cheap torch flickers awake — bait ads love to waste a moment of your time…',
  hintOn: 'Now shine it on each poster to burn away the gloss.',
  hintOff: 'Switch it on, then reveal what the posters really say.',

  glossyCta: 'TAP TO CLAIM →',
  fineprint: '* terms & conditions apply',
  truthTag: 'THE TRUTH',
  codeFragment: 'hidden letter: ',

  shineRevealed: '✓ Revealed',
  shineReady: '🔦 Shine light here',
  shineOff: 'Turn on the light first',

  codeAssembled: 'ACCESS CODE assembled: ',
  codeLetters: 'S-A-V-E',

  exitLabel: 'Enter the 4-letter code to open the exit',
  exitPlaceholder: '????',
  exitButton: 'Open exit →',
  errCode:
    'That is not the code. Illuminate all four posters and read the letters hiding in the fine print.',

  learnLabel: 'Read the fine print.',
  learn:
    'Ads shouting “free”, “you won” or “$0 today” usually hide the real cost in tiny print below — always read what you are actually agreeing to before you tap.',

  evidence:
    'Behind the “free trial” ad was a hidden €59/month auto-renewing subscription.',

  posters: [
    {
      glossyTitle: 'FREE 30-DAY TRIAL!',
      glossyBody: 'Try NovaCloud Premium — $0 today!',
      glossyBadge: '$0',
      truth:
        '…then auto-renews at €59/month. Cancelling requires calling a phone line open 2 hours a week.',
    },
    {
      glossyTitle: '🎉 CONGRATULATIONS!',
      glossyBody: "You've WON a €1,000 gift card! Tap to claim.",
      glossyBadge: '€1000',
      truth:
        "You did NOT win anything. This 'prize' harvests your personal data and card details.",
    },
    {
      glossyTitle: '📈 GET RICH QUICK!',
      glossyBody: 'Turn €100 into €10,000 in one week — guaranteed!',
      glossyBadge: '×100',
      truth:
        'A pure scam. Every euro you “invest” is gone, and the sky-high “returns” on screen are fake.',
    },
    {
      glossyTitle: '🛡️ VIRUS DETECTED!',
      glossyBody: 'Your device may be at risk — download SecureNow FREE!',
      glossyBadge: 'FREE',
      truth:
        'The warning is fake and the “antivirus” IS the malware. Real alerts never come from an ad.',
    },
  ],
}
