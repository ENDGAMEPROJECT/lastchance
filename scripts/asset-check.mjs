/* Static checks for the image catalogue (src/game/preloadAssets.js).

   preloadAssets exports GAME_IMAGES "for asset checks", but nothing ever
   checked it, so two failures could sit unnoticed:

   - a catalogue entry naming a file that is not there. Preloading it fails
     silently (loadImage resolves either way, by design — a missing preload
     must never block the game), and the miss only shows up as a blank frame
     when a player reaches that screen;
   - an image the game uses that the catalogue never mentions, which then
     downloads mid-scene instead of ahead of it — exactly the stutter the
     preloader exists to avoid.

   Run with `npm run check:assets` (also part of `npm run check:all`).

   Paths built at runtime from data — `ads-corridor/${poster.image}`,
   `algorithm-room/${row.id}.png` — cannot be read statically, so they are
   reported separately rather than guessed at. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'

const PUBLIC = 'public'
const SRC = 'src'
const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg)$/i

const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const full = path.join(dir, entry)
  return statSync(full).isDirectory() ? walk(full) : [full]
})

/* ---- what is on disk ---- */
const onDisk = new Set(
  walk(PUBLIC).filter((f) => IMAGE_RE.test(f)).map((f) => path.relative(PUBLIC, f)),
)

/* ---- what the catalogue promises ---- */
const bundle = await build({
  entryPoints: ['src/game/preloadAssets.js'],
  bundle: true, write: false, platform: 'node', format: 'esm',
  // BASE_URL is '/' in dev; the catalogue stores URLs, we want public paths.
  define: { 'import.meta.env': '{"BASE_URL":"/"}' },
  logLevel: 'error',
})
const mod = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))
const catalogue = new Set(mod.GAME_IMAGES.map((u) => u.replace(/^\//, '')))

/* ---- what the source references ---- */
const files = walk(SRC).filter((f) => /\.(jsx?|css)$/.test(f))
const referenced = new Set()
const dynamic = []
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  // bgUrl('x') / assetUrl('x') with a plain string
  for (const m of src.matchAll(/\b(bgUrl|assetUrl)\(\s*'([^'`$]+)'\s*\)/g)) {
    const [, fn, p] = m
    const needsBg = fn === 'bgUrl'
      && !/^(link-district|objects|influencers|algorithm-room|characters)\//.test(p)
    referenced.add(needsBg ? `bg/${p}` : p)
  }
  // url(...) in CSS, and anything built from a template literal
  for (const m of src.matchAll(/url\(\s*["']?\/([^"')]+\.(?:png|jpe?g|gif|webp|svg))/gi)) referenced.add(m[1])
  for (const m of src.matchAll(/\b(bgUrl|assetUrl)\(\s*`([^`]*\$\{[^`]*)`/g)) {
    dynamic.push(`${path.relative('.', file)}  ${m[1]}(\`${m[2]}\`)`)
  }
}

/* ---- report ---- */
const problems = []

const missingFiles = [...catalogue].filter((p) => !onDisk.has(p)).sort()
if (missingFiles.length) {
  problems.push(`${missingFiles.length} catalogue entr${missingFiles.length === 1 ? 'y names a file' : 'ies name files'} that do not exist:`)
  for (const p of missingFiles) problems.push(`    ${p}`)
}

const notPreloaded = [...referenced].filter((p) => !catalogue.has(p) && onDisk.has(p)).sort()
if (notPreloaded.length) {
  problems.push(`${notPreloaded.length} image(s) the source uses but the catalogue does not list:`)
  for (const p of notPreloaded) problems.push(`    ${p}`)
}

console.log(`Checked ${catalogue.size} catalogue entries against ${onDisk.size} files in public/.`)
if (dynamic.length) {
  console.log(`\n  ${dynamic.length} path(s) built at runtime — verify these by hand:`)
  for (const d of dynamic) console.log(`    ${d}`)
}

if (problems.length) {
  console.log('\n❌ ' + problems[0])
  for (const line of problems.slice(1)) console.log(line)
  process.exit(1)
} else {
  console.log('\n✅ every catalogued image exists, and every statically-referenced image is catalogued.')
}
