import { useGame } from '../game/GameContext.jsx'
import { DEBUG } from '../game/settings.js'
import { useT } from '../i18n/index.jsx'

/* Debug-only shortcut: skip the intro (welcome + pre-test) straight to the
   portal arrival. Renders nothing outside debug mode. */
export default function DebugPortalButton() {
  const { skipToPortal } = useGame()
  const t = useT()
  if (!DEBUG) return null
  return (
    <button className="btn btn-sm btn-ghost" title={t('debug.skipToPortalDescription')}
      onMouseDown={(event) => event.preventDefault()} onClick={skipToPortal}>
      {t('debug.skipToPortal')}
    </button>
  )
}
