import { useEffect } from 'react'
import { useGame } from './game/GameContext.jsx'
import Stage from './components/Stage.jsx'
import { DndProvider } from './components/dnd/Dnd.jsx'
import HUD from './components/HUD.jsx'
import GameMap from './components/GameMap.jsx'
import WelcomeScreen from './components/screens/WelcomeScreen.jsx'
import PretestScreen from './components/screens/PretestScreen.jsx'
import PosttestScreen from './components/screens/PosttestScreen.jsx'
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
  const { screen, activeNode, reducedMotion } = useGame()

  useEffect(() => {
    document.body.classList.toggle('reduced-motion', reducedMotion)
  }, [reducedMotion])

  let content
  if (screen === 'welcome') content = <WelcomeScreen />
  else if (screen === 'pretest') content = <PretestScreen />
  else if (screen === 'posttest') content = <PosttestScreen />
  else if (screen === 'win') content = <WinScreen />
  else if (screen === 'lose') content = <LoseScreen />
  else if (screen === 'room' && activeNode) {
    const RoomComp = ROOMS[activeNode.component]
    content = RoomComp ? <RoomComp node={activeNode} /> : <GameMap />
  } else content = <GameMap />

  // A key that changes on every navigation, so the swap remounts and its
  // enter animation + veil replay (map ↔ room feels like a doorway).
  const transitionKey = screen === 'room' && activeNode ? `room:${activeNode.id}` : screen

  return (
    <Stage>
      <DndProvider>
        <div className="stage">
          <HUD />
          <div className="stage-swap" key={transitionKey}>
            {content}
            <div className="transition-veil" aria-hidden />
          </div>
        </div>
      </DndProvider>
    </Stage>
  )
}
