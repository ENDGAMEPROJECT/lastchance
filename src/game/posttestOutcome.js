export function passedPosttest(answers, total) {
  return total > 0 && answers.length === total && Array.from(answers).every((answer) => answer === true)
}

export function pendingPosttestQuestions(answers, total) {
  return Array.from({ length: total }, (_, index) => index).filter((index) => answers[index] !== true)
}

export function mergePosttestAnswers(previous, indices, attempt) {
  const next = [...previous]
  indices.forEach((index, position) => {
    next[index] = previous[index] === true || attempt[position] === true
  })
  return next
}

export function posttestOutcome({ timedOut, timeLeft, passed }) {
  if (timedOut) return { outcome: 'lose', reason: passed ? 'notEnoughEvidenceConvincing' : 'notEnoughEvidenceUnconvincing' }
  if (timeLeft <= 0) return { outcome: 'lose', reason: 'timeUp' }
  return passed ? { outcome: 'win' } : { outcome: 'retry' }
}
