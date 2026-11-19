import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../game/GameContext.jsx'
import { ITEMS, EMOJI_KEY, encodeWord } from '../game/gameData.js'
import { bgUrl, assetUrl } from '../game/assets.js'
import { useReadingGate } from '../game/readingGate.js'
import { DEBUG } from '../game/settings.js'
import { useMobileView } from '../game/device.js'
import { playSound, stopSound, preloadSound } from '../game/sound.js'
import { useRoomState } from '../game/useRoomState.js'
import { useRoomProgress } from '../game/roomProgress.js'
import { track, OBJ } from '../game/xapi.js'
import { useI18n, useT } from '../i18n/index.jsx'
import RoomFrame from '../components/RoomFrame.jsx'
import GateButton from '../components/GateButton.jsx'
import CloseButton from '../components/CloseButton.jsx'
import { Draggable, DropZone } from '../components/dnd/Dnd.jsx'
import { useStage } from '../components/Stage.jsx'
import './InfluencerAvenue.css'

/* PUZZLE 2 — Influencer Avenue.
   Two stages shown in sequence:
     'label'  → (after a screen explaining each label) decode the emoji
                post-its (PAID / COLLAB / GIFTED) with the Emoji Decoding
                Card earned in Link District, then drag each onto its post.
     'verify' → run a SIMULATED reverse image search on three products,
                then classify each (mass-produced fake / AI-generated / verified).
   Reward: the Data Report on Max (its digits open the Algorithm Room).

   Structural data (handles, hues, verdicts) lives
   here; all display text comes from i18n (rooms.influencer.*). The posts and
   products arrays are index-aligned with the i18n `posts` / `products` arrays. */

/* ---- Stage 1 content: the three influencer posts ---- */
const POSTS = [
  {
    id: 'paid',
    xapiNo: 1, // stable xAPI id — see postNo()
    verified: true,
    followers: '1.2M',
    hue: 'linear-gradient(135deg, #ff8fd4, #b06bff)', // the faux photo block
    likes: '48.2K',
    comments: '1,204',
  },
  {
    id: 'gifted',
    xapiNo: 2, // stable xAPI id — see postNo()
    verified: true,
    followers: '850K',
     hue: 'linear-gradient(135deg, #ff1100, #ffbf6b)', 
    likes: '31.7K',
    comments: '882',
  },
  {
    id: 'collab',
    xapiNo: 3, // stable xAPI id — see postNo()
    verified: false,
    followers: '670K',
     hue: 'linear-gradient(135deg, #8fe5ff, #6b93ff)', 
    likes: '12.9K',
    comments: '431',
  },
  //  {
  //   id: 'nothing',
  //   verified: false,
  //   followers: '670K',
  //    hue: 'linear-gradient(135deg, #ff7b00, #fff56b)', 
  //   likes: '12.9K',
  //   comments: '431',
  //   correctLabel: 'NOTHING',
  // },
]

/* Statements identify a post by its position, never by its id: the ids are
   the correct labels, so using them would leak the answer key. */
/* The number a post is known by in the LRS (objects/posts/<n>).

   DECLARED on each post rather than taken from its position in POSTS, because
   an activity id must always mean the same thing: deriving it from the array
   index means reordering POSTS — or uncommenting the fourth post below —
   silently re-points every id and invalidates data already collected, with no
   error anywhere. The post's own `id` cannot be used: 'paid'/'gifted'/'collab'
   are the puzzle's answers, and would leak them into the activity id.
   `npm run check:xapi` fails if an xapiNo is missing or duplicated. */
const postNo = (id) => POSTS.find((p) => p.id === id)?.xapiNo

/* The emoji post-its sit in a column left of the posts, in an order that
   doesn't line up with the posts (a note's id is the post it belongs to). */
const NOTE_ORDER = ['collab', 'paid', 'gifted']
const NOTE_INNER_W = 156 // design px of text room inside a post-it
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* The word on each post's emoji sticky-note — and the answer the player
   types — is the post's label in the current language
   (rooms.influencer.labels.<id>, e.g. PAID / PAGADO / MAKSETTU / PLAĆENO).
   The keypad only has A–Z (EMOJI_KEY), so accents are folded away
   (COLABORACIÓN → COLABORACION, PLAĆENO → PLACENO, YHTEISTYÖ → YHTEISTYO) and
   anything else (spaces, punctuation) is dropped. */
const toKeypadWord = (label) =>
  label.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '')
const KEYPAD_LETTERS = new Set(Object.values(EMOJI_KEY))

/* Stable English names for analytics: the product copy is localised, so it
   cannot name the activity. Keys are PRODUCTS ids. */
const PRODUCT_NAMES = {
  mug: 'Product: Mug',
  novapad: 'Product: NovaPad X',
  speaker: 'Product: Speaker',
}

/* Desktop explainer, "What should I look for?": the two example cards
   (rooms.influencer.explain.*). image = file in public/products; icon = placeholder
   for a card whose image hasn't arrived yet. */
/* Length of one loop of the explainer's scripted reverse-search demo; the
   "Now you try" button unlocks after one full loop. */
const DEMO_LOOP_MS = 11500

const LOOK_FOR = [
  { n: 1, icon: '🏷️', image: 'compare-prices.png', title: 'priceTitle', text: 'priceText' },
  // Two photos side by side, each captioned (the second sits 16px lower).
  { n: 2, icon: '📝', title: 'claimsTitle', text: 'claimsText',
    pair: [{ image: 'bunny-1.png', caption: 'claimsCaption1' }, { image: 'bunny-2.png', caption: 'claimsCaption2' }] },
]

/* ---- Stage 2 content: the three products for reverse image search ---- */
const PRODUCTS = [
  {
    id: 'mug',
    seller: 'artisan_clay_co',
    art: {
      // rooms.influencer.products.0.art — tag sits in the blurred top-right corner,
      // the caption over the paint palette, clear of the girl and the mug.
      bg: 'mug.png',
      w: 480,
      h: 480,
      layers: [
        { key: 'price', className: 'ia-art-tag', x: 302, y: 54 },
        { key: 'label', className: 'ia-art-handmade', x: 232, y: 110, w: 236 },
      ],
    },
    // emoji: '☕',
    hue: 'linear-gradient(135deg, #d9b38c, #8a5a3b)',
    verdict: 'mass', // it is mass-produced, not handmade
  },
  {
    id: 'novapad',
    seller: 'novapad_x_deals',
    art: {
      // Text-free photo + translatable ad copy laid over it (rooms.influencer.products.1.art).
      bg: 'novapad-bg.jpg',
      w: 480,
      h: 406,
      layers: [
        { key: 'oldPrice', className: 'ia-art-old', x: 48, y: 38 },
        { key: 'price', className: 'ia-art-price', x: 12, y: 86 },
        { key: 'urgency', className: 'ia-art-urgency', x: 22, y: 176, w: 172 },
        { text: '😱😱😱', className: 'ia-art-emoji', x: 20, y: 308 },
      ],
      // Big stamp-like text over a reverse-search result photo: { result index: art key }.
      // The index is the result's number in the sheet (…products.1.matches.N): if
      // a result is renumbered there, update it here too (2 = fakedetector-ads-news).
      resultOverlays: { 2: 'fake' },
    },
    // emoji: '📱',
    hue: 'linear-gradient(135deg, #7a2ce0, #2b6bff)',
    verdict: 'ai', // the image is AI-generated / fake
  },
  {
    id: 'speaker',
    seller: 'cornerst_sounds',
    art: {
      // rooms.influencer.products.2.art — price sticker on the grey wall right of the speaker.
      bg: 'speaker.png',
      w: 480,
      h: 480,
      layers: [
        { key: 'price', className: 'ia-art-sale', x: 276, y: 112, splitDecimals: true },
      ],
    },
    // emoji: '🧁',
    hue: 'linear-gradient(135deg, #ff9fbf, #ffd36b)',
    verdict: 'verified', // this one is real
  },
]

/* Reverse-image-search result thumbnails per product: the "same" item found on
   several sites, shown as slightly different listing photos. Falls back to the
   product's own image when no variants were provided. Files live in
   public/products/. Cycled across the result rows. */
const ART = 'art' // thumb that IS the seller's own ad: rendered as ProductArt, text included
const RESULT_THUMBS = {
  mug: [ 'mug2.png', 'mug3.png', 'mug1.png', 'mug.png','mug4.png',], // bulk factory shelf · styled "handmade" shot · the seller's photo
  novapad: ['novapad.png','novapad4.png', 'novapad.png',  'novapad.png', 'novapad1.png', 'novapad2.png'],
  speaker: [ART,'speaker2.png', 'speaker3.png', 'speaker4.png', 'speaker5.png'],
}

/* URL of a file in public/products (base-URL aware), and of a product's own photo. */
const productUrl = (name) => assetUrl(`products/${name}`)
const productImg = (p) => productUrl(p.image || `${p.id}.png`)

/* A sheet cell of just a dash ("-", "–", "—") or blank means "none here":
   no price chip on that result, no copy layer on the art. */
const hasValue = (v) => typeof v === 'string' && !/^\s*[-–—]?\s*$/.test(v)

/* "89,95" -> 89 + small ",95" (decimals at half size). */
const splitPrice = (v) => {
  const m = /^(.*?\d)([.,]\d+)(.*)$/.exec(v || '')
  return m ? <>{m[1]}<small>{m[2]}</small>{m[3]}</> : v
}

/* Where art copy may sit and still show inside a tray tile (~190x156, cover-
   cropped): for a square 480 art the tile hides ~43px top & bottom, the grab
   badge covers x>405 above y~100, and the name label covers y~360-420 mid-width. */

/* A product's picture as ONE image. Products with `art` are plain HTML: the
   photo plus the ad copy as real (translated) text, laid out in a fixed w×h box
   (design px) that is scaled as a whole with a CSS transform to fit wherever
   it's shown (tray, chip, viewer, results, drag ghost). No SVG foreignObject —
   browsers (Safari above all) mis-scale/offset its HTML under the stage's
   transform. `cover` crops to fill its box (tiles, chips); otherwise it keeps
   its aspect ratio and fits inside. */
function ProductArt({ product, copy, cover = false, className = '', alt = '' }) {
  const { art } = product
  const ref = useRef(null)
  const [fit, setFit] = useState(0) // box → container scale factor

  // Measure in layout px (clientWidth/Height ignore the stage's scale transform).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !art) return
    const measure = () => {
      const sx = el.clientWidth / art.w
      const sy = el.clientHeight / art.h
      setFit(cover ? Math.max(sx, sy) : Math.min(sx, sy))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [art, cover])

  if (!art) return <img className={className} src={productImg(product)} alt={alt} draggable={false} />
  return (
    <div
      ref={ref}
      className={`ia-art ${className}`}
      style={cover ? undefined : { aspectRatio: `${art.w} / ${art.h}` }}
      role="img"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <div
        className="ia-art-box"
        style={{
          width: art.w,
          height: art.h,
          marginLeft: -art.w / 2,
          marginTop: -art.h / 2,
          transform: `scale(${fit})`,
          visibility: fit ? undefined : 'hidden',
        }}
      >
        <img className="ia-art-bg" src={productUrl(art.bg)} alt="" draggable={false} />
        <div className="ia-art-copy">
          {art.layers.filter((l) => l.text || hasValue(copy?.art?.[l.key])).map((l) => (
            <span
              key={l.key || l.text}
              className={l.className}
              style={{ left: l.x, top: l.y, width: l.w }}
            >
              {l.text ?? (l.splitDecimals ? splitPrice(copy?.art?.[l.key]) : copy?.art?.[l.key])}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* The three classification option values (labels come from i18n). */
const CLASSIFY_OPTIONS = ['mass', 'ai', 'verified']

/* Line-art emblem pressed into an inked stamp, drawn in the stamp's colour. */
function StampIcon({ value, className = 'ia-stamp-icon' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (value === 'mass') return ( // "wrong" cross
    <svg {...common} strokeWidth={2.6}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  )
  if (value === 'ai') return ( // two sparkles, one big and one small
    <svg {...common} fill="currentColor" strokeWidth={0.8}>
      <path d="M10 6C10.6 10.4 12.6 12.4 17 13C12.6 13.6 10.6 15.6 10 20C9.4 15.6 7.4 13.6 3 13C7.4 12.4 9.4 10.4 10 6Z" />
      <path d="M18 2.5C18.3 4.7 19.3 5.7 21.5 6C19.3 6.3 18.3 7.3 18 9.5C17.7 7.3 16.7 6.3 14.5 6C16.7 5.7 17.7 4.7 18 2.5Z" />
    </svg>
  )
  return ( // double checkmark
    <svg {...common} strokeWidth={2}>
      <path d="M1.5 12.5l4.5 4.5L16 7" />
      <path d="M11.5 15.5l1.5 1.5L23 7" />
    </svg>
  )
}

/* Fine pointer (mouse/trackpad) → the held stamp follows the cursor. On a
   coarse pointer (touch) there's no cursor to ride, so we fall back to
   tap-a-stamp then tap-the-slot, with the selection shown by highlights. */
const FINE_POINTER = typeof window !== 'undefined'
  && !!window.matchMedia?.('(pointer: fine)')?.matches

function influencerImageUrl(id, locale) {
  const filenames = {
    paid: { en: 'paid_en.jpg', es: 'paid_es.png', sr: 'paid_sr.png', fi: 'paid_en.jpg' },
    collab: { en: 'collab_en.png', es: 'collab_es.png', sr: 'collab_sr.png', fi: 'collab_en.png' },
    gifted: { en: 'gifted_en.jpg', es: 'gifted_es.png', sr: 'gifted_sr.png', fi: 'gifted_en.jpg' },
    nothing: { en: 'nothing_en.png', es: 'nothing_es.png', sr: 'nothing_sr.png', fi: 'nothing_en.png' },
  }
  const filename = filenames[id]?.[locale] || filenames[id]?.en
  return bgUrl(`influencers/${filename}`)
}

/* ---- Explainer demo: a scripted, non-interactive run of the reverse-search
   challenge (same UI as stage 2). English-only copy, by request — no i18n keys. */
const DEMO_PHASES = ['drag', 'search', 'results', 'hold', 'stamp']
// ratio = image height / width, used to place each match in the shortest column
// price: optional listing-price chip (same look as the real results).
const DEMO_MATCHES = [
  { img: 'shoes1.png', ratio: 1.05, site: 'solecraft.store', desc: 'Classic leather boat shoes, brown', price: '€129,95*' },
  { img: 'shoes2.png', ratio: 1.08, site: 'vintedly.com', desc: 'Designer boat shoes · barely worn', price: '€85*' },
  { img: 'shoes3.png', ratio: 0.94, site: 'luxe-resale.co', desc: 'Brown leather deck shoes, size 38' },
  { img: 'shoes4.png', ratio: 0.81, site: 'instapic.com', desc: '@styledaily · weekend look' },
  { img: 'shoes5.png', ratio: 1.13, site: 'shoefinder.net', desc: 'Same model sold by the official brand store', price: '€129,95*' },
  { img: 'shoes.png', ratio: 0.71, site: 'swingfeet.shop', desc: 'Lindy hop dance shoes · handmade' },
]
// Same stamps, in the same order, as the real rack (labels via rooms.influencer.classify.*).
const DEMO_STAMPS = ['mass', 'ai', 'verified']

/* Masonry: drop each match into the currently shortest of `n` columns. */
function masonry(items, n) {
  const cols = Array.from({ length: n }, () => ({ h: 0, items: [] }))
  items.forEach((m, i) => {
    const col = cols.reduce((lo, c) => (c.h < lo.h ? c : lo))
    col.items.push({ ...m, i })
    col.h += m.ratio + 0.3 // + room for the site / caption lines
  })
  return cols.map((c) => c.items)
}
const DEMO_COLUMNS = masonry(DEMO_MATCHES, 3)

function ReverseSearchDemo({ phase }) {
  const t = useT()
  const at = (p) => DEMO_PHASES.indexOf(phase) >= DEMO_PHASES.indexOf(p)
  const resultsRef = useRef(null)
  const demoRef = useRef(null)
  const [fly, setFly] = useState(null)

  // The flying stamp goes from the rack's Verified stamp to the image centre.
  // Measured rather than hard-coded: the layout differs on mobile and the
  // labels' length differs per locale. Rects are in screen px (stage scale +
  // the rack's zoom), so divide by the demo's on-screen scale.
  useLayoutEffect(() => {
    if (phase !== 'hold') return setFly(null)
    const root = demoRef.current
    const from = root?.querySelector('.ia-demo-rack .ia-stamp-verified .ia-stampmaker-face')
    const to = root?.querySelector('.ia-demo-frame')
    if (!from || !to) return
    const box = root.getBoundingClientRect()
    const scale = box.width / root.offsetWidth || 1
    const centre = (el) => {
      const r = el.getBoundingClientRect()
      return { x: (r.left + r.width / 2 - box.left) / scale, y: (r.top + r.height / 2 - box.top) / scale }
    }
    const a = centre(from), b = centre(to)
    // the fly-stamp's face sits ~10px below its box centre (handle above it)
    setFly({ '--fx0': `${a.x}px`, '--fy0': `${a.y - 10}px`, '--fx1': `${b.x}px`, '--fy1': `${b.y}px` })
  }, [phase])

  // Once the matches are in, slowly scroll down through them (like the player
  // would), then glide back up to the top.
  useEffect(() => {
    if (phase !== 'results') return
    const el = resultsRef.current
    if (!el) return
    el.scrollTop = 0
    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
    const t0 = performance.now()
    const DOWN_AT = 700, DOWN = 3000, UP_AT = 3900, UP = 1200
    let raf = 0
    const step = (now) => {
      const ms = now - t0
      const max = el.scrollHeight - el.clientHeight
      if (ms < UP_AT) el.scrollTop = ease(Math.min(1, Math.max(0, (ms - DOWN_AT) / DOWN))) * max
      else el.scrollTop = (1 - ease(Math.min(1, (ms - UP_AT) / UP))) * max
      if (ms < UP_AT + UP) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  return (
    <div className="ia-demo" aria-hidden ref={demoRef}>
      {/* saved image the player drags */}
      <div className="ia-demo-tray">
        <div className="ia-demo-traylabel">{t('rooms.influencer.stage2.trayLabel')}</div>
        <div className={`ia-demo-tile ${phase === 'drag' ? 'is-dragging' : ''}`} style={{ backgroundImage: `url("${productUrl('shoes.png')}")` }}>
          <span className="ia-imgtile-name">Lindy hop shoes</span>
        </div>
      </div>

      {/* full-size drag copy riding the cursor into the search bar (as the game's dnd ghost) */}
      {phase === 'drag' && (
        <>
          <div className="ia-demo-tile ia-demo-ghost" style={{ backgroundImage: `url("${productUrl('shoes.png')}")` }}>
            <span className="ia-imgtile-name">Lindy hop shoes</span>
          </div>
          <svg className="ia-demo-cursor" viewBox="0 0 24 24">
            <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </>
      )}

      <div className="ia-demo-engine">
        <div className="ia-demo-top">
          <img className="ia-demo-logo" src={productUrl('logo-joogle.png')} alt="" />
          <div className={`ia-demo-bar ${phase === 'drag' ? 'is-over' : ''}`}>
            <span className="ia-engine-lens">🔍</span>
            {at('search') && <span className="ia-engine-chip fade-in" style={{ backgroundImage: `url("${productUrl('shoes.png')}")` }} />}
            <span className="ia-engine-ph">{t('rooms.influencer.stage2.engineDrop')}</span>
          </div>
        </div>

        <div className="ia-demo-panel">
          {at('search') && (
            <div className="ia-demo-viewer">
              <div className="ia-demo-frame">
                <img className="ia-demo-img" src={productUrl('shoes.png')} alt="" />
                {phase === 'search' && <span className="ia-scan" />}
                <i className="ia-corner tl" /><i className="ia-corner tr" />
                <i className="ia-corner bl" /><i className="ia-corner br" />
                {at('stamp') && (
                  <span className="ia-stamp-mark ia-stamp-verified ia-demo-mark">
                    <StampIcon value="verified" />
                    {t('rooms.influencer.classify.verified')}
                  </span>
                )}
              </div>
            </div>
          )}

          {phase === 'search' && (
            <div className="ia-demo-cols">
              <div className="ia-demo-results">
                <div className="ia-searching-head t-xs">
                  <span className="ia-globe">🌐</span>
                  {t('rooms.influencer.stage2.searching')}
                  <span className="ia-dots"><i /><i /><i /></span>
                </div>
                <div className="ia-demo-skels">
                  {[44, 64, 52].map((h, i) => <span key={i} className="ia-skel" style={{ height: h }} />)}
                </div>
              </div>
            </div>
          )}

          {at('results') && (
            <div className="ia-demo-cols">
              <div className="ia-demo-results" ref={resultsRef}>
                <div className="t-xs upper dim">{t('rooms.influencer.stage2.matchesTitle')}</div>
                <div className="ia-matches">
                  {DEMO_COLUMNS.map((col, c) => (
                    <ul key={c} className="ia-matches-col">
                      {col.map((m) => (
                        <li key={m.site} className="ia-match" style={{ animationDelay: `${m.i * 110}ms` }}>
                          <span className="ia-match-media">
                            <img className="ia-match-img" src={productUrl(m.img)} alt="" />
                            {m.price && (
                              <span className="ia-match-price">
                                <img src={assetUrl('icons/price-tag.svg')} alt="" aria-hidden />
                                {m.price}
                              </span>
                            )}
                          </span>
                          <span className="ia-match-site">
                            <span className="ia-match-fav">{m.site.charAt(0)}</span>
                            <span className="ia-match-site-name">{m.site}</span>
                          </span>
                          <span className="ia-match-title">{m.desc}</span>
                        </li>
                      ))}
                    </ul>
                  ))}
                </div>
              </div>
              <div className="ia-demo-classify">
                <div className="t-xs upper dim">{t('rooms.influencer.stage2.classifyPrompt')}</div>
                <div className="ia-demo-rack">
                  {DEMO_STAMPS.map((value) => (
                    <div
                      key={value}
                      className={`ia-stampmaker ia-stamp-${value} ${value === 'verified' && phase === 'hold' ? 'held' : ''} ${value === 'verified' && at('stamp') ? 'inked' : ''}`}
                    >
                      <span className="ia-stampmaker-face" />
                      <span className="ia-stamp-label">{t(`rooms.influencer.classify.${value}`)}</span>
                      <StampIcon value={value} className="ia-stampmaker-icon" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* the Verified stamp travelling from the rack to the image */}
      {phase === 'hold' && fly && (
        <div className="ia-demo-flystamp ia-stamp-verified" style={fly}><span className="ia-stampmaker-face" /></div>
      )}
    </div>
  )
}

// full: the whole caption instead of the 2-line preview.
// showButton: the "View publication" link after it (phone only).
// fill: cut the caption to whatever fits the box's height (phone), not 2 lines.
function CaptionPreview({ username, caption, onOpen, full = false, showButton = true, fill = false }) {
  const t = useT()
  const buttonLabel = t('rooms.influencer.stage1.viewPublication')
  const measureRef = useRef(null)
  const measureTextRef = useRef(null)
  const [preview, setPreview] = useState(caption)

  useLayoutEffect(() => {
    const measure = measureRef.current
    let active = true
    function fitCaption() {
      if (!active || !measure.clientWidth) return
      const maxHeight = fill
        ? measure.parentElement.clientHeight + 1
        : parseFloat(getComputedStyle(measure).lineHeight) * 2 + 1
      const fits = (text) => {
        measureTextRef.current.textContent = text
        return measure.offsetHeight <= maxHeight
      }
      if (fits(caption)) { setPreview(caption); return }
      const words = caption.trim().split(/\s+/)
      let low = 0
      let high = words.length
      while (low < high) {
        const middle = Math.ceil((low + high) / 2)
        if (fits(words.slice(0, middle).join(' ') + '...')) low = middle
        else high = middle - 1
      }
      setPreview(words.slice(0, low).join(' ') + '...')
    }
    // offsetHeight/clientWidth use design pixels, independent of stage scale.
    fitCaption()
    const observer = new ResizeObserver(fitCaption)
    observer.observe(measure.parentElement)
    document.fonts.ready.then(fitCaption)
    document.fonts.addEventListener('loadingdone', fitCaption)
    return () => {
      active = false
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', fitCaption)
    }
  }, [username, caption, buttonLabel, fill])

  return (
    <div className={`ia-caption ${fill ? 'is-fill' : ''}`}>
      <span style={{fontWeight: "bold"}}>{username}</span>{' '}{full ? caption : preview}{' '}
      {showButton && <button type="button" className="ia-view-publication" aria-haspopup="dialog"
        onMouseDown={(event) => event.preventDefault()} onClick={onOpen}>
        {buttonLabel}
      </button>}
      <span ref={measureRef} className="ia-caption-measure" aria-hidden="true">
        <span style={{fontWeight: "bold"}}>{username}</span>{' '}<span ref={measureTextRef} />{' '}
        <span className="ia-view-publication">{buttonLabel}</span>
      </span>
    </div>
  )
}

function PostComments({ comments = [], hue, liked = {}, onToggle }) {
  const t = useT()
  // Likes are shared with the expanded publication.
  if (!comments.length) return null

  return (
    <ul className="ia-comments" aria-label={t('rooms.influencer.stage1.commentsTitle')} tabIndex={0} onMouseDown={(event) => event.preventDefault()}>
      {comments.map((comment, index) => (
        <li className="ia-comment" key={index}>
          <span className="ia-comment-avatar" aria-hidden="true"
            style={{ background: hue, filter: `hue-rotate(${index * 47}deg)` }}>
            {comment.username.replace(/^@/, '').charAt(0).toUpperCase()}
          </span>
          <p className="ia-comment-body">
            <strong>{comment.username}</strong>{' '}{comment.text}
          </p>
          <button type="button" className="ia-comment-like"
            aria-label={t('rooms.influencer.stage1.likeComment', { name: comment.username })}
            aria-pressed={!!liked[index]}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(index)
            }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  )
}

function PublicationOverlay({ post, copy, locale, liked, onToggle, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)
  const username = copy.username.replace(/^@/, '').trim()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return createPortal(
    <dialog ref={dialogRef} className="ia-publication" aria-labelledby="ia-publication-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="ia-publication-layout">
        <div className="ia-publication-image">
          <img src={influencerImageUrl(post.id, locale)} alt={copy.product} />
        </div>
        <div className="ia-publication-details">
          <header className="ia-publication-header">
            <span className="ia-avatar" style={{ background: post.hue }} aria-hidden="true">
              {username.charAt(0).toUpperCase()}
            </span>
            <div className="ia-publication-author">
              <h2 id="ia-publication-title">{username}
                {post.verified && <span className="ia-verified" title={t('rooms.influencer.stage1.verified')}>&#10003;</span>}
              </h2>
              <span>{copy.followers.trim()} {t('rooms.influencer.stage1.followersSuffix')}</span>
            </div>
            <CloseButton className="ia-publication-close" autoFocus onClick={onClose} />
          </header>
          <div className="ia-publication-thread" tabIndex={0} aria-label={t('rooms.influencer.stage1.commentsTitle')}>
            <p className="ia-publication-caption"><strong>{username}</strong>{' '}{copy.caption}</p>
            <PostComments comments={copy.comments} hue={post.hue} liked={liked} onToggle={onToggle} />
          </div>
          <footer className="ia-publication-footer">
            <span className="ia-publication-likes">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
              <strong>{post.likes}</strong>
            </span>
            <span>{t('rooms.influencer.stage1.commentCount', { count: post.comments })}</span>
          </footer>
        </div>
      </div>
    </dialog>,
    document.body,
  )
}

/* The products-chamber door (bg-reverse-search-door.png) in its own 1677x938
   pixel space, cover-fitted over the scene exactly like the background image,
   so the door hotspot lands on the pictured door. Same approach as the
   Algorithm Room's door (DoorKeypadMap there). */
const DOOR_ART = { w: 1677, h: 938 }
function DoorArtMap({ children }) {
  const ref = useRef(null)
  const [fit, setFit] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // client sizes are layout px, unaffected by the stage's scale transform
    const measure = () => setFit(Math.max(el.clientWidth / DOOR_ART.w, el.clientHeight / DOOR_ART.h))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="ia-door-map" ref={ref}>
      <div className="ia-door-art" style={{ transform: `scale(${fit})`, visibility: fit ? undefined : 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

/* The three disclosure labels (#publi / #collab / #regalo) with their tells:
   on the screen before the game and in the HUD's info (i) pop-over. */
function LabelCards() {
  const t = useT()
  return (
    <div className="ia-lf-cards">
      {['paid', 'collab', 'gifted'].map((key) => (
        <div key={key} className={`ia-lf-card ${key}`}>
          <img className="ia-lf-img" src={bgUrl(`influencers/feedback/${key}.png`)} alt="" />
          <span className="ia-lf-tag">{t(`rooms.influencer.labels.${key}`)}</span>
          <div className="ia-lf-desc">{t(`rooms.influencer.labelFeedback.${key}Desc`)}</div>
          <div className="ia-lf-ex t-xs">{t(`rooms.influencer.labelFeedback.${key}Example`)}</div>
        </div>
      ))}
    </div>
  )
}

/* Body of the HUD's info (i) pop-over in this room (the HUD supplies the
   title). step 'labels' (the label game): the label explainer. step 'search'
   (the reverse image search): its explainer, both "what do I look for?" cards
   and the how-to-play line. */
export function InfluencerInfo({ step }) {
  const t = useT()
  if (step !== 'search') {
    return (
      <div className="ia-info">
        <p className="ia-explain-body">{t('rooms.influencer.labelFeedback.intro')}</p>
        <h4 className="ia-lookfor-title">{t('rooms.influencer.stage1.howToSpot')}</h4>
        <LabelCards />
      </div>
    )
  }
  return (
    <div className="ia-info">
      <p className="ia-explain-body">{t('rooms.influencer.explain.body')}</p>
      <h4 className="ia-lookfor-title">{t('rooms.influencer.explain.lookForTitle')}</h4>
      <div className="ia-info-lookfor">
      {LOOK_FOR.map((c) => (
        <div key={c.n} className="ia-lookfor-card">
          {c.pair ? (
            <div className="ia-lookfor-pair">
              {c.pair.map((p) => (
                <figure key={p.image} className="ia-lookfor-pair-item">
                  <img src={productUrl(p.image)} alt="" />
                  <figcaption>{t(`rooms.influencer.explain.${p.caption}`)}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="ia-lookfor-img has-image" aria-hidden="true"><img src={productUrl(c.image)} alt="" /></div>
          )}
          <div className="ia-lookfor-copy">
            <h5 className="ia-lookfor-card-title">{t(`rooms.influencer.explain.${c.title}`)}</h5>
            <p className="ia-lookfor-text">{t(`rooms.influencer.explain.${c.text}`)}</p>
          </div>
        </div>
      ))}
      </div>
      <p className="ia-explain-instructions"><b className="lead-label">{t('common.howToPlay')}</b> {t('rooms.influencer.explain.instructions')}</p>
    </div>
  )
}

export default function InfluencerAvenue({ node }) {
  const { completeRoom, addEvidence, hasItem, setHintStep } = useGame()
  const { locale } = useI18n()
  const t = useT()

  /* Progress, not UI: these five survive a refresh so a player who has
     already decoded the labels comes back to the reverse-image search
     rather than to the start of the room. Everything else in here is
     transient (a held stamp, an open panel) and deliberately is not. */
  const [stage, setStage] = useRoomState('influencer.stage', 'labelFeedback') // 'labelFeedback' (what each label means) → 'label' → 'door' → 'chamber' → 'explain' → 'verify' → solved
  const [solved, setSolved] = useRoomState('influencer.solved', false)
  // Hints follow the stage: decoding the labels, then the reverse image search.
  useEffect(() => {
    setHintStep(stage === 'label' || stage === 'labelFeedback' ? 'labels'
      : stage === 'door' ? 'door' : 'search')
  }, [stage, setHintStep])
  const [demoPhase, setDemoPhase] = useState('drag') // explainer's scripted reverse-search demo
  // The label recap and the reverse-search explainer can't be skipped: their
  // continue buttons appear once the text has had time to be read.
  const labelFeedback = useReadingGate(['intro', 'paidDesc', 'paidExample', 'collabDesc', 'collabExample', 'giftedDesc', 'giftedExample']
    .map((key) => t(`rooms.influencer.labelFeedback.${key}`)), stage === 'labelFeedback', 10000)
  // The explainer is split in two steps on every device — 1: title + body, 2: how to play
  // + demo — each with its own reading gate.
  const mobile = useMobileView()
  const [explainStep, setExplainStep] = useState(1)
  const [explainStep1Read, setExplainStep1Read] = useState(false)
  // Both layouts split the explainer in two steps (it used to be phone-only).
  // Steps: 1 (title + body) → [phone only: 'look', the "What should I look
  // for?" cards; desktop shows them inside step 1] → 2 (how to play + demo).
  const explainText = explainStep === 2 ? t('rooms.influencer.explain.instructions') : t('rooms.influencer.explain.body')
  // Step 2's "Now you try" waits for one full loop of the demo (DEMO_LOOP_MS)
  // rather than just the instructions' reading time.
  const explain = useReadingGate(explainText, stage === 'explain', explainStep === 2 ? DEMO_LOOP_MS : undefined)
  // Coming back from step 2, step 1 has already been read — so its
  // Next is clickable immediately rather than re-running the wait.
  const explainStep1 = explainStep1Read ? { ...explain, ready: true } : explain
  const demoVisible = stage === 'explain' && explainStep === 2
  // Desktop step 1, "What should I look for?": which example card is
  // highlighted (1 = prices, 2 = claims). The button to the second card
  // unlocks 3s after the first is shown, and stays unlocked after that.
  const [lookFor, setLookFor] = useState(1)
  const [lookForReady, setLookForReady] = useState(false)
  const lookForShown = stage === 'explain' && (mobile ? explainStep === 'look' : explainStep === 1)
  useEffect(() => {
    if (!lookForShown || lookForReady) return
    const timer = window.setTimeout(() => setLookForReady(true), 3000)
    return () => window.clearTimeout(timer)
  }, [lookForShown, lookForReady])
  const [demoRun, setDemoRun] = useState(0) // bumped to replay the demo

  // Play the explainer's demo while it's open, on a loop: drag the shoes into
  // the bar, search, show the matches, press the verified stamp, hold 2s, repeat.
  useEffect(() => {
    if (!demoVisible) { setDemoPhase('drag'); return }
    const timers = [
      [1300, () => { setDemoPhase('search'); playSound('search.mp3') }],
      [3200, () => { stopSound('search.mp3'); playSound('twinkle.mp3'); setDemoPhase('results') }],
      [8600, () => setDemoPhase('hold')],
      [9500, () => { setDemoPhase('stamp'); playSound('stamp.mp3') }],
      [DEMO_LOOP_MS, () => { setDemoPhase('drag'); setDemoRun((n) => n + 1) }],
    ].map(([ms, fn]) => window.setTimeout(fn, ms))
    return () => { timers.forEach(window.clearTimeout); stopSound('search.mp3') }
  }, [demoVisible, demoRun])

  useEffect(() => { preloadSound('search.mp3'); preloadSound('stamp.mp3'); preloadSound('key_press.mp3') }, [])

  /* i18n content arrays, index-aligned with POSTS / PRODUCTS. */
  const postCopy = t('rooms.influencer.posts')
  const productCopy = t('rooms.influencer.products')

  /* ---- Stage 1 state ---- */
  const [publicationIndex, setPublicationIndex] = useState(null)
  const publicationTrigger = useRef(null)
  const [commentLikes, setCommentLikes] = useState({})
  function toggleCommentLike(postId, index) {
    // Only the like is reported, not un-liking.
    if (!commentLikes[postId]?.[index]) {
      track('liked', OBJ.postComment(postId, index + 1), { node: node.id, response: index + 1 })
    }
    setCommentLikes((previous) => ({
      ...previous,
      [postId]: { ...previous[postId], [index]: !previous[postId]?.[index] },
    }))
  }
  function closePublication() {
    const open = POSTS[publicationIndex]
    if (open) track('closed', OBJ.post(postNo(open.id)), { node: node.id })
    setPublicationIndex(null)
    publicationTrigger.current?.focus({ preventScroll: true })
  }
  const [answers, setAnswers] = useRoomState('influencer.answers', {}) // postId -> decoded letters
  // noteId -> { post, x, y }: the post a post-it was stuck on, and where
  // (design px, relative to the stage-1 body that holds the posts).
  const [placedRaw, setPlaced] = useRoomState('influencer.placed', {})
  const placed = useMemo(() => Object.fromEntries(
    Object.entries(placedRaw || {}).filter(([, v]) => v && v.post)), [placedRaw])
  const allPlaced = POSTS.every((p) => placed[p.id])
  const [labelsChecked, setLabelsChecked] = useState(false)
  const [placeErr, setPlaceErr] = useState('')
  const [placeErrN, setPlaceErrN] = useState(0)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [decoderOpen, setDecoderOpen] = useState(false)
  const selectedPost = POSTS.find((post) => post.id === selectedPostId)
  const selectedAnswer = answers[selectedPostId] || ''
  /* postId -> the word to decode, in the current language (see toKeypadWord). */
  const correctWords = useMemo(
    () => Object.fromEntries(POSTS.map((p) => [p.id, toKeypadWord(t(`rooms.influencer.labels.${p.id}`))])),
    [t]
  )
  const selectedWord = selectedPost ? correctWords[selectedPost.id] : ''
  const allDecoded = POSTS.every((p) => answers[p.id] === correctWords[p.id])
  // A clicked, not-yet-decoded post-it takes letters from the physical
  // keyboard at any time; the on-screen emoji keys need the decoder open.
  const canType = stage === 'label' && !!selectedPost && selectedAnswer !== selectedWord
  const canEdit = decoderOpen && canType

  /* Emoji sticky-notes: generated from the localised word via encodeWord, so
     each language shows its own emojis. */
  const notes = useMemo(
    () => POSTS.map((p) => ({ id: p.id, emojis: encodeWord(correctWords[p.id]) })),
    [correctWords]
  )

  /* Both the post card and the answer button inside it select the post; they
     share this so the statement is emitted exactly once, from one place. */
  function selectPost(id) {
    // No response: the activity already says which post, and anything more
    // here would look like an answer when the player has only clicked a card.
    track('selected', OBJ.post(postNo(id)), { node: node.id })
    setSelectedPostId(id)
  }

  function enterLetter(letter) {
    if (!canType || selectedAnswer.length >= selectedWord.length) return
    const next = selectedAnswer + letter
    /* The decoder, not the generic "Influencers" activity: this is a letter
       typed on the emoji keypad. The response says which letter, what the
       answer now reads, and which post it is being typed for — otherwise the
       log is a row of identical selections with nothing to tell them apart. */
    track('entered', OBJ.decoder(), {
      node: node.id,
      response: `${postNo(selectedPostId)};${letter};${next}`,
    })
    playSound('key_press.mp3')
    if (next.length === selectedWord.length) {
      playSound(next === selectedWord ? 'twinkle.mp3' : 'wrong.mp3')
    }
    setAnswers((prev) => ({ ...prev, [selectedPostId]: next }))
  }

  function eraseLetter() {
    if (!canType) return
    playSound('key_press.mp3') // the erase key is a key press too
    track('unselected', OBJ.influencers(), {
      node: node.id, response: `${selectedAnswer.slice(-1)};${selectedAnswer.slice(0, -1)}`,
    })
    setAnswers((prev) => ({ ...prev, [selectedPostId]: selectedAnswer.slice(0, -1) }))
  }

  /* Physical keyboard: while the decoder is open, A–Z type a letter and
     Backspace erases, exactly like clicking the keypad. The pressed key
     flashes with its click look (is-pressed) so the player sees which emoji
     it was. A ref keeps the listener on the latest handlers. */
  const [pressedKey, setPressedKey] = useState(null)
  const pressTimer = useRef(null)
  const keyHandler = useRef(null)
  keyHandler.current = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const tag = event.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return
    let pressed = null
    if (event.key === 'Backspace') {
      if (!canType || !selectedAnswer) return
      pressed = 'erase'
    } else {
      const letter = event.key.length === 1 ? toKeypadWord(event.key) : ''
      if (letter.length !== 1 || !KEYPAD_LETTERS.has(letter)) return
      if (!canType || selectedAnswer.length >= selectedWord.length) return
      pressed = letter
    }
    event.preventDefault()
    if (event.repeat) return
    if (pressed === 'erase') eraseLetter()
    else enterLetter(pressed)
    setPressedKey(pressed)
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressedKey(null), 140)
  }
  useEffect(() => {
    if (!decoderOpen && !(stage === 'label' && selectedPostId)) return
    const onKey = (event) => keyHandler.current(event)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decoderOpen, stage, selectedPostId])
  useEffect(() => () => window.clearTimeout(pressTimer.current), [])

  /* "Check" button (enabled once all three post-its sit on a post): right →
     keep them visible briefly, then recap what each label means before the
     reverse search; wrong → an error notice at the top (it doesn't say which
     ones are wrong); the post-its stay put to be moved. */
  function checkPlacement() {
    if (!allPlaced || labelsChecked) return
    const wrong = POSTS.filter((p) => placed[p.id].post !== p.id).map((p) => p.id)
    const ok = wrong.length === 0
    track('submitted', OBJ.labels(), {
      node: node.id,
      response: POSTS.map((p) => `${answers[p.id]}>${postNo(placed[p.id].post)}`).join(';'),
      success: ok,
      completion: ok,
      ...(ok ? { scaled: 1 } : {}),
    })
    if (!ok) {
      playSound('wrong.mp3')
      setPlaceErr(t('rooms.influencer.stage1.wrongPlacement'))
      setPlaceErrN((n) => n + 1) // replays the notice's shake on each wrong check
      return
    }
    setPlaceErr('')
    playSound('twinkle.mp3')
    setLabelsChecked(true)
  }
  // Labels right: a feedback pop-over over the posts, whose Next leads to the
  // products-chamber door.
  const stage1Done = useReadingGate(['title', 'body'].map((key) => t(`rooms.influencer.stage1Done.${key}`)),
    stage === 'label' && labelsChecked)
  function leaveLabels() {
    setDecoderOpen(false)
    setLabelsChecked(false)
    setStage('door')
  }

  /* ---- The products-chamber door: touching it fades to black and the
     player steps into the chamber (whose background is bg-reverse-search). */
  const DOOR_FADE_MS = 700
  const [doorFading, setDoorFading] = useState(false)
  const doorTimer = useRef(null)
  useEffect(() => () => window.clearTimeout(doorTimer.current), [])
  useEffect(() => { preloadSound('open_door.mp3'); preloadSound('note_stick.wav') }, [])
  function enterDoor() {
    if (doorFading) return
    track('opened', OBJ.productsDoor(), { node: node.id })
    playSound('open_door.mp3')
    setDoorFading(true)
    doorTimer.current = window.setTimeout(() => {
      setDoorFading(false)
      setStage('chamber')
    }, DOOR_FADE_MS)
  }

  /* ---- Dragging the post-its onto the posts ----
     Only once all three are decoded. A post-it counts as on a post when more
     than half its area is inside it — any post, right or wrong (the Check
     button judges). It sticks where it was dropped; dropped anywhere else it
     goes back to the column. Stuck post-its can be dragged again. */
  const { scale } = useStage()
  const postRefs = useRef({})
  const labelBodyRef = useRef(null)
  const [noteDrag, setNoteDrag] = useState(null) // { id, sx, sy, x, y, moved }
  const [wrongNotes, setWrongNotes] = useState([])
  const wrongTimer = useRef(null)
  useEffect(() => () => window.clearTimeout(wrongTimer.current), [])
  function shakeNotes(ids) {
    setWrongNotes(ids)
    window.clearTimeout(wrongTimer.current)
    wrongTimer.current = window.setTimeout(() => setWrongNotes([]), 450)
  }

  function onNotePointerDown(event, id) {
    if (event.button !== 0) return
    if (!allDecoded) { selectPost(id); return }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setNoteDrag({ id, sx: event.clientX, sy: event.clientY, x: 0, y: 0, moved: false })
  }
  // The post holding more than half of this post-it's area, if any.
  function postUnder(noteEl) {
    const note = noteEl.getBoundingClientRect()
    let best = null
    let bestShare = 0
    for (const p of POSTS) {
      const r = postRefs.current[p.id]?.getBoundingClientRect()
      if (!r) continue
      const w = Math.max(0, Math.min(note.right, r.right) - Math.max(note.left, r.left))
      const h = Math.max(0, Math.min(note.bottom, r.bottom) - Math.max(note.top, r.top))
      const share = (w * h) / (note.width * note.height)
      if (share > bestShare) { best = p.id; bestShare = share }
    }
    return bestShare > 0.5 ? best : null
  }
  // While dragging, the post the post-it would land on lights up its border.
  const [dropPost, setDropPost] = useState(null)
  function onNotePointerMove(event) {
    if (!noteDrag) return
    const x = (event.clientX - noteDrag.sx) / scale
    const y = (event.clientY - noteDrag.sy) / scale
    setNoteDrag((d) => d && { ...d, x, y, moved: d.moved || Math.hypot(x, y) > 4 })
    const el = event.currentTarget
    // Measure after this move is painted (the translate is applied on render).
    window.requestAnimationFrame(() => setDropPost(el.isConnected ? postUnder(el) : null))
  }
  function onNotePointerUp(event) {
    const d = noteDrag
    if (!d) return
    setNoteDrag(null)
    setDropPost(null)
    if (!d.moved) return
    const note = event.currentTarget.getBoundingClientRect()
    const best = postUnder(event.currentTarget)
    setPlaceErr('')
    if (!best) {
      // Dropped on nothing: back to the column.
      if (placed[d.id]) setPlaced((prev) => { const next = { ...prev }; delete next[d.id]; return next })
      return
    }
    track('dropped', OBJ.post(postNo(best)), { node: node.id, response: d.id })
    playSound('note_stick.wav') // the post-it pressed onto the post
    // Stick it where it was dropped, nudged fully inside the post.
    const body = labelBodyRef.current.getBoundingClientRect()
    const r = postRefs.current[best].getBoundingClientRect()
    const nw = note.width / scale
    const nh = note.height / scale
    const px = (r.left - body.left) / scale
    const py = (r.top - body.top) / scale
    const pw = r.width / scale
    const ph = r.height / scale
    const x = clamp((note.left - body.left) / scale, px, px + Math.max(0, pw - nw))
    const y = clamp((note.top - body.top) / scale, py, py + Math.max(0, ph - nh))
    playSound('key_press.mp3')
    setPlaced((prev) => ({ ...prev, [d.id]: { post: best, x, y } }))
  }

  /* The Emoji Decoding Card is only wanted while the labels are being decoded.
     Stage 1 can be left without ever opening it — the labels may have been
     explained before the game (see setStage('explain') above), or a debug skip
     — so say the tool is done the moment the stage moves on, or the bag goes on
     prompting for it all through the reverse-search stage. */
  useEffect(() => {
    if (stage === 'label') return
    window.dispatchEvent(new CustomEvent('lastchance:tool-done', { detail: { id: 'emojiCard' } }))
  }, [stage])

  /* ---- Stage 2 state ---- */
  const [activeId, setActiveId] = useState(null) // product image being uploaded/searched in the engine
  const [shownId, setShownId] = useState(null) // whose results are open under the engine
  const [searched, setSearched] = useRoomState('influencer.searched', {}) // productId -> true once results are in
  const [picks, setPicks] = useRoomState('influencer.picks', {}) // productId -> chosen verdict value
  const [verifyErr, setVerifyErr] = useState('')
  const [stampFx, setStampFx] = useState(0) // bumped on each stamp so the imprint animation replays
  const [heldStamp, setHeldStamp] = useState(null) // the stamp-maker currently "in hand"
  const [trayIndex, setTrayIndex] = useState(0) // mobile: the one image shown in the tray carousel
  // Progress: each correctly decoded label, each stage, each reverse search.
  useRoomProgress(`${stage}|${POSTS.filter((p) => answers[p.id] === correctWords[p.id]).length}|${Object.keys(placed).length}|${Object.keys(searched).length}`)
  const heldRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 }) // last cursor position (viewport px)

  // While a stamp is held it follows the cursor; Esc puts it down. Only on a
  // fine pointer — touch relies on tap-then-tap with the highlight/armed states.
  useEffect(() => {
    if (!heldStamp || !FINE_POINTER) return
    const move = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      const el = heldRef.current
      if (el) { el.style.left = `${e.clientX}px`; el.style.top = `${e.clientY}px` }
    }
    const key = (e) => { if (e.key === 'Escape') setHeldStamp(null) }
    window.addEventListener('pointermove', move)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('keydown', key) }
  }, [heldStamp])

  // Press the held stamp onto a product's slot.
  function stampVerdict(id, value) {
    const product = PRODUCTS.find((p) => p.id === id)
    track('dropped', OBJ.product(id, PRODUCT_NAMES[id] || id), {
      node: node.id, response: value, success: value === product?.verdict, completion: true,
    })
    pick(id, value)
    setStampFx((n) => n + 1)
    playSound('stamp.mp3') // the rubber-stamp ka-chunk
  }
  // Grab a stamp-maker (toggle it in/out of your hand); remember where it started.
  function grabStamp(value, e) {
    if (e) posRef.current = { x: e.clientX, y: e.clientY }
    if (heldStamp !== value) track('selected', OBJ.stamp(value), { node: node.id, response: value })
    setHeldStamp((cur) => (cur === value ? null : value))
  }
  // Peel a product's stamp off again (it becomes unclassified).
  function removeStamp(id) {
    setVerifyErr('')
    if (picks[id]) {
      track('unselected', OBJ.product(id, PRODUCT_NAMES[id] || id), { node: node.id, response: picks[id] })
    }
    setPicks((p) => { const next = { ...p }; delete next[id]; return next })
  }
  // Click the product's slot while holding a stamp → press it.
  function applyStamp(id) {
    if (!heldStamp) return
    // A stamp grabbed on another product can't be pressed on unseen results.
    if (!isSeen(id)) { setHeldStamp(null); setStampLockMsg(true); return }
    stampVerdict(id, heldStamp); setHeldStamp(null)
  }

  const searchTimer = useRef(null)

  /* Results must be looked at before stamping. A product's stamps unlock once
     the player has started scrolling its results AND STAMP_UNLOCK_MS have
     passed since that first scroll (if there's nothing below to scroll to,
     the count starts when the results open); an already-stamped product
     stays unlocked.
     If they're still unscrolled after NUDGE_MS, arrows + "Scroll down"
     appear right under the game. */
  const NUDGE_MS = 5000
  /* 6s, not 15: the results carry 11-16 words, which readingGate's own ~315 wpm
     pace puts at 2.6-3.5s, so 15s was four to five times the reading it gates —
     and it is paid three times over, once per product. The scroll requirement
     above is what actually evidences the results were looked at; this is only
     a floor under it, so it needs headroom over the reading time, not a
     multiple of it. The countdown line below fills over this value. */
  const STAMP_UNLOCK_MS = 6000
  const resultsScrollRef = useRef(null)
  const [resultsScrolled, setResultsScrolled] = useState({}) // productId -> true
  const [resultsTimed, setResultsTimed] = useState({}) // productId -> true once open long enough
  const [scrollNudge, setScrollNudge] = useState(false)
  const [stampLockMsg, setStampLockMsg] = useState(false)
  const isSeen = (id) => !!(id && (picks[id] || (resultsScrolled[id] && resultsTimed[id])))
  const shownSeen = isSeen(shownId)
  const shownScrolled = !!(shownId && resultsScrolled[shownId])
  const markScrolled = (id) => setResultsScrolled((m) => (m[id] ? m : { ...m, [id]: true }))
  useEffect(() => {
    setScrollNudge(false)
    if (stage !== 'verify' || !shownId || activeId || shownScrolled) return
    const id = shownId
    // Nothing to scroll → nothing hidden: counts as scrolled.
    const frame = window.requestAnimationFrame(() => {
      const el = resultsScrollRef.current
      if (el && el.scrollHeight - el.clientHeight <= 8) markScrolled(id)
    })
    const timer = window.setTimeout(() => setScrollNudge(true), NUDGE_MS)
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer) }
  }, [stage, shownId, activeId, shownScrolled])
  useEffect(() => { setStampLockMsg(false) }, [shownId])
  // The 15s count starts only once the player has begun scrolling the results.
  useEffect(() => {
    if (stage !== 'verify' || !shownId || activeId || !shownScrolled || resultsTimed[shownId]) return
    const id = shownId
    const timer = window.setTimeout(() => setResultsTimed((m) => ({ ...m, [id]: true })), STAMP_UNLOCK_MS)
    return () => window.clearTimeout(timer)
  }, [stage, shownId, activeId, shownScrolled, resultsTimed])
  function onResultsScroll(event) {
    if (shownId && event.currentTarget.scrollTop > 8) markScrolled(shownId)
  }
  useEffect(() => () => { clearTimeout(searchTimer.current); stopSound('search.mp3') }, [])

  useEffect(() => {
    const onUseItem = (event) => {
      if (event.detail?.id === 'emojiCard' && hasItem('emojiCard') && stage === 'label') {
        track('opened', OBJ.decoder(), { node: node.id })
        setDecoderOpen(true)
      }
    }
    window.addEventListener('lastchance:use-item', onUseItem)
    return () => window.removeEventListener('lastchance:use-item', onUseItem)
  }, [hasItem, stage])

  /* Drop a product image on the reverse-search engine: it "uploads" and searches
     the web for a beat, then its web-match results open under the engine.
     Dropping an already-searched image just re-opens its results. */
  function runSearch(id) {
    if (!id || activeId) return
    setVerifyErr('')
    if (searched[id]) { setShownId(id); return }
    setActiveId(id)
    track('searched', OBJ.product(id, PRODUCT_NAMES[id] || id), { node: node.id })
    playSound('search.mp3') // "searching the web…" whir
    clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      stopSound('search.mp3')
      playSound('twinkle.mp3') // results found
      setSearched((s) => ({ ...s, [id]: true }))
      setActiveId(null)
      setShownId(id)
    }, 2100)
  }

  function pick(id, value) {
    setVerifyErr('')
    setPicks((p) => ({ ...p, [id]: value }))
  }

  // DEBUG ONLY: remove this function and the marked button below to restore the full first stage.
  function skipFirstStageForDebug() {
    setDecoderOpen(false)
    setStage('door') // land on the products-chamber door, not the challenge itself
  }

  function submitVerify() {
    if (!PRODUCTS.every((p) => searched[p.id])) {
      setVerifyErr(t('rooms.influencer.stage2.errRunAll'))
      return
    }
    if (!PRODUCTS.every((p) => picks[p.id])) {
      setVerifyErr(t('rooms.influencer.stage2.errClassifyAll'))
      return
    }
    const allCorrect = PRODUCTS.every((p) => picks[p.id] === p.verdict)
    track('submitted', OBJ.verification(), {
      node: node.id,
      response: PRODUCTS.map((p) => picks[p.id]).join(';'),
      success: allCorrect,
      completion: allCorrect,
      ...(allCorrect ? { scaled: 1 } : {}),
    })
    if (!allCorrect) {
      playSound('wrong.mp3')
      setVerifyErr(t('rooms.influencer.stage2.errWrong'))
      return
    }
    // Both stages cleared: log evidence; RoomFrame handles reward collection.
    addEvidence({
      id: 'ev-influencer',
      label: t('rooms.influencer.evidenceLabel'),
    })
    setSolved(true)
  }

  function renderNote(id) {
    const note = notes.find((n) => n.id === id)
    const label = answers[id] || ''
    const word = correctWords[id]
    const decoded = label === word
    const state = label.length === word.length && !decoded ? 'bad' : ''
    const selected = selectedPostId === id && !decoded
    const spot = placed[id]
    const dragging = noteDrag?.id === id
    const draggable = allDecoded && !labelsChecked
    return (
      <div
        key={id}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        className={[
          'ia-note',
          selected && 'is-selected',
          decoded && 'is-decoded',
          draggable && 'is-draggable',
          dragging && 'is-dragging',
          spot && 'is-placed',
          wrongNotes.includes(id) && 'shake',
        ].filter(Boolean).join(' ')}
        style={{
          ...(spot ? { left: spot.x, top: spot.y } : null),
          ...(dragging ? { translate: `${noteDrag.x}px ${noteDrag.y}px` } : null),
        }}
        onMouseDown={(event) => event.preventDefault()}
        onPointerDown={labelsChecked ? undefined : (event) => onNotePointerDown(event, id)}
        onPointerMove={draggable ? onNotePointerMove : undefined}
        onPointerUp={draggable ? onNotePointerUp : undefined}
        onPointerCancel={() => { setNoteDrag(null); setDropPost(null) }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPost(id) }
        }}
      >
        <div className="ia-note-tape" />
        {decoded ? (
          // Decoded: the emojis give way to the word, written big.
          <div className="ia-note-word"
            style={{ fontSize: `${Math.min(24, Math.floor(NOTE_INNER_W / (word.length * 0.72)))}px` }}>
            {word}
          </div>
        ) : (
          <div className="ia-note-emojis">
            {note.emojis.map((e, i) => <span key={i}>{e}</span>)}
          </div>
        )}
        {/* Only the clicked post-it shows its letters input. */}
        {selected && (
          <div className={`ia-note-input ${state}`} aria-live="polite">
            <span className="ia-answer-letters" aria-hidden="true">
              {Array.from({ length: word.length }, (_, index) => (
                <span key={index} className={`ia-answer-letter ${index === label.length ? 'current' : ''}`}>
                  {label[index] || '\u00a0'}
                </span>
              ))}
            </span>
            {state === 'bad' && <span className="ia-answer-status t-xs">{t('rooms.influencer.stage1.wrong')}</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <RoomFrame
      node={node}
      // Posts: the avenue. The door, then — once through it — the products chamber.
      bgImage={bgUrl(stage === 'label' || stage === 'labelFeedback' ? 'influencer.png'
        : stage === 'door' ? 'bg-reverse-search-door.png' : 'bg-reverse-search.webp')}
      // The chamber card is a step-in, like the room's own briefing.
      showBack={stage !== 'chamber'}
      // In the reverse search, the back arrow returns to its own explainer
      // (step 1, already read), not to the room's entry briefing.
      onBack={stage === 'verify' ? () => {
        setHeldStamp(null)
        setExplainStep(1)
        setStage('explain')
      } : stage === 'label' ? () => {
        // The labels game's back arrow returns to the labels explanation.
        setDecoderOpen(false)
        setStage('labelFeedback')
      } : undefined}
      intro={t('rooms.influencer.intro')}
      solved={solved}
      solvedTitle={t('rooms.influencer.solvedTitle')}
      solvedText={t('rooms.influencer.solvedText')}
      reward={ITEMS.dataReport}
      onContinue={() => completeRoom(node.id)}
    >
      {publicationIndex !== null && (
        <PublicationOverlay post={POSTS[publicationIndex]} copy={postCopy[publicationIndex]} locale={locale}
          liked={commentLikes[POSTS[publicationIndex].id]}
          onToggle={(index) => toggleCommentLike(POSTS[publicationIndex].id, index)}
          onClose={closePublication} />
      )}
      {/* ============================ STAGE 1 ============================ */}
      {stage === 'label' && (
        <div className="ia-stage ia-label-stage fade-in">
          {/* Wrong check: same look as Link District's error box, pinned to the top. */}
          {placeErr && (
            <div key={placeErrN} className="ia-place-err" role="status">
              <span>{placeErr}</span>
              <CloseButton className="ia-place-err-close"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setPlaceErr('')} />
            </div>
          )}
          <div className="ia-head">
            <p className="game-prompt">
              {t('rooms.influencer.stage1.prompt')}
            </p>
            {/* DEBUG ONLY: remove this block with skipFirstStageForDebug when no longer needed. */}
            {DEBUG && (
              <button
                type="button"
                className="btn btn-ghost btn-sm ia-debug-skip"
                onClick={skipFirstStageForDebug}
              >
                ⏭ Skip decoding (debug)
              </button>
            )}
          </div>

          <div className="ia-label-body" ref={labelBodyRef}>
            {/* The emoji post-its: decode each (click it → its letters show,
                type with the emoji keyboard), then drag them onto the posts. */}
            <div className="ia-notes-dock">
              {NOTE_ORDER.map((id) => (placed[id]
                ? <div key={id} className="ia-note-slot" aria-hidden="true" />
                : renderNote(id)))}
              <div className="ia-notes-check">
                <button type="button" className="btn btn-green"
                  disabled={!allPlaced || labelsChecked}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={checkPlacement}>
                  {t('rooms.influencer.stage1.checkPlacement')}
                </button>
              </div>
            </div>
            {/* Post-its stuck on posts: a layer over the posts, so they can be
                picked up again and dragged elsewhere. */}
            {NOTE_ORDER.filter((id) => placed[id]).map((id) => renderNote(id))}
            <div className="ia-posts">
              {POSTS.map((p, idx) => {
                const copy = postCopy[idx]
                return (
                  // Solid backdrop under each post, so a post at 50% shows this
                  // colour through it rather than the busy room background.
                  <div key={p.id} className="ia-post-backdrop">
                  <article
                    ref={(el) => { postRefs.current[p.id] = el }}
                    className={`ia-post ${labelsChecked ? 'solved' : ''} ${noteDrag && dropPost === p.id ? 'is-drop-target' : ''}`}
                  >
                    {/* Social card header */}
                    <div className="ia-card-top">
                      <div className="ia-avatar" style={{ background: p.hue }}>
                        {copy.username.charAt(0)}
                      </div>
                      <div className="ia-id">
                        <div className="ia-name">
                          {copy.username}
                          {p.verified && (
                            <span className="ia-verified" title={t('rooms.influencer.stage1.verified')}>✓</span>
                          )}
                        </div>
                        <div className="ia-handle t-xs dim">
                          @{copy.username} · {copy.followers} {t('rooms.influencer.stage1.followersSuffix')}
                        </div>
                      </div>
                    </div>

                    <div className="ia-photo"
                      style={{
                        backgroundImage: `url("${influencerImageUrl(p.id, locale)}")`,
                        backgroundSize: 'cover',
                      }}>
                      <span className="ia-photo-tag mono">{copy.product}</span>
                      <span className="ia-stats t-xs">❤️ {p.likes} · 💬 {p.comments}</span>
                    </div>

                    <CaptionPreview username={copy.username} caption={copy.caption} full={!mobile} fill={mobile} showButton={mobile}
                      onOpen={(event) => {
                        event.stopPropagation()
                        publicationTrigger.current = event.currentTarget
                        track('opened', OBJ.post(postNo(p.id)), { node: node.id })
                        setPublicationIndex(idx)
                      }} />

                    {/* The comments fill the rest of the card and scroll. */}
                    {/* Desktop only: on phones the card shows the whole caption instead. */}
                    {!mobile && <PostComments comments={copy.comments} hue={p.hue}
                      liked={commentLikes[p.id]} onToggle={(index) => toggleCommentLike(p.id, index)} />}

                  </article>
                  </div>
                )
              })}
            </div>

          </div>

          <div className={`ia-decoder-slot ${decoderOpen ? 'is-open' : ''}`}>
            {decoderOpen && (
              <section className="ia-decoder" aria-label={t('rooms.influencer.decoder.title')}>
                <div className="ia-decoder-head">
                  <strong>{t('rooms.influencer.decoder.title')}</strong>
                  <span className="ia-decoder-target mono" aria-live="polite">
                    {selectedPost
                      ? notes.find((n) => n.id === selectedPost.id)?.emojis.join(' ')
                      : t('rooms.influencer.decoder.noSelection')}
                  </span>
                  <CloseButton
                    className="ia-decoder-close"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setDecoderOpen(false)}
                  />
                </div>
                <div className="ia-key-grid">
                  {Object.entries(EMOJI_KEY).map(([emoji, letter]) => (
                    <button
                      key={letter}
                      type="button"
                      className={`ia-key-cell ${pressedKey === letter ? 'is-pressed' : ''}`}
                      disabled={!canEdit || selectedAnswer.length >= selectedWord.length}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => enterLetter(letter)}
                      aria-label={`${letter} ${emoji}`}
                    >
                      <span className="ia-key-emoji" aria-hidden="true">{emoji}</span>
                      <span className="ia-key-letter mono" aria-hidden="true">{letter}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`ia-decoder-erase ${pressedKey === 'erase' ? 'is-pressed' : ''}`}
                    disabled={!canEdit || !selectedAnswer}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={eraseLetter}
                    aria-label={t('rooms.influencer.decoder.erase')}
                    title={t('rooms.influencer.decoder.erase')}
                  >
                    {/* Line-style backspace (delete-left) icon. */}
                    <svg
                      className="ia-erase-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ============= FEEDBACK: what each disclosure label means ============= */}
      {/* Stage 1 cleared: feedback pop-over over the labelled posts. */}
      {stage === 'label' && labelsChecked && (
        <div className="ia-pop-backdrop fade-in">
          <section className="ia-pop panel clip panel-glow-purple" role="dialog" aria-modal="true"
            aria-labelledby="ia-stage1-done-title">
            <div className="ia-pop-icon" aria-hidden="true">🏷️</div>
            <h3 id="ia-stage1-done-title" className="ia-explain-title">{t('rooms.influencer.stage1Done.title')}</h3>
            <p className="ia-explain-body">{t('rooms.influencer.stage1Done.body')}</p>
            <GateButton gate={stage1Done} className="btn-purple btn-lg" onClick={leaveLabels}>
              {t('rooms.influencer.stage1Done.next')}
            </GateButton>
          </section>
        </div>
      )}

      {/* ===================== THE PRODUCTS-CHAMBER DOOR ===================== */}
      {stage === 'door' && (
        <div className="ia-door-scene fade-in">
          <div className="ia-door-head">
            <p className="game-prompt">{t('rooms.influencer.door.prompt')}</p>
          </div>
          <DoorArtMap>
            <button
              type="button"
              className="ia-door-hotspot"
              disabled={doorFading}
              onMouseDown={(event) => event.preventDefault()}
              onClick={enterDoor}
              aria-label={t('rooms.influencer.door.action')}
            />
          </DoorArtMap>
          {doorFading && <div className="ia-door-fade to-black" aria-hidden="true" />}
        </div>
      )}

      {/* Through the door: a step-in card, like each room's entry briefing. */}
      {stage === 'chamber' && (
        <div className="room-briefing ia-chamber fade-in">
          <div className="ia-door-fade from-black" aria-hidden="true" />
          <div className="briefing-card panel clip panel-glow-purple">
            <div className="briefing-icon accent-purple">🛍️</div>
            <p className="briefing-text">{t('rooms.influencer.door.chamberIntro')}</p>
            <button className="btn btn-purple btn-lg briefing-begin" onClick={() => {
              setExplainStep(1)
              setStage('explain')
            }}>
              {t('common.begin')}
            </button>
          </div>
        </div>
      )}

      {stage === 'labelFeedback' && (
        <div className="ia-stage ia-explain fade-in">
          <div className="ia-explain-card panel clip">
            <h3 className="ia-explain-title">{t('rooms.influencer.labelFeedback.title')}</h3>
            <p className="ia-explain-body">{t('rooms.influencer.labelFeedback.intro')}</p>

            <h4 className="ia-lookfor-title ia-lf-howto">{t('rooms.influencer.stage1.howToSpot')}</h4>
            <LabelCards />

            <GateButton gate={labelFeedback} className="btn-purple btn-lg" onClick={() => {
              track('viewed', OBJ.labelsRecap(), { node: node.id })
              setStage('label')
            }}>
              {t('rooms.influencer.labelFeedback.continue')}
            </GateButton>
          </div>
        </div>
      )}

      {/* ===================== TRANSITION: what is reverse image search ===================== */}
      {stage === 'explain' && (
        <div className="ia-stage ia-explain fade-in">
          <div className={`ia-explain-card ia-search-intro panel clip ${explainStep === 1 ? 'is-step1' : ''}`}>
            {explainStep === 1 && <>
            <h3 className="ia-explain-title">{t('rooms.influencer.explain.title')}</h3>
            {/* Step 1 — phone: an example product photo to the left of the
                explanation. Desktop: the text alone, centred. */}
            <div className={`ia-explain-intro ${mobile ? '' : 'is-centered'}`}>
              {mobile && <img className="ia-explain-img" src={productUrl('jacket.png')} alt="" />}
              <p className="ia-explain-body">{t('rooms.influencer.explain.body')}</p>
            </div>
            </>}
            {/* "What should I look for?" — two example cards shown one at a
                time: the first with an arrow to the right (unlocks after 3s),
                the second with an arrow back to the left. Desktop: under the
                step-1 text. Phone: a screen of its own between step 1 and the demo. */}
            {lookForShown && (() => {
              const c = LOOK_FOR[lookFor - 1]
              return <>
                <h4 className="ia-lookfor-title">{t('rooms.influencer.explain.lookForTitle')}</h4>
                <div className="ia-lookfor">
                  {/* Each side keeps its slot (hidden when unused) so the card stays centred. */}
                  <button type="button" className={`ia-lookfor-arrow ${lookFor === 2 ? '' : 'is-hidden'}`}
                    aria-label={t('common.back')} title={t('common.back')}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setLookFor(1)} tabIndex={lookFor === 2 ? 0 : -1}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                  </button>
                  <div key={c.n} className="ia-lookfor-card fade-in">
                    {/* The example image (or a placeholder icon until it arrives). */}
                    {c.pair ? (
                      <div className="ia-lookfor-pair">
                        {c.pair.map((p) => (
                          <figure key={p.image} className="ia-lookfor-pair-item">
                            <img src={productUrl(p.image)} alt="" />
                            <figcaption>{t(`rooms.influencer.explain.${p.caption}`)}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <div className={`ia-lookfor-img ${c.image ? 'has-image' : ''}`} aria-hidden="true">
                        {c.image ? <img src={productUrl(c.image)} alt="" /> : <span>{c.icon}</span>}
                      </div>
                    )}
                    <div className="ia-lookfor-copy">
                      <h5 className="ia-lookfor-card-title">{t(`rooms.influencer.explain.${c.title}`)}</h5>
                      <p className="ia-lookfor-text">{t(`rooms.influencer.explain.${c.text}`)}</p>
                    </div>
                  </div>
                  <button type="button" className={`ia-lookfor-arrow ${lookFor === 1 ? '' : 'is-hidden'}`}
                    aria-label={t('common.next')} title={t('common.next')}
                    disabled={lookFor === 1 && !lookForReady}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setLookFor(2)} tabIndex={lookFor === 1 ? 0 : -1}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </>
            })()}

            {/* Two everyday uses: find where to buy something you like, and verify a claim. */}
            {/* <div className="ia-explain-uses">
              <div className="ia-explain-use">
                <span className="ia-explain-use-icon" aria-hidden>🛍️</span>
                <span>{t('rooms.influencer.explain.useShop')}</span>
              </div>
              <div className="ia-explain-use">
                <span className="ia-explain-use-icon" aria-hidden>🔎</span>
                <span>{t('rooms.influencer.explain.useVerify')}</span>
              </div>
            </div> */}

            {/* Scripted demo of the next challenge, in the same UI. */}
            {demoVisible && <>
                <p className="ia-explain-instructions"><b className="lead-label">{t('common.howToPlay')}</b> {t('rooms.influencer.explain.instructions')}</p>
            <ReverseSearchDemo phase={demoPhase} />
            </>}
{/* 
            <div className="learn ia-explain-learn">
              <b className="lead-label">{t('rooms.influencer.explain.takeawayLabel')}</b> {t('rooms.influencer.explain.takeaway')}
            </div> */}

            {/* Phone, step 1: Next to the "look for" cards. */}
            {mobile && explainStep === 1 && <div className="ia-explain-actions">
              <GateButton gate={explainStep1} className="btn-purple btn-lg" onClick={() => {
                setExplainStep1Read(true)
                setExplainStep('look')
              }}>
                {t('common.next')}
              </GateButton>
            </div>}
            {/* Next to the demo, once the second card is shown (desktop: in
                step 1; phone: on the cards screen, with Back to step 1). */}
            {lookForShown && (mobile || lookFor === 2) && <div className="ia-explain-actions">
              {mobile && <button className="btn btn-ghost btn-lg" onClick={() => setExplainStep(1)}>
                {t('common.back')}
              </button>}
              {lookFor === 2 && <GateButton gate={explainStep1} className="btn-purple btn-lg" onClick={() => {
                setExplainStep1Read(true)
                setExplainStep(2)
              }}>
                {t('common.next')}
              </GateButton>}
            </div>}
            {/* Step 2: Back to step 1, and the (gated) Continue into the challenge. */}
            {explainStep === 2 && <div className="ia-explain-actions">
              <button className="btn btn-ghost btn-lg" onClick={() => setExplainStep(mobile ? 'look' : 1)}>
                {t('common.back')}
              </button>
              <GateButton gate={explain} className="btn-purple btn-lg" onClick={() => {
                track('viewed', OBJ.searchExplainer(), { node: node.id })
                setStage('verify')
              }}>
                {t('rooms.influencer.explain.continue')}
              </GateButton>
            </div>}
          </div>
        </div>
      )}

      {/* ============================ STAGE 2 ============================ */}
      {stage === 'verify' && (
        <div className={`ia-stage fade-in ${heldStamp && FINE_POINTER ? 'ia-holding' : ''}`}>
          <div className="ia-head">
            <p className="game-prompt">{t('rooms.influencer.stage2.prompt')}</p>
          </div>

          <div className="ia-verify">
            {/* Your "downloaded" product images — drag one into the engine at right. */}
            <div className="ia-imgtray">
              <div className="ia-imgtray-label t-xs dim">{t('rooms.influencer.stage2.trayLabel')}</div>
              <div className="ia-imgtray-items">
                {PRODUCTS.map((p, idx) => {
                  const done = !!searched[p.id]
                  const isShown = shownId === p.id
                  const copy = productCopy[idx]
                  return (
                    <Draggable
                      key={p.id}
                      id={`img-${p.id}`}
                      kind="image"
                      data={{ id: p.id }}
                      disabled={!!activeId}
                      className={`ia-imgtile-drag ${isShown ? 'shown' : ''} ${idx === trayIndex ? 'is-current' : ''}`}
                    >
                      {/* is-carousel (mobile): the tile hugs the whole image — a class on
                          the tile itself so the drag ghost, a copy of it, matches. */}
                      <div className={`ia-imgtile ${mobile ? 'is-carousel' : ''}`}>
                        <ProductArt product={p} copy={copy} cover={!mobile} className="ia-imgtile-art" />
                        <span className="ia-imgtile-emoji">{p.emoji}</span>
                        <span className="ia-imgtile-name">{copy.name}</span>
                        {!done && <span className="ia-imgtile-badge grab" aria-hidden>⤓</span>}
                        {picks[p.id] && (
                          <span className={`ia-stamp-mark ia-stamp-${picks[p.id]} ia-imgtile-stamp`}>
                            <StampIcon value={picks[p.id]} />
                            {t(`rooms.influencer.classify.${picks[p.id]}`)}
                          </span>
                        )}
                      </div>
                    </Draggable>
                  )
                })}
              </div>
              {/* Mobile: the tiles are too small stacked, so the tray shows one
                  image at full size and these arrows flip between them. */}
              {mobile && (
                <div className="ia-imgtray-nav">
                  <button type="button" className="ia-imgtray-arrow"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setTrayIndex((i) => (i + PRODUCTS.length - 1) % PRODUCTS.length)}
                    aria-label={t('common.back')} title={t('common.back')}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                  </button>
                  <span className="ia-imgtray-count mono">{trayIndex + 1} / {PRODUCTS.length}</span>
                  <button type="button" className="ia-imgtray-arrow"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setTrayIndex((i) => (i + 1) % PRODUCTS.length)}
                    aria-label={t('common.next')} title={t('common.next')}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
              {/* Mobile: running tally of stamped products, styled like the
                  Link District's block-progress box. */}
              {mobile && (
                <div role="status" className={`ia-imgtray-progress mono ${PRODUCTS.every((p) => picks[p.id]) ? 'is-complete' : ''}`}>
                  {t('rooms.influencer.stage2.classifyCount', {
                    count: PRODUCTS.filter((p) => picks[p.id]).length,
                    total: PRODUCTS.length,
                  })}
                </div>
              )}
            </div>

            {/* The reverse-search engine — the search and its results happen HERE. */}
            {(() => {
              const active = activeId ? PRODUCTS.find((p) => p.id === activeId) : null
              const shown = !activeId && shownId ? PRODUCTS.find((p) => p.id === shownId) : null
              const shownCopy = shown ? productCopy[PRODUCTS.indexOf(shown)] : null
              return (
                <div className="ia-engine">
                  {/* Search bar: the engine's "logo" + a slim pill you drop the image into.
                      The dropped image shrinks to fit the bar's height, like a query chip. */}
                  <div className="ia-engine-top">
                    <img
                      className="ia-engine-logo"
                      src={productUrl('logo-joogle.png')}
                      alt={t('rooms.influencer.stage2.engineBar')}
                    />
                    <DropZone
                      id="reverse-engine"
                      accept={['image']}
                      overClassName="is-over"
                      className="ia-engine-drop"
                      onDrop={(data) => runSearch(data.id)}
                    >
                      <span className="ia-engine-lens" aria-hidden>🔍</span>
                      {(active || shown) && (
                        <span className="ia-engine-chip" aria-hidden>
                          <ProductArt
                            product={active || shown}
                            copy={productCopy[PRODUCTS.indexOf(active || shown)]}
                            cover
                            className="ia-engine-chip-art"
                          />
                        </span>
                      )}
                      <span className="ia-engine-ph">{t('rooms.influencer.stage2.engineDrop')}</span>
                      <span className="ia-engine-icon" aria-hidden>⤓</span>
                    </DropZone>
                  </div>

                  {/* Uploading + searching animation */}
                  {active && (
                    <div className="ia-engine-panel">
                      <div className="ia-engine-viewer">
                        <div className="ia-engine-frame">
                          <ProductArt
                            product={active}
                            copy={productCopy[PRODUCTS.indexOf(active)]}
                            className="ia-engine-img"
                          />
                          <span className="ia-scan" aria-hidden />
                          <i className="ia-corner tl" /><i className="ia-corner tr" />
                          <i className="ia-corner bl" /><i className="ia-corner br" />
                        </div>
                      </div>
                      <div className="ia-searching">
                        <div className="ia-searching-head t-xs">
                          <span className="ia-globe" aria-hidden>🌐</span>
                          {t('rooms.influencer.stage2.searching')}
                          <span className="ia-dots" aria-hidden><i /><i /><i /></span>
                        </div>
                        <div className="ia-skels" aria-hidden>
                          <span className="ia-skel" /><span className="ia-skel" /><span className="ia-skel" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results + classify for the searched image */}
                  {shown && (
                    <div className="ia-engine-panel fade-in">
                      {/* The searched image, big on black, framed by four corner brackets. */}
                      <div className="ia-engine-viewer">
                        <div className="ia-engine-frame">
                          <ProductArt
                            product={shown}
                            copy={shownCopy}
                            className="ia-engine-img"
                            alt={shownCopy.name}
                          />
                          <i className="ia-corner tl" /><i className="ia-corner tr" />
                          <i className="ia-corner bl" /><i className="ia-corner br" />
                          {/* the reserved slot over the image — click it with a stamp in hand to press */}
                          <button
                            type="button"
                            className={`ia-stampslot ${heldStamp ? 'armed' : ''} ${picks[shown.id] ? 'stamped' : ''}`}
                            onClick={() => applyStamp(shown.id)}
                            aria-label={t('rooms.influencer.stage2.stampHere')}
                          >
                            {picks[shown.id]
                              ? (
                                <span key={stampFx} className={`ia-stamp-mark ia-stamp-${picks[shown.id]}`}>
                                  <StampIcon value={picks[shown.id]} />
                                  {t(`rooms.influencer.classify.${picks[shown.id]}`)}
                                </span>
                              )
                              : <span className="ia-stampslot-ph t-xs dim">{t('rooms.influencer.stage2.stampHere')}</span>}
                          </button>
                        </div>
                        {/* under the image: peel the stamp off (row kept so the image never jumps) */}
                        <div className="ia-unstamp-row">
                          {picks[shown.id] && (
                            <button
                              type="button"
                              className="ia-unstamp"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => removeStamp(shown.id)}
                            >
                              ✕ {t('rooms.influencer.stage2.removeStamp')}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="ia-engine-cols">
                        <div className="ia-prod-result-wrap">
                        {/* Until the player scrolls, a glow pulses over the scrollbar. */}
                        {!shownScrolled && <span className="ia-scrollbar-pulse" aria-hidden="true" />}
                        <div className="ia-prod-result" ref={resultsScrollRef} onScroll={onResultsScroll}>
                          <div className="t-xs upper dim">{t('rooms.influencer.stage2.matchesTitle')}</div>
                          {/* Masonry of web matches: each photo at its natural aspect ratio,
                              site name on top, product title underneath. */}
                          <div className="ia-matches">
                            {(() => {
                              const thumbs = RESULT_THUMBS[shown.id] || [shown.image || `${shown.id}.png`]
                              const items = shownCopy.matches.map((m, i) => ({ m, i }))
                              return [0, 1, 2].map((col) => (
                                <ul key={col} className="ia-matches-col">
                                  {items.filter(({ i }) => i % 3 === col).map(({ m, i }) => (
                                    <li key={i} className="ia-match" style={{ animationDelay: `${i * 90}ms` }}>
                                      <span className="ia-match-media">
                                        {thumbs[i % thumbs.length] === ART && shown.art
                                          ? <ProductArt product={shown} copy={shownCopy} className="ia-match-img" />
                                          : <img className="ia-match-img" src={productUrl(thumbs[i % thumbs.length])} alt="" />}
                                        {/* listing price chip (only some results carry one) */}
                                        {hasValue(m.price) && (
                                          <span className="ia-match-price">
                                            <img src={assetUrl('icons/price-tag.svg')} alt="" aria-hidden />
                                            {m.price}
                                          </span>
                                        )}
                                        {(() => {
                                          const overlay = shownCopy.art?.[shown.art?.resultOverlays?.[i]]
                                          return hasValue(overlay) && <span className="ia-match-overlay">{overlay}</span>
                                        })()}
                                      </span>
                                      <span className="ia-match-site">
                                        <span className="ia-match-fav" aria-hidden>{m.site.charAt(0)}</span>
                                        <span className="ia-match-site-name">{m.site}</span>
                                      </span>
                                      <span className="ia-match-title">{m.title}</span>
                                    </li>
                                  ))}
                                </ul>
                              ))
                            })()}
                          </div>
                          <div className="ia-result-sum t-xs">{shownCopy.result}</div>
                          <div className="t-xs dim ia-prod-hint">{shownCopy.hint}</div>
                        </div>
                        </div>
                        <div className="ia-engine-classify">
                          {/* Tiny countdown line: fills over STAMP_UNLOCK_MS from the first
                              scroll; empty until then, gone once the stamps unlock. */}
                          {!shownSeen && (
                            <div className="ia-stamp-timer" aria-hidden="true">
                              {shownScrolled && (
                                <span key={shown.id} className="ia-stamp-timer-fill"
                                  style={{ animationDuration: `${STAMP_UNLOCK_MS}ms` }} />
                              )}
                            </div>
                          )}
                          {stampLockMsg && !shownSeen && (
                            <div className="ia-stamp-locked-msg" role="status">
                              <span>{t('rooms.influencer.stage2.lookFirst')}</span>
                              <CloseButton className="ia-stamp-locked-close"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => setStampLockMsg(false)} />
                            </div>
                          )}
                          <div className="t-xs upper dim">{t('rooms.influencer.stage2.classifyPrompt')}</div>
                          {/* Grab a stamp-maker; your cursor becomes it, then click the slot by the image. */}
                          <div className="ia-stamprack">
                            {CLASSIFY_OPTIONS.map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={`ia-stampmaker ia-stamp-${value} ${heldStamp === value ? 'held' : ''} ${picks[shown.id] === value ? 'inked' : ''} ${shownSeen ? '' : 'is-locked'}`}
                                aria-disabled={!shownSeen || undefined}
                                onClick={(e) => { if (!shownSeen) { setStampLockMsg(true); return } grabStamp(value, e) }}
                              >
                                <span className="ia-stampmaker-face" aria-hidden />
                                <span className="ia-stamp-label">{t(`rooms.influencer.classify.${value}`)}</span>
                                <StampIcon value={value} className="ia-stampmaker-icon" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          <div className="ia-actions">
            {scrollNudge && (
              <div className="ia-scroll-nudge" role="status">
                <span className="ia-scroll-nudge-arrow" aria-hidden="true">
                  <span className="ia-scroll-nudge-chevron" />
                  <span className="ia-scroll-nudge-chevron" />
                </span>
                <span className="ia-scroll-nudge-text">{t('rooms.influencer.stage2.scrollDown')}</span>
              </div>
            )}
            {verifyErr
              ? <div className="banner wrong shake ia-banner">{verifyErr}</div>
              : <span className="game-prompt">
                {/* {t('rooms.influencer.stage2.hint')} */}
                </span>}
            <button className="btn btn-purple btn-lg ia-confirm" onClick={submitVerify}>
              {t('rooms.influencer.stage2.confirm')}
            </button>
          </div>

        </div>
      )}

      {/* The grabbed stamp riding the cursor — portalled to <body> so it isn't
          offset by the scaled stage's transform. Fine pointers only. */}
      {stage === 'verify' && heldStamp && FINE_POINTER && createPortal(
        <div
          className={`ia-held-stamp ia-stamp-${heldStamp}`}
          ref={heldRef}
          aria-hidden
          style={{ left: `${posRef.current.x}px`, top: `${posRef.current.y}px` }}
        >
          <span className="ia-stampmaker-face" />
      </div>,
        document.body,
      )}

    </RoomFrame>
  )
}