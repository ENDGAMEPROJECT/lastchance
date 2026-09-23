import { useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { bgUrl } from '../../game/assets.js'
import InPersonTest from './InPersonTest.jsx'
import './conversation-screen.css'

/* POST-TEST — a mastery pass through the shared InPersonTest scene, then the
   final decision. What that decision means depends on how the player got here:

   - Puzzles finished in time (timedOut === false):
       SUCCESS ("close the tab") → the friend doesn't buy → win.
       FAIL ("hit buy") → retry while the clock still runs, or let the friend
       buy the tablet. If the countdown hits zero the reducer ends the run.
   - Time ran out before finishing (timedOut === true):
       The friend buys either way — SUCCESS and FAIL only change the copy on
       the lose screen ("convincing but not enough evidence" vs "not convinced").

   Entering retry resumes the (otherwise frozen) post-test clock via
   startPosttestDecision, so the extra attempts stay under time pressure. */
export default function PosttestScreen() {
  const { finishGame, startPosttestDecision, timedOut } = useGame()
  const t = useT()
  const script = t('story.posttest')
  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product }
  const [phase, setPhase] = useState('test') // 'test' | 'retry'
  const [run, setRun] = useState(0) // bump to replay the mastery pass

  // SUCCESS — player told the friend to close the tab.
  const onSuccess = () =>
    timedOut ? finishGame('lose', 'notEnoughEvidenceConvincing') : finishGame('win')

  // FAIL — player told the friend to buy it.
  const onFail = () => {
    if (timedOut) { finishGame('lose', 'notEnoughEvidenceUnconvincing'); return }
    // Finished in time → another attempt, now under the live countdown.
    startPosttestDecision()
    setPhase('retry')
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
      masteryOpening={t('story.mastery.banner')}
      actions={[
        { label: script.choiceClose, tone: 'green', onClick: onSuccess },
        { label: script.choiceBuy, tone: 'magenta', onClick: onFail },
      ]}
    />
  )
}
