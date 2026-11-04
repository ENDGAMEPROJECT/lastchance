import { useI18n } from '../../i18n/index.jsx'
import { assetUrl } from '../../game/assets.js'

/* Funder + project credits for the landing screen's bottom-right corner:
   the EU "Co-funded by" logo in the player's language, and the ENDGAME logo
   linking out to the project site. */

const ENDGAME_URL = 'https://endgameproject.github.io/'

/* The EU logo ships as one officially-issued file per language, named by
   locale: public/logos/eu-cofunded-<locale>.png. These are the horizontal
   RGB "WHITE" variants from the Commission's co-funded logo packs — white
   artwork on transparent, for dark backgrounds. A locale with no file falls
   back to English via onError, so adding a language is just a new file. */
const euLogoUrl = (locale) => assetUrl(`logos/eu-cofunded-${locale}.png`)
const EU_FALLBACK = euLogoUrl('en')

/* The wording each file carries, used as its alt text. This copy lives here
   rather than in the locale dictionaries because those are regenerated from
   the translation Sheet (see scripts/i18n-import.mjs) and a hand-added key
   would be overwritten — same reason FLAGS sits in WelcomeScreen.jsx.
   Each string is transcribed from the artwork itself, so it must stay in
   step with the file: Serbian is the Latin-script "Sufinansira Evropska
   unija" (the pack's EPS folder misspells it "Sufinansire"). */
const EU_ALT = {
  en: 'Co-funded by the European Union',
  es: 'Cofinanciado por la Unión Europea',
  fi: 'Euroopan unionin osarahoittama',
  sr: 'Sufinansira Evropska unija',
}

export default function LandingCredits() {
  const { locale } = useI18n()

  return (
    <div className="landing-credits">
      <img
        className="credits-eu"
        /* Remount on language change so a previous fallback doesn't stick. */
        key={locale}
        src={euLogoUrl(locale)}
        alt={EU_ALT[locale] || EU_ALT.en}
        draggable={false}
        onError={(e) => {
          const img = e.currentTarget
          if (img.dataset.fellBack) return // the English file is missing too
          img.dataset.fellBack = '1'
          img.src = EU_FALLBACK
        }}
      />
      <a
        className="credits-endgame"
        href={ENDGAME_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={assetUrl('logos/endgame.png')} alt="ENDGAME" draggable={false} />
      </a>
    </div>
  )
}
