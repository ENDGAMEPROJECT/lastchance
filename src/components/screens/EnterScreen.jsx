import { useState, useEffect } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { useStage } from '../Stage.jsx'
import { GAME_MINUTES, NARRATIVE } from '../../game/gameData.js'
import { bgUrl } from '../../game/assets.js'
import { getPreloadedVideo } from '../../game/preloadAssets.js'
import './screens.css'
import './pretest.css'
import './enter.css'

// Intro timeline (motion only): the tunnel video plays with the portal rings
// over it; in its last FLASH_MS the core swells to a whiteout; the white fades
// to black (WHITE_MS), then the black slowly fades to the scene (BLACK_MS).
const TUNNEL_VIDEO = 'transitions-videos/abduction-scene.mp4'
const TUNNEL_MS = 9042 // video length; replaced by the real duration once metadata loads
const FLASH_MS = 1900
const WHITE_MS = 1800
const LOAD_WAIT_MS = 6000 // if the video hasn't started by then, skip it and go to the fade
const BLACK_MS = 6000
const FADE_MS = 350 // matches the speech-band fade in pretest.css
const BACKDROPS = {
  friend: 'max-talking-ph-internet.png',
  player: 'player-talking-ph-internet.png',
  tour: 'no-one-talking-ph-internet.png',
}
const readingTime = (text) => Math.max(3500, text.length * 18 + 1500, text.trim().split(/\s+/).length * 280 + 800)

// Fixed spark layout (percent of the art), so it is stable across renders.
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const r = (n) => { const v = Math.sin((i + 1) * n * 12.9898) * 43758.5453; return v - Math.floor(v) }
  return {
    left: `${4 + r(1) * 92}%`,
    top: `${10 + r(2) * 78}%`,
    '--delay': `${(r(3) * 6).toFixed(2)}s`,
    '--dur': `${(2.4 + r(4) * 3).toFixed(2)}s`,
    '--dx': `${((r(5) - 0.5) * 40).toFixed(0)}px`,
    '--dy': `${(-(10 + r(6) * 30)).toFixed(0)}px`,
    '--c': i % 3 === 0 ? '#ff2bd6' : '#16f2ff',
  }
})

/* The portal arrival: after the warp, a short Max/Mia exchange inside the
   Physical Internet, then a walkthrough of the two HUD tools (Map, then Bag —
   each highlighted with its explanation underneath), and Mia's last line.
   Only then does "Countdown begins" appear; it starts the clock. Every step
   advances on its own after its reading time (shown by the timeline). */
export default function EnterScreen() {
  const { startGame, reducedMotion, setEnterTour } = useGame()
  const t = useT()
  const { scale } = useStage()
  const friend = NARRATIVE.friend
  const vars = { friend, product: NARRATIVE.product, minutes: GAME_MINUTES }

  const steps = [
    { who: 'friend', text: t('enter.friendLine', vars) },
    { who: 'player', text: t('enter.playerLine', vars) },
    { who: 'player', text: t('enter.mission', vars) },
    { who: 'tour', target: 'map', title: t('hud.map'), text: t('enter.mapText', vars) },
    { who: 'tour', target: 'bag', title: t('hud.bag'), text: t('enter.bagText', vars) },
    { who: 'player', text: t('enter.finalLine', vars) },
  ]

  // Intro phases: 'tunnel' (video + rings, scene hidden behind solid black) →
  // 'fade' (whiteout → black → scene) → 'done' (dialogue starts).
  const [phase, setPhase] = useState(reducedMotion ? 'done' : 'tunnel')
  const [tunnelMs, setTunnelMs] = useState(TUNNEL_MS)
  // The tunnel's clock (and the core's final flash) run from when the video
  // actually starts playing, not from mount, so a slow load doesn't desync them.
  const [playing, setPlaying] = useState(false)
  const intro = phase !== 'done'
  useEffect(() => {
    if (phase === 'done') return
    // The tunnel normally ends on the video's 'ended' event; these are fallbacks
    // for a video that never starts or stalls part-way.
    const delay = phase === 'fade' ? WHITE_MS + BLACK_MS : playing ? tunnelMs + 1500 : LOAD_WAIT_MS
    const timer = window.setTimeout(() => setPhase(phase === 'fade' ? 'done' : 'fade'), delay)
    return () => window.clearTimeout(timer)
  }, [phase, playing, tunnelMs])

  // Mount the shared, already-buffering <video> (preloaded at startup) into the
  // tunnel layer and play it from the start; detach it again when the tunnel ends.
  const [videoHost, setVideoHost] = useState(null)
  useEffect(() => {
    if (!videoHost) return
    const video = getPreloadedVideo(TUNNEL_VIDEO)
    const onMeta = () => { if (video.duration) setTunnelMs(video.duration * 1000) }
    const onPlaying = () => setPlaying(true)
    const toFade = () => setPhase('fade')
    video.className = 'enter-video'
    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', toFade)
    video.addEventListener('error', toFade)
    onMeta()
    video.currentTime = 0
    videoHost.appendChild(video)
    video.play().catch(() => {}) // a blocked/slow start falls back to LOAD_WAIT_MS
    return () => {
      video.pause()
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', toFade)
      video.removeEventListener('error', toFade)
      video.remove()
    }
  }, [videoHost])

  const [stepIndex, setStepIndex] = useState(0)
  const [clock, setClock] = useState({ step: 0, ms: 0 })
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const total = readingTime(step.text)
  const elapsed = clock.step === stepIndex ? clock.ms : 0
  const canStart = isLast && elapsed >= total
  const leaving = !reducedMotion && !isLast && elapsed >= total - FADE_MS
  const visibleLetters = reducedMotion ? step.text.length : Math.floor(elapsed / 18)
  const progress = `${Math.min(100, (elapsed / total) * 100)}%`

  // Reading clock: pauses while the tab is hidden, then moves to the next step.
  useEffect(() => {
    if (intro) return
    let ms = 0
    const timer = window.setInterval(() => {
      if (document.hidden) return
      ms = Math.min(total, ms + 50)
      setClock({ step: stepIndex, ms })
      if (ms >= total) {
        window.clearInterval(timer)
        if (!isLast) setStepIndex((i) => i + 1)
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [intro, stepIndex, total, isLast])

  // Tell the HUD which tool to reveal / highlight.
  const tour = stepIndex < 3 ? null : step.who === 'tour' ? step.target : 'done'
  useEffect(() => { setEnterTour(tour) }, [tour, setEnterTour])

  // Place the explanation under the highlighted HUD button. The button lives in
  // the HUD (outside this screen), so track its position every frame while shown.
  const [anchorX, setAnchorX] = useState(null)
  const [root, setRoot] = useState(null)
  useEffect(() => {
    if (step.who !== 'tour' || !root) return
    let frame = 0
    const measure = () => {
      const button = document.querySelector(`[data-tour="${step.target}"]`)
      if (button) {
        const b = button.getBoundingClientRect()
        const r = root.getBoundingClientRect()
        const x = (b.left + b.width / 2 - r.left) / scale
        setAnchorX((prev) => (prev != null && Math.abs(prev - x) < 0.5 ? prev : x))
      }
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    return () => window.cancelAnimationFrame(frame)
  }, [step.who, step.target, root, scale])

  const backdrop = step.who
  const name = step.who === 'player' ? NARRATIVE.player : friend
  const captionW = 360
  const captionLeft = anchorX == null ? null : Math.min(1280 - 16 - captionW, Math.max(16, anchorX - captionW + 40))

  return (
    <div className="scene pretest-scene enter-scene" ref={setRoot}>
      <div className={`pretest-content ${reducedMotion ? 'fade-in' : ''}`}>
        <div className="pretest-art">
          {Object.entries(BACKDROPS).map(([key, file]) => (
            <img key={key} className={`pretest-backdrop enter-backdrop ${backdrop === key ? 'is-visible' : ''}`} src={bgUrl(file)} alt="" />
          ))}
          {/* Subtle life in the scene: drifting sparks and rare glitch slices. */}
          {!reducedMotion && (
            <div className="enter-fx" aria-hidden="true">
              <div className="enter-glitch" style={{ backgroundImage: `url(${bgUrl(BACKDROPS[backdrop])})` }} />
              <div className="enter-glitch enter-glitch-b" style={{ backgroundImage: `url(${bgUrl(BACKDROPS[backdrop])})` }} />
              {SPARKS.map((style, i) => <span key={i} className="enter-spark" style={style} />)}
            </div>
          )}
        </div>

        {/* Arrival title, only during the opening exchange. */}
        <div className={`enter-head ${stepIndex < 3 ? '' : 'is-hidden'}`}>
          <div className="eyebrow accent-cyan">{t('enter.eyebrow')}</div>
          <h1 className="enter-title">
            {t('enter.titleLead')} <span className="grad">{t('enter.titleAccent')}</span>
          </h1>
        </div>

        {!intro && step.who !== 'tour' && (
          <div key={stepIndex} className={`pretest-speech ${step.who === 'player' ? 'is-player' : 'is-friend'} ${leaving ? 'is-leaving' : ''}`}>
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
          </div>
        )}

        {!intro && step.who === 'tour' && captionLeft != null && (
          <div key={stepIndex} className={`enter-caption is-${step.target} ${leaving ? 'is-leaving' : ''}`}
            style={{ left: captionLeft, width: captionW, '--arrow': `${anchorX - captionLeft}px` }} aria-live="polite">
            <b className="enter-caption-title">{step.title}</b>
            <p>{step.text}</p>
            <span className="enter-caption-track" aria-hidden="true">
              <span className="enter-caption-progress" style={{ width: progress }} />
            </span>
          </div>
        )}

        {canStart && (
          <button className="btn btn-cyan btn-lg jack-in enter-start" onClick={startGame}>
            {t('enter.start')}
          </button>
        )}
      </div>

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
      {intro && (
        <div className={`enter-blackout ${phase === 'fade' ? 'is-fading' : ''}`}
          style={{ '--white': `${WHITE_MS}ms`, '--black': `${BLACK_MS}ms` }} aria-hidden />
      )}
      {phase === 'fade' && <div className="enter-whiteout" style={{ '--white': `${WHITE_MS}ms` }} aria-hidden />}
    </div>
  )
}
