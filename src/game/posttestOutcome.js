export function passedPosttest(answers, total) {
  return total > 0 && answers.length === total && answers.every((answer) => answer === true)
}

export function posttestOutcome({ timedOut, timeLeft, passed }) {
  if (timedOut) return { outcome: 'lose', reason: passed ? 'notEnoughEvidenceConvincing' : 'notEnoughEvidenceUnconvincing' }
  if (timeLeft <= 0) return { outcome: 'lose', reason: 'timeUp' }
  return passed ? { outcome: 'win' } : { outcome: 'retry' }
}
