import { useState, useEffect, useRef } from 'react'
import { useGame, formatTime } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { getPreloadedVideo } from '../../game/preloadAssets.js'
import DialogNav from './DialogNav.jsx'
import DialogScene from './DialogScene.jsx'
import './screens.css'
import './pretest.css'
import './enter.css'
import { DEBUG } from '../../game/settings.js'

// Same reading pace / fade as the portal arrival (EnterScreen).
const PORTAL_VIDEO = 'transitions-videos/abduction-scene.mp4'
const TUNNEL_MS = 9042 // video length; replaced by the real duration once metadata loads
const FLASH_MS = 1900
const LOAD_WAIT_MS = 6000 // video never started → go on anyway
const WHITE_HOLD_MS = 2000 // the core's whiteout holds on white before the post-test fades in
// Arrival, as after the first portal trip: hold on black, then the black slowly
// fades to the scene (same curve and length as EnterScreen's BLACK_MS).
const HOLD_BLACK_MS = 1500
const BLACK_MS = 1000
const readingTime = (text) => Math.max(4500, text.length * 18 + 1500, text.trim().split(/\s+/).length * 280 + 800)

/* Back in the Physical Internet after the last district: a short player/friend
   exchange, then "Go back to the real world" → the map. Its Final Decision
   station brings the player back here, straight into the portal tunnel →
   post-test. The clock is paused here (COMPLETE_NODE) and resumes in the post-test. */
export default function ReturnScreen() {
  const { reducedMotion, narrative, timeLeft, returnTalked, finishReturnTalk, enterPosttestFromWhite } = useGame()
  const t = useT()
  const vars = {
    friend: narrative.friend,
    product: narrative.product,
    minutes: Math.ceil(timeLeft / 60),
    time: formatTime(timeLeft),
  }
  const steps = [
    { who: 'player', text: t('return.playerLine', vars) },
    // No time left → the offer is already over, so no countdown in the line.
    { who: 'friend', text: t(timeLeft > 0 ? 'return.friendLine' : 'return.friendLineTimeUp', vars) },
  ]

  // 'arrive' (black → slow fade-in) → 'talk' → 'tunnel' (video + portal
  // rings) → 'white' → post-test. The talk ends on the map; coming back from
  // its Final Decision starts at the tunnel.
  const [phase, setPhase] = useState(returnTalked ? 'tunnel' : reducedMotion ? 'talk' : 'arrive')
  useEffect(() => {
    if (phase !== 'arrive') return
    const timer = window.setTimeout(() => setPhase('talk'), HOLD_BLACK_MS + BLACK_MS)
    return () => window.clearTimeout(timer)
  }, [phase])
  const [stepIndex, setStepIndex] = useState(0)
  const [clock, setClock] = useState({ step: 0, ms: 0 })
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const total = readingTime(step.text)
  const elapsed = clock.step === stepIndex ? clock.ms : 0
  // debug: no reading wait — the buttons show at once
  const dialogDone = isLast && (DEBUG || elapsed >= total)
  const stepRead = DEBUG || elapsed >= total
  const doneSteps = useRef(new Set())
  const visibleLetters = reducedMotion ? step.text.length : Math.floor(elapsed / 40)
  const progress = `${Math.min(100, (elapsed / total) * 100)}%`

  // Reading clock: pauses while the tab is hidden; Next moves on once it's
  // full. A line read before (the player came Back) starts complete.
  useEffect(() => {
    if (phase !== 'talk') return
    if (doneSteps.current.has(stepIndex)) {
      setClock({ step: stepIndex, ms: total })
      return
    }
    let ms = 0
    const timer = window.setInterval(() => {
      if (document.hidden) return
      ms = Math.min(total, ms + 50)
      setClock({ step: stepIndex, ms })
      if (ms >= total) {
        window.clearInterval(timer)
        doneSteps.current.add(stepIndex)
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [phase, stepIndex, total])

  // Tunnel: play the shared, preloaded portal video; its end (or a stall) cuts
  // to white, then into the post-test.
  const [videoHost, setVideoHost] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [tunnelMs, setTunnelMs] = useState(TUNNEL_MS)
  useEffect(() => {
    if (!videoHost) return
    const video = getPreloadedVideo(PORTAL_VIDEO)
    const onMeta = () => { if (video.duration) setTunnelMs(video.duration * 1000) }
    const onPlaying = () => setPlaying(true)
    const toWhite = () => setPhase('white')
    video.className = 'enter-video'
    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', toWhite)
    video.addEventListener('error', toWhite)
    onMeta()
    video.currentTime = 0
    videoHost.appendChild(video)
    video.play().catch(() => {})
    return () => {
      video.pause()
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', toWhite)
      video.removeEventListener('error', toWhite)
      video.remove()
    }
  }, [videoHost])
  useEffect(() => {
    if (phase === 'tunnel' && !playing) {
      const timer = window.setTimeout(() => setPhase('white'), LOAD_WAIT_MS)
      return () => window.clearTimeout(timer)
    }
    if (phase === 'white') {
      const timer = window.setTimeout(enterPosttestFromWhite, WHITE_HOLD_MS)
      return () => window.clearTimeout(timer)
    }
  }, [phase, playing, enterPosttestFromWhite])

  const name = step.who === 'player' ? narrative.player : narrative.friend

  return (
    <div className="scene pretest-scene enter-scene return-scene">
      <div className="pretest-content fade-in">
        <div className="pretest-art">
          <DialogScene className="enter-backdrop" scene={narrative.internetScene} speaker={step.who} />
        </div>

        {phase === 'talk' && (
          <div key={stepIndex} className={`pretest-speech ${name === 'Mia' ? 'is-mia' : 'is-max'}`}>
            <div className="pretest-speech-name" data-text={name} aria-hidden="true">{name}</div>
            <p className="pretest-line" aria-label={step.text} aria-live="polite" aria-atomic="true">
              <span aria-hidden="true">
                <span className="pretest-line-visible">{step.text.slice(0, visibleLetters)}</span>
                <span className="pretest-line-pending">{step.text.slice(visibleLetters)}</span>
              </span>
            </p>
            <span className="pretest-reading-track" aria-hidden="true">
              <span className="pretest-reading-progress" style={{ width: progress }} />
            </span>
            <DialogNav canPrev={stepIndex > 0} canNext={stepRead && !isLast}
              onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
              onNext={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))} />
          </div>
        )}

        {phase === 'talk' && dialogDone && (
          <div className="return-actions fade-in">
            <button type="button" className="btn btn-cyan btn-lg" onMouseDown={(e) => e.preventDefault()} onClick={finishReturnTalk}>
              {t('return.goBack')}
            </button>
          </div>
        )}
      </div>

      {phase === 'arrive' && (
        <div className="enter-blackout is-fading" aria-hidden
          style={{ '--white': `${HOLD_BLACK_MS}ms`, '--black': `${BLACK_MS}ms` }} />
      )}
      {phase === 'tunnel' && <div className="enter-blackout" aria-hidden />}
      {phase === 'tunnel' && <div className="enter-video-host" ref={setVideoHost} aria-hidden />}
      {phase === 'tunnel' && (
        <div className={`portal-warp enter-warp ${playing ? 'is-playing' : ''}`} aria-hidden
          style={{ '--flash': `${FLASH_MS}ms`, '--flash-delay': `${Math.max(0, tunnelMs - FLASH_MS)}ms` }}>
          <div className="portal-streaks" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <span className="portal-ring" />
          <div className="portal-core" />
        </div>
      )}
      {phase === 'white' && <div className="return-whiteout" aria-hidden />}
    </div>
  )
}
