import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../game/GameContext.jsx'
import { ITEMS, EMOJI_KEY, encodeWord } from '../game/gameData.js'
import { bgUrl, assetUrl } from '../game/assets.js'
import { useReadingGate } from '../game/readingGate.js'
import { DEBUG } from '../game/settings.js'
import { playSound, stopSound, preloadSound } from '../game/sound.js'
import { useI18n, useT } from '../i18n/index.jsx'
import RoomFrame from '../components/RoomFrame.jsx'
import { Draggable, DropZone } from '../components/dnd/Dnd.jsx'
import './InfluencerAvenue.css'

/* PUZZLE 2 — Influencer Avenue.
   Two stages shown in sequence:
     'label'  → decode the emoji sticky-notes, then type each label
                (PAID / COLLAB / GIFTED) into the selected post using the
                Emoji Decoding Card earned in Link District.
     'verify' → run a SIMULATED reverse image search on three products,
                then classify each (mass-produced fake / AI-generated / verified).
   Reward: the Data Report on Max (its digits open the Algorithm Room).

   Structural data (handles, hues, correctLabel answer keys, verdicts) lives
   here; all display text comes from i18n (rooms.influencer.*). The posts and
   products arrays are index-aligned with the i18n `posts` / `products` arrays. */

/* ---- Stage 1 content: the three influencer posts ---- */
const POSTS = [
  {
    id: 'paid',
    verified: true,
    followers: '1.2M',
    hue: 'linear-gradient(135deg, #ff8fd4, #b06bff)', // the faux photo block
    likes: '48.2K',
    comments: '1,204',
    correctLabel: 'PAID',
  },
  {
    id: 'gifted',
    verified: true,
    followers: '850K',
     hue: 'linear-gradient(135deg, #ff1100, #ffbf6b)', 
    likes: '31.7K',
    comments: '882',
    correctLabel: 'GIFTED',
  },
  {
    id: 'collab',
    verified: false,
    followers: '670K',
     hue: 'linear-gradient(135deg, #8fe5ff, #6b93ff)', 
    likes: '12.9K',
    comments: '431',
    correctLabel: 'COLLAB',
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
        { key: 'label', className: 'ia-art-handmade', x: 240, y: 110, w: 190 },
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
      resultOverlays: { 3: 'fake' },
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

/* A product's picture as ONE image. Products with `art` are an SVG: the photo
   plus the ad copy as real (translated) text, laid out in the art's own
   w×h box (design px) so the whole thing scales, crops and drags as a single
   picture. `cover` crops to fill its box (tiles, chips); otherwise it keeps
   its aspect ratio. */
function ProductArt({ product, copy, cover = false, className = '', alt = '' }) {
  const { art } = product
  if (!art) return <img className={className} src={productImg(product)} alt={alt} draggable={false} />
  const { w: ART_W, h: ART_H } = art
  return (
    <svg
      className={`ia-art ${className}`}
      style={{ aspectRatio: `${ART_W} / ${ART_H}` }}
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      preserveAspectRatio={cover ? 'xMidYMid slice' : 'xMidYMid meet'}
      role="img"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <image
        href={productUrl(art.bg)}
        width={ART_W}
        height={ART_H}
        preserveAspectRatio="xMidYMin slice"
      />
      <foreignObject width={ART_W} height={ART_H}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="ia-art-copy" style={{ width: ART_W, height: ART_H }}>
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
      </foreignObject>
    </svg>
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
  if (value === 'mass') return ( // classic sawtooth factory with one tall chimney
    <svg {...common} strokeWidth={1.6}>
      <path d="M1.5 22h21" />
      <path d="M2.5 22V11.5l4.7-3.5v3.5l4.7-3.5v3.5l4.7-3.5v3.5H19V3h3v19" />
      <path d="M4.6 15h2.4v2.4H4.6zM9.3 15h2.4v2.4H9.3zM14 15h2.4v2.4H14z" />
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
const DEMO_MATCHES = [
  { img: 'shoes1.png', ratio: 1.05, site: 'solecraft.store', desc: 'Classic leather boat shoes, brown' },
  { img: 'shoes2.png', ratio: 1.08, site: 'vintedly.com', desc: 'Designer boat shoes · barely worn' },
  { img: 'shoes3.png', ratio: 0.94, site: 'luxe-resale.co', desc: 'Brown leather deck shoes, size 38' },
  { img: 'shoes4.png', ratio: 0.81, site: 'instapic.com', desc: '@styledaily · weekend look' },
  { img: 'shoes5.png', ratio: 1.13, site: 'shoefinder.net', desc: 'Same model sold by the official brand store' },
  { img: 'shoes.png', ratio: 0.71, site: 'swingfeet.shop', desc: 'Lindy hop dance shoes · handmade' },
]
const DEMO_STAMPS = { mass: 'Mass-produced', ai: 'AI-generated', verified: 'verified' }

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
    <div className="ia-demo" aria-hidden>
      {/* saved image the player drags */}
      <div className="ia-demo-tray">
        <div className="ia-demo-traylabel">Saved image</div>
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
          <img className="ia-demo-logo" src={productUrl('logo-booble.png')} alt="" />
          <div className={`ia-demo-bar ${phase === 'drag' ? 'is-over' : ''}`}>
            <span className="ia-engine-lens">🔍</span>
            {at('search') && <span className="ia-engine-chip fade-in" style={{ backgroundImage: `url("${productUrl('shoes.png')}")` }} />}
            <span className="ia-engine-ph">Drag an image here to search</span>
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
                    {DEMO_STAMPS.verified}
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
                  Searching the web
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
                          <img className="ia-match-img" src={productUrl(m.img)} alt="" />
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
                  {Object.entries(DEMO_STAMPS).map(([value, label]) => (
                    <div
                      key={value}
                      className={`ia-stampmaker ia-stamp-${value} ${value === 'verified' && phase === 'hold' ? 'held' : ''} ${value === 'verified' && at('stamp') ? 'inked' : ''}`}
                    >
                      <span className="ia-stampmaker-face" />
                      <span className="ia-stamp-label">{label}</span>
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
      {phase === 'hold' && (
        <div className="ia-demo-flystamp ia-stamp-verified"><span className="ia-stampmaker-face" /></div>
      )}
    </div>
  )
}

function CaptionPreview({ username, caption, onOpen }) {
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
      const maxHeight = parseFloat(getComputedStyle(measure).lineHeight) * 2 + 1
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
  }, [username, caption, buttonLabel])

  return (
    <div className="ia-caption ">
      <span style={{fontWeight: "bold"}}>{username}</span>{' '}{preview}{' '}
      <button type="button" className="ia-view-publication" aria-haspopup="dialog"
        onMouseDown={(event) => event.preventDefault()} onClick={onOpen}>
        {buttonLabel}
      </button>
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
            <button type="button" className="ia-publication-close" autoFocus
              onClick={onClose} aria-label={t('common.close')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
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

export default function InfluencerAvenue({ node }) {
  const { completeRoom, addEvidence, hasItem } = useGame()
  const { locale } = useI18n()
  const t = useT()

  const [stage, setStage] = useState('label') // 'label' → 'labelFeedback' → 'explain' → 'verify' → solved
  const [solved, setSolved] = useState(false)
  const [demoPhase, setDemoPhase] = useState('drag') // explainer's scripted reverse-search demo
  // The label recap and the reverse-search explainer can't be skipped: their
  // continue buttons appear once the text has had time to be read.
  const labelFeedbackRead = useReadingGate(['intro', 'paidDesc', 'paidExample', 'collabDesc', 'collabExample', 'giftedDesc', 'giftedExample']
    .map((key) => t(`rooms.influencer.labelFeedback.${key}`)), stage === 'labelFeedback', 15000)
  const explainRead = useReadingGate([t('rooms.influencer.explain.body'), t('rooms.influencer.explain.instructions')], stage === 'explain')
  const [demoRun, setDemoRun] = useState(0) // bumped to replay the demo

  // Play the explainer's demo while it's open, on a loop: drag the shoes into
  // the bar, search, show the matches, press the verified stamp, hold 2s, repeat.
  useEffect(() => {
    if (stage !== 'explain') { setDemoPhase('drag'); return }
    const timers = [
      [1300, () => { setDemoPhase('search'); playSound('search.mp3') }],
      [3200, () => { stopSound('search.mp3'); playSound('twinkle.mp3'); setDemoPhase('results') }],
      [8600, () => setDemoPhase('hold')],
      [9500, () => { setDemoPhase('stamp'); playSound('stamp.mp3') }],
      [11500, () => { setDemoPhase('drag'); setDemoRun((n) => n + 1) }],
    ].map(([ms, fn]) => window.setTimeout(fn, ms))
    return () => { timers.forEach(window.clearTimeout); stopSound('search.mp3') }
  }, [stage, demoRun])

  useEffect(() => { preloadSound('search.mp3'); preloadSound('stamp.mp3') }, [])

  /* i18n content arrays, index-aligned with POSTS / PRODUCTS. */
  const postCopy = t('rooms.influencer.posts')
  const productCopy = t('rooms.influencer.products')

  /* ---- Stage 1 state ---- */
  const [publicationIndex, setPublicationIndex] = useState(null)
  const publicationTrigger = useRef(null)
  const [commentLikes, setCommentLikes] = useState({})
  function toggleCommentLike(postId, index) {
    setCommentLikes((previous) => ({
      ...previous,
      [postId]: { ...previous[postId], [index]: !previous[postId]?.[index] },
    }))
  }
  function closePublication() {
    setPublicationIndex(null)
    publicationTrigger.current?.focus({ preventScroll: true })
  }
  const [answers, setAnswers] = useState({}) // postId -> decoded letters
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [decoderOpen, setDecoderOpen] = useState(false)
  const selectedPost = POSTS.find((post) => post.id === selectedPostId)
  const selectedAnswer = answers[selectedPostId] || ''
  const canEdit = decoderOpen && selectedPost && selectedAnswer !== selectedPost.correctLabel

  /* Emoji sticky-notes: generated from the correct label via encodeWord. */
  const notes = useMemo(
    () => POSTS.map((p) => ({ id: p.id, emojis: encodeWord(p.correctLabel) })),
    []
  )

  function enterLetter(letter) {
    if (!canEdit || selectedAnswer.length >= selectedPost.correctLabel.length) return
    const next = selectedAnswer + letter
    if (next.length === selectedPost.correctLabel.length) {
      playSound(next === selectedPost.correctLabel ? 'twinkle.mp3' : 'wrong.mp3')
    }
    setAnswers((prev) => ({ ...prev, [selectedPostId]: next }))
  }

  function eraseLetter() {
    if (!canEdit) return
    setAnswers((prev) => ({ ...prev, [selectedPostId]: selectedAnswer.slice(0, -1) }))
  }

  useEffect(() => {
    if (stage !== 'label' || !POSTS.every((post) => answers[post.id] === post.correctLabel)) return
    // Keep all three completed words visible briefly, then recap what each
    // label means (disclosure) before moving on to the reverse-search stage.
    const timer = window.setTimeout(() => {
      setDecoderOpen(false)
      setStage('labelFeedback')
    }, 900)
    return () => window.clearTimeout(timer)
  }, [answers, stage])

  /* ---- Stage 2 state ---- */
  const [activeId, setActiveId] = useState(null) // product image being uploaded/searched in the engine
  const [shownId, setShownId] = useState(null) // whose results are open under the engine
  const [searched, setSearched] = useState({}) // productId -> true once results are in
  const [picks, setPicks] = useState({}) // productId -> chosen verdict value
  const [verifyErr, setVerifyErr] = useState('')
  const [stampFx, setStampFx] = useState(0) // bumped on each stamp so the imprint animation replays
  const [heldStamp, setHeldStamp] = useState(null) // the stamp-maker currently "in hand"
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
    pick(id, value)
    setStampFx((n) => n + 1)
    playSound('stamp.mp3') // the rubber-stamp ka-chunk
  }
  // Grab a stamp-maker (toggle it in/out of your hand); remember where it started.
  function grabStamp(value, e) {
    if (e) posRef.current = { x: e.clientX, y: e.clientY }
    setHeldStamp((cur) => (cur === value ? null : value))
  }
  // Peel a product's stamp off again (it becomes unclassified).
  function removeStamp(id) {
    setVerifyErr('')
    setPicks((p) => { const next = { ...p }; delete next[id]; return next })
  }
  // Click the product's slot while holding a stamp → press it.
  function applyStamp(id) { if (heldStamp) { stampVerdict(id, heldStamp); setHeldStamp(null) } }

  const searchTimer = useRef(null)
  useEffect(() => () => { clearTimeout(searchTimer.current); stopSound('search.mp3') }, [])

  useEffect(() => {
    const onUseItem = (event) => {
      if (event.detail?.id === 'emojiCard' && hasItem('emojiCard') && stage === 'label') setDecoderOpen(true)
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
    setStage('explain') // land on the reverse-search instructions, not the challenge itself
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

  return (
    <RoomFrame
      node={node}
      bgImage={bgUrl('influencer.png')}
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

          <div className="ia-posts">
            {POSTS.map((p, idx) => {
              const note = notes.find((n) => n.id === p.id)
              const copy = postCopy[idx]
              const label = answers[p.id] || ''
              const correct = label === p.correctLabel
              const state = correct ? 'ok' : label.length === p.correctLabel.length ? 'bad' : ''
              const selected = selectedPostId === p.id
              return (
                <article
                  key={p.id}
                  className={`ia-post ${correct ? 'solved' : ''} ${selected ? 'selected' : ''}`}
                  onClick={() => setSelectedPostId(p.id)}
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

                  <CaptionPreview username={copy.username} caption={copy.caption}
                    onOpen={(event) => {
                      event.stopPropagation()
                      publicationTrigger.current = event.currentTarget
                      setPublicationIndex(idx)
                    }} />

                  {/* <PostComments comments={copy.comments} hue={p.hue}
                    liked={commentLikes[p.id]} onToggle={(index) => toggleCommentLike(p.id, index)} /> */}

                  {/* Emoji sticky-note to decode */}
                  <div className="ia-note">
                    <div className="ia-note-tape" />
                    <div className="ia-note-emojis">
                      {note.emojis.map((e, i) => (
                        <span key={i}>{e}</span>
                      ))}
                    </div>
                    {/* <div className="ia-note-cap t-xs">{t('rooms.influencer.stage1.decodeMe')}</div> */}
                  </div>

                  <button
                    type="button"
                    className={`ia-answer ${state}`}
                    aria-pressed={selected}
                    aria-label={t('rooms.influencer.stage1.selectPost', { name: p.name })}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setSelectedPostId(p.id)}
                  >
                    <span className="ia-answer-letters" aria-hidden="true">
                      {Array.from({ length: p.correctLabel.length }, (_, index) => (
                        <span key={index} className={`ia-answer-letter ${selected && !correct && index === label.length ? 'current' : ''}`}>
                          {label[index] || '\u00a0'}
                        </span>
                      ))}
                    </span>
                    <span className="ia-answer-status t-xs" aria-live="polite">
                      {state === 'bad' ? t('rooms.influencer.stage1.wrong') : null}
                    </span>
                  </button>
                </article>
              )
            })}
          </div>

          <div className="ia-decoder-slot">
            {decoderOpen && (
              <section className="ia-decoder" aria-label={t('rooms.influencer.decoder.title')}>
                <div className="ia-decoder-head">
                  <strong>{t('rooms.influencer.decoder.title')}</strong>
                  <span className="ia-decoder-target mono" aria-live="polite">
                    {selectedPost?.name || t('rooms.influencer.decoder.noSelection')}
                  </span>
                  <button
                    type="button"
                    className="ia-decoder-close"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setDecoderOpen(false)}
                    aria-label={t('common.close')}
                    title={t('common.close')}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="ia-key-grid">
                  {Object.entries(EMOJI_KEY).map(([emoji, letter]) => (
                    <button
                      key={letter}
                      type="button"
                      className="ia-key-cell"
                      disabled={!canEdit || selectedAnswer.length >= selectedPost.correctLabel.length}
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
                    className="ia-decoder-erase"
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
      {stage === 'labelFeedback' && (
        <div className="ia-stage ia-explain fade-in">
          <div className="ia-explain-card panel clip">
            <h3 className="ia-explain-title">{t('rooms.influencer.labelFeedback.title')}</h3>
            <p className="ia-explain-body">{t('rooms.influencer.labelFeedback.intro')}</p>

            <div className="ia-lf-cards">
              <div className="ia-lf-card paid">
                <span className="ia-lf-tag">{t('rooms.influencer.labels.paid')}</span>
                <div className="ia-lf-desc">{t('rooms.influencer.labelFeedback.paidDesc')}</div>
                <div className="ia-lf-ex t-xs">{t('rooms.influencer.labelFeedback.paidExample')}</div>
              </div>
              <div className="ia-lf-card collab">
                <span className="ia-lf-tag">{t('rooms.influencer.labels.collab')}</span>
                <div className="ia-lf-desc">{t('rooms.influencer.labelFeedback.collabDesc')}</div>
                <div className="ia-lf-ex t-xs">{t('rooms.influencer.labelFeedback.collabExample')}</div>
              </div>
              <div className="ia-lf-card gifted">
                <span className="ia-lf-tag">{t('rooms.influencer.labels.gifted')}</span>
                <div className="ia-lf-desc">{t('rooms.influencer.labelFeedback.giftedDesc')}</div>
                <div className="ia-lf-ex t-xs">{t('rooms.influencer.labelFeedback.giftedExample')}</div>
              </div>
            </div>

            {labelFeedbackRead && <button className="btn btn-purple btn-lg" onClick={() => setStage('explain')}>
              {t('rooms.influencer.labelFeedback.continue')}
            </button>}
          </div>
        </div>
      )}

      {/* ===================== TRANSITION: what is reverse image search ===================== */}
      {stage === 'explain' && (
        <div className="ia-stage ia-explain fade-in">
          <div className="ia-explain-card panel clip">
            <h3 className="ia-explain-title">{t('rooms.influencer.explain.title')}</h3>
            <p className="ia-explain-body">{t('rooms.influencer.explain.body')}</p>

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
                <p className="ia-explain-instructions"><b className="lead-label">{t('common.howToPlay')}</b> {t('rooms.influencer.explain.instructions')}</p>
            <ReverseSearchDemo phase={demoPhase} />
{/* 
            <div className="learn ia-explain-learn">
              <b className="lead-label">{t('rooms.influencer.explain.takeawayLabel')}</b> {t('rooms.influencer.explain.takeaway')}
            </div> */}

            {explainRead && <button className="btn btn-purple btn-lg" onClick={() => setStage('verify')}>
              {t('rooms.influencer.explain.continue')}
            </button>}
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
                      className={`ia-imgtile-drag ${isShown ? 'shown' : ''}`}
                    >
                      <div className="ia-imgtile">
                        <ProductArt product={p} copy={copy} cover className="ia-imgtile-art" />
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
                      src={productUrl('logo-booble.png')}
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
                        <div className="ia-prod-result">
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
                        <div className="ia-engine-classify">
                          <div className="t-xs upper dim">{t('rooms.influencer.stage2.classifyPrompt')}</div>
                          {/* Grab a stamp-maker; your cursor becomes it, then click the slot by the image. */}
                          <div className="ia-stamprack">
                            {CLASSIFY_OPTIONS.map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={`ia-stampmaker ia-stamp-${value} ${heldStamp === value ? 'held' : ''} ${picks[shown.id] === value ? 'inked' : ''}`}
                                onClick={(e) => grabStamp(value, e)}
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