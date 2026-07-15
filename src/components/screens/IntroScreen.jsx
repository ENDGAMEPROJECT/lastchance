import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { GAME_MINUTES, NARRATIVE } from '../../game/gameData.js'
import './screens.css'

export default function IntroScreen() {
  const { startGame } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product, minutes: GAME_MINUTES }
  const steps = t('intro.steps')

  return (
    <div className="stage-scroll">
      <div className="intro fade-in">
        <div className="intro-glyph">◉</div>
        <div className="eyebrow">{t('intro.eyebrow')}</div>
        <h1 className="intro-title">
          {t('intro.titleLead')} <span className="grad">{t('intro.titleAccent')}</span>
        </h1>
        <p className="intro-tag mono">{t('intro.tagline')}</p>

        <div className="intro-body">
          <div className="intro-card panel clip panel-glow-cyan">
            <h3 className="accent-cyan">{t('intro.situationTitle')}</h3>
            <p>{t('intro.hook', vars)}</p>
            <p className="muted">{t('intro.context', vars)}</p>
            <div className="intro-mission">
              <span className="chip warn">{t('intro.clock', vars)}</span>
              <p>{t('intro.mission', vars)}</p>
            </div>
          </div>

          <div className="intro-steps">
            {steps.map((s, i) => (
              <div className="intro-step panel" key={i}>
                <b>{s.title}</b>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-cyan btn-lg jack-in" onClick={startGame}>
          {t('intro.start')}
        </button>
        <p className="dim t-xs" style={{ marginTop: 8 }}>
          {t('intro.pretest', vars)}
        </p>
      </div>
    </div>
  )
}
