import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { useStage } from '../Stage.jsx'
import { GAME_MINUTES } from '../../game/gameData.js'
import { getPreloadedVideo } from '../../game/preloadAssets.js'
import { DEBUG } from '../../game/settings.js'
import { bgUrl } from '../../game/assets.js'
import DialogNav from './DialogNav.jsx'
import DialogScene, { sceneBackground } from './DialogScene.jsx'
import './screens.css'
import './pretest.css'
import './enter.css'

/* Typewriter speed (ms per letter) and the pause once a line is fully typed.
   A line's reading time = its typing time + HOLD_MS, so it always finishes. */
const LETTER_MS = 40
const HOLD_MS = 1500

// Intro timeline (motion only): the tunnel video plays with the portal rings
// over it; in its last FLASH_MS the core swells to a whiteout; the white fades
// to black (WHITE_MS), then the black slowly fades to the scene (BLACK_MS).
const TUNNEL_VIDEO = 'transitions-videos/abduction-scene.mp4'
const TUNNEL_MS = 9042 // video length; replaced by the real duration once metadata loads
const FLASH_MS = 1900
const WHITE_MS = 1800
const LOAD_WAIT_MS = 6000 // if the video hasn't started by then, skip it and go to the fade
const BLACK_MS = 6000
const readingTime = (text) => text.length * LETTER_MS + HOLD_MS // type it out, then hold

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
   Physical Internet, then a walkthrough of the HUD tools (Map, Bag, Hints —
   each highlighted with its explanation underneath), and Mia's last line.
   Only then does the Map become clickable; opening it starts the clock. Each
   step waits for its reading time (shown by the timeline), then the player
   moves on with Next (or goes Back to re-read; read steps come back complete). */
export default function EnterScreen() {
  const { reducedMotion, setEnterTour, narrative } = useGame()
  const t = useT()
  const { scale, viewRect } = useStage()
  const friend = narrative.friend
  const vars = { friend, product: narrative.product, minutes: GAME_MINUTES }

  const steps = [
    { who: 'friend', text: t('enter.friendLine', vars) },
    { who: 'player', text: t('enter.playerLine', vars) },
    { who: 'player', text: t('enter.mission', vars) },
    { who: 'tour', target: 'map', title: t('hud.map'), text: t('enter.mapText', vars) },
    { who: 'tour', target: 'bag', title: t('hud.bag'), text: t('enter.bagText', vars) },
    { who: 'tour', target: 'hints', title: t('hud.hints'), text: t('enter.hintsText', vars) },
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
  // Debug only: freeze the whole arrival (timers, dialogue, CSS animations and
  // the tunnel video) to inspect a moment, e.g. the "Physical Internet" title.
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  useEffect(() => {
    if (phase === 'done' || paused) return
    // The tunnel normally ends on the video's 'ended' event; these are fallbacks
    // for a video that never starts or stalls part-way.
    const delay = phase === 'fade' ? WHITE_MS + BLACK_MS : playing ? tunnelMs + 1500 : LOAD_WAIT_MS
    const timer = window.setTimeout(() => setPhase(phase === 'fade' ? 'done' : 'fade'), delay)
    return () => window.clearTimeout(timer)
  }, [phase, playing, tunnelMs, paused])

  // Mount the shared, already-buffering <video> (preloaded during the pre-test) into the
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
  useEffect(() => {
    const video = videoHost?.querySelector('video')
    if (!video) return
    if (paused) video.pause()
    else video.play().catch(() => {})
  }, [paused, videoHost])

  const [stepIndex, setStepIndex] = useState(0)
  const [clock, setClock] = useState({ step: 0, ms: 0 })
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const total = readingTime(step.text)
  const elapsed = clock.step === stepIndex ? clock.ms : 0
  // debug: no reading wait — the buttons show at once
  const canStart = isLast && (DEBUG || elapsed >= total)
  const stepRead = DEBUG || elapsed >= total
  const doneSteps = useRef(new Set())
  const goNext = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1))
  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1))
  const visibleLetters = reducedMotion ? step.text.length : Math.floor(elapsed / LETTER_MS)
  const progress = `${Math.min(100, (elapsed / total) * 100)}%`

  // Reading clock: pauses while the tab is hidden; a step read before (the
  // player came Back) starts complete.
  useEffect(() => {
    if (intro) return
    if (doneSteps.current.has(stepIndex)) {
      setClock({ step: stepIndex, ms: total })
      return
    }
    let ms = 0
    const timer = window.setInterval(() => {
      if (document.hidden || pausedRef.current) return
      ms = Math.min(total, ms + 50)
      setClock({ step: stepIndex, ms })
      if (ms >= total) {
        window.clearInterval(timer)
        doneSteps.current.add(stepIndex)
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [intro, stepIndex, total])

  // Reveal the tools during their explanations; enable Map after the final line.
  const tour = canStart ? 'ready' : stepIndex < 3 ? null : step.who === 'tour' ? step.target : 'done'
  useEffect(() => { setEnterTour(tour) }, [tour, setEnterTour])

  // Place the explanation next to the highlighted HUD button, never over it.
  // The button lives in the HUD (outside this screen), so track its box (in
  // design px, relative to this screen) every frame while shown.
  const [anchor, setAnchor] = useState(null)
  const [root, setRoot] = useState(null)
  useEffect(() => {
    if (step.who !== 'tour' || !root) return
    let frame = 0
    const measure = () => {
      const button = document.querySelector(`[data-tour="${step.target}"]`)
      if (button) {
        // viewRect undoes a phone-orientation rotation, if any
        const b = viewRect(button.getBoundingClientRect())
        const r = viewRect(root.getBoundingClientRect())
        const box = {
          left: (b.left - r.left) / scale,
          right: (b.right - r.left) / scale,
          top: (b.top - r.top) / scale,
          bottom: (b.bottom - r.top) / scale,
        }
        setAnchor((prev) => (prev && ['left', 'right', 'top', 'bottom'].every((k) => Math.abs(prev[k] - box[k]) < 0.5) ? prev : box))
      }
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    return () => window.cancelAnimationFrame(frame)
  }, [step.who, step.target, root, scale, viewRect])

  // The empty arrival scene shows until the dialogue starts (and during the HUD tour).
  const backdrop = intro || step.who === 'tour' ? 'initial' : step.who
  const name = step.who === 'player' ? narrative.player : friend
  const glitchBackground = backdrop === 'initial'
    ? { backgroundImage: `url(${bgUrl('initial-ph-internet.png')})` }
    : sceneBackground(narrative.internetScene, backdrop)
  const captionW = 550
  // How tall the caption is including the Back/Next row hanging under it, so
  // it can be kept clear of the screen's bottom edge (design px).
  const [captionEl, setCaptionEl] = useState(null)
  const [captionReach, setCaptionReach] = useState(0)
  useLayoutEffect(() => {
    if (!captionEl) return
    const measure = () => {
      const btn = captionEl.querySelector('.dlg-nav-btn')
      setCaptionReach(captionEl.offsetHeight + (btn ? btn.offsetTop + btn.offsetHeight : 0))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(captionEl)
    return () => observer.disconnect()
  }, [captionEl])
  const sceneH = root?.offsetHeight || 720
  const CAPTION_GAP = 14
  // Desktop: the button is in the top bar, above this screen → the caption
  // hangs below it, arrow pointing up. Phones: the buttons are a column down
  // the right edge, over the screen → the caption sits to the button's left,
  // arrow pointing right, so it covers neither that button nor the next one.
  const captionSide = anchor != null && anchor.bottom > 4
  let caption = null
  if (anchor) {
    const midX = (anchor.left + anchor.right) / 2
    const midY = (anchor.top + anchor.bottom) / 2
    if (captionSide) {
      const left = Math.min(1280 - 16 - captionW, Math.max(16, anchor.left - CAPTION_GAP - captionW))
      // Level with the button, but lifted if the caption plus its Back/Next
      // row would run off the bottom (the Bag sits low in the phone column).
      const top = Math.max(14, Math.min(anchor.top, sceneH - 14 - captionReach))
      caption = { style: { left, top, width: captionW, '--arrow-y': `${midY - top}px` } }
    } else {
      const left = Math.min(1280 - 16 - captionW, Math.max(16, midX - captionW + 40))
      caption = { style: { left, top: Math.max(14, anchor.bottom + CAPTION_GAP), width: captionW, '--arrow': `${midX - left}px` } }
    }
  }

  return (
    <div className={`scene pretest-scene enter-scene ${paused ? 'is-paused' : ''}`} ref={setRoot}>
      <div className={`pretest-content ${reducedMotion ? 'fade-in' : ''}`}>
        <div className="pretest-art">
          <img className={`pretest-backdrop enter-backdrop ${backdrop === 'initial' ? 'is-visible' : ''}`} src={bgUrl('initial-ph-internet.png')} alt="" />
          <DialogScene
            className="enter-backdrop"
            scene={narrative.internetScene}
            speaker={backdrop === 'initial' ? null : backdrop}
            visible={backdrop !== 'initial'}
          />
          {/* Subtle life in the scene: drifting sparks and rare glitch slices. */}
          {!reducedMotion && (
            <div className="enter-fx" aria-hidden="true">
              <div className="enter-glitch" style={glitchBackground} />
              <div className="enter-glitch enter-glitch-b" style={glitchBackground} />
              {SPARKS.map((style, i) => <span key={i} className="enter-spark" style={style} />)}
            </div>
          )}
        </div>

        {/* Arrival title, only during the opening exchange. */}
        <div className={`enter-head ${stepIndex < 3 ? '' : 'is-hidden'}`}>
          {/* <div className="eyebrow accent-cyan">{t('enter.eyebrow')}</div> */}
          <h1 className="enter-title">
            {t('enter.titleLead')} <span className="grad-light">{t('enter.titleAccent')}</span>
          </h1>
        </div>

        {!intro && step.who !== 'tour' && (
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
            <DialogNav canPrev={stepIndex > 0} canNext={stepRead && !isLast} onPrev={goPrev} onNext={goNext} />
          </div>
        )}

        {!intro && step.who === 'tour' && caption && (
          <div key={stepIndex} ref={setCaptionEl} className={`enter-caption is-${step.target} ${captionSide ? 'is-side' : ''}`}
            style={caption.style} aria-live="polite">
            <b className="enter-caption-title">{step.title}</b>
            <p>{step.text}</p>
            <span className="enter-caption-track" aria-hidden="true">
              <span className="enter-caption-progress" style={{ width: progress }} />
            </span>
            <DialogNav className="is-caption" holdNext canPrev={stepIndex > 0} canNext={stepRead && !isLast} onPrev={goPrev} onNext={goNext} />
          </div>
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
      {DEBUG && (
        <button type="button" className="btn btn-sm btn-ghost enter-debug-pause"
          onMouseDown={(event) => event.preventDefault()} onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      )}
    </div>
  )
}
