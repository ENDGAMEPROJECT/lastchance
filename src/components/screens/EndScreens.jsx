import { useState } from 'react'
import { useGame, formatTime } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { assetUrl } from '../../game/assets.js'
import { useMobileView } from '../../game/device.js'
import { getAllEvidence } from '../../game/evidence.js'
import Modal from '../Modal.jsx'
import SurveyModal from '../SurveyModal.jsx'
import { isSurveyDone, markSurveyDone } from '../../game/session.js'

/* The project site, the same destination ECHO sends players to. */
const ENDGAME_URL = 'https://endgameproject.github.io/'
import './screens.css'

/* Clouds drifting across the win sky: [top px, scale, seconds to cross, start offset 0–1, opacity]. */
const CLOUDS = [
  [70, 1.15, 420, 0.15, 0.95],
  [150, 0.7, 520, 0.55, 0.8],
  [255, 0.9, 470, 0.85, 0.9],
  [390, 0.6, 600, 0.35, 0.7],
  [470, 1.0, 540, 0.7, 0.75],
]

/* Morning sky behind the win screen: a sunny gradient with a few clouds
   drifting very slowly. Pure CSS, decorative. */
function WinSky() {
  return (
    <div className="win-sky" aria-hidden="true">
      <div className="win-sun" />
      {CLOUDS.map(([top, scale, dur, offset, opacity], i) => (
        <div key={i} className="win-cloud-lane" style={{ top, '--dur': `${dur}s`, '--offset': `${-offset * dur}s`, '--x': `${Math.round(-420 + offset * 1740)}px` }}>
          <div className="win-cloud" style={{ transform: `scale(${scale})`, opacity }} />
        </div>
      ))}
    </div>
  )
}

/* Key segment for copy written about the friend (the character the player did
   NOT pick): playing Mia → friend Max → "Max", and vice versa. */
const friendKey = (narrative) => (narrative.friendId === 'mia' ? 'Mia' : 'Max')

/* "What happened / would have happened to {friend}" — the consequence card on
   every ending, in the lose screen's red card style. */
function WhatHappenedCard({ titleKey, textKey, narrative, vars, light = false }) {
  const t = useT()
  return (
    <div className={light ? 'intro-card panel-light clip end-what end-what-light' : 'intro-card what-happened-card panel clip end-what'}>
      <h3>{t(titleKey, vars)}</h3>
      <p>{t(`${textKey}.${friendKey(narrative)}`, vars)}</p>
    </div>
  )
}

/* Lose-screen popover: the evidence the player gathered vs. what was still
   out there, as two lists. */
function EvidenceReport({ open, onClose }) {
  const { evidence, narrative } = useGame()
  const t = useT()
  const collectedIds = new Set(evidence.map((e) => e.id))
  const missing = getAllEvidence(t, narrative).filter((e) => !collectedIds.has(e.id))
  return (
    <Modal open={open} onClose={onClose} title={t('end.lose.missingEvidence.title')} accent="magenta" width={620} className="evidence-report">
      <h4 className="evidence-report-heading is-collected">{t('end.lose.missingEvidence.collected')}</h4>
      {evidence.length === 0 ? (
        <p className="muted">{t('end.lose.missingEvidence.none')}</p>
      ) : (
        <ul className="evidence-report-list is-collected">
          {evidence.map((e) => <li key={e.id}>{e.label}</li>)}
        </ul>
      )}
      {missing.length > 0 && (
        <>
          <h4 className="evidence-report-heading is-missing">{t('end.lose.missingEvidence.missing')}</h4>
          <ul className="evidence-report-list is-missing">
            {missing.map((e) => <li key={e.id}>{e.label}</li>)}
          </ul>
        </>
      )}
    </Modal>
  )
}

/* The feedback survey, offered on both endings. An invitation rather than a
   wall: a player who just lost should not be made to fill in a form before
   they can read why. Asked once per run (see session.js), so a refresh on
   the end screen does not nag. */
function SurveyInvite() {
  const t = useT()
  const { reset } = useGame()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(isSurveyDone)
  const [options, setOptions] = useState(false)

  /* Once the survey is in, the run really is over: offer the ways out, the
     same two ECHO offers. "Continue exploring ECHO" is deliberately not
     among them — there is nothing to keep exploring here, and the label
     names the wrong escape room. Closing returns to this screen, where the
     evidence report still is. */
  const endOptions = options && (
    <div className="sv-backdrop" onClick={() => setOptions(false)}>
      <div
        className="sv-modal eo-modal panel clip panel-glow-cyan fade-in"
        role="dialog" aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sv-head">
          <h3 className="accent-cyan">{t('escapeRoomEnd.title')}</h3>
          <button className="sv-x" onClick={() => setOptions(false)} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="sv-body eo-body">
          <p className="eo-description">{t('escapeRoomEnd.description')}</p>
          <div className="eo-actions">
            <button type="button" className="btn btn-cyan btn-lg" onClick={reset}>
              {t('escapeRoomEnd.restart')}
            </button>
            <a
              className="btn btn-lg eo-link"
              href={ENDGAME_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('escapeRoomEnd.visitResources')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  if (done) {
    return (
      <>
        <p className="sv-thanks">
          {t('survey.bannerTitle')}{' '}
          <a href={ENDGAME_URL} target="_blank" rel="noopener noreferrer">{t('escapeRoomEnd.visitResources')}</a>
        </p>
        {endOptions}
      </>
    )
  }

  return (
    <>
      <div className="sv-banner">
        <div className="sv-banner-text">
          <div className="sv-banner-title">{t('survey.bannerTitle')}</div>
          <div className="sv-banner-sub">{t('survey.bannerSubtitle')}</div>
        </div>
        <button className="btn btn-cyan" onClick={() => setOpen(true)}>{t('survey.bannerButton')}</button>
      </div>
      {open && (
        <SurveyModal
          onClose={() => setOpen(false)}
          onSubmitted={() => { markSurveyDone(); setDone(true); setOpen(false); setOptions(true) }}
        />
      )}
      {endOptions}
    </>
  )
}

export function WinScreen() {
  const { timeLeft, reset, narrative } = useGame()
  const t = useT()
  const [reportOpen, setReportOpen] = useState(false)
  const vars = { friend: narrative.friend, product: narrative.product, time: formatTime(timeLeft) }
  // Large buttons on desktop (>1180px); regular size on phones (≤1180px,
  // = settings.mobile.breakpoint). Re-renders when the window crosses it.
  const btnClass = useMobileView() ? 'btn' : 'btn btn-lg'

  return (
    <div className="stage-scroll win-scene">
      <WinSky />
      {/* The chosen character, bottom-right (public/ending/mia-won.png / max-won.png). */}
      <img className="win-players" src={assetUrl(`ending/${narrative.character}-won.png`)} alt="" />
      <div className="intro end fade-in">
        <div className="eyebrow" style={{ color: 'var(--green)', fontSize: "20px", fontWeight: "bold" }}>
          <span>{t('end.win.eyebrow')} </span>
          <span className="intro-glyph win-glyph">✓</span>
        </div>
        <h1 className="intro-title">{t('end.win.titleLead', vars)} <span className="grad">{t('end.win.titleAccent')}</span></h1>
        <h3 className="intro-offer" style={{ fontSize: "1.17em", fontFamily: "var(--font-retro)", color: "#2gc3c52", textAlign: "center" }}>{t('end.win.tag', vars)}</h3>
        <p style={{ fontSize: "1.15rem", fontFamily: "var(--font-retro)", marginBottom: 16, textAlign: "center" }}
        className="win-description">{t('end.win.body', vars)}</p>

        <WhatHappenedCard titleKey="end.whatHappened.titleWin" textKey="end.whatCould" narrative={narrative} vars={vars} light />

        <div className="end-actions">
          <button className={`btn-magenta win-again ${btnClass}`} onClick={reset}>{t('end.win.again')}</button>
          <button className={`btn-light ${btnClass}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setReportOpen(true)}>
            {t('end.win.evidenceButton')}
          </button>
        </div>
        <SurveyInvite />
      </div>
      <EvidenceReport open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}

export function LoseScreen() {
  const { reset, loseReason, narrative } = useGame()
  const t = useT()
  const [reportOpen, setReportOpen] = useState(false)
  const vars = { friend: narrative.friend, product: narrative.product }
  const btnClass = useMobileView() ? 'btn' : 'btn btn-lg' // as on the win screen

  // Per-outcome heading/body, falling back to the generic time-up copy. The
  // reducer sets loseReason: 'timeUp' | 'choseBuy' |
  // 'notEnoughEvidenceConvincing' | 'notEnoughEvidenceUnconvincing'.
  const reasonKey = `end.lose.reasons.${loseReason}`
  const reasonHeading = t(`${reasonKey}.heading`)
  const heading = reasonHeading === `${reasonKey}.heading` ? t('end.lose.heading') : reasonHeading
  // A reason may carry per-friend copy (…<reason>.Mia.body / .Max.body, for the
  // pronouns); otherwise its plain body; otherwise the generic lose copy.
  const friendBodyKey = `${reasonKey}.${friendKey(narrative)}.body`
  const friendBody = t(friendBodyKey, vars)
  const reasonBody = friendBody !== friendBodyKey ? friendBody : t(`${reasonKey}.body`, vars)
  const body = reasonBody === `${reasonKey}.body` ? t('end.lose.body', vars) : reasonBody

  return (
    <div className="stage-scroll lose-scene">
      {/* The chosen character's lost scene (public/ending/mia-lost.png / max-lost.png). */}
      <div className="lose-bg" style={{ backgroundImage: `url("${assetUrl(`ending/${narrative.character}-lost.png`)}")` }} aria-hidden="true" />
      <div className="intro end fade-in gap-larger">
       
        <div className="eyebrow container-lose-eyebrow" style={{ color: 'var(--red)' }}>  <span className="intro-glyph lose-glyph">⏱</span>{t('end.lose.eyebrow')}</div>
        <h1 className="intro-title">{t('end.lose.titleLead', vars)} <span className="grad-red">{t('end.lose.titleAccent')}</span></h1>
        {/* <p className="intro-tag mono">{t('end.lose.tag')}</p> */}

        <div className="lose-reason">
          <h3 className="lose-heading">{heading}</h3>
          <p className="lose-description">{body}</p>
        </div>

        <WhatHappenedCard titleKey="end.whatHappened.titleLose" textKey="end.whatHappened" narrative={narrative} vars={vars} />

        <div className="end-actions">
          <button className={`btn-cyan ${btnClass}`} onClick={reset}>{t('end.lose.again')}</button>
          <button className={`btn-magenta ${btnClass}`} onMouseDown={(e) => e.preventDefault()} onClick={() => setReportOpen(true)}>
            {t('end.lose.missingEvidence.button')}
          </button>
        </div>
        <SurveyInvite />
      </div>
      <EvidenceReport open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  )
}
