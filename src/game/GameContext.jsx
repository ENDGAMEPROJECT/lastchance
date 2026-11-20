/* ============================================================
   GameContext — single source of truth for run state:
   which screen is showing, node progress, inventory, evidence,
   and the 30-minute countdown.

   Rooms consume this with useGame() and call completeRoom() when
   solved. Progress model per node: 'locked' | 'available' | 'done'.
   ============================================================ */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react'
import { getNarrative } from './characters.js'
import { NarrativeContext } from './NarrativeContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import dictionaries from '../i18n/dictionaries.js'
import { NODES, GAME_MINUTES, ITEMS } from './gameData.js'
import { DEBUG, DEBUG_SCREEN, DEBUG_POSTTEST_SCENARIO, DEBUG_CHARACTER } from './settings.js'
import { saveRun, loadRun, clearRun, clearRoomState } from './session.js'
import { playSound, preloadSound, playLoopFor } from './sound.js'
import { track, OBJ, once, resetOnce, markRoomStart, roomDuration } from './xapi.js'

const GameContext = createContext(null)

/* Which district hands over each tool, so a `collected` statement is filed
   under the room that awarded it (matching the xAPI sheet). */
const REWARD_NODE = {
  emojiCard: 'link-district',
  dataReport: 'influencer-avenue',
  truthLight: 'algorithm-room',
}

const START_SECONDS = GAME_MINUTES * 60

function initialProgress() {
  const p = {}
  NODES.forEach((n, i) => {
    // Debug mode unlocks every district so any puzzle can be opened directly.
    p[n.id] = DEBUG || i === 0 ? 'available' : 'locked'
  })
  return p
}

function debugPosttestState(state, scenario) {
  const timedOut = scenario === 'timeout'
  return {
    ...state,
    screen: 'posttest',
    timedOut,
    timeLeft: timedOut ? 0 : 300,
    running: false, // the post-test is not timed (see START_POSTTEST_DECISION)
    postDecision: true,
    posttestSession: state.posttestSession + 1,
    loseReason: null,
    activeNodeId: null,
    reviewNodeId: null,
    roomStarted: false,
    hintStep: null,
    progress: Object.fromEntries(NODES.map((node, i) => [
      node.id, !timedOut || i < 2 ? 'done' : i === 2 ? 'available' : 'locked',
    ])),
    inventory: timedOut ? [ITEMS.emojiCard] : Object.values(ITEMS),
    evidence: state.evidence, // keep what was gathered (e.g. via the debug "All evidence" button)
  }
}

const baseInitialState = {
  // Debug: skip the welcome/pretest and land on the map (or a ?screen= jump).
  screen: DEBUG ? DEBUG_SCREEN || 'map' : 'welcome', // 'welcome' | 'pretest' | 'enter' | 'map' | 'room' | 'posttest' | 'win' | 'lose'
  player: { alias: '', age: '', character: DEBUG ? DEBUG_CHARACTER : 'mia' }, // debug: ?character=max
  timedOut: false, // ran out of time BEFORE finishing the puzzles
  posttestSession: 0,
  posttestEntry: null, // 'white' when the post-test is entered out of the return portal's whiteout
  loseReason: null, // why the friend bought — picks the lose-screen copy
  postDecision: false, // post-test reached the final call → clock runs & shows
  returnTalked: false, // the Physical Internet "go back" exchange has played → Final Decision is lit
  activeNodeId: null,
  reviewNodeId: null,
  roomStarted: false,
  hintStep: null,
  progress: initialProgress(),
  inventory: DEBUG ? Object.values(ITEMS) : [], // Item[]; debug starts with every tool.
  evidence: [], // { id, label } collected clues to use on Max
  timeLeft: START_SECONDS,
  running: false,
  reducedMotion: false,
  // Portal-arrival walkthrough of the HUD: null (not shown) | 'map' | 'bag' | 'hints'
  // (steady highlight) | 'done' (all shown) | 'ready' (Map starts the run).
  enterTour: null,
}

export const initialState = DEBUG && DEBUG_SCREEN === 'posttest'
  ? debugPosttestState(baseInitialState, DEBUG_POSTTEST_SCENARIO)
  : baseInitialState

export function reducer(state, action) {
  switch (action.type) {
    case 'SUBMIT_WELCOME':
      return { ...state, player: { ...action.player, character: action.player.character === 'max' ? 'max' : 'mia' }, screen: 'pretest' }

    case 'ENTER_INTERNET':
      // Pre-test → the "jack in" transition (explains Map/Bag). Clock is not
      // running yet; START_GAME starts it when the player commits.
      return { ...state, screen: 'enter', enterTour: null }

    case 'START_GAME':
      return { ...state, screen: 'map', running: true, timeLeft: START_SECONDS, hintStep: null, enterTour: null }

    case 'FINISH':
      // Final decision from the post-test resolves the game.
      if (state.screen === 'win' || state.screen === 'lose') return state
      if (action.outcome === 'win' && (state.timedOut || state.timeLeft <= 0)) {
        return { ...state, screen: 'lose', running: false, loseReason: state.timedOut ? 'notEnoughEvidenceConvincing' : 'timeUp' }
      }
      return { ...state, screen: action.outcome, running: false, loseReason: action.reason ?? state.loseReason }

    case 'START_POSTTEST_DECISION':
      if (state.screen !== 'posttest') return state
      /* The clock STOPS here. The post-test is the measurement — the same three
         items as the pre-test, compared across countries — so timing it means a
         wrong answer can no longer be told apart from a player who simply ran
         out, and the retry would drain the same clock that the player most
         needs in order to think. The remaining time stays on screen, frozen.

         The stake is unaffected: running out DURING the puzzles still sets
         timedOut, and the friend then buys whatever the player argues. */
      return { ...state, postDecision: true, running: false }

    case 'OPEN_NODE': {
      if (['posttest', 'win', 'lose'].includes(state.screen)) return state
      if (state.progress[action.id] !== 'available') return state
      const returningToRoom = state.activeNodeId === action.id
      return {
        ...state,
        screen: 'room',
        activeNodeId: action.id,
        reviewNodeId: null,
        roomStarted: returningToRoom ? state.roomStarted : false,
        hintStep: returningToRoom ? state.hintStep : null,
      }
    }

    case 'REVIEW_NODE':
      if (['posttest', 'win', 'lose'].includes(state.screen)) return state
      if (state.progress[action.id] !== 'done') return state
      return { ...state, screen: 'review', reviewNodeId: action.id }

    case 'START_ROOM':
      return { ...state, roomStarted: true }

    case 'SET_HINT_STEP':
      return { ...state, hintStep: action.step }

    case 'GO_MAP':
      if (['posttest', 'win', 'lose'].includes(state.screen)) return state
      return { ...state, screen: 'map', reviewNodeId: null }

    case 'DEBUG_SKIP_TO_PORTAL':
      // Debug-only: skip the welcome + pre-test and land on the "step inside"
      // portal arrival, clock stopped (START_GAME starts it as in a real run).
      if (!DEBUG) return state
      return { ...state, screen: 'enter', running: false, activeNodeId: null, reviewNodeId: null, enterTour: null }

    case 'SET_ENTER_TOUR':
      return state.enterTour === action.step ? state : { ...state, enterTour: action.step }

    case 'DEBUG_GATHER_EVIDENCE': {
      // Debug-only: as if every district had been solved — all marked done,
      // each room's evidence logged and every tool in the bag. Stays on the map.
      if (!DEBUG) return state
      const evidence = [...state.evidence]
      action.evidence.forEach((e) => { if (!evidence.some((x) => x.id === e.id)) evidence.push(e) })
      return {
        ...state,
        progress: Object.fromEntries(NODES.map((n) => [n.id, 'done'])),
        evidence,
        inventory: Object.values(ITEMS),
      }
    }

    case 'DEBUG_SET_CHARACTER':
      // Debug-only: switch which character the player plays (text + images follow).
      if (!DEBUG) return state
      return { ...state, player: { ...state.player, character: action.character === 'max' ? 'max' : 'mia' } }

    case 'GOTO_SCREEN': // debug-only jump
      // A named scenario ("Test · 5:00 / 0:00") rebuilds that post-test setup.
      if (DEBUG && action.screen === 'posttest' && action.scenario) return debugPosttestState(state, action.scenario)
      // Same scenario, but starting at the return cutscene (Physical Internet
      // dialogue → portal → white → post-test), clock paused as in a real run.
      if (DEBUG && action.screen === 'return' && action.scenario) {
        return { ...debugPosttestState(state, action.scenario), screen: 'return', running: false, posttestEntry: null, returnTalked: false }
      }
      // Plain post-test entry (the map's Final Decision node) keeps the real run
      // state — progress, evidence, clock — exactly like clearing the last district.
      if (action.screen === 'posttest') {
        return {
          ...state,
          screen: 'posttest',
          posttestSession: state.posttestSession + 1,
          posttestEntry: action.fromWhite ? 'white' : null,
          postDecision: true,
          running: false, // the post-test is not timed (see START_POSTTEST_DECISION)
          activeNodeId: null,
          reviewNodeId: null,
          roomStarted: false,
          hintStep: null,
        }
      }
      // Debug lose jumps name the cause, so the lose screen shows that copy.
      if (action.screen === 'lose' && action.reason) {
        return { ...state, screen: 'lose', running: false, loseReason: action.reason, activeNodeId: null, reviewNodeId: null }
      }
      return { ...state, screen: action.screen, activeNodeId: null, reviewNodeId: null }

    case 'COMPLETE_NODE': {
      if (state.timedOut || ['posttest', 'win', 'lose'].includes(state.screen)) return state
      const idx = NODES.findIndex((n) => n.id === action.id)
      if (idx === -1) return state
      const progress = { ...state.progress, [action.id]: 'done' }
      const next = NODES[idx + 1]
      if (next && progress[next.id] === 'locked') progress[next.id] = 'available'
      const allDone = NODES.every((n) => progress[n.id] === 'done')
      return {
        ...state,
        progress,
        // Clearing the last district ends the puzzles → back to the Physical
        // Internet for the "go back" exchange (ReturnScreen), then the map,
        // whose Final Decision opens the portal into the post-test.
        screen: allDone ? 'return' : 'map',
        activeNodeId: null,
        reviewNodeId: null,
        roomStarted: false,
        hintStep: null,
        // The clock pauses during that cutscene; entering the post-test
        // (GOTO_SCREEN 'posttest') sets postDecision and resumes it.
        running: allDone ? false : state.running,
      }
    }

    case 'FINISH_RETURN_TALK':
      // The "go back" exchange is over → back on the map, where only the Final
      // Decision is left (it opens the portal). The clock stays paused.
      if (state.screen !== 'return') return state
      return { ...state, screen: 'map', returnTalked: true }

    case 'WIN':
      return { ...state, screen: 'win', running: false }

    case 'ADD_ITEM': {
      if (state.inventory.some((i) => i.id === action.item.id)) return state
      return { ...state, inventory: [...state.inventory, action.item] }
    }

    case 'ADD_EVIDENCE': {
      if (state.evidence.some((e) => e.id === action.evidence.id)) return state
      return { ...state, evidence: [...state.evidence, action.evidence] }
    }

    case 'TICK': {
      if (!state.running) return state
      const t = state.timeLeft - 1
      if (t <= 0) {
        /* Backstop only: the post-test now enters with the clock stopped, so
           this should be unreachable. If a future route starts it again,
           failing closed here beats a clock that silently never expires. */
        if (state.screen === 'posttest') {
          return { ...state, timeLeft: 0, running: false, screen: 'lose', loseReason: 'timeUp' }
        }
        /* Out of time before finishing the puzzles. The outcome is sealed —
           timedOut means the friend buys whatever is argued later — but the
           player is NOT pulled out of the room. Running out at puzzle 3 used to
           mean never seeing puzzles 4-6, which in a classroom throws away half
           the material over a clock. They finish at their own pace and face the
           friend when they choose; the map's Final Decision unlocks on timedOut
           so they can also end it at any moment. */
        return { ...state, timeLeft: 0, running: false, timedOut: true }
      }
      return { ...state, timeLeft: t }
    }

    case 'ADD_TIME':
      return { ...state, timeLeft: Math.max(0, state.timeLeft + action.seconds) }

    case 'TOGGLE_MOTION':
      return { ...state, reducedMotion: !state.reducedMotion }

    case 'RESTORE':
      // A saved run, replacing the fresh state wholesale. The clock picks up
      // from the saved timeLeft: it does not advance while the page is away.
      return action.state

    case 'RESET':
      return { ...initialState, posttestSession: state.posttestSession + 1, reducedMotion: state.reducedMotion }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  /* A run found in storage at mount. Held, not applied: the player chooses
     (see SessionDialog). Read once — re-reading after a resume would find
     the run we just restored. */
  const [pendingRun, setPendingRun] = useState(loadRun)
  /* The characters' names are translatable (see getNarrative), so the
     narrative has to be rebuilt when the language changes. */
  const { locale } = useI18n()
  const narrative = useMemo(
    () => getNarrative(state.player.character, dictionaries[locale]?.names),
    [state.player.character, locale],
  )
  const runningRef = useRef(state.running)
  runningRef.current = state.running

  /* Persist every state change, so a refresh at any moment is recoverable.
     Held back while a saved run is still on offer: the fresh state would
     otherwise overwrite the very run the player is being asked about.
     (saveRun ignores the welcome screen, so merely loading the page never
     creates a run.) */
  useEffect(() => {
    if (!pendingRun) saveRun(state)
  }, [state, pendingRun])

  /* Continue the saved run. The actor is already back from sessionStorage
     (see xapi.js), so the statement carries the same identity as the rest
     of the run rather than opening a new one. */
  const resumeRun = useCallback(() => {
    if (!pendingRun) return
    dispatch({ type: 'RESTORE', state: pendingRun })
    track('resumed', OBJ.game(), { node: 'intro' })
    setPendingRun(null)
  }, [pendingRun])

  /* Start over: the saved run is abandoned, so report it as exited before
     dropping it — otherwise it would look like a run that simply stopped. */
  const discardRun = useCallback(() => {
    if (pendingRun) track('exited', OBJ.game(), { node: 'intro' })
    clearRun()
    setPendingRun(null)
  }, [pendingRun])

  // One global 1s clock; only counts while running.
  useEffect(() => {
    const id = setInterval(() => {
      if (runningRef.current) dispatch({ type: 'TICK' })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Chime whenever a NEW object lands in the inventory (reducer dedupes, so
  // this only fires on genuine growth — one place covers every reward grant).
  const prevInvLen = useRef(state.inventory.length)
  useEffect(() => {
    if (state.inventory.length > prevInvLen.current) playSound('inventory.mp3')
    prevInvLen.current = state.inventory.length
  }, [state.inventory.length])
  useEffect(() => {
    preloadSound('inventory.mp3')
    preloadSound('wrong.mp3') // used by every puzzle's incorrect-answer feedback
    preloadSound('timeout.mp3')
    // The tunnel whoosh plays the instant EnterScreen mounts, so warming it
    // on that screen would already be too late.
    preloadSound('portal_whoosh.mp3')
  }, [])

  /* ---- xAPI: statements that belong to run state rather than to one room.
     Fired centrally here for the same reason as the inventory chime above —
     one place covers every path that can trigger them. Rooms only report
     their own puzzle interactions. ---- */

  // A new tool in the bag → `collected`, filed under the room that gave it.
  const trackedItems = useRef(new Set(state.inventory.map((i) => i.id)))
  useEffect(() => {
    state.inventory.forEach((item) => {
      if (trackedItems.current.has(item.id)) return
      trackedItems.current.add(item.id)
      track('collected', OBJ.reward(item.id), { node: REWARD_NODE[item.id] })
    })
  }, [state.inventory])

  // A district turning 'done' → `completed`, with how long it took.
  const trackedDone = useRef(new Set(NODES.filter((n) => state.progress[n.id] === 'done').map((n) => n.id)))
  useEffect(() => {
    NODES.forEach((node) => {
      if (state.progress[node.id] !== 'done' || trackedDone.current.has(node.id)) return
      trackedDone.current.add(node.id)
      track('completed', OBJ.room(node.id), {
        node: node.id, success: true, completion: true, ...roomDuration(node.id),
      })
    })
  }, [state.progress])

  // The countdown reaching zero — either before the puzzles were finished
  // (timedOut) or during the post-test, which ends the run there and then.
  // Watches timeLeft rather than timedOut so both paths are covered.
  useEffect(() => {
    if (state.timeLeft > 0) return
    once('timerExpired', () => {
      // timeout.mp3 is authored as a ~0.9s seamless loop, so play it as one for
      // a few passes rather than a single clipped-sounding hit.
      playLoopFor('timeout.mp3', 3600)
      if (state.timedOut) track('terminated', OBJ.timer(), { node: 'posttest', response: 0 })
    })
  }, [state.timeLeft, state.timedOut])

  // The run's outcome. `once` guards against a re-render re-sending it.
  useEffect(() => {
    if (state.screen !== 'win' && state.screen !== 'lose') return
    const won = state.screen === 'win'
    once('outcome', () => {
      track(won ? 'passed' : 'failed', OBJ.game(), {
        node: 'posttest',
        response: won ? `${state.timeLeft};${state.evidence.length}` : (state.loseReason || 'timeUp'),
        success: won,
        ...(won ? { scaled: 1 } : {}),
        completion: true,
      })
      track('completed', OBJ.game(), {
        node: 'posttest', response: state.timeLeft, success: won, completion: true,
      })
    })
  }, [state.screen, state.timeLeft, state.evidence.length, state.loseReason])

  /* The final conversation is available but has not been had yet — either every
     district is cleared, or the clock ran out and the player chose to keep
     going. This is the state worth protecting: closing the window here loses
     the post-test, and with it the only post-measure of what was learned. */
  const postTestPending = (state.timedOut
    || (NODES.every((n) => state.progress[n.id] === 'done') && state.returnTalked))
    && !['posttest', 'win', 'lose'].includes(state.screen)

  useEffect(() => {
    if (!postTestPending) return
    /* Browsers ignore any custom text and show their own wording, so this needs
       no translation — preventDefault is what raises the prompt at all. */
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [postTestPending])

  const submitWelcome = useCallback((player) => {
    // A new run starts here: no puzzle state from an earlier run in this tab.
    clearRoomState()
    dispatch({ type: 'SUBMIT_WELCOME', player })
  }, [])
  const enterInternet = useCallback(() => dispatch({ type: 'ENTER_INTERNET' }), [])
  const startGame = useCallback(() => {
    // Committing to the run: the 30-minute countdown starts here.
    track('started', OBJ.timer(), { node: 'intro', response: START_SECONDS })
    dispatch({ type: 'START_GAME' })
  }, [])
  const finishGame = useCallback((outcome, reason) => dispatch({ type: 'FINISH', outcome, reason }), [])
  const startPosttestDecision = useCallback(() => dispatch({ type: 'START_POSTTEST_DECISION' }), [])
  const gotoScreen = useCallback((screen, scenario, reason) => dispatch({ type: 'GOTO_SCREEN', screen, scenario, reason }), [])
  // The return portal's exit: into the post-test, fading in from white.
  const enterPosttestFromWhite = useCallback(() => dispatch({ type: 'GOTO_SCREEN', screen: 'posttest', fromWhite: true }), [])
  const finishReturnTalk = useCallback(() => dispatch({ type: 'FINISH_RETURN_TALK' }), [])
  const skipToPortal = useCallback(() => dispatch({ type: 'DEBUG_SKIP_TO_PORTAL' }), [])
  const setCharacter = useCallback((character) => dispatch({ type: 'DEBUG_SET_CHARACTER', character }), [])
  const setEnterTour = useCallback((step) => dispatch({ type: 'SET_ENTER_TOUR', step }), [])
  const gatherAllEvidence = useCallback((evidence) => dispatch({ type: 'DEBUG_GATHER_EVIDENCE', evidence }), [])
  const openNode = useCallback((id) => dispatch({ type: 'OPEN_NODE', id }), [])
  const reviewNode = useCallback((id) => dispatch({ type: 'REVIEW_NODE', id }), [])
  const startRoom = useCallback((nodeId) => {
    if (nodeId) markRoomStart(nodeId)
    dispatch({ type: 'START_ROOM' })
  }, [])
  const setHintStep = useCallback((step) => dispatch({ type: 'SET_HINT_STEP', step }), [])
  const goMap = useCallback(() => dispatch({ type: 'GO_MAP' }), [])
  const completeRoom = useCallback((id) => dispatch({ type: 'COMPLETE_NODE', id }), [])
  const addItem = useCallback((item) => dispatch({ type: 'ADD_ITEM', item }), [])
  const addEvidence = useCallback((evidence) => dispatch({ type: 'ADD_EVIDENCE', evidence }), [])
  const addTime = useCallback((seconds) => dispatch({ type: 'ADD_TIME', seconds }), [])
  const reset = useCallback(() => {
    track('started', OBJ.game(), { node: 'intro', response: 'restart' })
    resetOnce() // a new run re-arms the one-shot statements (outcome, timer)
    // Drop the saved run too, or a refresh after "play again" would offer to
    // resume the game that was just finished. Also re-arms the survey ask.
    clearRun()
    dispatch({ type: 'RESET' })
  }, [])
  const toggleMotion = useCallback(() => dispatch({ type: 'TOGGLE_MOTION' }), [])
  const winNow = useCallback(() => dispatch({ type: 'WIN' }), [])

  const hasItem = useCallback((id) => state.inventory.some((i) => i.id === id), [state.inventory])

  const activeNode = NODES.find((n) => n.id === state.activeNodeId) || null
  const reviewNodeData = NODES.find((n) => n.id === state.reviewNodeId) || null

  const value = {
    ...state,
    postTestPending,
    narrative,
    NODES,
    ITEMS,
    activeNode,
    reviewNodeData,
    submitWelcome,
    enterInternet,
    startGame,
    finishGame,
    startPosttestDecision,
    gotoScreen,
    enterPosttestFromWhite,
    finishReturnTalk,
    skipToPortal,
    setCharacter,
    setEnterTour,
    gatherAllEvidence,
    openNode,
    reviewNode,
    startRoom,
    setHintStep,
    goMap,
    completeRoom,
    addItem,
    hasItem,
    addEvidence,
    addTime,
    reset,
    toggleMotion,
    winNow,
    pendingRun,
    resumeRun,
    discardRun,
  }

  return (
    <GameContext.Provider value={value}>
      <NarrativeContext.Provider value={narrative}>{children}</NarrativeContext.Provider>
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
