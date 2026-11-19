import { useState } from 'react'
import SurveyModal from './SurveyModal.jsx'
import { isSurveyDone, markSurveyDone } from '../game/session.js'
import { useT } from '../i18n/index.jsx'

/* The feedback survey, offered away from the endings: from the resume dialog,
   and in-game once the clock has gone. Both are points where a player may stop
   for good without ever reaching an ending — a class period ends when it ends,
   and a run that was cut short is exactly the one whose feedback is worth
   having. Until now the survey lived only on the win/lose screens, so stopping
   anywhere else meant it was never asked.

   Asked once per run (see session.js), so answering it here satisfies the end
   screen's banner too: it shows its thanks line instead of asking again. */

/* The once-per-run bookkeeping on its own, for a caller that needs to place
   the modal itself. SessionDialog does: opening the survey ON TOP of that
   dialog reads as a modal inside a modal — two backdrops, two panels — so it
   swaps itself for the survey and comes back when the survey closes. */
export function useSurveyOffer() {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(isSurveyDone)
  return {
    open,
    done,
    show: () => setOpen(true),
    close: () => setOpen(false),
    submitted: () => { markSurveyDone(); setDone(true); setOpen(false) },
  }
}

/* Button and modal together, for somewhere with nothing to stack against —
   the map. Renders nothing once answered, which is what makes it safe to
   drop in without a condition around it. */
export default function SurveyButton({ className = 'btn btn-cyan' }) {
  const t = useT()
  const { open, done, show, close, submitted } = useSurveyOffer()

  if (done) return null

  return (
    <>
      <button type="button" className={className} onClick={show}>
        {t('survey.bannerButton')}
      </button>
      {open && <SurveyModal onClose={close} onSubmitted={submitted} />}
    </>
  )
}
