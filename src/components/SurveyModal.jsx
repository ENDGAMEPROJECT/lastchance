import { useState } from 'react'
import { useT } from '../i18n/index.jsx'
import { track, OBJ, EXT } from '../game/xapi.js'
import './SurveyModal.css'

/* End-of-run feedback survey, modelled on the one in the ECHO escape room
   (../SocialMediaER2 SurveyModal) so results from the two rooms line up.

   Sections are config, not markup: each reads its copy from survey.<id>Title
   and, for the multi-item ones, the survey.<id>Items array. Adding a question
   is a row in the translation Sheet, not a change here — which also means the
   item count is whatever the Sheet says, in every language. */
const SECTIONS = [
  { id: 'opinion', type: 'single-rating', scale: 5, titleKey: 'survey.opinionTitle', rangeKey: 'survey.opinionRange' },
  { id: 'learning', type: 'multi-rating', scale: 7, titleKey: 'survey.learningTitle', rangeKey: 'survey.rateRange' },
  { id: 'guess', type: 'multi-rating', scale: 7, titleKey: 'survey.guessTitle', rangeKey: 'survey.rateRange' },
  // The free-text question has no separate …Title key: survey.comments IS the question.
  { id: 'comments', type: 'text', titleKey: 'survey.comments' },
]

function Scale({ scale, value, onPick, name }) {
  return (
    <div className="sv-scale" role="radiogroup" aria-label={name}>
      {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          className={`sv-dot ${value === n ? 'on' : ''}`}
          onClick={() => onPick(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function SurveyModal({ onClose, onSubmitted }) {
  const t = useT()
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const section = SECTIONS[step]
  const isLast = step === SECTIONS.length - 1
  const items = section.type === 'multi-rating' ? t(`survey.${section.id}Items`) : null
  const list = Array.isArray(items) ? items : []

  /* Ratings are required, free text is not: an empty comment box should not
     trap someone who simply has nothing to add. */
  const complete = section.type === 'single-rating'
    ? answers[section.id] !== undefined
    : section.type === 'multi-rating'
      ? list.every((_, i) => answers[`${section.id}_${i}`] !== undefined)
      : true

  const set = (key, value) => {
    setAnswers((a) => ({ ...a, [key]: value }))
    setShowHint(false)
  }

  const next = () => {
    if (!complete) return setShowHint(true)
    if (!isLast) return setStep((s) => s + 1)
    /* One statement carries the whole survey: result.response for readers
       that only show the response string, and the answers object in an
       extension so each item stays queryable. */
    track('evaluated', OBJ.survey(), {
      node: 'posttest',
      response: JSON.stringify(answers),
      completion: true,
      resultExt: { [EXT.surveyAnswers]: answers },
    })
    onSubmitted?.(answers)
  }

  return (
    <div className="sv-backdrop">
      <div className="sv-modal panel clip panel-glow-cyan fade-in" role="dialog" aria-modal="true" aria-label={t('survey.title')}>
        <div className="sv-head">
          <h3 className="accent-cyan">{t('survey.title')}</h3>
          <button className="sv-x" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        <div className="sv-progress" aria-hidden>
          <span style={{ width: `${((step + 1) / SECTIONS.length) * 100}%` }} />
        </div>

        <div className="sv-body">
          <h4 className="sv-section-title">{t(section.titleKey)}</h4>
          {section.rangeKey && <p className="sv-range mono">{t(section.rangeKey)}</p>}

          {section.type === 'single-rating' && (
            <Scale scale={section.scale} name={t(section.titleKey)}
              value={answers[section.id]} onPick={(n) => set(section.id, n)} />
          )}

          {section.type === 'multi-rating' && (
            <ol className="sv-items">
              {list.map((text, i) => (
                <li key={i} className={`sv-item ${showHint && answers[`${section.id}_${i}`] === undefined ? 'missing' : ''}`}>
                  <span className="sv-item-text">{text}</span>
                  <Scale scale={section.scale} name={text}
                    value={answers[`${section.id}_${i}`]} onPick={(n) => set(`${section.id}_${i}`, n)} />
                </li>
              ))}
            </ol>
          )}

          {section.type === 'text' && (
            <textarea
              className="field sv-text"
              rows={5}
              value={answers.comments || ''}
              onChange={(e) => set('comments', e.target.value)}
              aria-label={t(section.titleKey)}
            />
          )}

          {showHint && !complete && <div className="banner wrong shake sv-hint">{t('survey.requiredHint')}</div>}
        </div>

        <div className="sv-actions">
          <button type="button" className="btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            {t('survey.previous')}
          </button>
          <span className="sv-step mono">{step + 1} / {SECTIONS.length}</span>
          <button type="button" className="btn btn-cyan" onClick={next}>
            {isLast ? t('survey.submit') : t('survey.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
