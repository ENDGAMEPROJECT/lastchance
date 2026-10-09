import assert from 'node:assert/strict'
import { ROULETTE_WHEELS, ROULETTE_SEGMENTS, rouletteResult, correctRouletteVerdict, correctRouletteAnswer } from '../src/game/rouletteData.js'

assert.deepEqual(ROULETTE_WHEELS.map((wheel) => wheel.id), ['w1', 'w3'], 'Only the discount and prize wheels remain')
assert.equal(ROULETTE_WHEELS[0].forced, 3, 'The discount wheel always lands on 50% off')
assert.equal(ROULETTE_WHEELS[1].forced, 7, 'The prize wheel always lands on no prize')

for (const wheel of ROULETTE_WHEELS) {
  // Both wheels ignore random inputs; only their own motive is a valid answer.
  assert.equal(wheel.icons.length, ROULETTE_SEGMENTS)
  const outcomes = Array.from({ length: ROULETTE_SEGMENTS }, (_, index) =>
    rouletteResult(wheel, () => (index + 0.5) / ROULETTE_SEGMENTS))
  assert.ok(outcomes.every((result) => result === wheel.forced))
  assert.equal(rouletteResult(wheel, () => { throw new Error('Rigged wheels must not draw randomly') }), wheel.forced)

  const verdict = wheel.forced === null ? 'fair' : 'rigged'
  assert.equal(correctRouletteVerdict(wheel, verdict), true)
  assert.equal(correctRouletteVerdict(wheel, verdict === 'fair' ? 'rigged' : 'fair'), false)
  assert.equal(correctRouletteVerdict(wheel, undefined), false)
  assert.equal(correctRouletteAnswer(wheel, verdict, wheel.reason), true)
  assert.equal(correctRouletteAnswer(wheel, verdict, 'lostOnce'), false)
  assert.equal(correctRouletteAnswer(wheel, verdict === 'fair' ? 'rigged' : 'fair', wheel.reason), false)
  assert.equal(correctRouletteAnswer(wheel, verdict, undefined), false)
}
console.log('Roulette checks passed: two rigged wheels, forced coupon/loss and required justifications.')
