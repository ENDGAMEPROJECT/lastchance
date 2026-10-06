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

export function WinScreen() {
  const { timeLeft, evidence, reset, narrative } = useGame()
  const t = useT()
  const vars = { friend: narrative.friend, product: narrative.product, time: formatTime(timeLeft) }

  return (
    <div className="stage-scroll win-scene">
      <WinSky />
      {/* <img className="offer-phone-only" src={assetUrl("bg/offer-phone-only.png")}></img> */}
      {/* Max and Mia, bottom-left (public/ending/player-won.png). */}
      <img className="win-players" src={assetUrl('ending/player-won.png')} alt="" />
      <div className="win-title-container">
         <div className="eyebrow" style={{ color: 'var(--green)' }}>{t('end.win.eyebrow')} 
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
              <div className="eyebrow" style={{ color: '#16624c', marginTop: 14 }}>{t('end.win.evidenceHeading')}</div>
              <ul className="evidence-list">
                {evidence.map((e) => (<li key={e.id}><span className="ev-dot" />{e.label}</li>))}
              </ul>
            </>
          )}
        </div>

        <button className="btn btn-green btn-lg" onClick={reset}>{t('end.win.again')}</button>
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
  const reasonBody = t(`${reasonKey}.body`, vars)
  const body = reasonBody === `${reasonKey}.body` ? t('end.lose.body', vars) : reasonBody

  return (
    <div className="stage-scroll">
      <div className="intro end fade-in">
        <div className="intro-glyph lose-glyph">⏱</div>
        <div className="eyebrow" style={{ color: 'var(--red)' }}>{t('end.lose.eyebrow')}</div>
        <h1 className="intro-title">{t('end.lose.titleLead', vars)} <span className="grad-red">{t('end.lose.titleAccent')}</span></h1>
        <p className="intro-tag mono">{t('end.lose.tag')}</p>

        <div className="intro-card panel clip" style={{ borderColor: 'rgba(255,59,92,0.4)', boxShadow: 'var(--glow-red)' }}>
          <h3 style={{ color: 'var(--red)' }}>{heading}</h3>
          <p>{body}</p>
        </div>

        <button className="btn btn-cyan btn-lg" onClick={reset}>{t('end.lose.again')}</button>
      </div>
    </div>
  )
}
