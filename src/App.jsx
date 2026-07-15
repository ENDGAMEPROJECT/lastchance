import { useEffect } from 'react'
import { useGame } from './game/GameContext.jsx'
import Stage from './components/Stage.jsx'
import { DndProvider } from './components/dnd/Dnd.jsx'
import HUD from './components/HUD.jsx'
import GameMap from './components/GameMap.jsx'
import WelcomeScreen from './components/screens/WelcomeScreen.jsx'
import IntroScreen from './components/screens/IntroScreen.jsx'
import { WinScreen, LoseScreen } from './components/screens/EndScreens.jsx'

// Districts & corridors
import LinkDistrict from './rooms/LinkDistrict.jsx'
import RouletteCorridor from './rooms/RouletteCorridor.jsx'
import InfluencerAvenue from './rooms/InfluencerAvenue.jsx'
import AlgorithmRoom from './rooms/AlgorithmRoom.jsx'
import AdsCorridor from './rooms/AdsCorridor.jsx'
import PersuasionRoom from './rooms/PersuasionRoom.jsx'
import FinalDecision from './rooms/FinalDecision.jsx'

const ROOMS = {
  LinkDistrict,
  RouletteCorridor,
  InfluencerAvenue,
  AlgorithmRoom,
  AdsCorridor,
  PersuasionRoom,
  FinalDecision,
}

export default function App() {
  const { screen, activeNode, reducedMotion } = useGame()

  useEffect(() => {
    document.body.classList.toggle('reduced-motion', reducedMotion)
  }, [reducedMotion])

  let content
  if (screen === 'welcome') content = <WelcomeScreen />
  else if (screen === 'intro') content = <IntroScreen />
  else if (screen === 'win') content = <WinScreen />
  else if (screen === 'lose') content = <LoseScreen />
  else if (screen === 'room' && activeNode) {
    const RoomComp = ROOMS[activeNode.component]
    content = RoomComp ? <RoomComp node={activeNode} /> : <GameMap />
  } else content = <GameMap />

  return (
    <Stage>
      <DndProvider>
        <div className="stage">
          <HUD />
          {content}
        </div>
      </DndProvider>
    </Stage>
  )
}
