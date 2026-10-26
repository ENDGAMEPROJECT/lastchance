import { useCallback, useEffect, useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useI18n, useT, AVAILABLE_LOCALES, localeName } from '../../i18n/index.jsx'
import { bgUrl } from '../../game/assets.js'
import { preloadGameAssets } from '../../game/preloadAssets.js'
import { IS_PHONE } from '../../game/device.js'
import RotatePrompt from './RotatePrompt.jsx'
import './welcome.css'

// Flag per language (drawn by the self-hosted emoji font, see game/emojiFont.js).
const FLAGS = { en: '🇬🇧', es: '🇪🇸', fi: '🇫🇮', sr: '🇷🇸' }

/* First screen: collect the player's alias + age and let them pick a
   language. The language list is populated from the registered locales,
   so new languages appear automatically. */
export default function WelcomeScreen() {
  const { submitWelcome } = useGame()
  const t = useT()
  const { locale, setLocale } = useI18n()
  const [alias, setAlias] = useState('')
  const [age, setAge] = useState('')
  // Nothing picked by default: the player must choose a character and a
  // language before entering (the phone keyboard's "go" key submits the form
  // straight from the inputs, which used to skip both pickers).
  const [character, setCharacter] = useState(null)
  const [languageChosen, setLanguageChosen] = useState(false)
  const [err, setErr] = useState('')
  // Phones: the validated entry waits behind the "turn your phone" screen.
  const [pending, setPending] = useState(null)
  const continueToGame = useCallback(() => submitWelcome(pending), [pending, submitWelcome])

  useEffect(() => {
    preloadGameAssets({ screen: 'welcome', character: character || 'mia' })
  }, [character])

  const onSubmit = (e) => {
    e.preventDefault()
    const a = alias.trim()
    const n = parseInt(age, 10)
    if (!a) return setErr(t('welcome.aliasError'))
    if (!age || Number.isNaN(n) || n < 1 || n > 120) return setErr(t('welcome.ageError'))
    if (!character) return setErr(t('welcome.characterError'))
    if (!languageChosen) return setErr(t('welcome.languageError'))
    const entry = { alias: a, age: n, character }
    if (IS_PHONE) setPending(entry)
    else submitWelcome(entry)
  }

  return (
    <div className="scene welcome-scene">
      <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('welcome.gif')})` }} />
      <form className="welcome-card panel clip panel-glow-cyan fade-in" onSubmit={onSubmit}>
        {/* <div className="welcome-glyph">◉</div>
        <div className="eyebrow">{t('welcome.eyebrow')}</div> */}
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

        <fieldset className="welcome-character">
          <legend>{t('welcome.characterLabel')}</legend>
          <div className="character-picker">
            <label className={`character-option is-mia ${character === 'mia' ? 'on' : ''}`}>
              <input type="radio" name="character" value="mia" checked={character === 'mia'} onChange={() => { setErr(''); setCharacter('mia') }} />
              <img className="character-figure" src={bgUrl('algorithm-room/mia-figure-nobg.png')} alt="" draggable={false} />
              <span className="character-name">{t('welcome.characterMia')}</span>
            </label>
            <label className={`character-option is-max ${character === 'max' ? 'on' : ''}`}>
              <input type="radio" name="character" value="max" checked={character === 'max'} onChange={() => { setErr(''); setCharacter('max') }} />
              <img className="character-figure" src={bgUrl('algorithm-room/max-figure-nobg.png')} alt="" draggable={false} />
              <span className="character-name">{t('welcome.characterMax')}</span>
            </label>
          </div>
        </fieldset>

        <div className="welcome-field">
          <span>{t('welcome.languageLabel')}</span>
          <div className="lang-picker">
            {AVAILABLE_LOCALES.map((code) => (
              <button
                type="button"
                key={code}
                className={`lang-chip ${languageChosen && locale === code ? 'on' : ''}`}
                aria-pressed={languageChosen && locale === code}
                onClick={() => { setErr(''); setLocale(code); setLanguageChosen(true) }}
              >
                {localeName(code)} <span className="lang-flag" aria-hidden="true">{FLAGS[code]}</span>
              </button>
            ))}
          </div>
        </div>

        {err && <div className="banner wrong shake">{err}</div>}

        <button type="submit" className="btn btn-cyan btn-lg welcome-start">
          <svg className="welcome-start-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8M6.6 6.6a7.5 7.5 0 1 0 10.8 0" /></svg>
          {t('welcome.start')}
        </button>
      </form>
      {pending && <RotatePrompt onContinue={continueToGame} />}
    </div>
  )
}
