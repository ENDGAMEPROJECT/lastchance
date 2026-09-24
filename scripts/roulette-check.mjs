import assert from 'node:assert/strict'
import { ROULETTE_WHEELS, ROULETTE_SEGMENTS, rouletteResult, correctRouletteVerdict, correctRouletteAnswer } from '../src/game/rouletteData.js'

for (const wheel of ROULETTE_WHEELS) {
  // Every random interval maps to its own slice on fair wheels;
  // rigged wheels ignore all random inputs.
  const outcomes = Array.from({ length: ROULETTE_SEGMENTS }, (_, index) =>
    rouletteResult(wheel, () => (index + 0.5) / ROULETTE_SEGMENTS))
  if (wheel.forced === null) {
    assert.deepEqual(outcomes, [0, 1, 2, 3, 4, 5, 6, 7])
    assert.equal(rouletteResult(wheel, () => 0), 0)
    assert.equal(rouletteResult(wheel, () => 0.999999), 7)
  } else assert.ok(outcomes.every((result) => result === wheel.forced))

  const verdict = wheel.forced === null ? 'fair' : 'rigged'
  assert.equal(correctRouletteVerdict(wheel, verdict), true)
  assert.equal(correctRouletteVerdict(wheel, verdict === 'fair' ? 'rigged' : 'fair'), false)
  assert.equal(correctRouletteVerdict(wheel, undefined), false)
  assert.equal(correctRouletteAnswer(wheel, verdict, wheel.reason), true)
  assert.equal(correctRouletteAnswer(wheel, verdict, 'lostOnce'), false)
  assert.equal(correctRouletteAnswer(wheel, verdict === 'fair' ? 'rigged' : 'fair', wheel.reason), false)
  assert.equal(correctRouletteAnswer(wheel, verdict, undefined), false)
}
console.log('Roulette checks passed: random slices, forced outcomes and required justifications.')
