import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import InPersonTest from './InPersonTest.jsx'

export default function PretestScreen() {
  const { startGame } = useGame()
  const t = useT()
  const script = t('story.pretest')

  return (
    <InPersonTest
      script={script}
      actions={[{ label: script.begin, tone: 'cyan', onClick: startGame }]}
    />
  )
}
