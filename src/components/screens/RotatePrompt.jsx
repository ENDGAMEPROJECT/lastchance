import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../../i18n/index.jsx'
import { isLandscape } from '../../game/device.js'
import './rotate.css'

// Not turned by then → carry on anyway (the game rotates itself to fit).
const GIVE_UP_MS = 15000

/* Phones only: shown between the portrait welcome screen and the landscape
   game. An animated phone turns sideways while the player is asked to do the
   same; once the phone is actually in landscape we carry on by ourselves —
   or after GIVE_UP_MS if it never is.
   It's portalled to <body>, outside the stage, so it
   always reads upright in the phone's real orientation. */
export default function RotatePrompt({ onContinue }) {
  const t = useT()
  const done = useRef(false)

  useEffect(() => {
    let timer
    const finish = () => {
      if (done.current) return
      done.current = true
      onContinue()
    }
    const check = () => {
      window.clearTimeout(timer)
      // A short beat so the turn registers before the game appears.
      if (isLandscape()) timer = window.setTimeout(finish, 700)
    }
    check()
    const giveUp = window.setTimeout(finish, GIVE_UP_MS)
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(giveUp)
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [onContinue])

  return createPortal(
    <div className="rotate-prompt" role="dialog" aria-modal="true" aria-labelledby="rotate-title" aria-describedby="rotate-text">
      <div className="rotate-phone" aria-hidden="true">
        <svg viewBox="0 0 60 100">
          <rect x="4" y="4" width="52" height="92" rx="9" />
          <rect className="rotate-phone-screen" x="10" y="14" width="40" height="70" rx="2" />
          <line x1="24" y1="9" x2="36" y2="9" />
          <circle cx="30" cy="90" r="2.5" />
        </svg>
        <svg className="rotate-arrow" viewBox="0 0 100 100">
          <path d="M20 30 A 40 40 0 0 1 80 30" />
          <path d="M72 18 L 82 31 L 66 34" />
        </svg>
      </div>
      <h2 id="rotate-title" className="rotate-title">{t('rotate.title')}</h2>
      <p id="rotate-text" className="rotate-text">{t('rotate.text')}</p>
    </div>,
    document.body,
  )
}
