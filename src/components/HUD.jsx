import { useState } from 'react'
import { useGame, formatTime } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import { DEBUG } from '../game/settings.js'
import { isMuted, setMuted } from '../game/sound.js'
import { getHintContext } from '../game/hints.js'
import Modal from './Modal.jsx'
import './HUD.css'

/* Persistent top bar: countdown, mission recap, inventory & map access. */
export default function HUD() {
  const { screen, activeNodeId, timeLeft, inventory, evidence, goMap } = useGame()
  const t = useT()
  const [bagOpen, setBagOpen] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)
  const [muted, setMutedState] = useState(isMuted())
  const toggleMute = () => setMutedState(setMuted(!muted))
  const hintContext = getHintContext(screen, activeNodeId)
  const hints = t(`hints.${hintContext}.items`)

  const low = timeLeft <= 300 // last 5 min
  const critical = timeLeft <= 60

  return (
    <>
      <header className="hud">
        <div className="hud-left">
          <span className="hud-logo" aria-label={t('hud.logo')}>◉</span>
          <span className="hud-sub mono">{t('hud.expires')}</span>
        </div>

        <div className={`hud-timer ${low ? 'low' : ''} ${critical ? 'critical pulse' : ''}`}>
          <span className="hud-timer-label mono">{t('hud.tminus')}</span>
          <span className="hud-timer-val mono">{formatTime(timeLeft)}</span>
        </div>

        <div className="hud-right">
          {DEBUG && <span className="chip bad hud-debug">🐞 DEBUG</span>}
          <button
            className="btn btn-amber btn-sm hud-hints"
            onClick={() => setHintsOpen(true)}
            aria-label={t('hud.hints')}
            title={t('hud.hints')}
          >
            {t('hud.hints')}
          </button>
          <button
            className="btn btn-ghost btn-sm hud-mute"
            onClick={toggleMute}
            aria-label={muted ? t('hud.unmuteSound') : t('hud.muteSound')}
            title={muted ? t('hud.unmuteSound') : t('hud.muteSound')}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {screen !== 'map' && (
            <button className="btn btn-cyan btn-sm" onClick={goMap}>
              {t('hud.map')}
            </button>
          )}
          <button className="btn btn-purple btn-sm" onClick={() => setBagOpen(true)}>
            {t('hud.bag')} {inventory.length > 0 && <b className="bag-count">{inventory.length}</b>}
          </button>
        </div>
      </header>

      <Modal open={hintsOpen} onClose={() => setHintsOpen(false)} title={t('hints.title')} accent="amber" width={620}>
        <p className="muted t-sm hints-context">{t(`hints.${hintContext}.context`)}</p>
        <ol className="hints-list">
          {hints.map((hint, index) => (
            <li key={index}>
              <span className="hint-number">{index + 1}</span>
              <span>{hint}</span>
            </li>
          ))}
        </ol>
      </Modal>

      <Modal open={bagOpen} onClose={() => setBagOpen(false)} title={t('hud.inventoryTitle')} accent="purple" width={620}>
        <div className="bag-section">
          <div className="eyebrow" style={{ color: 'var(--purple)' }}>{t('hud.tools')}</div>
          {inventory.length === 0 ? (
            <p className="muted t-sm">{t('hud.noTools')}</p>
          ) : (
            <div className="bag-grid">
              {inventory.map((it) => (
                <div key={it.id} className="bag-item panel">
                  <div className="bag-icon">{it.icon}</div>
                  <div>
                    <div className="bag-name">{t(`items.${it.id}.name`, { friend: NARRATIVE.friend })}</div>
                    <div className="bag-desc muted t-xs">{t(`items.${it.id}.desc`, { friend: NARRATIVE.friend })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bag-section">
          <div className="eyebrow" style={{ color: 'var(--green)' }}>{t('hud.evidenceHeading')}</div>
          {evidence.length === 0 ? (
            <p className="muted t-sm">{t('hud.noEvidence', { friend: NARRATIVE.friend })}</p>
          ) : (
            <ul className="evidence-list">
              {evidence.map((e) => (
                <li key={e.id}><span className="ev-dot" />{e.label}</li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  )
}
