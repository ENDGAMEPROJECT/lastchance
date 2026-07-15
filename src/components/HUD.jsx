import { useState } from 'react'
import { useGame, formatTime } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import { DEBUG } from '../game/settings.js'
import Modal from './Modal.jsx'
import './HUD.css'

/* Persistent top bar: countdown, mission recap, inventory & map access. */
export default function HUD() {
  const { screen, timeLeft, inventory, evidence, goMap } = useGame()
  const t = useT()
  const [bagOpen, setBagOpen] = useState(false)

  if (['welcome', 'pretest', 'posttest', 'win', 'lose'].includes(screen)) return null

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
