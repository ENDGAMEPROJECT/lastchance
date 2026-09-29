import { useState, useEffect } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { GAME_MINUTES, NARRATIVE } from '../../game/gameData.js'
import { bgUrl } from '../../game/assets.js'
import './screens.css'

/* Transition between the pre-test and the district map — the moment the player
   "steps inside" the Physical Internet. A neon portal warp plays on arrival (a
   wormhole rushing past, then a whiteout the instructions emerge from), so the
   jump from the real-world chat into the digital world feels like travel rather
   than a plain screen swap. It opens on the hand-off beat ({friend} sets the
   30-minute ultimatum, the player invites them along), then primes the two HUD
   tools they'll lean on (Map and Bag). "Step inside" starts the clock. */
export default function EnterScreen() {
  const { startGame, reducedMotion } = useGame()
  const t = useT()
  const friend = NARRATIVE.friend
  const vars = { friend, product: NARRATIVE.product, minutes: GAME_MINUTES }

  // The portal overlay only plays with motion enabled; it clears itself once
  // the warp finishes so it never sits in front of the buttons.
  const [warping, setWarping] = useState(!reducedMotion)
  useEffect(() => {
    if (!warping) return
    const timer = window.setTimeout(() => setWarping(false), 1900)
    return () => window.clearTimeout(timer)
  }, [warping])

  return (
    <div className="stage-scroll enter-scroll">
      {/* Arrive onto the actual district map — the instructions sit over it, so
          the portal drops you into the world you're about to explore. */}
      <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('map/map-bg.png')})` }} />
      {warping && (
        <div className="portal-warp" aria-hidden>
          <div className="portal-streaks" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <div className="portal-core" />
        </div>
      )}
      <div className={`intro ${reducedMotion ? 'fade-in' : 'portal-arrive'}`}>
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
          <div className="intro-card panel panel-glow-cyan">
            <h3 className="accent-cyan">{t('enter.toolsTitle')}</h3>
            <p className="muted">{t('enter.toolsIntro', vars)}</p>
            <div className="intro-mission">
              <span className="chip warn">{t('enter.clock', vars)}</span>
              <p>{t('enter.mission', vars)}</p>
            </div>
          </div>

          <div className="intro-steps">
            <div className="intro-step panel">
              <span className="intro-step-icon" aria-hidden>{t('hud.map').split(' ')[0]}</span>
              <div className="intro-step-body">
                <b>{t('hud.map').split(' ').slice(1).join(' ')}</b>
                <span>{t('enter.mapText', vars)}</span>
              </div>
            </div>
            <div className="intro-step panel">
              <span className="intro-step-icon" aria-hidden>{t('hud.bag').split(' ')[0]}</span>
              <div className="intro-step-body">
                <b>{t('hud.bag').split(' ').slice(1).join(' ')}</b>
                <span>{t('enter.bagText', vars)}</span>
              </div>
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
