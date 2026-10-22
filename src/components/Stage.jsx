import { createContext, useContext, useState, useLayoutEffect, useMemo } from 'react'
import { settings } from '../game/settings.js'
import './Stage.css'

/* Fixed-resolution 16:9 stage.
   The game is authored at settings.design (1280x720) and scaled as a
   single unit to fit the window, letterboxed. We expose the current
   scale factor via context so the drag-and-drop ghost (which lives in
   screen space) can match the on-screen size of dragged elements. */

const StageContext = createContext({ scale: 1, ...settings.design })

export function useStage() {
  return useContext(StageContext)
}

export default function Stage({ children }) {
  const { width, height } = settings.design
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const compute = () => {
      const s = Math.min(window.innerWidth / width, window.innerHeight / height)
      setScale(s)
      // Mobile text boost (only read by the ≤920px media query in global.css):
      // enough to bring the 17px body text up to minTextPx on screen, capped.
      const { minTextPx, maxTextBoost } = settings.mobile
      const boost = Math.min(maxTextBoost, Math.max(1, minTextPx / (17 * s)))
      document.documentElement.style.setProperty('--text-boost', boost.toFixed(3))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [width, height])

  const ctx = useMemo(() => ({ scale, width, height }), [scale, width, height])

  return (
    <StageContext.Provider value={ctx}>
      <div className="viewport">
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
