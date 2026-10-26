import { useT } from '../../i18n/index.jsx'

/* Back / Next for a timed dialogue line, set just outside the speech band:
   Back at its bottom-left corner (only when there is an earlier line in the
   stretch), Next at its bottom-right (only once the line's reading time is
   over). `holdNext` keeps Next in place but disabled until then instead — for
   the HUD tour captions, where the two sit side by side and a lone Back would
   look stranded. The parent leaves it out while the player is choosing an
   option. Desktop and phone sizes: the .dlg-nav rules in pretest.css. */
export default function DialogNav({ canPrev, canNext, onPrev, onNext, holdNext = false, className = '' }) {
  const t = useT()
  const showNext = canNext || holdNext
  if (!canPrev && !showNext) return null
  return (
    <div className={`dlg-nav ${className}`}>
      {canPrev && (
        <button type="button" className="dlg-nav-btn dlg-nav-prev"
          onMouseDown={(event) => event.preventDefault()} onClick={onPrev}
          aria-label={t('common.back')} title={t('common.back')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      {showNext && (
        <button type="button" className="dlg-nav-btn dlg-nav-next" disabled={!canNext}
          onMouseDown={(event) => event.preventDefault()} onClick={onNext}
          aria-label={t('common.next')} title={t('common.next')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  )
}
