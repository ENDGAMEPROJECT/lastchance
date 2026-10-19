import { useGame } from '../game/GameContext.jsx'
import { DEBUG } from '../game/settings.js'
import { useT } from '../i18n/index.jsx'

/* Debug: play the last Physical Internet dialogue + portal transition, then the
   post-test, in either scenario (5:00 left / time ran out). */
export function DebugReturnButtons() {
  const { gotoScreen } = useGame()
  if (!DEBUG) return null
  return <>
    <button className="btn btn-sm btn-ghost" title="Play the last Physical Internet dialogue and the portal back, then the post-test with all puzzles completed and 5 minutes left"
      onClick={() => gotoScreen('return', 'inTime')}>
      Return · 5:00
    </button>
    <button className="btn btn-sm btn-ghost" title="Play the last Physical Internet dialogue and the portal back, then the post-test after time ran out"
      onClick={() => gotoScreen('return', 'timeout')}>
      Return · 0:00
    </button>
  </>
}

export default function DebugPosttestButtons() {
  const { gotoScreen } = useGame()
  const t = useT()
  if (!DEBUG) return null
  return <>
    <button className="btn btn-sm btn-ghost" title={t('debug.posttestInTimeDescription')}
      onClick={() => gotoScreen('posttest', 'inTime')}>
      {t('debug.posttestInTime')}
    </button>
    <button className="btn btn-sm btn-ghost" title={t('debug.posttestTimeoutDescription')}
      onClick={() => gotoScreen('posttest', 'timeout')}>
      {t('debug.posttestTimeout')}
    </button>
  </>
}
