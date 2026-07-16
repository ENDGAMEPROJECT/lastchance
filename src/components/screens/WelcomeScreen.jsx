import { useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useI18n, useT, AVAILABLE_LOCALES, localeName } from '../../i18n/index.jsx'
import './welcome.css'

/* First screen: collect the player's alias + age and let them pick a
   language. The language list is populated from the registered locales,
   so new languages appear automatically. */
export default function WelcomeScreen() {
  const { submitWelcome } = useGame()
  const t = useT()
  const { locale, setLocale } = useI18n()
  const [alias, setAlias] = useState('')
  const [age, setAge] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const a = alias.trim()
    const n = parseInt(age, 10)
    if (!a) return setErr(t('welcome.aliasError'))
    if (!age || Number.isNaN(n) || n < 1 || n > 120) return setErr(t('welcome.ageError'))
    submitWelcome({ alias: a, age: n })
  }

  return (
    <div className="scene welcome-scene">
      <div className="bg-slot" style={{ backgroundImage: 'url(/bg/welcome.gif)' }} />
      <form className="welcome-card panel clip panel-glow-cyan fade-in" onSubmit={onSubmit}>
        <div className="welcome-glyph">◉</div>
        <div className="eyebrow">{t('welcome.eyebrow')}</div>
        <h1 className="welcome-title">
          {t('welcome.titleLead')} <span className="grad">{t('welcome.titleAccent')}</span>
        </h1>
        <p className="welcome-tag mono">{t('welcome.tagline')}</p>

        <div className="welcome-fields">
          <label className="welcome-field">
            <span>{t('welcome.aliasLabel')}</span>
            <input
              className="field"
              value={alias}
              onChange={(e) => { setErr(''); setAlias(e.target.value) }}
              placeholder={t('welcome.aliasPlaceholder')}
              maxLength={20}
              autoFocus
            />
          </label>

          <label className="welcome-field age">
            <span>{t('welcome.ageLabel')}</span>
            <input
              className="field"
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(e) => { setErr(''); setAge(e.target.value) }}
              placeholder={t('welcome.agePlaceholder')}
            />
          </label>
        </div>

        <div className="welcome-field">
          <span>{t('welcome.languageLabel')}</span>
          <div className="lang-picker">
            {AVAILABLE_LOCALES.map((code) => (
              <button
                type="button"
                key={code}
                className={`lang-chip ${locale === code ? 'on' : ''}`}
                onClick={() => setLocale(code)}
              >
                {localeName(code)} <em className="mono">{code}</em>
              </button>
            ))}
          </div>
        </div>

        {err && <div className="banner wrong shake">{err}</div>}

        <button type="submit" className="btn btn-cyan btn-lg welcome-start">{t('welcome.start')}</button>
      </form>
    </div>
  )
}
