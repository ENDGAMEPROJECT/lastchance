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

  /* Where the run actually stands, beyond the district count. All of it is
     composed from keys that already exist in every language (nodes.*.title
     and the hints.stats.* labels the HUD uses), so finer detail costs no
     new translation.

     Where they are: the district they had open, or — on the map — the one
     they would open next. What they are carrying: the evidence and tools
     that survive, which is the honest measure of what resuming preserves.
     Mid-puzzle progress is deliberately not claimed: rooms keep their own
     state (blocked doors, framed posters), none of which is saved. */
  const whereId = pendingRun.activeNodeId
    || NODES.find((n) => progress[n.id] === 'available')?.id
  const where = whereId ? t(`nodes.${whereId}.title`) : null
  const evidence = pendingRun.evidence?.length ?? 0
  const tools = pendingRun.inventory?.length ?? 0

  return (
    <div className="session-backdrop">
      <div className="session-dialog panel clip panel-glow-cyan fade-in" role="dialog" aria-modal="true">
        <h3 className="accent-cyan">{t('session.title')}</h3>
        <p className="session-message">{t('session.message')}</p>
        <p className="session-progress mono">
          {t('session.progress', { done, total, time: formatTime(pendingRun.timeLeft ?? 0) })}
        </p>
        <p className="session-detail mono">
          {where && <span className="session-where">{where}</span>}
          <span>{t('hints.stats.evidence')}: {evidence}</span>
          <span>{t('hints.stats.tools')}: {tools}</span>
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
