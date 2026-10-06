import { useGame } from '../game/GameContext.jsx'
import { DEBUG } from '../game/settings.js'

/* Debug-only: shows who the player is playing and switches Mia ⇄ Max on click.
   Everything character-dependent (names, pronouns, images) follows the switch. */
export default function DebugCharacterButton() {
  const { player, setCharacter } = useGame()
  if (!DEBUG) return null
  const current = player.character === 'max' ? 'max' : 'mia'
  const next = current === 'max' ? 'mia' : 'max'
  const name = { mia: 'Mia', max: 'Max' }
  return (
    <button className="btn btn-sm btn-ghost" title={`Debug: switch to playing as ${name[next]}`}
      onMouseDown={(event) => event.preventDefault()} onClick={() => setCharacter(next)}>
      As {name[current]} ⇄
    </button>
  )
}
