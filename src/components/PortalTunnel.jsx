import { useEffect, useRef, useState } from 'react'
import HoloTunnel from './HoloTunnel.jsx'
import { getPreloadedVideo, PORTAL_VIDEO } from '../game/preloadAssets.js'
import { settings } from '../game/settings.js'
import './PortalTunnel.css'

/* The portal trip's tunnel: the tunnel video (preloaded during the screen
   before), with the coded tunnel (HoloTunnel) as a fallback so the trip never
   freezes on the video's first frame.

   The video gives way to HoloTunnel when:
     · play() is refused (autoplay blocked, e.g. iPhone Low Power Mode),
     · it errors,
     · it hasn't started after START_WAIT_MS (still downloading), or
     · it stops advancing for STALL_MS mid-play.
   Once it has switched it stays on HoloTunnel. The screen that mounts this
   owns the trip's timing either way; the video just plays once.

   Props are HoloTunnel's: rampMs, paused (debug freeze), className. */
const START_WAIT_MS = 1200
const STALL_MS = 900

export default function PortalTunnel({ rampMs, paused = false, className = '' }) {
  const [fallback, setFallback] = useState(!settings.portal.video)
  const [host, setHost] = useState(null)
  const videoRef = useRef(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    if (!host || fallback) return
    const video = getPreloadedVideo(PORTAL_VIDEO)
    videoRef.current = video
    let done = false
    let started = false
    let lastTime = -1
    let lastMove = performance.now()
    const giveUp = () => {
      if (done) return
      done = true
      setFallback(true)
    }
    const onPlaying = () => { started = true; lastMove = performance.now() }
    video.className = 'portal-tunnel-video'
    video.addEventListener('playing', onPlaying)
    video.addEventListener('error', giveUp)
    try { video.currentTime = 0 } catch { /* not seekable yet: it starts at 0 anyway */ }
    host.appendChild(video)
    if (!pausedRef.current) {
      const attempt = video.play()
      if (attempt && attempt.catch) attempt.catch((err) => {
        // An AbortError only means a pause() interrupted it (debug freeze / unmount).
        if (err && err.name !== 'AbortError') giveUp()
      })
    }
    const mountedAt = performance.now()
    const watchdog = window.setInterval(() => {
      if (pausedRef.current || video.ended) { lastMove = performance.now(); return }
      const now = performance.now()
      if (!started) {
        if (now - mountedAt > START_WAIT_MS) giveUp()
        return
      }
      if (video.currentTime !== lastTime) { lastTime = video.currentTime; lastMove = now }
      else if (now - lastMove > STALL_MS) giveUp()
    }, 150)
    return () => {
      done = true
      window.clearInterval(watchdog)
      video.pause()
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('error', giveUp)
      video.remove()
      videoRef.current = null
    }
  }, [host, fallback])

  // Debug freeze.
  useEffect(() => {
    const video = videoRef.current
    if (!video || fallback) return
    if (paused) video.pause()
    else video.play().catch(() => {})
  }, [paused, fallback])

  if (fallback) return <HoloTunnel className={className} rampMs={rampMs} paused={paused} />
  return <div className={`portal-tunnel ${className}`} ref={setHost} aria-hidden />
}
