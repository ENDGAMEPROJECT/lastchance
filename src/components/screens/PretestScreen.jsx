import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import InPersonTest from './InPersonTest.jsx'

export default function PretestScreen() {
  const { enterInternet } = useGame()
  const t = useT()
  const script = t('story.pretest')

  // Diagnostic conversation, then our "step inside" transition (enterInternet)
  // rather than jumping straight to the map — the enter screen explains Map/Bag.
  return (
    <InPersonTest
      script={script}
      actions={[{ label: script.begin, tone: 'cyan', onClick: enterInternet }]}
    />
  )
}
