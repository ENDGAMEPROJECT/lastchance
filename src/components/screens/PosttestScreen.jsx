import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import InPersonTest from './InPersonTest.jsx'

export default function PosttestScreen() {
  const { finishGame } = useGame()
  const t = useT()
  const script = t('story.posttest')

  return (
    <InPersonTest
      script={script}
      requirePhoneView={false}
      masteryOpening={t('story.mastery.banner')}
      actions={[
        { label: script.choiceClose, tone: 'green', onClick: () => finishGame('win') },
        { label: script.choiceBuy, tone: 'magenta', onClick: () => finishGame('lose') },
      ]}
    />
  )
}
