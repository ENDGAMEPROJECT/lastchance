import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useGame, formatTime } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { DEBUG, settings } from '../game/settings.js'
import { isMuted, setMuted } from '../game/sound.js'
import { getHintContext, getHintPlan } from '../game/hints.js'
import { track, OBJ, EXT } from '../game/xapi.js'
import { useStage } from './Stage.jsx'
import { ROOM_PROGRESS_EVENT } from '../game/roomProgress.js'
import Modal from './Modal.jsx'
import DataReport from './DataReport.jsx'
import DebugPosttestButtons from './DebugPosttestButtons.jsx'
import DebugPortalButton from './DebugPortalButton.jsx'
import DebugCharacterButton from './DebugCharacterButton.jsx'
import './HUD.css'

const MOBILE_QUERY = `(max-width: ${settings.mobile.breakpoint}px)`
// On mobile a first tap only unfolds a HUD button's label; it isn't "opening" it.
// (With a pop-over already open the buttons act on the first tap — see navTap.)
const unfoldTap = (target) => Boolean(target.closest('.hud-m-nav:not(.is-expanded)')) && !document.querySelector('.modal-backdrop')

/* Persistent top bar: countdown, mission recap, inventory & map access. */
export default function HUD() {
  const { screen, activeNodeId, roomStarted, linkRound, timeLeft, inventory, evidence, progress, goMap, startGame, postDecision, enterTour, narrative } = useGame()
  const t = useT()
  const [bagOpen, setBagOpen] = useState(false)
  const [bagTab, setBagTab] = useState('tools') // 'tools' | 'evidence'
  useEffect(() => { if (bagOpen) setBagTab('tools') }, [bagOpen]) // always open on Tools
  const [bagReminder, setBagReminder] = useState(false)
  const neededItem = { 'influencer-avenue': 'emojiCard', 'algorithm-room': 'dataReport', 'ads-corridor': 'truthLight' }[activeNodeId]
  const needsBag = screen === 'room' && roomStarted && progress[activeNodeId] !== 'done'
    && Boolean(neededItem && inventory.some((item) => item.id === neededItem))

  useEffect(() => {
    setBagReminder(false)
    if (!needsBag) return
    let clicks = 0
    let elapsed = false
    let consulted = false
    const remind = () => {
      if (!consulted && elapsed && clicks >= settings.bagReminder.clicks) setBagReminder(true)
    }
    const onClick = (event) => {
      if (event.target.closest('[data-tour="bag"]')) {
        if (unfoldTap(event.target)) return
        consulted = true
        setBagReminder(false)
      } else if (event.target.closest('.room-body') && !event.target.closest('.room-cleared-overlay')) {
        clicks += 1
        remind()
      }
    }
    const timer = window.setTimeout(() => { elapsed = true; remind() }, settings.bagReminder.delayMs)
    document.addEventListener('click', onClick, true)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', onClick, true)
    }
  }, [needsBag, activeNodeId])
  const [reportOpen, setReportOpen] = useState(false)
  const [deniedItem, setDeniedItem] = useState(null)
  const [hintsOpen, setHintsOpen] = useState(false)
  const [hintReminder, setHintReminder] = useState(false)

  // Light up Hints when the player looks stuck in an unsolved room: enough
  // clicks AND no puzzle progress for a while. Progress (reported by the room
  // via useRoomProgress) restarts both counts; opening Hints turns the glow off
  // until the next bit of progress.
  const needsHint = screen === 'room' && roomStarted && progress[activeNodeId] !== 'done'
  useEffect(() => {
    setHintReminder(false)
    if (!needsHint) return
    const { clicks: minClicks, idleMs, idleMsWithItem } = settings.hintReminder
    const waitMs = neededItem ? idleMsWithItem : idleMs
    let timer
    let clicks = 0
    let elapsed = false
    let consulted = false
    const remind = () => {
      if (!consulted && elapsed && clicks >= minClicks) setHintReminder(true)
    }
    const restart = () => {
      window.clearTimeout(timer)
      clicks = 0
      elapsed = false
      consulted = false
      setHintReminder(false)
      timer = window.setTimeout(() => { elapsed = true; remind() }, waitMs)
    }
    const onClick = (event) => {
      if (event.target.closest('.hud-hints')) {
        if (unfoldTap(event.target)) return
        consulted = true
        setHintReminder(false)
      } else if (event.target.closest('.room-body') && !event.target.closest('.room-cleared-overlay')) {
        clicks += 1
        remind()
      }
    }
    restart()
    document.addEventListener('click', onClick, true)
    window.addEventListener(ROOM_PROGRESS_EVENT, restart)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener(ROOM_PROGRESS_EVENT, restart)
    }
  }, [needsHint, activeNodeId, neededItem])
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

  // First dialogue (pre-test): until the player first taps the fullscreen
  // button, its border pulses softly. One tap ends it for good, even if they
  // later leave fullscreen again.
  const [fullscreenTapped, setFullscreenTapped] = useState(false)
  const fullscreenReminder = screen === 'pretest' && !fullscreen && !fullscreenTapped
  const toggleFullscreen = async () => {
    setFullscreenTapped(true)
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
    // Only the reveal is reported; re-collapsing a hint is not a new event.
    // Read state directly rather than from the updater — StrictMode runs
    // updaters twice in dev, which would double-report.
    if (!revealedHints.includes(index)) {
      // Keyed on the node, like every other statement's parent, so hint use
      // joins to the rest of a district's activity.
      track('asked', OBJ.hint(xapiNode, index + 1), { node: xapiNode, response: index + 1 })
    }
    setRevealedHints((current) => (current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index]))
  }

  /* ---- xAPI: HUD panels and settings.
     Driven off state rather than the buttons, because every panel has a
     desktop bar control, a mobile round button AND closePanels() — one effect
     per panel covers all three without triple-reporting. ---- */
  const xapiNode = screen === 'room' ? activeNodeId
    : screen === 'welcome' || screen === 'enter' ? 'intro'
      : screen === 'return' || screen === 'review' ? 'map'
        : screen
  const hudInit = useRef({ bag: true, hints: true, tab: true, mute: true, full: true })

  useEffect(() => {
    if (hudInit.current.bag) { hudInit.current.bag = false; return }
    track(bagOpen ? 'opened' : 'closed', OBJ.bag(), { node: xapiNode })
  }, [bagOpen])

  useEffect(() => {
    if (hudInit.current.hints) { hudInit.current.hints = false; return }
    track(hintsOpen ? 'opened' : 'closed', OBJ.hints(), { node: xapiNode })
  }, [hintsOpen])

  // No statement for the report modal opening: useItem() already reports
  // `used` for the very same click, so tracking both double-counts one gesture.

  useEffect(() => {
    if (hudInit.current.tab) { hudInit.current.tab = false; return }
    track('selected', OBJ.bagTab(), { node: xapiNode, response: bagTab })
  }, [bagTab])

  useEffect(() => {
    if (hudInit.current.mute) { hudInit.current.mute = false; return }
    track('updated', OBJ.sound(), { node: xapiNode, response: muted ? 'off' : 'on' })
  }, [muted])

  useEffect(() => {
    if (hudInit.current.full) { hudInit.current.full = false; return }
    track('updated', OBJ.fullscreen(), { node: xapiNode, response: fullscreen ? 'on' : 'off' })
  }, [fullscreen])

  // The game deciding the player looks stuck and lighting up Bag or Hints.
  useEffect(() => {
    if (bagReminder) track('experienced', OBJ.nudge(), { node: xapiNode, response: 'bag' })
  }, [bagReminder])
  useEffect(() => {
    if (hintReminder) track('experienced', OBJ.nudge(), { node: xapiNode, response: 'hints' })
  }, [hintReminder])

  const itemRoom = { emojiCard: 'influencer-avenue', dataReport: 'algorithm-room', truthLight: 'ads-corridor' }
  const useItem = (item) => {
    if (itemRoom[item.id] !== activeNodeId) {
      // Reaching for the right tool in the wrong room: logged as an
      // unsuccessful use, which is more informative than silence.
      track('used', OBJ.reward(item.id), {
        node: activeNodeId, response: `${item.id};${activeNodeId}`, success: false,
      })
      setDeniedItem(item.id)
      window.setTimeout(() => setDeniedItem(null), 700)
      return
    }
    track('used', OBJ.reward(item.id), { node: activeNodeId, success: true })
    setBagOpen(false)
    if (item.id === 'dataReport') setReportOpen(true)
    else window.dispatchEvent(new CustomEvent('lastchance:use-item', { detail: { id: item.id } }))
  }

  // Mobile (≤ settings.mobile.breakpoint): the top bar is replaced by floating
  // round buttons. Desktop rendering is untouched.
  const { viewportEl } = useStage()
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const sync = () => setMobile(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  // On mobile, the right-hand buttons are icon-only: tapping any of them
  // unfolds all three to show their labels, and a second tap on one opens it.
  // Tapping anywhere else folds them back.
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { setExpanded(false) }, [screen, activeNodeId, mobile])
  useEffect(() => {
    if (!expanded) return
    const fold = (event) => {
      if (!event.target.closest('[data-nav]')) setExpanded(false)
    }
    document.addEventListener('pointerdown', fold, true)
    return () => document.removeEventListener('pointerdown', fold, true)
  }, [expanded])
  // With a pop-over open (e.g. the Bag), a tap acts at once: the buttons are
  // already in view and the player is switching panels.
  const panelOpen = hintsOpen || bagOpen || reportOpen
  const navTap = (action) => () => {
    if (!expanded && !panelOpen) return setExpanded(true)
    setExpanded(false)
    action?.()
  }
  // Only one pop-over at a time: opening one closes the others.
  const closePanels = () => { setHintsOpen(false); setBagOpen(false); setReportOpen(false) }
  const openHints = () => { closePanels(); setHintsOpen(true) }
  const openBag = () => { closePanels(); setBagOpen(true) }

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
  const showNav = !preGame && screen !== 'posttest' && screen !== 'return'
  // The portal arrival walks the player through Map, Bag and Hints: the buttons
  // appear there for show until the final line finishes; then Map starts the run.
  const touring = screen === 'enter' && Boolean(enterTour)
  const mapReady = touring && enterTour === 'ready'
  const mapBlocked = touring && !mapReady
  const tourClass = (target) => (touring ? `hud-tour-btn ${enterTour === target ? 'is-focus' : ''} ${mapReady && target === 'map' ? 'is-ready' : ''}` : '')
  // Hints only help where there's a live objective — a puzzle room, or the map
  // pointing at the next district. Elsewhere (setup, conversations, endings)
  // there's nothing to hint, so don't offer the button.
  const showHints = screen === 'room' || screen === 'map' || touring

  const mobileHud = (
    <div className="hud-m">
      {DEBUG && (
        <div className="hud-m-debug">
          {['posttest', 'win', 'lose'].includes(screen) && <DebugPosttestButtons />}
          {['welcome', 'pretest'].includes(screen) && <DebugPortalButton />}
          <DebugCharacterButton />
        </div>
      )}

      {/* The side columns are pinned to the screen edges, not the scaled game
          box, so they're portalled out of the stage (into the viewport, which
          a phone may have turned to keep the game landscape): on a long, short phone
          they sit in the letterbox; on a squarer one they overlap the game. */}
      {createPortal(<div className={`hud-m-edges ${screen === 'welcome' ? 'is-welcome' : ''}`}>
      <div className="hud-m-col hud-m-left">
        {document.fullscreenEnabled && (
          <button
            type="button"
            className={`btn btn-ghost hud-m-btn ${fullscreenReminder ? 'hud-fullscreen-reminder' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleFullscreen}
            aria-label={fullscreen ? t('hud.exitFullscreen') : t('hud.enterFullscreen')}
            title={fullscreen ? t('hud.exitFullscreen') : t('hud.enterFullscreen')}
            aria-pressed={fullscreen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d={fullscreen
                ? 'M9 3v6H3m12-6v6h6M3 15h6v6m6 0v-6h6'
                : 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'} />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost hud-m-btn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleMute}
          aria-label={muted ? t('hud.unmuteSound') : t('hud.muteSound')}
          title={muted ? t('hud.unmuteSound') : t('hud.muteSound')}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        {fullscreenError && <span role="alert" className="t-xs hud-m-alert">{t('hud.fullscreenError')}</span>}
      </div>

      <div className="hud-m-col hud-m-right">
      
        {showHints && (
          <button
            type="button"
            data-nav="hints"
            data-tour="hints"
            className={`btn btn-amber hud-hints hud-m-btn hud-m-nav ${expanded ? 'is-expanded' : ''} ${tourClass('hints')} ${hintReminder && !hintsOpen && !touring ? 'hud-hint-reminder' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={navTap(touring ? undefined : openHints)}
            tabIndex={touring ? -1 : undefined}
            aria-disabled={touring || undefined}
            aria-label={t('hud.hints')}
            aria-expanded={expanded}
          >
            {expanded ? t('hud.hints') : '💡'}
          </button>
        )}
        {(showNav || touring) && screen !== 'map' && (
          <button
            type="button"
            data-tour="map"
            data-nav="map"
            className={`btn btn-cyan hud-m-btn hud-m-nav ${expanded ? 'is-expanded' : ''} ${tourClass('map')}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={navTap(mapReady ? startGame : touring ? undefined : () => { closePanels(); goMap() })}
            tabIndex={mapBlocked ? -1 : undefined}
            aria-disabled={mapBlocked || undefined}
            aria-label={t('hud.map')}
            aria-expanded={expanded}
          >
            {expanded ? t('hud.map') : '🗺'}
          </button>
        )}
        {(showNav || touring) && (
          <button
            type="button"
            data-tour="bag"
            data-nav="bag"
            className={`btn btn-purple hud-m-btn hud-m-nav ${expanded ? 'is-expanded' : ''} ${tourClass('bag')} ${bagReminder && !bagOpen ? 'hud-bag-reminder' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={navTap(touring ? undefined : openBag)}
            tabIndex={touring ? -1 : undefined}
            aria-disabled={touring || undefined}
            aria-label={t('hud.bag')}
            aria-expanded={expanded}
          >
            {expanded ? t('hud.bag') : '🎒'}
            {inventory.length > 0 && <b className="bag-count">{inventory.length}</b>}
          </button>
        )}
      </div>

      {showTimer && (
        <div className={`hud-timer hud-m-timer ${low ? 'low' : ''} ${critical ? 'critical pulse' : ''}`}>
          <span className="hud-timer-val mono">{formatTime(timeLeft)}</span>
        </div>
      )}
      </div>, viewportEl || document.body)}
    </div>
  )

  return (
    <>
      {mobile ? mobileHud : <header className="hud">
        <div className="hud-left">
          <span className="hud-logo" aria-label={t('hud.logo')}>◉</span>
          {showTimer && <span className="hud-sub mono">{t('hud.expires')}</span>}
       
        {showTimer && (
          <div className={`hud-timer ${low ? 'low' : ''} ${critical ? 'critical pulse' : ''}`}>
            {/* <span className="hud-timer-label mono">{t('hud.tminus')}</span> */}
            <span className="hud-timer-val mono">{formatTime(timeLeft)}</span>
          </div>
        )}
       
        </div>


        <div className="hud-right">
          {document.fullscreenEnabled && (
            <button
              type="button"
              className={`btn btn-ghost btn-sm hud-fullscreen ${fullscreenReminder ? 'hud-fullscreen-reminder' : ''}`}
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
          {DEBUG && <DebugCharacterButton />}
          {showHints && (
            <button
              className={`btn btn-amber btn-sm hud-hints ${tourClass('hints')} ${hintReminder && !hintsOpen && !touring ? 'hud-hint-reminder' : ''}`}
              data-tour="hints"
              onClick={touring ? undefined : () => setHintsOpen(true)}
              tabIndex={touring ? -1 : undefined}
              aria-disabled={touring || undefined}
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
              onClick={mapReady ? startGame : touring ? undefined : goMap}
              onMouseDown={(event) => event.preventDefault()}
              tabIndex={mapBlocked ? -1 : undefined} aria-disabled={mapBlocked || undefined}>
              {t('hud.map')}
            </button>
          )}
          {(showNav || touring) && (
            <button className={`btn btn-purple btn-sm ${tourClass('bag')} ${bagReminder && !bagOpen ? 'hud-bag-reminder' : ''}`} data-tour="bag"
              onClick={touring ? undefined : () => setBagOpen(true)} tabIndex={touring ? -1 : undefined} aria-disabled={touring || undefined}>
              {t('hud.bag')} {inventory.length > 0 && <b className="bag-count">{inventory.length}</b>}
            </button>
          )}
        </div>
      </header>}

      <Modal open={hintsOpen} onClose={() => setHintsOpen(false)} title={t('hints.title')} accent="amber" width={620} className="hud-modal">
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

      <Modal open={bagOpen} onClose={() => setBagOpen(false)} title={t('hud.inventoryTitle')} accent="purple" width={620} className="hud-modal">
        {/* Two tabs: the tools you carry, and the evidence gathered so far. */}
        <div className="bag-tabs" role="tablist">
          {[
            { id: 'tools', label: t('hud.tools'), count: inventory.length },
            { id: 'evidence', label: t('hud.evidenceHeading'), count: evidence.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`bag-tab-${tab.id}`}
              aria-selected={bagTab === tab.id}
              aria-controls={`bag-panel-${tab.id}`}
              className={`bag-tab bag-tab-${tab.id} ${bagTab === tab.id ? 'is-active' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setBagTab(tab.id)}
            >
              {tab.label}
              <span className="bag-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Both panels stay rendered in one grid cell (the inactive one only
            hidden), so the bag keeps the taller panel's height on tab change. */}
        <div className="bag-panels">
          <div className={`bag-section ${bagTab === 'tools' ? '' : 'is-hidden'}`} role="tabpanel" id="bag-panel-tools"
            aria-labelledby="bag-tab-tools" aria-hidden={bagTab !== 'tools'}>
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
                      <div className="bag-desc muted t-sm">{t(`items.${it.id}.desc`, { friend: narrative.friend })}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={`bag-section ${bagTab === 'evidence' ? '' : 'is-hidden'}`} role="tabpanel" id="bag-panel-evidence"
            aria-labelledby="bag-tab-evidence" aria-hidden={bagTab !== 'evidence'}>
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
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('rooms.algorithm.report.modalTitle')} accent="amber" width={960} className="report-modal">
        <DataReport />
      </Modal>
    </>
  )
}
