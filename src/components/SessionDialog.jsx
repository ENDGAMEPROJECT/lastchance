import { useState } from 'react'
import { useGame, formatTime } from '../game/GameContext.jsx'
import SurveyModal from './SurveyModal.jsx'
import { useSurveyOffer } from './SurveyButton.jsx'
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
  const survey = useSurveyOffer()
  /* "Start over" destroys the saved run on the click — the progress, the
     evidence, the pending survey — and sits next to Resume, so one mis-tap
     used to end a run that was still going. Arm it first. */
  const [confirmRestart, setConfirmRestart] = useState(false)

  if (!pendingRun) return null

  /* In place of this dialog, not over it: the survey brings its own backdrop
     and panel, and showing both at once reads as a modal inside a modal.
     Closing it returns here, with the run still on offer. */
  if (survey.open) return <SurveyModal onClose={survey.close} onSubmitted={survey.submitted} />

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
  /* The saved run reached the final conversation but never had it — all
     districts cleared, or the clock gone and the player carrying on. Starting
     over throws that away, and with it the only post-measure of what they
     learned, so say so rather than letting the button do it quietly. */
  const postTestPending = (pendingRun.timedOut
    || (NODES.every((n) => progress[n.id] === 'done') && pendingRun.returnTalked))
    && !['posttest', 'win', 'lose'].includes(pendingRun.screen)

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
        {postTestPending && (
          <p className="session-pending">{t('session.postTestPending')}</p>
        )}
        {confirmRestart ? (
          /* Armed: say plainly what the button is about to do, then ask again.
             The lines above already give the specifics — districts cleared,
             time left, the unanswered survey — so this says only what they do
             not: that it cannot be undone. Back is the focused default,
             because the safe action should be the easy one. */
          <>
            <p className="session-confirm" role="alert">{t('session.confirmRestart')}</p>
            <div className="session-actions">
              <button type="button" className="btn btn-cyan btn-lg" onClick={() => setConfirmRestart(false)} autoFocus>
                {t('common.back')}
              </button>
              <button type="button" className="btn btn-magenta" onClick={discardRun}>
                {t('session.restart')}
              </button>
            </div>
          </>
        ) : (
          <div className="session-actions">
            <button type="button" className="btn btn-cyan btn-lg" onClick={resumeRun} autoFocus>
              {t('session.resume')}
            </button>
            {/* The feedback survey, from here rather than only from an ending:
                whoever is looking at this dialog may be coming back to a run
                they will not finish, at whatever point they left it. Gone once
                answered, so a second refresh does not ask again. */}
            {!survey.done && (
              <button type="button" className="btn btn-amber" onClick={survey.show}>
                {t('survey.bannerButton')}
              </button>
            )}
            {/* Quieter when there is something to lose: the warning above says
                what, and the default action should be the safe one. */}
            <button type="button" className={postTestPending ? 'btn btn-ghost' : 'btn btn-magenta'}
              onClick={() => setConfirmRestart(true)}>
              {t('session.restart')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
