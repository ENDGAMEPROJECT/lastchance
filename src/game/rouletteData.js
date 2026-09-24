// Selection rules are revealed in feedback after the player judges the spins.
export const ROULETTE_WHEELS = [
  { id: 'w1', highlight: 3, forced: 3, minimumPurchase: 60, reason: 'forcedOffer', options: ['wonOnce', 'forcedOffer', 'colours'] },
  { id: 'w2', highlight: 6, forced: null, reason: 'equalChance', options: ['equalChance', 'smallPrize', 'different'] },
  { id: 'w3', highlight: 5, forced: 7, retryBait: true, reason: 'forcedLoss', options: ['lostOnce', 'expensive', 'forcedLoss'] },
  { id: 'w4', highlight: 4, forced: null, reason: 'honestLoss', options: ['manyPrizes', 'honestLoss', 'lostOnce'] },
]
export const ROULETTE_SEGMENTS = 8
export function rouletteResult(wheel, random = Math.random) {
  return wheel.forced ?? Math.floor(random() * ROULETTE_SEGMENTS)
}
export function correctRouletteVerdict(wheel, verdict) {
  return verdict === (wheel.forced === null ? 'fair' : 'rigged')
}
export function correctRouletteAnswer(wheel, verdict, reason) {
  return correctRouletteVerdict(wheel, verdict) && reason === wheel.reason
}
