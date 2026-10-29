/* Static checks for the xAPI layer (src/game/xapi.js + its call sites).
   These catch the mistakes neither `vite build` nor a render can see:

   - build is blind to undefined identifiers entirely;
   - an SSR render only evaluates component BODIES, while most track() calls
     live in event handlers and effects, which never run there.

   So: verify every call site names a verb, an object factory and a parent that
   actually exist, and that the symbols it uses are imported. Run with
   `npm run check:xapi` (also part of `npm run check:all`). */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { NODES } from '../src/game/gameData.js'

const SRC = 'src'
const problems = []
const ok = (cond, msg) => { if (!cond) problems.push(msg) }

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const full = path.join(dir, entry)
  return statSync(full).isDirectory() ? walk(full) : [full]
})
const files = walk(SRC).filter((f) => /\.jsx?$/.test(f))

/* ---- The catalogue, read out of xapi.js itself ---- */
const xapiSrc = readFileSync('src/game/xapi.js', 'utf8')
const section = (name) => {
  const start = xapiSrc.indexOf(`export const ${name} = {`)
  if (start === -1) return ''
  let depth = 0
  for (let i = xapiSrc.indexOf('{', start); i < xapiSrc.length; i++) {
    if (xapiSrc[i] === '{') depth++
    else if (xapiSrc[i] === '}' && --depth === 0) return xapiSrc.slice(start, i)
  }
  return ''
}
const VERBS = new Set([...section('VERBS').matchAll(/^\s{2}(\w+):\s*\{/gm)].map((m) => m[1]))
const FACTORIES = new Set([...section('OBJ').matchAll(/^\s{2}(\w+):\s*\(/gm)].map((m) => m[1]))
const PARENTS = new Set([...section('PARENTS').matchAll(/^\s{2}'?([\w-]+)'?:/gm)].map((m) => m[1]))

ok(VERBS.size > 10, `expected a populated VERBS map, parsed ${VERBS.size}`)
ok(FACTORIES.size > 10, `expected a populated OBJ catalogue, parsed ${FACTORIES.size}`)
ok(PARENTS.size > 5, `expected a populated PARENTS map, parsed ${PARENTS.size}`)

/* Every node in the game graph needs a parent activity, or its statements
   would be filed with no parent at all. */
for (const node of NODES) ok(PARENTS.has(node.id), `PARENTS has no entry for node '${node.id}'`)

const XAPI_EXPORTS = ['track', 'OBJ', 'EXT', 'VERBS', 'PARENTS', 'once', 'resetOnce',
  'markRoomStart', 'roomDuration', 'initActor', 'setActorLang', 'getActor', 'isConfigured', 'isoDuration']
const HOOKS = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useLayoutEffect', 'useContext', 'Fragment']

for (const file of files) {
  if (file.endsWith('game/xapi.js')) continue
  const src = readFileSync(file, 'utf8')
  const where = file.replace(`${SRC}/`, '')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '') // ignore comments

  /* --- verbs --- */
  for (const m of code.matchAll(/track\(\s*'(\w+)'/g))
    ok(VERBS.has(m[1]), `${where}: track('${m[1]}') — no such verb in VERBS`)
  for (const m of code.matchAll(/track\(\s*[^,']*\?\s*'(\w+)'\s*:\s*'(\w+)'/g)) {
    ok(VERBS.has(m[1]), `${where}: track(… ? '${m[1]}') — no such verb in VERBS`)
    ok(VERBS.has(m[2]), `${where}: track(… : '${m[2]}') — no such verb in VERBS`)
  }

  /* --- object factories --- */
  for (const m of code.matchAll(/\bOBJ\.(\w+)\s*\(/g))
    ok(FACTORIES.has(m[1]), `${where}: OBJ.${m[1]}() — no such factory in the OBJ catalogue`)

  /* --- extensions --- */
  const EXTS = new Set([...xapiSrc.matchAll(/^\s{2}(\w+):\s*`\$\{ENDGAME\}\/ext\//gm)].map((m) => m[1]))
  for (const m of code.matchAll(/\bEXT\.(\w+)\b/g))
    ok(EXTS.has(m[1]), `${where}: EXT.${m[1]} — no such extension`)

  /* --- parents: a literal node: '…' must be a known parent key --- */
  for (const m of code.matchAll(/\bnode:\s*'([\w-]+)'/g))
    ok(PARENTS.has(m[1]), `${where}: node: '${m[1]}' — not a key in PARENTS, so the statement would have no parent`)

  /* --- imports: anything used must be imported --- */
  const xapiImport = code.match(/import \{([^}]*)\} from '[^']*xapi\.js'/)
  const imported = xapiImport ? xapiImport[1].split(',').map((s) => s.trim()) : []
  for (const sym of XAPI_EXPORTS) {
    const used = new RegExp(`\\b${sym}\\s*[(.]`).test(code)
    if (used && !imported.includes(sym)) {
      // `track(` etc. only counts if the file imports from xapi at all.
      if (xapiImport || ['track', 'OBJ'].includes(sym))
        ok(false, `${where}: uses ${sym} but does not import it from game/xapi.js`)
    }
  }

  /* --- react hooks: used but not imported (the class `vite build` is blind
         to — it shipped a crash once) --- */
  const reactImport = code.match(/import \{([^}]*)\} from 'react'/)
  if (reactImport) {
    const names = reactImport[1].split(',').map((s) => s.trim())
    const body = code.slice(reactImport.index + reactImport[0].length)
    for (const hook of HOOKS)
      ok(!new RegExp(`\\b${hook}\\s*[(<]`).test(body) || names.includes(hook),
        `${where}: uses ${hook} but does not import it from react`)
  }
}

if (problems.length) {
  console.error(`\n❌ ${problems.length} xAPI problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`✅ xAPI call sites consistent (${VERBS.size} verbs, ${FACTORIES.size} objects, ${PARENTS.size} parents) across ${files.length} files.`)
