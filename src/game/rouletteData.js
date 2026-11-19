// Selection rules are revealed in feedback after the player judges the spins.
// `xapiNo` is the number the wheel is known by in the LRS (objects/roulette<n>).
// Declared, not derived from array position, so reordering or adding a wheel
// cannot re-point an existing activity id. Checked by `npm run check:xapi`.
export const ROULETTE_WHEELS = [
  { id: 'w1', xapiNo: 1, highlight: 3, forced: 3, couponBait: true, icons: ['coupon', 'coupon', 'coupon', 'coupon', 'coupon', 'coupon', 'coupon', 'none'] },
  { id: 'w3', xapiNo: 2, highlight: 5, forced: 7, retryBait: true, icons: ['phone', 'tablet', 'cash', 'console', 'headset', 'laptop', 'cash', 'none'] },
]
export const ROULETTE_SEGMENTS = 8
export function rouletteResult(wheel, random = Math.random) {
  return wheel.forced ?? Math.floor(random() * ROULETTE_SEGMENTS)
}
export function correctRouletteVerdict(wheel, verdict) {
  return verdict === (wheel.forced === null ? 'fair' : 'rigged')
}
