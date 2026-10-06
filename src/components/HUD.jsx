import { useEffect, useState } from 'react'
import { useGame, formatTime } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { DEBUG } from '../game/settings.js'
import { isMuted, setMuted } from '../game/sound.js'
import { getHintContext, getHintPlan } from '../game/hints.js'
import Modal from './Modal.jsx'
import DataReport from './DataReport.jsx'
import DebugPosttestButtons from './DebugPosttestButtons.jsx'
import DebugPortalButton from './DebugPortalButton.jsx'
import './HUD.css'

/* Persistent top bar: countdown, mission recap, inventory & map access. */
export default function HUD() {
  const { screen, activeNodeId, roomStarted, linkRound, timeLeft, inventory, evidence, progress, goMap, postDecision, enterTour, narrative } = useGame()
  const t = useT()
  const [bagOpen, setBagOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [deniedItem, setDeniedItem] = useState(null)
  const [hintsOpen, setHintsOpen] = useState(false)
  const [muted, setMutedState] = useState(isMuted())
  const toggleMute = () => setMutedState(setMuted(!muted))
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullscreenError, setFullscreenError] = useState(false)

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement))
      setFullscreenError(false)
    }
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  const toggleFullscreen = async () => {
    setFullscreenError(false)
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setFullscreenError(true)
    }
  }
  const hintContext = getHintContext(screen, activeNodeId)
  const hints = t(`hints.${hintContext}.items`)
  const hintPlan = getHintPlan(screen, activeNodeId, progress)
  const objectiveNode = hintPlan.objectiveNode
  const objectiveKey = hintPlan.objectiveKey
  const nodeObjectiveKey = objectiveNode ? `nodes.${objectiveNode.id}` : null
  const linkRoundHint = screen === 'room' && roomStarted && activeNodeId === 'link-district' && linkRound !== null
    ? t(`hints.room.link.rounds.${linkRound}`)
    : null
  const linkRoundPrompt = screen === 'room' && roomStarted && activeNodeId === 'link-district' && linkRound !== null
    ? t(`hints.room.link.prompts.${linkRound}`)
    : null
  const baseHintPrompts = t(`hints.${hintContext}.prompts`)
  const hintPrompts = linkRoundPrompt
    ? [linkRoundPrompt, ...baseHintPrompts.filter((prompt) => prompt !== linkRoundPrompt)].slice(0, 3)
    : baseHintPrompts
  const [revealedHints, setRevealedHints] = useState([])

  useEffect(() => {
    setRevealedHints([])
  }, [hintsOpen, hintContext, linkRound])

  const toggleHint = (index) => {
    setRevealedHints((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index])
  }

  const itemRoom = { emojiCard: 'influencer-avenue', dataReport: 'algorithm-room', truthLight: 'ads-corridor' }
  const useItem = (item) => {
    if (itemRoom[item.id] !== activeNodeId) {
      setDeniedItem(item.id)
      window.setTimeout(() => setDeniedItem(null), 700)
      return
    }
    setBagOpen(false)
    if (item.id === 'dataReport') setReportOpen(true)
    else window.dispatchEvent(new CustomEvent('lastchance:use-item', { detail: { id: item.id } }))
  }

  const low = timeLeft <= 300
  const critical = timeLeft <= 60

  // The welcome/setup, pre-test and "step inside" transition all happen before
  // the clock starts, so there's no countdown to show. In the post-test the
  // clock stays hidden through the Q&A and only appears once the final decision
  // begins (postDecision). None of these screens are navigable, so hide the
  // Map/Bag shortcuts there too. (In debug the run starts straight on the map,
  // where both correctly appear.)
  const preGame = screen === 'welcome' || screen === 'pretest' || screen === 'enter'
  const showTimer = !preGame && (screen !== 'posttest' || postDecision)
  const showNav = !preGame && screen !== 'posttest'
  // The portal arrival walks the player through Map and Bag: the buttons appear
  // there for show (not clickable yet) and the one being explained is highlighted.
  const touring = screen === 'enter' && Boolean(enterTour)
  const tourClass = (target) => (touring ? `hud-tour-btn ${enterTour === target ? 'is-focus' : ''}` : '')
  // Hints only help where there's a live objective — a puzzle room, or the map
  // pointing at the next district. Elsewhere (setup, conversations, endings)
  // there's nothing to hint, so don't offer the button.
  const showHints = screen === 'room' || screen === 'map'

  return (
    <>
      <header className="hud">
        <div className="hud-left">
          <span className="hud-logo" aria-label={t('hud.logo')}>◉</span>
          {showTimer && <span className="hud-sub mono">{t('hud.expires')}</span>}
        </div>

        {showTimer && (
          <div className={`hud-timer ${low ? 'low' : ''} ${critical ? 'critical pulse' : ''}`}>
            <span className="hud-timer-label mono">{t('hud.tminus')}</span>
            <span className="hud-timer-val mono">{formatTime(timeLeft)}</span>
          </div>
        )}

        <div className="hud-right">
          {document.fullscreenEnabled && (
            <button
              type="button"
              className="btn btn-ghost btn-sm hud-fullscreen"
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggleFullscreen}
              aria-label={fullscreen ? t('hud.exitFullscreen') : t('hud.enterFullscreen')}
              title={fullscreen ? t('hud.exitFullscreen') : t('hud.enterFullscreen')}
              aria-pressed={fullscreen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d={fullscreen
                  ? 'M9 3v6H3m12-6v6h6M3 15h6v6m6 0v-6h6'
                  : 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'} />
              </svg>
            </button>
          )}
          {fullscreenError && <span role="alert" className="t-xs">{t('hud.fullscreenError')}</span>}
          {DEBUG && ['posttest', 'win', 'lose'].includes(screen) && <DebugPosttestButtons />}
          {DEBUG && ['welcome', 'pretest'].includes(screen) && <DebugPortalButton />}
          {DEBUG && <span className="chip bad hud-debug">🐞 DEBUG</span>}
          {showHints && (
            <button
              className="btn btn-amber btn-sm hud-hints"
              onClick={() => setHintsOpen(true)}
              aria-label={t('hud.hints')}
              title={t('hud.hints')}
            >
              {t('hud.hints')}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm hud-mute"
            onClick={toggleMute}
            aria-label={muted ? t('hud.unmuteSound') : t('hud.muteSound')}
            title={muted ? t('hud.unmuteSound') : t('hud.muteSound')}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {(showNav || touring) && screen !== 'map' && (
            <button className={`btn btn-cyan btn-sm ${tourClass('map')}`} data-tour="map"
              onClick={touring ? undefined : goMap} tabIndex={touring ? -1 : undefined} aria-disabled={touring || undefined}>
              {t('hud.map')}
            </button>
          )}
          {(showNav || touring) && (
            <button className={`btn btn-purple btn-sm ${tourClass('bag')}`} data-tour="bag"
              onClick={touring ? undefined : () => setBagOpen(true)} tabIndex={touring ? -1 : undefined} aria-disabled={touring || undefined}>
              {t('hud.bag')} {inventory.length > 0 && <b className="bag-count">{inventory.length}</b>}
            </button>
          )}
        </div>
      </header>

      <Modal open={hintsOpen} onClose={() => setHintsOpen(false)} title={t('hints.title')} accent="amber" width={620}>
        <div className="hint-target panel">
          <div className="eyebrow" style={{ color: 'var(--cyan)' }}>{t('hints.targetLabel')}</div>
          {screen === 'map' && objectiveNode ? (
            <>
              <h4>{t('hints.mapObjective.title', { district: t(`${nodeObjectiveKey}.title`) })}</h4>
              <p>{t('hints.mapObjective.text')}</p>
            </>
          ) : objectiveNode ? (
            <>
              <h4>{t(`${nodeObjectiveKey}.title`)}</h4>
              <p>{t(`${nodeObjectiveKey}.blurb`)}</p>
            </>
          ) : objectiveKey ? (
            <>
              <h4>{t(`hints.objectives.${objectiveKey}.title`)}</h4>
              <p>{t(`hints.objectives.${objectiveKey}.text`)}</p>
            </>
          ) : (
            <p>{t('hints.noTarget')}</p>
          )}
        </div>

        <p className="muted t-sm hints-context">{t(`hints.${hintContext}.context`)}</p>
        <div className="hints-list">
          {(linkRoundHint
            ? [linkRoundHint, ...hints.filter((hint) => hint !== linkRoundHint)].slice(0, 3)
            : hints
          ).map((hint, index) => {
            const isRevealed = revealedHints.includes(index)
            const prompt = Array.isArray(hintPrompts) && hintPrompts[index]
              ? hintPrompts[index]
              : t('hints.defaultPrompt', { number: index + 1 })
            return (
              <div className={`hint-disclosure ${isRevealed ? 'is-open' : ''}`} key={index}>
                <button type="button" className="hint-trigger" onClick={() => toggleHint(index)} aria-expanded={isRevealed}>
                  <span className="hint-number">{index + 1}</span>
                  <span>{prompt}</span>
                  <span className="hint-chevron" aria-hidden>{isRevealed ? '−' : '+'}</span>
                </button>
                {isRevealed && <div className="hint-answer">{hint}</div>}
              </div>
            )
          })}
        </div>

      </Modal>

      <Modal open={bagOpen} onClose={() => setBagOpen(false)} title={t('hud.inventoryTitle')} accent="purple" width={620}>
        <div className="bag-section">
          <div className="eyebrow" style={{ color: 'var(--purple)' }}>{t('hud.tools')}</div>
          {inventory.length === 0 ? (
            <p className="muted t-sm">{t('hud.noTools')}</p>
          ) : (
            <div className="bag-grid">
              {inventory.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className={`bag-item panel ${it.id === 'dataReport' ? 'bag-item-report' : ''} ${deniedItem === it.id ? 'bag-item-denied' : ''}`}
                  onClick={() => useItem(it)}
                >
                  <div><img className="bag-icon" src={bgUrl(it.id === 'dataReport' ? narrative.reportImage : it.image)} alt="" /></div>
                  <div>
                    <div className="bag-name">{t(`items.${it.id}.name`, { friend: narrative.friend })}</div>
                    <div className="bag-desc muted t-xs">{t(`items.${it.id}.desc`, { friend: narrative.friend })}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bag-section">
          <div className="eyebrow" style={{ color: 'var(--green)' }}>{t('hud.evidenceHeading')}</div>
          {evidence.length === 0 ? (
            <p className="muted t-sm">{t('hud.noEvidence', { friend: narrative.friend })}</p>
          ) : (
            <ul className="evidence-list">
              {evidence.map((e) => (
                <li key={e.id}><span className="ev-dot" />{e.label}</li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('rooms.algorithm.report.modalTitle')} accent="amber" width={960} className="report-modal">
        <DataReport />
      </Modal>
    </>
  )
}
