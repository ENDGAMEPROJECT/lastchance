import { useEffect, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'
import { mergePosttestAnswers, passedPosttest, pendingPosttestQuestions, posttestOutcome } from '../game/posttestOutcome.js'
import InPersonTest from '../components/screens/InPersonTest.jsx'
import '../components/screens/conversation-screen.css'

/* POST-TEST — a mastery pass through the shared InPersonTest scene, then the
   final decision. What that decision means depends on how the player got here:

   - Puzzles finished in time (timedOut === false):
       SUCCESS (all answers correct) → friend doesn't buy.
       FAIL → retry only unanswered/incorrect questions while time remains.
       If the countdown hits zero the reducer ends the run.
   - Time ran out before finishing (timedOut === true):
       The friend buys either way — SUCCESS and FAIL only change the copy on
       the lose screen ("convincing but not enough evidence" vs "not convinced").

   The remaining time covers the post-test and retries. A player who already
   ran out of time can finish the post-test, but cannot prevent the purchase. */
export default function FinalDecision() {
  const { finishGame, startPosttestDecision, timedOut, timeLeft } = useGame()
  const t = useT()
  const script = t('story.posttest')
  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product }
  const [phase, setPhase] = useState('test') // 'test' | 'retry'
  const [run, setRun] = useState(0) // bump to replay the mastery pass
  const totalQuestions = t('story.rounds').length
  const [answers, setAnswers] = useState(() => Array(totalQuestions).fill(false))
  const [questionIndices, setQuestionIndices] = useState(() => pendingPosttestQuestions([], totalQuestions))

  useEffect(() => { startPosttestDecision() }, [startPosttestDecision])

  const resolveAttempt = (attempt) => {
    const nextAnswers = mergePosttestAnswers(answers, questionIndices, attempt)
    setAnswers(nextAnswers)
    const passed = passedPosttest(nextAnswers, totalQuestions)
    const result = posttestOutcome({ timedOut, timeLeft, passed })
    if (result.outcome === 'retry') setPhase('retry')
    else finishGame(result.outcome, result.reason)
  }

  if (phase === 'retry') {
    return (
      <div className="scene convo-scene">
        <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('conversation.png')})` }} />
        <div className="convo-layout">
          <div className="pt-retry panel clip fade-in">
            <p className="pt-retry-line">{t('story.posttest.retryFriend', vars)}</p>
            <div className="pt-retry-actions">
              <button
                className="btn btn-lg btn-green"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuestionIndices(pendingPosttestQuestions(answers, totalQuestions))
                  setRun((n) => n + 1)
                  setPhase('test')
                }}
              >
                {t('story.posttest.retryAgain', vars)}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <InPersonTest
      key={run}
      script={script}
      requirePhoneView={false}
      assessment
      questionIndices={questionIndices}
      skipOpening={run > 0}
      onComplete={resolveAttempt}
      assessmentEnding={(passed) => timedOut
        ? t(passed ? 'end.lose.reasons.notEnoughEvidenceConvincing.body' : 'end.lose.reasons.notEnoughEvidenceUnconvincing.body', vars)
        : t(passed ? 'story.posttest.convinced' : 'story.posttest.retryFriend', vars)}
      masteryOpening={t('story.mastery.banner')}
    />
  )
}
