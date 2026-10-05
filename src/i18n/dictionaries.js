import en from './locales/en.js'
import es from './locales/es.js'
import fi from './locales/fi.js'
import sr from './locales/sr.js'
import fullscreen from './locales/fullscreen.js'

// Keep local interface additions independent of generated sheet translations.
const dictionaries = Object.fromEntries(
  Object.entries({ en, es, fi, sr }).map(([code, dictionary]) => [code, {
    ...dictionary,
    hud: { ...dictionary.hud, ...fullscreen[code] },
  }]),
)

export default dictionaries
