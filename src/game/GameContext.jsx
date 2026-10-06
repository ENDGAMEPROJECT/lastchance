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
import { DEBUG, DEBUG_SCREEN, DEBUG_POSTTEST_SCENARIO } from './settings.js'
import { playSound, preloadSound } from './sound.js'

const GameContext = createContext(null)

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
    evidence: [],
  }
}

const baseInitialState = {
  // Debug: skip the welcome/pretest and land on the map (or a ?screen= jump).
  screen: DEBUG ? DEBUG_SCREEN || 'map' : 'welcome', // 'welcome' | 'pretest' | 'enter' | 'map' | 'room' | 'posttest' | 'win' | 'lose'
  player: { alias: '', age: '', character: 'mia' },
  timedOut: false, // ran out of time BEFORE finishing the puzzles
  posttestSession: 0,
  loseReason: null, // why the friend bought — picks the lose-screen copy
  postDecision: false, // post-test reached the final call → clock runs & shows
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
  // Portal-arrival walkthrough of the HUD: null (not shown) | 'map' | 'bag'
  // (that button highlighted) | 'done' (both shown, none highlighted).
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

    case 'GOTO_SCREEN': // debug-only jump
      if (DEBUG && action.screen === 'posttest') return debugPosttestState(state, action.scenario)
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
        // Clearing the last district ends the puzzles → into the post-test.
        screen: allDone ? 'posttest' : 'map',
        activeNodeId: null,
        reviewNodeId: null,
        roomStarted: false,
        linkRound: null,
        // The assessment and retries share the remaining puzzle time.
        postDecision: allDone ? true : state.postDecision,
        running: allDone ? state.timeLeft > 0 : state.running,
      }
    }

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

  const submitWelcome = useCallback((player) => dispatch({ type: 'SUBMIT_WELCOME', player }), [])
  const enterInternet = useCallback(() => dispatch({ type: 'ENTER_INTERNET' }), [])
  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), [])
  const finishGame = useCallback((outcome, reason) => dispatch({ type: 'FINISH', outcome, reason }), [])
  const startPosttestDecision = useCallback(() => dispatch({ type: 'START_POSTTEST_DECISION' }), [])
  const gotoScreen = useCallback((screen, scenario) => dispatch({ type: 'GOTO_SCREEN', screen, scenario }), [])
  const skipToPortal = useCallback(() => dispatch({ type: 'DEBUG_SKIP_TO_PORTAL' }), [])
  const setEnterTour = useCallback((step) => dispatch({ type: 'SET_ENTER_TOUR', step }), [])
  const openNode = useCallback((id) => dispatch({ type: 'OPEN_NODE', id }), [])
  const reviewNode = useCallback((id) => dispatch({ type: 'REVIEW_NODE', id }), [])
  const startRoom = useCallback(() => dispatch({ type: 'START_ROOM' }), [])
  const setLinkRound = useCallback((round) => dispatch({ type: 'SET_LINK_ROUND', round }), [])
  const goMap = useCallback(() => dispatch({ type: 'GO_MAP' }), [])
  const completeRoom = useCallback((id) => dispatch({ type: 'COMPLETE_NODE', id }), [])
  const addItem = useCallback((item) => dispatch({ type: 'ADD_ITEM', item }), [])
  const addEvidence = useCallback((evidence) => dispatch({ type: 'ADD_EVIDENCE', evidence }), [])
  const addTime = useCallback((seconds) => dispatch({ type: 'ADD_TIME', seconds }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])
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
    skipToPortal,
    setEnterTour,
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
