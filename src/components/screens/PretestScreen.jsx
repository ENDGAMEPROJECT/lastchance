import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { DEBUG } from '../../game/settings.js'
import { bgUrl } from '../../game/assets.js'
import Conversation from '../Conversation.jsx'
import ProductPreview from '../ProductPreview.jsx'
import './conversation-screen.css'

/* PRE-TEST — the story, told as a diagnostic conversation with the friend,
   the scam "deal" shown on a phone beside the chat. Any answer advances;
   it ends on the ultimatum and a button that starts the game clock. */
export default function PretestScreen() {
  const { startGame } = useGame()
  const t = useT()
  const friend = NARRATIVE.friend
  const p = t('story.pretest')
  const eyebrow = (DEBUG ? `${p.debugTag} · ` : '') + p.eyebrow

  return (
    <div className="scene convo-scene">
      <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('conversation.png')})` }} />
      <div className="convo-head fade-in">
        <div className="eyebrow accent-cyan">{eyebrow}</div>
        <h2>{t('story.pretest.title', { friend })}</h2>
      </div>

      <div className="convo-layout">
        <ProductPreview seconds={30 * 60} />
        <Conversation
          opening={p.opening}
          rounds={t('story.rounds')}
          responses={p.responses}
          mode="diagnostic"
          friend={friend}
          replyLabel={t('story.respondPrompt', { friend })}
          ending={{
            friend: p.endingFriend,
            you: p.endingYou,
            actions: [{ label: p.begin, tone: 'cyan', onClick: startGame }],
          }}
        />
      </div>
    </div>
  )
}
