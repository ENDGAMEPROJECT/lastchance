/* ============================================================
   GameContext — single source of truth for run state:
   which screen is showing, node progress, inventory, evidence,
   and the 30-minute countdown.

   Rooms consume this with useGame() and call completeRoom() when
   solved. Progress model per node: 'locked' | 'available' | 'done'.
   ============================================================ */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react'
import { getNarrative } from './characters.js'
import { NarrativeContext } from './NarrativeContext.jsx'
import { NODES, GAME_MINUTES, ITEMS } from './gameData.js'
import { DEBUG, DEBUG_SCREEN, DEBUG_POSTTEST_SCENARIO, DEBUG_CHARACTER } from './settings.js'
import { playSound, preloadSound } from './sound.js'
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
    running: !timedOut,
    postDecision: true,
    posttestSession: state.posttestSession + 1,
    loseReason: null,
    activeNodeId: null,
    reviewNodeId: null,
    roomStarted: false,
    linkRound: null,
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
  linkRound: null,
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
      return { ...state, screen: 'map', running: true, timeLeft: START_SECONDS, linkRound: null, enterTour: null }

    case 'FINISH':
      // Final decision from the post-test resolves the game.
      if (state.screen === 'win' || state.screen === 'lose') return state
      if (action.outcome === 'win' && (state.timedOut || state.timeLeft <= 0)) {
        return { ...state, screen: 'lose', running: false, loseReason: state.timedOut ? 'notEnoughEvidenceConvincing' : 'timeUp' }
      }
      return { ...state, screen: action.outcome, running: false, loseReason: action.reason ?? state.loseReason }

    case 'START_POSTTEST_DECISION':
      if (state.screen !== 'posttest') return state
      // Keep the remaining deadline visible throughout the assessment and retries.
      return { ...state, postDecision: true, running: !state.timedOut && state.timeLeft > 0 }

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
        linkRound: returningToRoom ? state.linkRound : null,
      }
    }

    case 'REVIEW_NODE':
      if (['posttest', 'win', 'lose'].includes(state.screen)) return state
      if (state.progress[action.id] !== 'done') return state
      return { ...state, screen: 'review', reviewNodeId: action.id }

    case 'START_ROOM':
      return { ...state, roomStarted: true }

    case 'SET_LINK_ROUND':
      return { ...state, linkRound: action.round }

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
          running: state.timeLeft > 0,
          activeNodeId: null,
          reviewNodeId: null,
          roomStarted: false,
          linkRound: null,
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
        linkRound: null,
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
        // Already in the post-test → puzzles were finished in time and the
        // retry clock just ran out. The friend stops waiting and buys.
        if (state.screen === 'posttest') {
          return { ...state, timeLeft: 0, running: false, screen: 'lose', loseReason: 'timeUp' }
        }
        // Out of time before finishing the puzzles → still face the friend in
        // the post-test (last chance), but flagged as timed out.
        return { ...state, timeLeft: 0, running: false, timedOut: true, screen: 'posttest', postDecision: true, activeNodeId: null, reviewNodeId: null, roomStarted: false, linkRound: null }
      }
      return { ...state, timeLeft: t }
    }

    case 'ADD_TIME':
      return { ...state, timeLeft: Math.max(0, state.timeLeft + action.seconds) }

    case 'TOGGLE_MOTION':
      return { ...state, reducedMotion: !state.reducedMotion }

    case 'RESET':
      return { ...initialState, posttestSession: state.posttestSession + 1, reducedMotion: state.reducedMotion }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const narrative = useMemo(() => getNarrative(state.player.character), [state.player.character])
  const runningRef = useRef(state.running)
  runningRef.current = state.running

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

  // The countdown reaching zero before the puzzles were finished.
  useEffect(() => {
    if (state.timedOut) once('timerExpired', () => track('terminated', OBJ.timer(), { node: 'posttest', response: 0 }))
  }, [state.timedOut])

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

  const submitWelcome = useCallback((player) => dispatch({ type: 'SUBMIT_WELCOME', player }), [])
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
  const setLinkRound = useCallback((round) => dispatch({ type: 'SET_LINK_ROUND', round }), [])
  const goMap = useCallback(() => dispatch({ type: 'GO_MAP' }), [])
  const completeRoom = useCallback((id) => dispatch({ type: 'COMPLETE_NODE', id }), [])
  const addItem = useCallback((item) => dispatch({ type: 'ADD_ITEM', item }), [])
  const addEvidence = useCallback((evidence) => dispatch({ type: 'ADD_EVIDENCE', evidence }), [])
  const addTime = useCallback((seconds) => dispatch({ type: 'ADD_TIME', seconds }), [])
  const reset = useCallback(() => {
    track('started', OBJ.game(), { node: 'intro', response: 'restart' })
    resetOnce() // a new run re-arms the one-shot statements (outcome, timer)
    dispatch({ type: 'RESET' })
  }, [])
  const toggleMotion = useCallback(() => dispatch({ type: 'TOGGLE_MOTION' }), [])
  const winNow = useCallback(() => dispatch({ type: 'WIN' }), [])

  const hasItem = useCallback((id) => state.inventory.some((i) => i.id === id), [state.inventory])

  const activeNode = NODES.find((n) => n.id === state.activeNodeId) || null
  const reviewNodeData = NODES.find((n) => n.id === state.reviewNodeId) || null

  const value = {
    ...state,
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
    setLinkRound,
    goMap,
    completeRoom,
    addItem,
    hasItem,
    addEvidence,
    addTime,
    reset,
    toggleMotion,
    winNow,
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
