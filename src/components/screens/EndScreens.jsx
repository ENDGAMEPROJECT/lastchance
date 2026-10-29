import { useGame, formatTime } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { assetUrl } from '../../game/assets.js'
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
function WhatHappenedCard({ titleKey, textKey, narrative, vars }) {
  const t = useT()
  return (
    <div className="intro-card panel clip end-what">
      <h3>{t(titleKey, vars)}</h3>
      <p>{t(`${textKey}.${friendKey(narrative)}`, vars)}</p>
    </div>
  )
}

export function WinScreen() {
  const { timeLeft, evidence, reset, narrative } = useGame()
  const t = useT()
  const vars = { friend: narrative.friend, product: narrative.product, time: formatTime(timeLeft) }

  return (
    <div className="stage-scroll win-scene">
      <WinSky />
      {/* <img className="offer-phone-only" src={assetUrl("bg/offer-phone-only.png")}></img> */}
      {/* The chosen character, bottom-right (public/ending/mia-won.png / max-won.png). */}
      <img className="win-players" src={assetUrl(`ending/${narrative.character}-won.png`)} alt="" />
      <div className="win-title-container">
         <div className="eyebrow" style={{ color: 'var(--green)', fontSize: "16px", fontWeight: "bold" }}>
           <span>{t('end.win.eyebrow')} </span>
            <span className="intro-glyph win-glyph">✓</span>
        </div>
        <h1 className="intro-title">{t('end.win.titleLead', vars)} <span className="grad">{t('end.win.titleAccent')}</span></h1>
        <p className="intro-tag mono">{t('end.win.tag', vars)}</p>
          {/* <h3 className="win-congrats">{t('end.win.heading')}</h3> */}
          <p className="win-description">{t('end.win.body', vars)}</p>
      </div>
      <div className="intro end fade-in">
       

        <div className="intro-card panel-light clip panel-glow-cyan">
        
          {evidence.length > 0 && (
            <>
              <div className="" style={{ color: '#16624c', marginTop: 2, fontWeight: "bold", fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>{t('end.win.evidenceHeading')}</div>
              <ul className="evidence-list">
                {evidence.map((e) => (<li key={e.id}><span className="ev-dot" />{e.label}</li>))}
              </ul>
            </>
          )}
        </div>

        <WhatHappenedCard titleKey="end.whatHappened.titleWin" textKey="end.whatCould" narrative={narrative} vars={vars} />

        <button className="btn-light btn-lg" onClick={reset}>{t('end.win.again')}</button>
      </div>
    </div>
  )
}

export function LoseScreen() {
  const { reset, loseReason, narrative } = useGame()
  const t = useT()
  const vars = { friend: narrative.friend, product: narrative.product }

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
    <div className="stage-scroll">
      {/* The chosen character's lost scene (public/ending/mia-lost.png / max-lost.png). */}
      <div className="lose-bg" style={{ backgroundImage: `url("${assetUrl(`ending/${narrative.character}-lost.png`)}")` }} aria-hidden="true" />
      <div className="intro end fade-in">
       
        <div className="eyebrow container-lose-eyebrow" style={{ color: 'var(--red)' }}>  <span className="intro-glyph lose-glyph">⏱</span>{t('end.lose.eyebrow')}</div>
        <h1 className="intro-title">{t('end.lose.titleLead', vars)} <span className="grad-red">{t('end.lose.titleAccent')}</span></h1>
        <p className="intro-tag mono">{t('end.lose.tag')}</p>

        <div className="intro-card panel clip" style={{ borderColor: 'rgba(255,59,92,0.4)', boxShadow: 'var(--glow-red)' }}>
          <h3 style={{ color: 'var(--red)' }}>{heading}</h3>
          <p>{body}</p>
        </div>

        <WhatHappenedCard titleKey="end.whatHappened.titleLose" textKey="end.whatHappened" narrative={narrative} vars={vars} />

        <button className="btn btn-cyan btn-lg" onClick={reset}>{t('end.lose.again')}</button>
      </div>
    </div>
  )
}
