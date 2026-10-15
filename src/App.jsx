import { useEffect } from 'react'
import { useGame } from './game/GameContext.jsx'
import { preloadGameAssets } from './game/preloadAssets.js'
import { useI18n } from './i18n/index.jsx'
import Stage from './components/Stage.jsx'
import { DndProvider } from './components/dnd/Dnd.jsx'
import HUD from './components/HUD.jsx'
import GameMap from './components/GameMap.jsx'
import RoomReview from './components/RoomReview.jsx'
import WelcomeScreen from './components/screens/WelcomeScreen.jsx'
import PretestScreen from './components/screens/PretestScreen.jsx'
import EnterScreen from './components/screens/EnterScreen.jsx'
import FinalDecision from './rooms/FinalDecision.jsx'
import { WinScreen, LoseScreen } from './components/screens/EndScreens.jsx'

// Districts & corridors
import LinkDistrict from './rooms/LinkDistrict.jsx'
import RouletteCorridor from './rooms/RouletteCorridor.jsx'
import InfluencerAvenue from './rooms/InfluencerAvenue.jsx'
import AlgorithmRoom from './rooms/AlgorithmRoom.jsx'
import AdsCorridor from './rooms/AdsCorridor.jsx'
import PersuasionRoom from './rooms/PersuasionRoom.jsx'

const ROOMS = {
  LinkDistrict,
  RouletteCorridor,
  InfluencerAvenue,
  AlgorithmRoom,
  AdsCorridor,
  PersuasionRoom,
}

export default function App() {
  const { screen, activeNode, reviewNodeId, reducedMotion, posttestSession, narrative, progress, NODES } = useGame()
  const { locale } = useI18n()
  const nodeId = screen === 'review' ? reviewNodeId : activeNode?.id
  const nextNodeId = screen === 'room'
    ? NODES[NODES.findIndex((node) => node.id === nodeId) + 1]?.id
    : NODES.find((node) => progress[node.id] !== 'done')?.id

  useEffect(() => {
    document.body.classList.toggle('reduced-motion', reducedMotion)
  }, [reducedMotion])

  // WelcomeScreen owns its draft character selection. Later stages prepare
  // only the current destination and the next room in the route.
  useEffect(() => {
    if (screen !== 'welcome') {
      preloadGameAssets({ screen, character: narrative.character, locale, nodeId, nextNodeId })
    }
  }, [screen, narrative.character, locale, nodeId, nextNodeId])

  const roomContent = activeNode
    ? (() => {
      const RoomComp = ROOMS[activeNode.component]
      return RoomComp ? <RoomComp node={activeNode} /> : null
    })()
    : null

  let content
  if (screen === 'welcome') content = <WelcomeScreen />
  else if (screen === 'pretest') content = <PretestScreen />
  else if (screen === 'enter') content = <EnterScreen />
  else if (screen === 'posttest') content = <FinalDecision key={posttestSession} />
  else if (screen === 'win') content = <WinScreen />
  else if (screen === 'lose') content = <LoseScreen />
  else if (screen === 'review') content = <RoomReview />
  else if (screen === 'map') content = <GameMap />
  else content = roomContent ? null : <GameMap />

  // A key that changes on every navigation, so the swap remounts and its
  // enter animation + veil replay (map ↔ room feels like a doorway).
  const transitionKey = activeNode ? `node:${activeNode.id}` : screen

  return (
    <Stage>
      <DndProvider>
        <div className="stage">
          <HUD />
          <div className="stage-swap" key={transitionKey}>
            {activeNode && (
              <div
                className={`room-preserved ${screen === 'room' ? 'is-active' : ''}`}
                aria-hidden={screen === 'room' ? undefined : 'true'}
              >
                {roomContent}
              </div>
            )}
            {content}
            <div className="transition-veil" aria-hidden />
          </div>
        </div>
      </DndProvider>
    </Stage>
  )
}
