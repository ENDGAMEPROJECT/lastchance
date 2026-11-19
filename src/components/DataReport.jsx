import { useT } from '../i18n/index.jsx'
import './DataReport.css'

/* One emoji per entry, all from the self-hosted emoji subset
   (game/emojiFont.js UNICODE_RANGE) so they show in colour in every browser.
   Index-aligned with rooms.algorithm.report.entries. */
const ENTRY_ICONS = ['📢', '⏰', '⭐', '🛑', '🔗', '📱', '🛍️', '😟', '🚨', '💸']
/* Times and result colours: structure, not copy, so they live here. The
   sheet import dropped them from the locales (entries only carry text/result);
   a locale value still wins if it ever comes back. */
const ENTRY_TIMES = ['10:02', '10:03', '10:04', '10:05', '10:06', '10:07', '10:11', '10:12', '10:20', '10:25']
const ENTRY_TONES = ['green', 'green', 'green', 'red', 'orange', 'green', 'green', 'orange', 'green', 'green']

export default function DataReport() {
  const t = useT()
  const entries = t('rooms.algorithm.report.entries')

  return (
    <article className="data-report">
      <div className="data-report-hole data-report-hole-one" aria-hidden />
      <div className="data-report-hole data-report-hole-two" aria-hidden />
      <div className="data-report-hole data-report-hole-three" aria-hidden />

      <header className="data-report-header">
        <p className="data-report-kicker">{t('rooms.algorithm.report.kicker')}</p>
        <h2>{t('rooms.algorithm.report.title')}</h2>
        <p className="data-report-subtitle">{t('rooms.algorithm.report.subject')}</p>
        <p className="data-report-instruction">{t('rooms.algorithm.report.instruction')}</p>
      </header>

      <div className="data-report-table">
        <div className="data-report-headings">
          <span>{t('rooms.algorithm.report.columns.time')}</span>
          <span>{t('rooms.algorithm.report.columns.activity')}</span>
          <span>{t('rooms.algorithm.report.columns.interpretation')}</span>
        </div>
        <div className="data-report-entries">
          {entries.map((entry, index) => (
            <div className="data-report-row" key={index}>
              <span className="data-report-time mono">{entry.time || ENTRY_TIMES[index]}</span>
              <span className="data-report-icon" aria-hidden>{ENTRY_ICONS[index]}</span>
              <span className="data-report-activity">{entry.text}</span>
              <span className="data-report-arrow" aria-hidden>→</span>
              <span className={`data-report-result ${entry.tone || ENTRY_TONES[index] || ''}`}>{entry.result}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
