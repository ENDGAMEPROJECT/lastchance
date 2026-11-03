import { useI18n, localeName } from '../i18n/index.jsx'
import { DEBUG } from '../game/settings.js'

/* Debug-only: shows the current language and cycles through every registered
   locale on click (en → es → fi → sr → en …), so translations can be checked
   on any screen without restarting the run. */
export default function DebugLanguageButton() {
  const { locale, setLocale, locales } = useI18n()
  if (!DEBUG) return null
  const next = locales[(locales.indexOf(locale) + 1) % locales.length]
  return (
    <button className="btn btn-sm btn-ghost" title={`Debug: switch language to ${localeName(next)}`}
      onMouseDown={(event) => event.preventDefault()} onClick={() => setLocale(next)}>
      {locale.toUpperCase()} ⇄
    </button>
  )
}
