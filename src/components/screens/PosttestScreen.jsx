import { useEffect, useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { bgUrl } from '../../game/assets.js'
import { posttestOutcome } from '../../game/posttestOutcome.js'
import InPersonTest from './InPersonTest.jsx'
import './conversation-screen.css'

/* POST-TEST — a mastery pass through the shared InPersonTest scene, then the
   final decision. What that decision means depends on how the player got here:

   - Puzzles finished in time (timedOut === false):
       SUCCESS (correct answers + "close the tab") → friend doesn't buy.
       FAIL (incorrect answers or "hit buy") → retry while time remains, or let the friend
       buy the tablet. If the countdown hits zero the reducer ends the run.
   - Time ran out before finishing (timedOut === true):
       The friend buys either way — SUCCESS and FAIL only change the copy on
       the lose screen ("convincing but not enough evidence" vs "not convinced").

   The remaining time covers the post-test and retries. A player who already
   ran out of time can finish the post-test, but cannot prevent the purchase. */
export default function PosttestScreen() {
  const { finishGame, startPosttestDecision, timedOut, timeLeft } = useGame()
  const t = useT()
  const script = t('story.posttest')
  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product }
  const [phase, setPhase] = useState('test') // 'test' | 'retry'
  const [run, setRun] = useState(0) // bump to replay the mastery pass

  useEffect(() => { startPosttestDecision() }, [startPosttestDecision])

  const resolveAttempt = (passed) => {
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
                onClick={() => { setRun((n) => n + 1); setPhase('test') }}
              >
                {t('story.posttest.retryAgain', vars)}
              </button>
              <button
                className="btn btn-lg btn-magenta"
                onClick={() => finishGame('lose', 'choseBuy')}
              >
                {t('story.posttest.retryGiveUp', vars)}
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
      masteryOpening={t('story.mastery.banner')}
      actions={[
        { label: script.choiceClose, tone: 'green', onClick: ({ passed }) => resolveAttempt(passed) },
        { label: script.choiceBuy, tone: 'magenta', onClick: () => resolveAttempt(false) },
      ]}
    />
  )
}
