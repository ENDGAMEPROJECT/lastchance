const ROOM_HINT_KEYS = {
  'link-district': 'link',
  'roulette-corridor': 'roulette',
  'influencer-avenue': 'influencer',
  'algorithm-room': 'algorithm',
  'ads-corridor': 'ads',
  'persuasion-room': 'persuasion',
}

export function getHintContext(screen, activeNodeId) {
  if (screen === 'room' && ROOM_HINT_KEYS[activeNodeId]) {
    return `room.${ROOM_HINT_KEYS[activeNodeId]}`
  }
  if (screen === 'pretest' || screen === 'posttest' || screen === 'map') return screen
  if (screen === 'win' || screen === 'lose') return `end.${screen}`
  return 'map'
}