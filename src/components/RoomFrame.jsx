import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
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
   - solved / solvedText / reward / onContinue: the cleared overlay and collect step
   - children: the interactive puzzle UI (mounted only after Begin)
*/
export default function RoomFrame({
  node,
  intro,
  bgImage,
  dimBackground = false,
  solved = false,
  solvedText,
  reward = null,
  onContinue,
  children,
}) {
  const t = useT()
  const { startRoom, addItem, hasItem, screen, narrative } = useGame()
  const accent = node?.accent || 'cyan'
  const vars = { friend: narrative.friend }
  const [started, setStarted] = useState(false)
  const collectRef = useRef(null)
  const continueRef = useRef(null)
  const collected = !!reward && hasItem(reward.id)
  const canContinue = !reward || collected
  const rewardName = reward ? t(`items.${reward.id}.name`, vars) : ''
  const rewardImage = reward?.id === 'dataReport' ? narrative.reportImage : reward?.image

  useEffect(() => {
    if (!started || !solved || screen !== 'room') return
    const target = canContinue ? continueRef.current : collectRef.current
    target?.focus({ preventScroll: true })
  }, [started, solved, screen, canContinue])

  function collectReward() {
    if (reward && !hasItem(reward.id)) addItem(reward)
  }

  function keepFocusInOverlay(event) {
    if (event.key !== 'Tab') return
    const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')]
    if (!buttons.length) return
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus({ preventScroll: true })
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus({ preventScroll: true })
    }
  }

  // Titles and "Puzzle N ·" subtitles are metadata clutter inside a room — the
  // map already names each district. Rooms show only their task brief + icon.
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
            <p className="briefing-text muted">{brief}</p>
            <button
              className={`btn btn-${accent} btn-lg briefing-begin`}
              onClick={() => {
                setStarted(true)
                startRoom()
              }}
            >
              {t('common.begin')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* The task brief is shown once on the entry briefing card; during
              play the puzzle speaks for itself, so no persistent header. */}
          <div className="room-body swap-in" inert={solved ? '' : undefined} aria-hidden={solved || undefined}>{children}</div>

          {solved && (
            <div className="room-cleared-overlay" onKeyDown={keepFocusInOverlay}>
              <section className="room-cleared" role="dialog" aria-modal="true"
                aria-labelledby="room-cleared-title" aria-describedby="room-cleared-description">
                <div className="cleared-summary">
                  <span className="cleared-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
                  </span>
                  <h2 id="room-cleared-title" className="cleared-title">{t('roomframe.clearedDefaultTitle')}</h2>
                  <p id="room-cleared-description" className="cleared-text">
                    {solvedText || t('roomframe.clearedDefaultText')}
                  </p>
                </div>

                {reward && (
                  <section className={`cleared-reward ${collected ? 'is-collected' : ''}`} aria-labelledby="cleared-reward-name">
                    <div className="reward-art" aria-hidden="true"
                      style={rewardImage ? { backgroundImage: `url("${bgUrl(rewardImage)}")` } : undefined}>
                      {!reward.image && <span className="reward-icon">{reward.icon}</span>}
                    </div>
                    <div className="reward-info">
                      <div className="reward-eyebrow">{t('roomframe.rewardLabel')}</div>
                      <h3 id="cleared-reward-name" className="reward-name">{rewardName}</h3>
                      <p className="reward-desc">{t(`items.${reward.id}.desc`, vars)}</p>
                      <button ref={collectRef} type="button" className="btn btn-amber reward-collect"
                        disabled={collected} onClick={collectReward}
                        onMouseDown={(event) => event.preventDefault()}>
                        {collected && <svg className="reward-collected-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
                      <span>{collected ? <> {rewardName} {t('roomframe.collected')} </> : t('roomframe.collect')}</span> 
                      </button>
                      <p className="reward-confirmation" role="status">
                        {collected ? <>{rewardName} {t('roomframe.addedToBag')} </> : ''}
                      </p>
                    </div>
                  </section>
                )}

                {canContinue && (
                  <div className="cleared-actions">
                    <button ref={continueRef} type="button" className="btn btn-green"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => { if (!reward || hasItem(reward.id)) onContinue?.() }}>
                      {t('common.continue')}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
