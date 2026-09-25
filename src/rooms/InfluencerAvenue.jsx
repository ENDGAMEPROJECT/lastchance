import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from '../game/GameContext.jsx'
import { ITEMS, EMOJI_KEY, encodeWord } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'
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
                then classify each (mass-produced fake / AI-generated / legit).
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
    // emoji: '☕',
    hue: 'linear-gradient(135deg, #d9b38c, #8a5a3b)',
    verdict: 'mass', // it is mass-produced, not handmade
  },
  {
    id: 'novapad',
    seller: 'novapad_x_deals',
    // emoji: '📱',
    hue: 'linear-gradient(135deg, #7a2ce0, #2b6bff)',
    verdict: 'ai', // the image is AI-generated / fake
  },
  {
    id: 'cupcakes',
    seller: 'cornerst_bakery',
    // emoji: '🧁',
    hue: 'linear-gradient(135deg, #ff9fbf, #ffd36b)',
    verdict: 'legit', // this one is real
  },
]

/* The three classification option values (labels come from i18n). */
const CLASSIFY_OPTIONS = ['mass', 'ai', 'legit']

/* Rubber-stamp faces for each verdict. */
const STAMP_EMOJI = { mass: '🏭', ai: '🤖', legit: '✅' }

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
    <div className="ia-caption t-xs">
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
  const { completeRoom, addItem, addEvidence, hasItem } = useGame()
  const { locale } = useI18n()
  const t = useT()

  const [stage, setStage] = useState('label') // 'label' → 'labelFeedback' → 'explain' → 'verify' → solved
  const [solved, setSolved] = useState(false)
  const [searchDone, setSearchDone] = useState(false) // explainer's mock search finished → show results

  // Play the explainer's "searching → results" beat each time it opens.
  useEffect(() => {
    if (stage !== 'explain') { setSearchDone(false); return }
    // ~0.9s for the photo to "drag" into the bar, then the search resolves.
    playSound('search.mp3') // searching whir (placeholder — a proper search hum would be nicer)
    const id = window.setTimeout(() => {
      stopSound('search.mp3')
      playSound('twinkle.mp3') // results land
      setSearchDone(true)
    }, 1700)
    return () => { window.clearTimeout(id); stopSound('search.mp3') }
  }, [stage])

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
    setStage('verify')
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
    // Both stages cleared — grant the rewards and mark solved.
    addItem(ITEMS.dataReport)
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
            <p className="ia-prompt">
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
                      {correct ? t('rooms.influencer.stage1.correct', { label }) : state === 'bad'
                        ? t('rooms.influencer.stage1.wrong')
                        : null}
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

            <button className="btn btn-purple btn-lg" onClick={() => setStage('explain')}>
              {t('rooms.influencer.labelFeedback.continue')}
            </button>
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
            <div className="ia-explain-uses">
              <div className="ia-explain-use">
                <span className="ia-explain-use-icon" aria-hidden>🛍️</span>
                <span>{t('rooms.influencer.explain.useShop')}</span>
              </div>
              <div className="ia-explain-use">
                <span className="ia-explain-use-icon" aria-hidden>🔎</span>
                <span>{t('rooms.influencer.explain.useVerify')}</span>
              </div>
            </div>

            {/* Animated reverse-image-search mock: the jacket photo drops into a
                search bar, it "searches", then the matching cheap shops pop up. */}
            <div className="ia-search">
              {/* 1 · the seller's post you want to check */}
              <div className="ia-src">
                <span className="ia-src-photo" aria-hidden>🧥</span>
                <span className="ia-src-cap t-xs">{t('rooms.influencer.explain.queryCaption')}</span>
              </div>

              {/* 2 · drag its photo into a reverse image search ↓ */}
              <div className="ia-search-draghint t-xs dim">{t('rooms.influencer.explain.dragHint')}</div>

              {/* 3 · the search bar — the photo drops into it from the post above */}
              <div className="ia-search-bar">
                <span className="ia-search-thumb" aria-hidden>
                  🧥
                  <span className="ia-search-hand" aria-hidden>🫳</span>
                </span>
                <span className="ia-search-q">
                  <span className="ia-search-q-text">{t('rooms.influencer.explain.searchLabel')}</span>
                  <span className="ia-search-scan" aria-hidden />
                </span>
                <span className="ia-search-go" aria-hidden>🔍</span>
              </div>

              <div className="ia-search-panel">
                {!searchDone ? (
                  <div className="ia-search-loading">
                    <span className="ia-search-spinner" aria-hidden />
                    <span className="mono t-sm">{t('rooms.influencer.explain.searching')}</span>
                  </div>
                ) : (
                  <div className="ia-search-out">
                    <div className="ia-search-resultshead t-xs dim">{t('rooms.influencer.explain.resultsLabel')}</div>
                    <div className="ia-search-results">
                      {[['dropship-mart', '$12'], ['mega-cheap', '$9'], ['fastfinds', '$14'], ['shop2000', '$11']].map(([shop, price], i) => (
                        <div className="ia-search-hit" key={shop} style={{ animationDelay: `${i * 0.14}s` }}>
                          <span className="ia-search-hit-emoji" aria-hidden>🧥</span>
                          <span className="ia-search-hit-shop t-xs">{shop}</span>
                          <span className="ia-search-hit-price t-xs mono">{price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="learn ia-explain-learn">
              <b>{t('rooms.influencer.explain.takeawayLabel')}</b> {t('rooms.influencer.explain.takeaway')}
            </div>

            <button className="btn btn-purple btn-lg" onClick={() => setStage('verify')}>
              {t('rooms.influencer.explain.continue')}
            </button>
          </div>
        </div>
      )}

      {/* ============================ STAGE 2 ============================ */}
      {stage === 'verify' && (
        <div className={`ia-stage fade-in ${heldStamp && FINE_POINTER ? 'ia-holding' : ''}`}>
          <div className="ia-head">
            <p className="ia-prompt">{t('rooms.influencer.stage2.prompt')}</p>
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
                      <div className="ia-imgtile" style={{
                        backgroundImage: `url("${import.meta.env.BASE_URL}products/${p.id}.png")`,
                        backgroundSize: "cover"
                      }}>
                        <span className="ia-imgtile-emoji">{p.emoji}</span>
                        <span className="ia-imgtile-name">{copy.name}</span>
                        <span className={`ia-imgtile-badge ${done ? 'done' : 'grab'}`} aria-hidden>{done ? '✓' : '⤓'}</span>
                        {picks[p.id] && (
                          <span className="ia-imgtile-verdict t-xs">{t(`rooms.influencer.classify.${picks[p.id]}`)}</span>
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
                  <div className="ia-engine-bar mono">
                    <span className="ia-engine-dot" /> {t('rooms.influencer.stage2.engineBar')}
                  </div>
                  <DropZone
                    id="reverse-engine"
                    accept={['image']}
                    overClassName="is-over"
                    className="ia-engine-drop"
                    onDrop={(data) => runSearch(data.id)}
                  >
                    <div className="ia-engine-ph">
                      <span className="ia-engine-icon" aria-hidden>⤓</span>
                      <span>{t('rooms.influencer.stage2.engineDrop')}</span>
                    </div>
                  </DropZone>

                  {/* Uploading + searching animation */}
                  {active && (
                    <div className="ia-engine-panel">
                      <div className="ia-engine-busy">
                        <div className="ia-engine-thumb"
                          style={{
                            backgroundImage: `url("${import.meta.env.BASE_URL}products/${active.id}.png")`,
                            backgroundSize: 'cover',
                          }}>
                          <span className="ia-scan" aria-hidden />
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
                    </div>
                  )}

                  {/* Results + classify for the searched image */}
                  {shown && (
                    <div className="ia-engine-panel fade-in">
                      <div className="ia-engine-result-head">
                        <div
                          className="ia-engine-thumb"
                          style={{
                            backgroundImage: `url("${import.meta.env.BASE_URL}products/${shown.id}.png")`,
                            backgroundSize: 'cover',
                          }}
                        />
                        {/* the reserved slot — click it with a stamp in hand to press */}
                        <button
                          type="button"
                          className={`ia-stampslot ${heldStamp ? 'armed' : ''}`}
                          onClick={() => applyStamp(shown.id)}
                          aria-label={t('rooms.influencer.stage2.stampHere')}
                        >
                          {picks[shown.id]
                            ? (
                              <span key={stampFx} className={`ia-stamp-mark ia-stamp-${picks[shown.id]}`}>
                                {t(`rooms.influencer.classify.${picks[shown.id]}`)}
                              </span>
                            )
                            : <span className="ia-stampslot-ph t-xs dim">{t('rooms.influencer.stage2.stampHere')}</span>}
                        </button>
                        <div className="ia-engine-result-meta">
                          <div className="t-sm">{shownCopy.name}</div>
                          <div className="t-xs dim mono">{shown.seller}</div>
                        </div>
                      </div>
                      <div className="ia-engine-cols">
                        <div className="ia-prod-result">
                          <div className="t-xs upper dim">{t('rooms.influencer.stage2.matchesTitle')}</div>
                          <ul className="ia-matches">
                            {shownCopy.matches.slice(0, 3).map((m, i) => (
                              <li key={i} className="ia-match" style={{ animationDelay: `${i * 90}ms` }}>
                                <span className="ia-match-fav" style={{ background: shown.hue }} aria-hidden />
                                <span className="ia-match-txt">
                                  <span className="ia-match-site mono">{m.site}</span>
                                  <span className="ia-match-title">{m.title}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
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
                                <span className="ia-stampmaker-face" aria-hidden>{STAMP_EMOJI[value]}</span>
                                <span className="ia-stamp-label">{t(`rooms.influencer.classify.${value}`)}</span>
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
              : <span className="dim t-sm">{t('rooms.influencer.stage2.hint')}</span>}
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
          <span className="ia-stampmaker-face">{STAMP_EMOJI[heldStamp]}</span>
        </div>,
        document.body,
      )}

    </RoomFrame>
  )
}
