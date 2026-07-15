/* ============================================================
   GameContext — single source of truth for run state:
   which screen is showing, node progress, inventory, evidence,
   and the 30-minute countdown.

   Rooms consume this with useGame() and call completeRoom() when
   solved. Progress model per node: 'locked' | 'available' | 'done'.
   ============================================================ */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { NODES, GAME_MINUTES, ITEMS } from './gameData.js'

const GameContext = createContext(null)

const START_SECONDS = GAME_MINUTES * 60

function initialProgress() {
  const p = {}
  NODES.forEach((n, i) => {
    p[n.id] = i === 0 ? 'available' : 'locked'
  })
  return p
}

const initialState = {
  screen: 'welcome', // 'welcome' | 'intro' | 'map' | 'room' | 'win' | 'lose'
  player: { alias: '', age: '' },
  activeNodeId: null,
  progress: initialProgress(),
  inventory: [], // Item[]
  evidence: [], // { id, label } collected clues to use on Max
  timeLeft: START_SECONDS,
  running: false,
  reducedMotion: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SUBMIT_WELCOME':
      return { ...state, player: action.player, screen: 'intro' }

    case 'START_GAME':
      return { ...state, screen: 'map', running: true, timeLeft: START_SECONDS }

    case 'OPEN_NODE': {
      if (state.progress[action.id] === 'locked') return state
      return { ...state, screen: 'room', activeNodeId: action.id }
    }

    case 'GO_MAP':
      return { ...state, screen: 'map', activeNodeId: null }

    case 'COMPLETE_NODE': {
      const idx = NODES.findIndex((n) => n.id === action.id)
      if (idx === -1) return state
      const progress = { ...state.progress, [action.id]: 'done' }
      const next = NODES[idx + 1]
      if (next && progress[next.id] === 'locked') progress[next.id] = 'available'
      const allDone = NODES.every((n) => progress[n.id] === 'done')
      return {
        ...state,
        progress,
        screen: allDone ? 'win' : 'map',
        activeNodeId: null,
        running: allDone ? false : state.running,
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
      if (t <= 0) return { ...state, timeLeft: 0, running: false, screen: 'lose' }
      return { ...state, timeLeft: t }
    }

    case 'ADD_TIME':
      return { ...state, timeLeft: Math.max(0, state.timeLeft + action.seconds) }

    case 'TOGGLE_MOTION':
      return { ...state, reducedMotion: !state.reducedMotion }

    case 'RESET':
      return { ...initialState, progress: initialProgress(), reducedMotion: state.reducedMotion }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const runningRef = useRef(state.running)
  runningRef.current = state.running

  // One global 1s clock; only counts while running.
  useEffect(() => {
    const id = setInterval(() => {
      if (runningRef.current) dispatch({ type: 'TICK' })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const submitWelcome = useCallback((player) => dispatch({ type: 'SUBMIT_WELCOME', player }), [])
  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), [])
  const openNode = useCallback((id) => dispatch({ type: 'OPEN_NODE', id }), [])
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

  const value = {
    ...state,
    NODES,
    ITEMS,
    activeNode,
    submitWelcome,
    startGame,
    openNode,
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

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
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
