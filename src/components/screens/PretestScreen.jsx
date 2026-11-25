import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import InPersonTest from './InPersonTest.jsx'

/* Expressions through the pre-test. Only the one speaking shows an
   expression; the listener is always neutral. The friend is excited showing
   the offer (their first line) and stressed in every line after it ("Whatever
   the reason…" onwards); the player is thinking while answering and accepting
   only on their last line ("Deal…"). */
const pretestPoses = ({ phase, round }) => {
  if (phase === 'reply') return { player: 'thinking', friend: null }
  if (phase === 'endingYou') return { player: 'accepting', friend: null }
  const opening = phase === 'opening' || (phase === 'options' && round === 0)
  return { player: null, friend: opening ? 'excited' : 'stressed' }
}

export default function PretestScreen() {
  const { enterInternet } = useGame()
  const t = useT()
  const script = t('story.pretest')

  // Diagnostic conversation, then our "step inside" transition (enterInternet)
  // rather than jumping straight to the map — the enter screen explains Map/Bag.
  return (
    <InPersonTest
      script={script}
      posesAt={pretestPoses}
      phoneAction={{ label: script.begin, onClick: enterInternet }}
    />
  )
}
