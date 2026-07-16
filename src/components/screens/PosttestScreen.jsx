import { useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { DEBUG } from '../../game/settings.js'
import Conversation from '../Conversation.jsx'
import ProductPreview from '../ProductPreview.jsx'
import './conversation-screen.css'

/* POST-TEST — shown when the game ends. An uninterrupted diagnostic pass,
   then a mastery pass (feedback, must be correct) ending in the final
   decision: close the tab (win) or hit buy (lose). The deal is on the
   phone beside the chat, its countdown nearly at zero. */
export default function PosttestScreen() {
  const { finishGame } = useGame()
  const t = useT()
  const friend = NARRATIVE.friend
  const p = t('story.posttest')
  const [phase, setPhase] = useState('diagnostic') // 'diagnostic' → 'mastery'
  const eyebrow = (DEBUG ? `${p.debugTag} · ` : '') + p.eyebrow
  const reply = t('story.respondPrompt', { friend })

  return (
    <div className="scene convo-scene">
      <div className="bg-slot" style={{ backgroundImage: 'url(/bg/conversation.png)' }} />
      <div className="convo-head fade-in">
        <div className="eyebrow accent-magenta">{eyebrow}</div>
        <h2>{t('story.posttest.title', { friend })}</h2>
      </div>

      <div className="convo-layout">
        <ProductPreview seconds={120} urgent />
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
        ) : (
          <Conversation
            key="mastery"
            opening={t('story.mastery.banner')}
            rounds={t('story.rounds')}
            mode="mastery"
            friend={friend}
            replyLabel={reply}
            ending={{
              friend: p.endingFriend,
              actions: [
                { label: p.choiceClose, tone: 'green', onClick: () => finishGame('win') },
                { label: p.choiceBuy, tone: 'magenta', onClick: () => finishGame('lose') },
              ],
            }}
          />
        )}
      </div>
    </div>
  )
}
