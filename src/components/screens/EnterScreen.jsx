import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { GAME_MINUTES, NARRATIVE } from '../../game/gameData.js'
import './screens.css'

/* Transition between the pre-test and the district map — the moment the player
   "jacks in" to the Physical Internet. It opens on the hand-off beat ({friend}
   sets the 30-minute ultimatum, the player invites them along), then primes the
   two HUD tools they'll lean on (Map and Bag). "Jack in" starts the clock. */
export default function EnterScreen() {
  const { startGame } = useGame()
  const t = useT()
  const friend = NARRATIVE.friend
  const vars = { friend, product: NARRATIVE.product, minutes: GAME_MINUTES }

  return (
    <div className="stage-scroll">
      <div className="intro fade-in">
        <div className="intro-glyph">⏻</div>
        <div className="eyebrow accent-cyan">{t('enter.eyebrow')}</div>
        <h1 className="intro-title">
          {t('enter.titleLead')} <span className="grad">{t('enter.titleAccent')}</span>
        </h1>

        {/* The hand-off: the challenge, then the invitation. */}
        <div className="enter-dialogue">
          <div className="enter-line friend">
            <span className="enter-who">{friend}</span>
            <p>{t('enter.friendLine', vars)}</p>
          </div>
          <div className="enter-line you">
            <span className="enter-who">{t('story.you')}</span>
            <p>{t('enter.playerLine', vars)}</p>
          </div>
        </div>

        <div className="intro-body">
          <div className="intro-card panel clip panel-glow-cyan">
            <h3 className="accent-cyan">{t('enter.toolsTitle')}</h3>
            <p className="muted">{t('enter.toolsIntro', vars)}</p>
            <div className="intro-mission">
              <span className="chip warn">{t('enter.clock', vars)}</span>
              <p>{t('enter.mission', vars)}</p>
            </div>
          </div>

          <div className="intro-steps">
            <div className="intro-step panel">
              <b>{t('hud.map')}</b>
              <span>{t('enter.mapText', vars)}</span>
            </div>
            <div className="intro-step panel">
              <b>{t('hud.bag')}</b>
              <span>{t('enter.bagText', vars)}</span>
            </div>
          </div>
        </div>

        <button className="btn btn-cyan btn-lg jack-in" onClick={startGame}>
          {t('enter.start')}
        </button>
      </div>
    </div>
  )
}
