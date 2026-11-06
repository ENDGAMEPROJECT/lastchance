import { forwardRef } from 'react'
import { useT } from '../i18n/index.jsx'

/* The game's one close button (✕): a dark neon chip — purple edge, cyan inner
   glow — styled by `.close-btn` in styles/global.css. Pass
   `light` when it sits on a light surface. Position it with `className`;
   any other props (onClick, ref, autoFocus, onMouseDown…) go to the <button>. */
const CloseButton = forwardRef(function CloseButton({ className = '', light = false, ...rest }, ref) {
  const t = useT()
  return (
    <button
      ref={ref}
      type="button"
      className={`close-btn ${light ? 'close-btn--light' : ''} ${className}`.trim()}
      aria-label={t('common.close')}
      title={t('common.close')}
      {...rest}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
    </button>
  )
})

export default CloseButton
