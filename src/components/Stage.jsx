import { createContext, useContext, useState, useLayoutEffect, useEffect, useMemo, useCallback } from 'react'
import { settings } from '../game/settings.js'
import { IS_PHONE } from '../game/device.js'
import './Stage.css'

/* Fixed-resolution 16:9 stage.
   The game is authored at settings.design (1280x720) and scaled as a
   single unit to fit the window, letterboxed. We expose the current
   scale factor via context so the drag-and-drop ghost (which lives in
   screen space) can match the on-screen size of dragged elements.

   Phones only: the stage keeps a fixed orientation whatever way the phone is
   held — `portrait` (the welcome screen) swaps the design to 720x1280, and the
   rest of the game is landscape. If the phone is held the other way, the whole
   view is rotated 90° in CSS (iOS can't lock orientation from a web page). Any
   code mapping screen coordinates into the game uses toView()/viewRect(),
   which undo that rotation (they're plain pass-throughs when not rotated). */

const StageContext = createContext({
  scale: 1,
  ...settings.design,
  rotated: false,
  toView: (x, y) => ({ x, y }),
  viewRect: (r) => r,
  viewportEl: null,
})

export function useStage() {
  return useContext(StageContext)
}

export default function Stage({ children, portrait = false }) {
  const width = portrait ? settings.design.height : settings.design.width
  const height = portrait ? settings.design.width : settings.design.height
  const [scale, setScale] = useState(1)
  const [view, setView] = useState({ W: window.innerWidth, H: window.innerHeight, rotated: false })
  const [viewportEl, setViewportEl] = useState(null)

  useLayoutEffect(() => {
    const compute = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      // Held against the design's orientation → turn the view a quarter.
      const rotated = IS_PHONE && (H > W) !== (height > width)
      const vw = rotated ? H : W
      const vh = rotated ? W : H
      const s = Math.min(vw / width, vh / height)
      setScale(s)
      setView({ W, H, rotated })
      // Mobile text boost (only read by the ≤920px media query in global.css):
      // enough to bring the 17px body text up to minTextPx on screen, capped.
      const { minTextPx, maxTextBoost } = settings.mobile
      const boost = Math.min(maxTextBoost, Math.max(1, minTextPx / (17 * s)))
      document.documentElement.style.setProperty('--text-boost', boost.toFixed(3))
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('orientationchange', compute)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('orientationchange', compute)
    }
  }, [width, height])

  // Where the browser allows it (Android, in fullscreen), also ask for a real
  // orientation lock. Best effort: unsupported or refused is fine.
  useEffect(() => {
    if (!IS_PHONE) return
    const lock = () => {
      if (!document.fullscreenElement) return
      window.screen.orientation?.lock?.(portrait ? 'portrait' : 'landscape').catch(() => {})
    }
    lock()
    document.addEventListener('fullscreenchange', lock)
    return () => document.removeEventListener('fullscreenchange', lock)
  }, [portrait])

  // The rotated view is turned 90° clockwise about its top-left and shifted
  // right by the screen width: view (x, y) → screen (W − y, x).
  const { W, H, rotated } = view
  const toView = useCallback((x, y) => (rotated ? { x: y, y: W - x } : { x, y }), [rotated, W])
  const viewRect = useCallback((r) => (rotated
    ? { left: r.top, right: r.bottom, top: W - r.right, bottom: W - r.left, width: r.height, height: r.width }
    : r), [rotated, W])

  const ctx = useMemo(
    () => ({ scale, width, height, rotated, toView, viewRect, viewportEl }),
    [scale, width, height, rotated, toView, viewRect, viewportEl],
  )

  const viewportStyle = rotated
    ? { inset: 'auto', top: 0, left: 0, width: H, height: W, transformOrigin: 'top left', transform: `translateX(${W}px) rotate(90deg)` }
    : undefined

  return (
    <StageContext.Provider value={ctx}>
      <div className="viewport" ref={setViewportEl} style={viewportStyle}>
        <div
          className="stage16 app-shell"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </StageContext.Provider>
  )
}
