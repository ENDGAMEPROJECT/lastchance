import { useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { DEBUG } from '../../game/settings.js'
import { bgUrl } from '../../game/assets.js'
import Conversation from '../Conversation.jsx'
import ProductPreview from '../ProductPreview.jsx'
import './conversation-screen.css'

/* POST-TEST — shown when the game ends. An uninterrupted diagnostic pass,
   then a mastery pass (feedback, must be correct) ending in the final
   decision. What that decision means depends on how the player got here:

   - Puzzles finished in time (timedOut === false):
       SUCCESS ("close the tab") → the friend doesn't buy → win.
       FAIL ("hit buy") → retry while the clock still runs, or let the friend
       buy the tablet. If the countdown hits zero the reducer ends the run.
   - Time ran out before finishing the puzzles (timedOut === true):
       The friend buys either way — SUCCESS and FAIL only change the copy on
       the lose screen ("convincing but not enough evidence" vs "not convinced").

   The deal is on the phone beside the chat, its countdown nearly at zero. */
export default function PosttestScreen() {
  const { finishGame, startPosttestDecision, timedOut, timeLeft, postDecision } = useGame()
  const t = useT()
  const friend = NARRATIVE.friend
  const p = t('story.posttest')
  const vars = { friend, product: NARRATIVE.product }
  // 'diagnostic' → 'mastery' → ('retry' only when puzzles were finished in time)
  const [phase, setPhase] = useState('diagnostic')
  const [masteryRun, setMasteryRun] = useState(0) // bump to replay the mastery pass
  const eyebrow = (DEBUG ? `${p.debugTag} · ` : '') + p.eyebrow
  const reply = t('story.respondPrompt', { friend })

  // SUCCESS — player told the friend to close the tab.
  const onSuccess = () =>
    timedOut ? finishGame('lose', 'notEnoughEvidenceConvincing') : finishGame('win')

  // FAIL — player told the friend to buy it.
  const onFail = () => {
    if (timedOut) finishGame('lose', 'notEnoughEvidenceUnconvincing')
    else setPhase('retry') // finished in time → offer another attempt
  }

  return (
    <div className="scene convo-scene">
      <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('conversation.png')})` }} />
      <div className="convo-head fade-in">
        <div className="eyebrow accent-magenta">{eyebrow}</div>
        <h2>{t('story.posttest.title', { friend })}</h2>
      </div>

      <div className="convo-layout">
        {/* The deal's countdown stays a static promise through the Q&A and only
            becomes a live clock once the final decision begins. */}
        {postDecision ? <ProductPreview remaining={timeLeft} /> : <ProductPreview staticOffer />}
        {phase === 'diagnostic' ? (
          <Conversation
            key="diagnostic"
            opening={p.opening}
            rounds={t('story.rounds')}
            responses={p.responses}
            mode="diagnostic"
            friend={friend}
            replyLabel={reply}
            onRoundsDone={() => setPhase('mastery')}
          />
        ) : phase === 'mastery' ? (
          <Conversation
            key={`mastery-${masteryRun}`}
            opening={t('story.mastery.banner')}
            rounds={t('story.rounds')}
            mode="mastery"
            friend={friend}
            replyLabel={reply}
            onRoundsDone={startPosttestDecision}
            ending={{
              friend: p.endingFriend,
              actions: [
                { label: p.choiceClose, tone: 'green', onClick: onSuccess },
                { label: p.choiceBuy, tone: 'magenta', onClick: onFail },
              ],
            }}
          />
        ) : (
          <div className="pt-retry panel clip fade-in">
            <p className="pt-retry-line">{t('story.posttest.retryFriend', vars)}</p>
            <div className="pt-retry-actions">
              <button
                className="btn btn-lg btn-green"
                onClick={() => {
                  setMasteryRun((n) => n + 1)
                  setPhase('mastery')
                }}
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
        )}
      </div>
    </div>
  )
}
