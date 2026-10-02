import { useGame } from '../game/GameContext.jsx'
import { DEBUG } from '../game/settings.js'
import { useT } from '../i18n/index.jsx'

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
