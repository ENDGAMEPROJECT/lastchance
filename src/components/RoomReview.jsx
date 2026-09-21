import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'

const ROOM_KEY = {
  'link-district': 'link',
  'roulette-corridor': 'roulette',
  'influencer-avenue': 'influencer',
  'algorithm-room': 'algorithm',
  'ads-corridor': 'ads',
  'persuasion-room': 'persuasion',
}

export default function RoomReview() {
  const { reviewNodeData, goMap } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend }
  const roomKey = reviewNodeData ? ROOM_KEY[reviewNodeData.id] : null

  if (!reviewNodeData || !roomKey) return null

  return (
    <div className="scene room-review-scene">
      <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('map/map-bg.png')})` }} />
      <div className={`room-review panel clip panel-glow-${reviewNodeData.accent} fade-in`}>
        <div className={`eyebrow accent-${reviewNodeData.accent}`}>{t(`nodes.${reviewNodeData.id}.subtitle`, vars)}</div>
        <h2>{t(`rooms.${roomKey}.solvedTitle`, vars)}</h2>
        <p className="muted">{t(`rooms.${roomKey}.solvedText`, vars)}</p>
        <button className={`btn btn-${reviewNodeData.accent}`} onClick={goMap}>
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
