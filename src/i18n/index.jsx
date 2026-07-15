/* ============================================================
   Lightweight, zero-dependency i18n.

   - Dictionaries live in ./locales/<lang>.js as nested objects.
   - useT() returns a t(key, vars) function:
       t('hud.map')                      -> "Map"
       t('intro.hook', { friend: 'Max' }) -> interpolates {friend}
       t('intro.steps')                   -> returns arrays/objects as-is
   - Missing keys return the key string (so gaps are visible, not blank).
   - Only English is registered today; add a locale by dropping a file
     in ./locales and registering it in LOCALES below.
   ============================================================ */

import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import en from './locales/en.js'

const LOCALES = { en }
export const AVAILABLE_LOCALES = Object.keys(LOCALES)
const DEFAULT_LOCALE = 'en'

/* Display names (endonyms) for the language picker. Add an entry when
   you register a new locale above. */
export const LOCALE_NAMES = {
  en: 'English',
  // es: 'Español',
  // fr: 'Français',
}
export const localeName = (code) => LOCALE_NAMES[code] || code.toUpperCase()

const I18nContext = createContext(null)

function lookup(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

function interpolate(value, vars) {
  if (typeof value !== 'string' || !vars) return value
  return value.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }) {
  const [locale, setLocale] = useState(initialLocale)

  const t = useCallback(
    (key, vars) => {
      const dict = LOCALES[locale] || LOCALES[DEFAULT_LOCALE]
      let value = lookup(dict, key)
      if (value === undefined && locale !== DEFAULT_LOCALE) value = lookup(LOCALES[DEFAULT_LOCALE], key)
      if (value === undefined) {
        if (import.meta?.env?.DEV) console.warn(`[i18n] missing key: ${key}`)
        return key
      }
      return interpolate(value, vars)
    },
    [locale],
  )

  const value = useMemo(() => ({ t, locale, setLocale, locales: AVAILABLE_LOCALES }), [t, locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/* Convenience hook: const t = useT() */
export function useT() {
  return useI18n().t
}
