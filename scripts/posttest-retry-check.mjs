import assert from 'node:assert/strict'
import { mergePosttestAnswers, pendingPosttestQuestions, passedPosttest, posttestOutcome } from '../src/game/posttestOutcome.js'

let answers = [false, false, false]
let pending = pendingPosttestQuestions(answers, 3)
answers = mergePosttestAnswers(answers, pending, [false, true, false])
assert.deepEqual(pendingPosttestQuestions(answers, 3), [0, 2])
assert.equal(passedPosttest(answers, 3), false)
assert.deepEqual(posttestOutcome({ timedOut: false, timeLeft: 100, passed: false }), { outcome: 'retry' })
pending = pendingPosttestQuestions(answers, 3)
answers = mergePosttestAnswers(answers, pending, [true, false])
assert.deepEqual(answers, [true, true, false])
assert.deepEqual(pendingPosttestQuestions(answers, 3), [2])
answers = mergePosttestAnswers(answers, [2], [true])
assert.equal(passedPosttest(answers, 3), true)
assert.deepEqual(pendingPosttestQuestions(answers, 3), [])
assert.deepEqual(posttestOutcome({ timedOut: false, timeLeft: 40, passed: true }), { outcome: 'win' })
assert.deepEqual(posttestOutcome({ timedOut: false, timeLeft: 0, passed: false }), { outcome: 'lose', reason: 'timeUp' })
for (const passed of [true, false]) {
  assert.deepEqual(posttestOutcome({ timedOut: true, timeLeft: 0, passed }), {
    outcome: 'lose', reason: passed ? 'notEnoughEvidenceConvincing' : 'notEnoughEvidenceUnconvincing',
  })
}
assert.equal(passedPosttest(Array(3), 3), false)
assert.deepEqual(mergePosttestAnswers([true, false, true], [1], []), [true, false, true])
console.log('Post-test retry checks passed: cumulative answers, shrinking retries, automatic outcomes and timeout.')
