import en from './locales/en.js'
import es from './locales/es.js'
import fi from './locales/fi.js'
import sr from './locales/sr.js'
import fullscreen from './locales/fullscreen.js'
import orientation from './locales/orientation.js'
import characters from './locales/characters.js'

// Local copy only fills missing keys. Imported sheet translations take priority.
export function withLocalFallbacks(dictionary, code) {
  return {
    ...dictionary,
    welcome: { ...characters[code], ...dictionary.welcome },
    hud: { ...fullscreen[code], ...dictionary.hud },
    rotate: { ...orientation[code], ...dictionary.rotate },
  }
}

const dictionaries = Object.fromEntries(
  Object.entries({ en, es, fi, sr }).map(([code, dictionary]) => [code, withLocalFallbacks(dictionary, code)]),
)

export default dictionaries
