import { useT } from '../i18n/index.jsx'
import './DataReport.css'

const ENTRY_ICONS = ['↗', '◉', '▣', '□', 'AD', '⌁', '+', '◷', '✦', '↻']

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
            <div className="data-report-row" key={`${entry.time}-${index}`}>
              <span className="data-report-time mono">{entry.time}</span>
              <span className="data-report-icon" aria-hidden>{ENTRY_ICONS[index]}</span>
              <span className="data-report-activity">
                {entry.text.split(/(\d+(?:[.,]\d+)?)/g).map((part, partIndex) =>
                  /^\d+(?:[.,]\d+)?$/.test(part)
                    ? <strong key={partIndex}>{part}</strong>
                    : <span key={partIndex}>{part}</span>
                )}
              </span>
              <span className="data-report-arrow" aria-hidden>→</span>
              <span className={`data-report-result ${entry.tone}`}>{entry.result}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}