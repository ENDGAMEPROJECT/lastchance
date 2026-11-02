/* ============================================================
   i18n export — one CSV per Sheet tab.

   Mirrors the translation Sheet to docs/translations/<Tab>.csv, one file
   per tab, columns key,en,es,fi,sr. The Sheet stays the single source of
   truth (see i18n-import.mjs); this is the readable, diffable snapshot of
   it — handy for review, for bulk edits, and for seeing what a locale is
   actually missing.

   It also validates placeholders. interpolate() (see i18n/characterText.js)
   substitutes only the variables a call site passes plus the character vars,
   and leaves anything else in the output verbatim — so a translator writing
   {okrug} where the call site passes {district} ships a literal "{okrug}"
   to the player. Every placeholder in a translated cell must therefore
   either appear in that row's English cell or be a known character var.

   Run with:  npm run i18n:export
   ============================================================ */

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')
const OUT_DIR = resolve(ROOT, 'docs/translations')

const SHEET_ID = process.env.I18N_SHEET_ID || '1cbn45Bo4OFBMLHEism-0dzoeiWMugNsqrM5BanbAYh8'
const TABS = ['Interface', 'Hints', 'Links', 'Roulette', 'Influencer', 'Algorithm', 'Ads', 'Persuasion', 'Final']
const LANGS = ['en', 'es', 'fi', 'sr']
const tabCsvUrl = (tab) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`

/* Character variables are supplied for every key, so they are always legal
   in a translation even though they never appear in the English cell.
   Read from the source rather than duplicated, so the two cannot drift. */
const charVarSrc = execFileSync('cat', [resolve(ROOT, 'src/i18n/characterText.js')], { encoding: 'utf8' })
const CHAR_VARS = new Set(
  [...charVarSrc.matchAll(/^\s{4}([A-Za-z_]\w*):/gm)].map((m) => m[1]),
)

/* ---- CSV ---- */
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false }
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n'

const placeholders = (s) => new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))

/* Declined name forms. characterVars turns every names.<character>.<form>
   row into the variable {friend_<form>}, so those are legal anywhere. */
const NAME_FORMS = new Set()

/* Variable names that were translated along with the text. interpolate()
   substitutes by exact name, so {okrug} where the call site passes
   {district} ships literal braces to the player. A rename is applied only
   when the target actually appears in that row's English, so it can never
   invent a variable: the English is what the call site demonstrably passes. */
const ALIASES = {
  okrug: 'district', minuta: 'minutes', oznaka: 'label', ukupno: 'total',
  upareno: 'matched', slovo: 'letter', trag: 'clue',
}


mkdirSync(OUT_DIR, { recursive: true })
const badVars = []
const renamed = []
const untranslated = { es: 0, fi: 0, sr: 0 }
let total = 0

/* Fetch every tab up front: a names.<character>.<form> row legitimises the
   variable {friend_<form>} anywhere in the workbook, whatever tab it is on. */
const sheets = []
for (const tab of TABS) {
  const res = await fetch(tabCsvUrl(tab))
  if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`)
  const rows = parseCsv(await res.text())
  const header = rows.shift()
  sheets.push({ tab, rows, col: Object.fromEntries(LANGS.map((l) => [l, header.indexOf(l)])) })
}

for (const { rows } of sheets) {
  for (const row of rows) {
    const m = (row[0] || '').trim().match(/^names\.\w+\.(\w+)$/)
    if (m) NAME_FORMS.add(`friend_${m[1]}`)
  }
}
if (NAME_FORMS.size) console.log(`  declined name forms: ${[...NAME_FORMS].sort().join(', ')}\n`)

for (const { tab, rows, col } of sheets) {

  const out = [['key', ...LANGS]]
  for (const row of rows) {
    const key = (row[0] || '').trim()
    if (!key) continue
    total++
    const cells = {}
    for (const lang of LANGS) cells[lang] = (row[col[lang]] ?? '').trim()
    // Validate placeholders against the English row + character vars,
    // repairing a translated variable name where the English proves the target.
    const enVars = placeholders(cells.en)
    const allowed = new Set([...enVars, ...CHAR_VARS, ...NAME_FORMS])
    for (const lang of LANGS) {
      if (lang === 'en') continue
      if (!cells[lang] || cells[lang] === cells.en) { untranslated[lang]++; continue }
      for (const v of placeholders(cells[lang])) {
        if (allowed.has(v)) continue
        const target = ALIASES[v]
        if (target && enVars.has(target)) {
          cells[lang] = cells[lang].replaceAll(`{${v}}`, `{${target}}`)
          renamed.push({ tab, key, lang, from: v, to: target })
        } else {
          badVars.push({ tab, key, lang, variable: v, text: cells[lang] })
        }
      }
    }
    out.push([key, ...LANGS.map((l) => cells[l])])
  }
  writeFileSync(resolve(OUT_DIR, `${tab}.csv`), toCsv(out))
  console.log(`  ${tab.padEnd(11)} ${String(out.length - 1).padStart(4)} keys → docs/translations/${tab}.csv`)
}

console.log(`\n${total} keys across ${TABS.length} tabs`)
for (const l of ['es', 'fi', 'sr']) {
  console.log(`  ${l}: ${total - untranslated[l]}/${total} translated`)
}



if (renamed.length) {
  console.log(`\n✎ ${renamed.length} translated variable name(s) repaired in the CSV:`)
  for (const r of renamed) console.log(`    [${r.lang}] ${r.key}  {${r.from}} → {${r.to}}`)
}


if (badVars.length) {
  console.log(`\n❌ ${badVars.length} placeholder(s) no call site supplies — these render literally:`)
  for (const b of badVars) console.log(`    [${b.lang}] ${b.key}  {${b.variable}}\n        ${b.text.slice(0, 70)}`)
} else {
  console.log('\n✅ every placeholder in a translation is supplied')
}
