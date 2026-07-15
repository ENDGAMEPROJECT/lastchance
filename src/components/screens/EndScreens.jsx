import { useGame, formatTime } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import './screens.css'

export function WinScreen() {
  const { timeLeft, evidence, reset } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product, time: formatTime(timeLeft) }

  return (
    <div className="stage-scroll">
      <div className="intro end fade-in">
        <div className="intro-glyph win-glyph">✓</div>
        <div className="eyebrow" style={{ color: 'var(--green)' }}>{t('end.win.eyebrow')}</div>
        <h1 className="intro-title">{t('end.win.titleLead', vars)} <span className="grad">{t('end.win.titleAccent')}</span></h1>
        <p className="intro-tag mono">{t('end.win.tag', vars)}</p>

        <div className="intro-card panel clip panel-glow-cyan">
          <h3 className="accent-green">{t('end.win.heading')}</h3>
          <p>{t('end.win.body', vars)}</p>
          {evidence.length > 0 && (
            <>
              <div className="eyebrow" style={{ color: 'var(--green)', marginTop: 14 }}>{t('end.win.evidenceHeading')}</div>
              <ul className="evidence-list">
                {evidence.map((e) => (<li key={e.id}><span className="ev-dot" />{e.label}</li>))}
              </ul>
            </>
          )}
          <div className="learn" style={{ marginTop: 16 }}>{t('end.win.posttest', vars)}</div>
        </div>

        <button className="btn btn-green btn-lg" onClick={reset}>{t('end.win.again')}</button>
      </div>
    </div>
  )
}

export function LoseScreen() {
  const { reset } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product }

  return (
    <div className="stage-scroll">
      <div className="intro end fade-in">
        <div className="intro-glyph lose-glyph">⏱</div>
        <div className="eyebrow" style={{ color: 'var(--red)' }}>{t('end.lose.eyebrow')}</div>
        <h1 className="intro-title">{t('end.lose.titleLead', vars)} <span className="grad-red">{t('end.lose.titleAccent')}</span></h1>
        <p className="intro-tag mono">{t('end.lose.tag')}</p>

        <div className="intro-card panel clip" style={{ borderColor: 'rgba(255,59,92,0.4)', boxShadow: 'var(--glow-red)' }}>
          <h3 style={{ color: 'var(--red)' }}>{t('end.lose.heading')}</h3>
          <p>{t('end.lose.body', vars)}</p>
          <div className="learn" style={{ marginTop: 14, borderColor: 'var(--red)', background: 'rgba(255,59,92,0.08)' }}>
            <b style={{ color: 'var(--red)' }}>{t('end.lose.lessonLabel')}</b> {t('end.lose.lesson')}
          </div>
        </div>

        <button className="btn btn-cyan btn-lg" onClick={reset}>{t('end.lose.again')}</button>
      </div>
    </div>
  )
}
