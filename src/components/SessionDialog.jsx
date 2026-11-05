import { useGame, formatTime } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import './SessionDialog.css'

/* Shown over the welcome screen when a run is found in storage after a
   refresh. Deliberately not a Modal: there is no dismiss and no backdrop
   click, because closing it would leave the player on a welcome screen
   whose "Enter" would start a second run on top of the saved one. The two
   buttons are the only ways out.

   It states what is actually at stake — districts cleared and time left —
   so the choice is informed rather than a guess about what "resume" means. */
export default function SessionDialog() {
  const { pendingRun, resumeRun, discardRun, NODES } = useGame()
  const t = useT()

  if (!pendingRun) return null

  const progress = pendingRun.progress || {}
  const done = Object.values(progress).filter((s) => s === 'done').length
  const total = NODES.length

  return (
    <div className="session-backdrop">
      <div className="session-dialog panel clip panel-glow-cyan fade-in" role="dialog" aria-modal="true">
        <h3 className="accent-cyan">{t('session.title')}</h3>
        <p className="session-message">{t('session.message')}</p>
        <p className="session-progress mono">
          {t('session.progress', { done, total, time: formatTime(pendingRun.timeLeft ?? 0) })}
        </p>
        <div className="session-actions">
          <button type="button" className="btn btn-cyan btn-lg" onClick={resumeRun} autoFocus>
            {t('session.resume')}
          </button>
          <button type="button" className="btn btn-magenta" onClick={discardRun}>
            {t('session.restart')}
          </button>
        </div>
      </div>
    </div>
  )
}
