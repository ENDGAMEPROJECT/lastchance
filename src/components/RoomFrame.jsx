import { useState } from 'react'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import './RoomFrame.css'

const NODE_ICON = {
  'link-district': '🚪',
  'roulette-corridor': '🎡',
  'influencer-avenue': '📱',
  'algorithm-room': '🖥️',
  'ads-corridor': '📢',
  'persuasion-room': '🖼️',
  'final-decision': '🔓',
}

/* Consistent chrome for every district/corridor.
   On entry it shows a BRIEFING card (the room name + the task, explained
   in-scene). The player clicks Begin to step in, which reveals the
   interactive puzzle (children). This makes navigation feel like walking
   into a room rather than jumping straight into a task.

   Props:
   - node: current node (title/subtitle/accent)
   - intro: the task explanation, shown on the briefing card
   - bgImage: optional background image slot
   - solved / solvedTitle / solvedText / onContinue: the cleared bar
   - children: the interactive puzzle UI (mounted only after Begin)
*/
export default function RoomFrame({
  node,
  intro,
  bgImage,
  dimBackground = false,
  solved = false,
  solvedTitle,
  solvedText,
  onContinue,
  children,
}) {
  const t = useT()
  const accent = node?.accent || 'cyan'
  const vars = { friend: NARRATIVE.friend }
  const [started, setStarted] = useState(false)

  const title = node ? t(`nodes.${node.id}.title`, vars) : ''
  const subtitle = node ? t(`nodes.${node.id}.subtitle`, vars) : ''
  const brief = intro || (node ? t(`nodes.${node.id}.blurb`, vars) : '')

  return (
    <div className="scene room-scene">
      {bgImage && <div className="bg-slot" style={{ backgroundImage: `url(${bgImage})` }} />}
      {/* Optional lights-out layer: darkens the background image itself. Sits
          just above .bg-slot but behind all interactive content. */}
      {dimBackground && <div className="bg-blackout" aria-hidden />}

      {!started ? (
        <div className="room-briefing fade-in">
          <div className={`briefing-card panel clip panel-glow-${accent}`}>
            <div className={`briefing-icon accent-${accent}`}>{node ? NODE_ICON[node.id] : '▶'}</div>
            <div className={`eyebrow accent-${accent}`}>{subtitle}</div>
            <h2 className="briefing-title">{title}</h2>
            <p className="briefing-text muted">{brief}</p>
            <button className={`btn btn-${accent} btn-lg briefing-begin`} onClick={() => setStarted(true)}>
              {t('common.begin')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="room-header fade-in">
            <div className={`eyebrow accent-${accent}`}>{subtitle}</div>
            <h2>{title}</h2>
            <p className="muted">{brief}</p>
          </div>

          <div className="room-body swap-in">{children}</div>

          {solved && (
            <div className="room-cleared-overlay fade-in">
              <div className="room-cleared panel clip panel-glow-green">
                <div className="cleared-left">
                  <span className="cleared-badge">✓</span>
                  <div>
                    <div className="cleared-title">{solvedTitle || t('roomframe.clearedDefaultTitle')}</div>
                    <div className="cleared-text muted t-sm">{solvedText || t('roomframe.clearedDefaultText')}</div>
                  </div>
                </div>
                <button className="btn btn-green" onClick={onContinue}>{t('common.continue')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
