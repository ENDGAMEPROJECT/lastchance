/* ============================================================
   i18n import — Google Sheet → locale files.

   Downloads the translation workbook and regenerates the locale
   dictionaries under src/i18n/locales/ so the Sheet is the single
   source of truth for all user-facing copy.

   The workbook has one tab per section (Interface + one per room),
   each with columns key,en,es,fi,sr. Keys carry their full dot-path
   (e.g. rooms.link.intro), so import simply concatenates every tab's
   rows regardless of which tab they live in.

   - The `key` column is a dot-path; numeric segments become array
     indices (e.g. story.rounds.0.options.1.text).
   - Values come entirely from the Sheet. Container *shape* (whether a
     numeric-keyed node is a real array or a sparse object like the
     algorithm-room `slots`) can't be encoded in flat keys, so it is
     read from the existing locale files as a structural template.
   - en.js is written as a self-contained monolith from the `en`
     column (the ./en/*.js fragments are no longer imported).
   - es/fi/sr start as a full copy of English, then every non-empty
     translation cell overrides its key. Empty cells therefore fall
     back to English — no blank strings, no half-built arrays.
   - Cells equal to "true"/"false" are written back as booleans
     (the only non-string leaves in the dictionary).

   Run with:  npm run i18n:import
   ============================================================ */

import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')
const LOCALES_DIR = resolve(ROOT, 'src/i18n/locales')

/* Google Sheet source. Tabs are listed in escape-room order; each is
   fetched as CSV. Override the id with I18N_SHEET_ID if the sheet moves. */
const SHEET_ID = process.env.I18N_SHEET_ID || '1cbn45Bo4OFBMLHEism-0dzoeiWMugNsqrM5BanbAYh8'
const TABS = ['Interface', 'Links', 'Roulette', 'Influencer', 'Algorithm', 'Ads', 'Persuasion', 'Final']
// headers=1 pins the header to a single row; without it gviz merges the
// all-text header rows of a fully-untranslated tab into one giant field.
const tabCsvUrl = (tab) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`

const LANGS = ['en', 'es', 'fi', 'sr']

/* ---- minimal RFC-4180 CSV parser (quotes, "" escapes, CRLF) ---- */
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Google Sheets renders booleans as TRUE/FALSE; match either case so the
// quiz `correct` flags come back as real booleans, not truthy strings.
const coerce = (s) => (/^true$/i.test(s) ? true : /^false$/i.test(s) ? false : s)

/* Map every container path in a reference dict to 'array' | 'object', so
   reconstruction preserves shape (a sparse {1,2} slots object must not
   become an array with null holes). */
function buildShapeMap(o, path, map) {
  if (Array.isArray(o)) {
    map.set(path, 'array')
    o.forEach((v, i) => buildShapeMap(v, path ? `${path}.${i}` : String(i), map))
  } else if (o && typeof o === 'object') {
    map.set(path, 'object')
    for (const k of Object.keys(o)) buildShapeMap(o[k], path ? `${path}.${k}` : k, map)
  }
}

async function loadShapeMap() {
  const map = new Map()
  try {
    const en = (await import(pathToFileURL(resolve(LOCALES_DIR, 'en.js')).href)).default
    buildShapeMap(en, '', map)
  } catch (e) {
    console.warn(`  (no en.js template — falling back to key-shape heuristics: ${e.message})`)
  }
  return map
}

function makeSetDeep(shape) {
  return function setDeep(root, path, value) {
    const parts = path.split('.')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      if (node[p] == null) {
        const childPath = parts.slice(0, i + 1).join('.')
        const kind = shape.get(childPath) || (/^\d+$/.test(parts[i + 1]) ? 'array' : 'object')
        node[p] = kind === 'array' ? [] : {}
      }
      node = node[p]
    }
    node[parts[parts.length - 1]] = value
  }
}

/* ---- download + parse every tab of the Google Sheet ---- */
async function fetchTab(tab) {
  const res = await fetch(tabCsvUrl(tab))
  if (!res.ok) throw new Error(`fetch "${tab}" failed: HTTP ${res.status} (is the sheet shared "anyone with the link"?)`)
  return (await res.text()).replace(/^﻿/, '')
}

const records = [] // normalized: { key, en, es, fi, sr }
const keyTab = new Map() // key -> first tab it appeared in
const overlaps = [] // { key, tabs: [first, dup] }
const tabTexts = await Promise.all(TABS.map(fetchTab))
TABS.forEach((tab, ti) => {
  const table = parseCSV(tabTexts[ti])
  const header = table[0]
  const keyIdx = header.indexOf('key')
  if (keyIdx === -1) throw new Error(`tab "${tab}" is missing a "key" column`)
  const idx = Object.fromEntries(LANGS.map((l) => [l, header.indexOf(l)]))
  for (const l of LANGS) if (idx[l] === -1) throw new Error(`tab "${tab}" is missing a "${l}" column`)
  for (const row of table.slice(1)) {
    const key = row[keyIdx]
    if (key === undefined || key === '') continue
    if (keyTab.has(key)) overlaps.push({ key, tabs: [keyTab.get(key), tab] })
    else keyTab.set(key, tab)
    records.push(Object.fromEntries([['key', key], ...LANGS.map((l) => [l, row[idx[l]] ?? ''])]))
  }
})
console.log(`  downloaded ${records.length} keys from ${TABS.length} tabs: ${TABS.join(', ')}`)

if (overlaps.length) {
  console.warn(`\n⚠ ${overlaps.length} key(s) appear in more than one tab — the last occurrence wins:`)
  for (const { key, tabs } of overlaps) console.warn(`    ${key}  (${tabs[0]} → ${tabs[1]})`)
  console.warn('')
}

/* ---- shape template (read existing en.js before we overwrite it) ---- */
const shape = await loadShapeMap()
const setDeep = makeSetDeep(shape)

/* ---- build English base ---- */
const en = {}
for (const r of records) setDeep(en, r.key, coerce(r.en))

/* ---- build each locale as English + translated overrides ---- */
const dicts = { en }
for (const lang of ['es', 'fi', 'sr']) {
  const dict = structuredClone(en)
  let translated = 0
  for (const r of records) {
    if (r[lang] !== '') { setDeep(dict, r.key, coerce(r[lang])); translated++ }
  }
  dicts[lang] = dict
  console.log(`  ${lang}: ${translated}/${records.length} keys translated`)
}

/* ---- write locale files ---- */
const banner = '/* AUTO-GENERATED from the translation Google Sheet by `npm run i18n:import`. Do not edit by hand. */\n'
for (const lang of LANGS) {
  const body = `${banner}export default ${JSON.stringify(dicts[lang], null, 2)}\n`
  writeFileSync(resolve(LOCALES_DIR, `${lang}.js`), body)
}

console.log(`✓ wrote ${LANGS.map((l) => `${l}.js`).join(', ')} from ${records.length} keys`)
