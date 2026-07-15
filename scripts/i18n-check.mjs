// Temporary verification: does every static t('...') key resolve in en?
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import en from '../src/i18n/locales/en.js'

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(p)
  }
  return out
}

function lookup(obj, key) {
  return key.split('.').reduce((a, k) => (a == null ? a : a[k]), obj)
}

const files = walk('src')
// match t('key') or t("key") — static keys only (skip template literals with ${})
const re = /\bt\(\s*(['"])([\w.]+)\1/g
const missing = []
const seen = new Set()
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  let m
  while ((m = re.exec(src))) {
    const key = m[2]
    // skip obvious non-i18n first args (e.g. classList.toggle) by requiring a dotted namespace
    if (!key.includes('.')) continue
    const id = `${key}`
    if (seen.has(id)) continue
    seen.add(id)
    if (lookup(en, key) === undefined) missing.push(`${key}   (${f})`)
  }
}

console.log(`Checked ${seen.size} unique static keys across ${files.length} files.`)
if (missing.length) {
  console.log(`\n❌ ${missing.length} UNRESOLVED KEYS:`)
  for (const x of missing) console.log('  - ' + x)
  process.exit(1)
} else {
  console.log('✅ All static t() keys resolve.')
}
