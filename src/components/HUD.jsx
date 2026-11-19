import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useGame, formatTime } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { DEBUG, settings } from '../game/settings.js'
import { isMuted, setMuted, playSound, preloadSound } from '../game/sound.js'
import { getHintContext, getHintPlan, getRoomIntroKey } from '../game/hints.js'
import { ROOM_PROGRESS_EVENT } from '../game/roomProgress.js'
import { track, OBJ, EXT } from '../game/xapi.js'
import { useStage } from './Stage.jsx'
import { useRoomState } from '../game/useRoomState.js'
import Modal from './Modal.jsx'
import DataReport from './DataReport.jsx'
import { InfluencerInfo } from '../rooms/InfluencerAvenue.jsx'
import DebugPosttestButtons from './DebugPosttestButtons.jsx'
import DebugPortalButton from './DebugPortalButton.jsx'
import DebugCharacterButton from './DebugCharacterButton.jsx'
import DebugLanguageButton from './DebugLanguageButton.jsx'
import './HUD.css'

/* Rooms with an info button (i) beside Hints: the button's label and the
   pop-over's title (i18n keys), its width and its body. hintStep is the room's
   current step (GameContext), so a room can change the info as it moves on. */
const INFO_ROOMS = {
  'persuasion-room': () => ({
    button: 'rooms.persuasion.info.button',
    title: 'rooms.persuasion.info.title',
    width: 620,
    render: (t) => (
      <dl className="info-list">
        {[].concat(t('rooms.persuasion.info.items') || []).filter((item) => item && typeof item === 'object').map((item, i) => (
          <div key={i} className="info-item">
            <dt>{item.name}</dt>
            <dd>{item.text}</dd>
          </div>
        ))}
      </dl>
    ),
  }),
  // Label game → the label explainer; reverse image search → its explainer.
  // (No info pop-over at the products-chamber door.)
  'influencer-avenue': (hintStep) => hintStep === 'door' ? null : hintStep === 'search' ? {
    button: 'rooms.influencer.explain.lookForTitle',
    title: 'rooms.influencer.explain.title',
    width: 900,
    render: () => <InfluencerInfo step="search" />,
  } : {
    button: 'rooms.influencer.info.labelsButton',
    title: 'rooms.influencer.labelFeedback.title',
    width: 900,
    render: () => <InfluencerInfo step="labels" />,
  },
}

const MOBILE_QUERY = `(max-width: ${settings.mobile.breakpoint}px)`
// On mobile a first tap only unfolds a HUD button's label; it isn't "opening" it.
// (With a pop-over already open the buttons act on the first tap — see navTap.)
const unfoldTap = (target) => Boolean(target.closest('.hud-m-nav:not(.is-expanded)')) && !document.querySelector('.modal-backdrop')

/* Persistent top bar: countdown, mission recap, inventory & map access. */
/* Desktop-only pointer under a lit-up Bag button: two chevrons bobbing
   up towards it. Colour follows the button's reminder class (see HUD.css). */
function ReminderArrow() {
  return (
    <span className="hud-reminder-arrow" aria-hidden="true">
      <span className="hud-reminder-chevron" />
      <span className="hud-reminder-chevron" />
    </span>
  )
}

export default function HUD() {
  const { screen, activeNodeId, roomStarted, hintStep, timeLeft, inventory, evidence, progress, goMap, startGame, postDecision, enterTour, narrative, postTestPending } = useGame()
  const t = useT()
  const [bagOpen, setBagOpen] = useState(false)
  const [bagTab, setBagTab] = useState('tools') // 'tools' | 'evidence'
  // Debug (phone): the red corner dot hides/shows every debug control. The
  // class lives on <body> so in-room and map debug buttons follow it too.
  const [debugHidden, setDebugHidden] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('debug-hidden', debugHidden)
  }, [debugHidden])
  useEffect(() => { if (bagOpen) setBagTab('tools') }, [bagOpen]) // always open on Tools
  const [bagReminder, setBagReminder] = useState(false)
  const neededItem = { 'influencer-avenue': 'emojiCard', 'algorithm-room': 'dataReport', 'ads-corridor': 'truthLight' }[activeNodeId]
  const needsBag = screen === 'room' && roomStarted && progress[activeNodeId] !== 'done'
    && Boolean(neededItem && inventory.some((item) => item.id === neededItem))

  useEffect(() => {
    setBagReminder(false)
    if (!needsBag) return
    const { clicks: minClicks, afterClicksMs, idleMs } = settings.bagReminder
    let clicks = 0
    let used = false
    let idleTimer
    let clickTimer
    const show = () => { if (!used) setBagReminder(true) }
    /* Opening the bag RE-ARMS the reminder instead of silencing it for good:
       looking inside only proves the player looked, not that it helped, so if
       they carry on clicking around with nothing to show for it the glow comes
       back. Puzzle progress re-arms it too, so anyone actually getting on with
       the room is never nagged. Only USING the needed tool stops it for good —
       that is the thing the reminder exists to prompt. */
    const restart = () => {
      window.clearTimeout(idleTimer)
      window.clearTimeout(clickTimer)
      clicks = 0
      clickTimer = undefined
      setBagReminder(false)
      idleTimer = window.setTimeout(show, idleMs)
    }
    /* Two ways the prompt stops being useful: the player uses the tool, or the
       room moves past the point the tool was for. The second matters because
       holding a tool is not the same as still needing it — the Data Report is
       only wanted AT the keypad, and anyone who gets past it without opening
       the bag (a replayer who remembers the code, or a debug skip) would
       otherwise be nagged for the rest of the room. Rooms announce that with
       `lastchance:tool-done`. */
    const onDone = (event) => {
      if (event.detail?.id !== neededItem) return
      used = true
      window.clearTimeout(idleTimer)
      window.clearTimeout(clickTimer)
      setBagReminder(false)
    }
    const onClick = (event) => {
      if (event.target.closest('[data-tour="bag"]')) {
        if (unfoldTap(event.target)) return
        restart()
      } else if (event.target.closest('.room-body') && !event.target.closest('.room-cleared-overlay')) {
        clicks += 1
        // Armed on the Nth click only: further clicks must not keep pushing it back.
        if (clicks >= minClicks && !clickTimer) clickTimer = window.setTimeout(show, afterClicksMs)
      }
    }
    restart()
    document.addEventListener('click', onClick, true)
    window.addEventListener(ROOM_PROGRESS_EVENT, restart)
    window.addEventListener('lastchance:use-item', onDone)
    window.addEventListener('lastchance:tool-done', onDone)
    return () => {
      window.clearTimeout(idleTimer)
      window.clearTimeout(clickTimer)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener(ROOM_PROGRESS_EVENT, restart)
      window.removeEventListener('lastchance:use-item', onDone)
      window.removeEventListener('lastchance:tool-done', onDone)
    }
  }, [needsBag, activeNodeId, neededItem])
  const [reportOpen, setReportOpen] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)
  // "Persuasion techniques" info, beside Hints. Only the Persuasion Lab has
  // one for now (rooms.persuasion.info); another room can be added to INFO_ROOMS.
  const [infoOpen, setInfoOpen] = useState(false)
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
  const hintPlan = getHintPlan(screen, activeNodeId, progress)
  const objectiveNode = hintPlan.objectiveNode
  const objectiveKey = hintPlan.objectiveKey
  const nodeObjectiveKey = objectiveNode ? `nodes.${objectiveNode.id}` : null
  // The room's briefing text, so it can be re-read after "Step inside".
  const roomIntroKey = screen === 'room' ? getRoomIntroKey(activeNodeId) : null

  // Rooms with several stages report the one the player is on (hintStep), and
  // get that stage's hints (hints.room.<room>.steps.<step>). If a stage has no
  // hints in the dictionary yet, the room's general hints are used instead.
  const stepSetKey = screen === 'room' && hintStep ? `hints.${hintContext}.steps.${hintStep}` : null
  const hintSetKey = stepSetKey && Array.isArray(t(`${stepSetKey}.items`)) ? stepSetKey : `hints.${hintContext}`
  const asList = (value) => (Array.isArray(value) ? value : [])
  const hints = asList(t(`${hintSetKey}.items`))
  const hintPrompts = asList(t(`${hintSetKey}.prompts`))

  // Hints open in order, one at a time: each next hint unlocks
  // settings.hints.unlockDelayMs after the previous one was read. Kept per
  // room step (and across a refresh), so leaving and coming back does not
  // reset the wait.
  const [hintLog, setHintLog] = useRoomState('hud.hints', {})
  const hintSeq = `${activeNodeId || screen}|${hintSetKey}`
  const hintEntry = hintLog[hintSeq] || { read: 0, readyAt: 0 }
  const [now, setNow] = useState(() => Date.now())
  // Debug mode skips the wait so every hint can be checked straight away.
  const nextLocked = !DEBUG && hintEntry.read < hints.length && now < hintEntry.readyAt
  useEffect(() => {
    if (!hintsOpen || !nextLocked) return
    setNow(Date.now())
    const tick = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [hintsOpen, nextLocked])
  // Which read hints are folded closed. Transient: they reopen with the panel.
  const [foldedHints, setFoldedHints] = useState([])
  useEffect(() => { setFoldedHints([]) }, [hintsOpen, hintSeq])

  const openHint = (index) => {
    if (index < hintEntry.read) {
      // Already read: just fold or unfold it. Not a new event.
      setFoldedHints((current) => (current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]))
      return
    }
    if (!DEBUG && (index !== hintEntry.read || Date.now() < hintEntry.readyAt)) return
    // Keyed on the node, like every other statement's parent, so hint use
    // joins to the rest of a district's activity.
    track('asked', OBJ.hint(xapiNode, index + 1), { node: xapiNode, response: index + 1 })
    setHintLog((log) => ({
      ...log,
      [hintSeq]: { read: Math.max(log[hintSeq]?.read ?? 0, index + 1), readyAt: Date.now() + settings.hints.unlockDelayMs },
    }))
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
  useEffect(() => { preloadSound('bag_open.mp3') }, [])

  useEffect(() => {
    if (hudInit.current.bag) { hudInit.current.bag = false; return }
    // The zipper on the way in only: it is a one-second sound and the bag is
    // opened often, so playing it on close as well would wear thin fast.
    if (bagOpen) playSound('bag_open.mp3')
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

  // The game deciding the player looks stuck and lighting up the Bag.
  useEffect(() => {
    if (bagReminder) track('experienced', OBJ.nudge(), { node: xapiNode, response: 'bag' })
  }, [bagReminder])

  /* The final conversation is waiting and the player has wandered off — once
     the clock is gone they may keep exploring, so this is a recurring nudge
     rather than a one-off: the Map button glows for a few seconds every so
     often, and the station itself pulses once they get there. Silent on the
     map, where the station is already visible. */
  const [mapReminder, setMapReminder] = useState(false)
  useEffect(() => {
    setMapReminder(false)
    if (!postTestPending || screen === 'map') return
    const { everyMs, showMs } = settings.decisionReminder
    let hide
    const pulse = () => {
      setMapReminder(true)
      hide = window.setTimeout(() => setMapReminder(false), showMs)
    }
    const timer = window.setInterval(pulse, everyMs)
    hide = window.setTimeout(pulse, everyMs / 2) // one early, so it is not a long silence
    return () => { window.clearInterval(timer); window.clearTimeout(hide); }
  }, [postTestPending, screen])

  const itemRoom = { emojiCard: 'influencer-avenue', dataReport: 'algorithm-room', truthLight: 'ads-corridor' }
  /* A tool can be taken out anywhere. In the wrong room it simply does nothing
     — each room listens only for its own item — rather than being refused,
     which is truer to the fiction: you can get a torch out of a bag in any
     room, it just doesn't help you there. The Data Report is a document, so it
     opens wherever the player wants to re-read it.
     result.success still records whether the use had an effect, so the data
     shows a player reaching for the wrong tool without the game blocking it. */
  const useItem = (item) => {
    track('used', OBJ.reward(item.id), {
      node: activeNodeId,
      response: `${item.id};${activeNodeId}`,
      success: itemRoom[item.id] === activeNodeId,
    })
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
  const panelOpen = hintsOpen || bagOpen || reportOpen || infoOpen
  const navTap = (action) => () => {
    if (!expanded && !panelOpen) return setExpanded(true)
    setExpanded(false)
    action?.()
  }
  // Only one pop-over at a time: opening one closes the others.
  const closePanels = () => { setHintsOpen(false); setBagOpen(false); setReportOpen(false); setInfoOpen(false) }
  const openInfo = () => { closePanels(); setInfoOpen(true) }
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
  const info = screen === 'room' && !touring && INFO_ROOMS[activeNodeId] ? INFO_ROOMS[activeNodeId](hintStep) : null

  const mobileHud = (
    <div className="hud-m">
      {DEBUG && (
        <div className="hud-m-debug">
          {['posttest', 'win', 'lose'].includes(screen) && <DebugPosttestButtons />}
          {['welcome', 'pretest'].includes(screen) && <DebugPortalButton />}
          <DebugCharacterButton />
          <DebugLanguageButton />
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
        {info && (
          <button
            type="button"
            data-nav="info"
            className={`btn hud-info hud-m-btn hud-m-nav ${expanded ? 'is-expanded' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={navTap(openInfo)}
            aria-label={t(info.button)}
            aria-expanded={expanded}
          >
            {expanded ? t(info.button) : 'i'}
          </button>
        )}
        {showHints && (
          <button
            type="button"
            data-nav="hints"
            data-tour="hints"
            className={`btn btn-amber hud-hints hud-m-btn hud-m-nav ${expanded ? 'is-expanded' : ''} ${tourClass('hints')}`}
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
            className={`btn btn-cyan hud-m-btn hud-m-nav ${expanded ? 'is-expanded' : ''} ${mapReminder ? 'hud-map-reminder' : ''} ${tourClass('map')}`}
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
      {/* Debug on/off dot (desktop + mobile), pinned to the screen corner. */}
      {DEBUG && createPortal(
        <button type="button" className="hud-m-debug-toggle"
          title={debugHidden ? 'Debug: show debug buttons' : 'Debug: hide debug buttons'}
          aria-pressed={!debugHidden}
          onMouseDown={(event) => event.preventDefault()} onClick={() => setDebugHidden((h) => !h)} />,
        document.body,
      )}
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
          {DEBUG && (
            <span className="hud-debug-group">
              {['posttest', 'win', 'lose'].includes(screen) && <DebugPosttestButtons />}
              {['welcome', 'pretest'].includes(screen) && <DebugPortalButton />}
              <span className="chip bad hud-debug">🐞 DEBUG</span>
              <DebugCharacterButton />
              <DebugLanguageButton />
            </span>
          )}
          {info && (
            <button
              type="button"
              className="hud-info"
              onMouseDown={(event) => event.preventDefault()}
              onClick={openInfo}
              aria-label={t(info.button)}
              title={t(info.button)}
            >
              i
            </button>
          )}
          {showHints && (
            <button
              className={`btn btn-amber btn-sm hud-hints ${tourClass('hints')}`}
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
            <button className={`btn btn-cyan btn-sm ${tourClass('map')} ${mapReminder ? 'hud-map-reminder' : ''}`} data-tour="map"
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
              {bagReminder && !bagOpen && <ReminderArrow />}
            </button>
          )}
        </div>
      </header>}

      <Modal open={hintsOpen} onClose={() => setHintsOpen(false)} title={t('hints.title')} accent="amber" width={620} className="hud-modal">
        {roomIntroKey && (
          <div className="hint-instructions panel">
            <div className="eyebrow" style={{ color: 'var(--amber)' }}>{t('common.howToPlay')}</div>
            <p>{t(roomIntroKey)}</p>
          </div>
        )}

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
          {hints.map((hint, index) => {
            const isRead = index < hintEntry.read
            const isOpen = isRead && !foldedHints.includes(index)
            const isNext = index === hintEntry.read
            const isLocked = !DEBUG && !isRead && (!isNext || nextLocked)
            const prompt = hintPrompts[index] || t('hints.defaultPrompt', { number: index + 1 })
            return (
              <div className={`hint-disclosure ${isOpen ? 'is-open' : ''} ${isLocked ? 'is-locked' : ''}`} key={`${hintSeq}-${index}`}>
                <button type="button" className="hint-trigger" onClick={() => openHint(index)}
                  aria-expanded={isOpen} aria-disabled={isLocked || undefined}>
                  <span className="hint-number">{index + 1}</span>
                  <span>{prompt}</span>
                  {isLocked ? (
                    <span className="hint-lock mono" aria-hidden>
                      🔒{isNext && <> {formatTime(Math.ceil((hintEntry.readyAt - now) / 1000))}</>}
                    </span>
                  ) : (
                    <span className="hint-chevron" aria-hidden>{isOpen ? '−' : '+'}</span>
                  )}
                </button>
                {isOpen && <div className="hint-answer">{hint}</div>}
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
                    className={`bag-item panel ${it.id === 'dataReport' ? 'bag-item-report' : ''}`}
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

      {info && (
        <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title={t(info.title)}
          accent="magenta" width={info.width} className="hud-modal info-modal">
          {info.render(t)}
        </Modal>
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('rooms.algorithm.report.modalTitle')} accent="amber" width={960} className="report-modal">
        <DataReport />
      </Modal>
    </>
  )
}
