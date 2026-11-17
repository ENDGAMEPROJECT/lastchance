import { NODES } from './gameData.js'

const ROOM_HINT_KEYS = {
  'link-district': 'link',
  'roulette-corridor': 'rouletteInvestigation',
  'influencer-avenue': 'influencer',
  'algorithm-room': 'algorithm',
  'ads-corridor': 'ads',
  'persuasion-room': 'persuasion',
}

/* The briefing text each room shows before "Step inside" (see RoomFrame's
   `intro` prop). The Hints panel repeats it so it can be re-read mid-puzzle. */
const ROOM_INTRO_KEYS = {
  'link-district': 'rooms.link.intro',
  'roulette-corridor': 'rooms.roulette.investigation.intro',
  'influencer-avenue': 'rooms.influencer.intro',
  'algorithm-room': 'rooms.algorithm.intro',
  'ads-corridor': 'rooms.ads.intro',
  'persuasion-room': 'rooms.persuasion.intro',
}

export function getRoomIntroKey(activeNodeId) {
  return ROOM_INTRO_KEYS[activeNodeId] || null
}

export function getHintContext(screen, activeNodeId) {
  if (screen === 'room' && ROOM_HINT_KEYS[activeNodeId]) {
    return `room.${ROOM_HINT_KEYS[activeNodeId]}`
  }
  if (screen === 'pretest' || screen === 'posttest') return screen
  if (screen === 'map') return screen
  if (screen === 'win' || screen === 'lose') return `end.${screen}`
  return 'map'
}

export function getHintPlan(screen, activeNodeId, progress = {}) {
  const activeNode = NODES.find((node) => node.id === activeNodeId) || null
  const completed = NODES.filter((node) => progress[node.id] === 'done')
  const nextNode = NODES.find((node) => progress[node.id] === 'available') || null

  const objectiveNode = screen === 'room'
    ? activeNode
    : screen === 'map'
      ? nextNode
      : null

  const objectiveKey = screen === 'pretest' || screen === 'posttest' ? screen : null

  return {
    activeNode,
    nextNode,
    completedCount: completed.length,
    totalCount: NODES.length,
    objectiveNode,
    objectiveKey,
  }
}
