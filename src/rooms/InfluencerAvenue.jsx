import { useMemo, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { ITEMS, EMOJI_KEY, encodeWord } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'
import { useT } from '../i18n/index.jsx'
import RoomFrame from '../components/RoomFrame.jsx'
import Modal from '../components/Modal.jsx'
import { Draggable, DropZone } from '../components/dnd/Dnd.jsx'
import './InfluencerAvenue.css'

/* PUZZLE 2 — Influencer Avenue.
   Two stages shown in sequence:
     'label'  → decode the emoji sticky-notes, then DRAG the correct label
                (PAID / COLLAB / GIFTED) onto each sponsored post using the
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
    id: 'luna',
    name: 'LUNA.BEAUTY',
    handle: '@luna.beauty',
    verified: true,
    followers: '1.2M',
    hue: 'linear-gradient(135deg, #ff8fd4, #b06bff)', // the faux photo block
    likes: '48.2K',
    comments: '1,204',
    correctLabel: 'PAID',
  },
  {
    id: 'max',
    name: 'MAX_STREAMS',
    handle: '@max_streams',
    verified: true,
    followers: '850K',
    hue: 'linear-gradient(135deg, #16f2ff, #2b6bff)',
    likes: '31.7K',
    comments: '882',
    correctLabel: 'COLLAB',
  },
  {
    id: 'julia',
    name: 'FIT_BY_JULIA',
    handle: '@fit_by_julia',
    verified: false,
    followers: '670K',
    hue: 'linear-gradient(135deg, #2bff88, #16c4a9)',
    likes: '12.9K',
    comments: '431',
    correctLabel: 'GIFTED',
  },
]

/* The three draggable label "stamps". Values are the answer keys; the
   display copy comes from i18n (rooms.influencer.labels.*). */
const LABELS = ['PAID', 'COLLAB', 'GIFTED']
const LABEL_KEY = { PAID: 'paid', COLLAB: 'collab', GIFTED: 'gifted' }

/* ---- Stage 2 content: the three products for reverse image search ---- */
const PRODUCTS = [
  {
    id: 'mug',
    seller: 'artisan_clay_co',
    emoji: '☕',
    hue: 'linear-gradient(135deg, #d9b38c, #8a5a3b)',
    verdict: 'mass', // it is mass-produced, not handmade
  },
  {
    id: 'novapad',
    seller: 'novapad_x_deals',
    emoji: '📱',
    hue: 'linear-gradient(135deg, #7a2ce0, #2b6bff)',
    verdict: 'ai', // the image is AI-generated / fake
  },
  {
    id: 'cupcakes',
    seller: 'cornerst_bakery',
    emoji: '🧁',
    hue: 'linear-gradient(135deg, #ff9fbf, #ffd36b)',
    verdict: 'legit', // this one is real
  },
]

/* The three classification option values (labels come from i18n). */
const CLASSIFY_OPTIONS = ['mass', 'ai', 'legit']

export default function InfluencerAvenue({ node }) {
  const { completeRoom, addItem, addEvidence, hasItem } = useGame()
  const t = useT()

  const [stage, setStage] = useState('label') // 'label' → 'verify' → solved
  const [solved, setSolved] = useState(false)

  /* i18n content arrays, index-aligned with POSTS / PRODUCTS. */
  const postCopy = t('rooms.influencer.posts')
  const productCopy = t('rooms.influencer.products')

  /* ---- Stage 1 state ---- */
  const [placed, setPlaced] = useState({}) // postId -> placed label value
  const [decoderOpen, setDecoderOpen] = useState(false)

  /* Emoji sticky-notes: generated from the correct label via encodeWord. */
  const notes = useMemo(
    () => POSTS.map((p) => ({ id: p.id, emojis: encodeWord(p.correctLabel) })),
    []
  )

  /* Assign (or replace) the label stamped onto a post. Chips are reusable,
     so this never consumes them. Advance once all three are correct. */
  function assign(postId, label) {
    setPlaced((prev) => {
      const next = { ...prev, [postId]: label }
      if (POSTS.every((p) => next[p.id] === p.correctLabel)) {
        // small beat so the green feedback registers before advancing
        setTimeout(() => setStage('verify'), 650)
      }
      return next
    })
  }

  /* ---- Stage 2 state ---- */
  const [searched, setSearched] = useState({}) // productId -> true once searched
  const [picks, setPicks] = useState({}) // productId -> chosen verdict value
  const [verifyErr, setVerifyErr] = useState('')

  function runSearch(id) {
    setSearched((s) => ({ ...s, [id]: true }))
  }

  function pick(id, value) {
    setVerifyErr('')
    setPicks((p) => ({ ...p, [id]: value }))
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
      onContinue={() => completeRoom(node.id)}
    >
      {/* ============================ STAGE 1 ============================ */}
      {stage === 'label' && (
        <div className="ia-stage fade-in">
          <div className="ia-head">
            <span className="chip">{t('rooms.influencer.stage1.badge')}</span>
            <span className="chip warn">{t('rooms.influencer.stage1.tag')}</span>
            <p className="ia-prompt">
              {t('rooms.influencer.stage1.prompt', {
                paid: t('rooms.influencer.labels.paid'),
                collab: t('rooms.influencer.labels.collab'),
                gifted: t('rooms.influencer.labels.gifted'),
              })}
            </p>
            <button className="btn btn-purple btn-sm" onClick={() => setDecoderOpen(true)}>
              {t('rooms.influencer.stage1.openDecoder')}
            </button>
          </div>

          <div className="ia-posts">
            {POSTS.map((p, idx) => {
              const note = notes.find((n) => n.id === p.id)
              const copy = postCopy[idx]
              const label = placed[p.id]
              const correct = label === p.correctLabel
              const state = !label ? '' : correct ? 'ok' : 'bad'
              return (
                <div key={p.id} className={`ia-post ${state === 'ok' ? 'solved' : ''}`}>
                  {/* Social card header */}
                  <div className="ia-card-top">
                    <div className="ia-avatar" style={{ background: p.hue }}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="ia-id">
                      <div className="ia-name">
                        {p.name}
                        {p.verified && (
                          <span className="ia-verified" title={t('rooms.influencer.stage1.verified')}>✓</span>
                        )}
                      </div>
                      <div className="ia-handle t-xs dim">
                        {p.handle} · {p.followers} {t('rooms.influencer.stage1.followersSuffix')}
                      </div>
                    </div>
                  </div>

                  <div className="ia-photo" style={{ background: p.hue }}>
                    <span className="ia-photo-tag mono">{copy.product}</span>
                    <span className="ia-stats t-xs">❤️ {p.likes} · 💬 {p.comments}</span>
                  </div>

                  <div className="ia-caption t-xs">{copy.caption}</div>

                  {/* Emoji sticky-note to decode */}
                  <div className="ia-note">
                    <div className="ia-note-tape" />
                    <div className="ia-note-emojis">
                      {note.emojis.map((e, i) => (
                        <span key={i}>{e}</span>
                      ))}
                    </div>
                    <div className="ia-note-cap t-xs">{t('rooms.influencer.stage1.decodeMe')}</div>
                  </div>

                  {/* Drop target for the decoded label */}
                  <DropZone
                    id={`post-${p.id}`}
                    accept={['label']}
                    overClassName="is-over"
                    className={`ia-drop ${state}`}
                    onDrop={(data) => assign(p.id, data.label)}
                  >
                    {label ? (
                      <span className="ia-drop-label">
                        {state === 'ok' ? '✓ ' : '✗ '}
                        {t(`rooms.influencer.labels.${LABEL_KEY[label]}`)}
                      </span>
                    ) : (
                      <span className="ia-drop-ph t-sm">{t('rooms.influencer.stage1.dropPlaceholder')}</span>
                    )}
                  </DropZone>
                </div>
              )
            })}
          </div>

          {/* Reusable label chips tray */}
          <div className="ia-tray">
            <span className="ia-tray-title t-xs upper dim">{t('rooms.influencer.stage1.trayTitle')}</span>
            <div className="ia-chips">
              {LABELS.map((w) => (
                <Draggable key={w} id={`label-${w}`} kind="label" data={{ label: w }}>
                  <span className="ia-chip">{t(`rooms.influencer.labels.${LABEL_KEY[w]}`)}</span>
                </Draggable>
              ))}
            </div>
            <span className="dim t-xs ia-tray-hint">{t('rooms.influencer.stage1.hint')}</span>
          </div>
        </div>
      )}

      {/* ============================ STAGE 2 ============================ */}
      {stage === 'verify' && (
        <div className="ia-stage fade-in">
          <div className="ia-head">
            <span className="chip ok">{t('rooms.influencer.stage2.stage1Cleared')}</span>
            <span className="chip">{t('rooms.influencer.stage2.badge')}</span>
            <span className="chip warn">{t('rooms.influencer.stage2.tag')}</span>
            <p className="ia-prompt">{t('rooms.influencer.stage2.prompt')}</p>
          </div>

          <div className="ia-products">
            {PRODUCTS.map((p, idx) => {
              const done = !!searched[p.id]
              const copy = productCopy[idx]
              return (
                <div key={p.id} className={`ia-product ${done ? 'searched' : ''}`}>
                  <div className="ia-prod-photo" style={{ background: p.hue }}>
                    <span className="ia-prod-emoji">{p.emoji}</span>
                    <span className="ia-prod-seller mono t-xs">{p.seller}</span>
                  </div>
                  <div className="ia-prod-name t-sm">{copy.name}</div>

                  {!done ? (
                    <button className="btn btn-purple btn-sm" onClick={() => runSearch(p.id)}>
                      {t('rooms.influencer.stage2.runSearch')}
                    </button>
                  ) : (
                    <>
                      <div className="ia-prod-result">
                        <div className="t-xs upper dim">{t('rooms.influencer.stage2.resultTitle')}</div>
                        <div className="t-xs">{copy.result}</div>
                        <div className="t-xs dim ia-prod-hint">{copy.hint}</div>
                      </div>

                      {/* Segmented control — classify the product */}
                      <div className="ia-segments">
                        {CLASSIFY_OPTIONS.map((value) => (
                          <button
                            key={value}
                            className={`ia-seg ${picks[p.id] === value ? 'on' : ''}`}
                            onClick={() => pick(p.id, value)}
                          >
                            {t(`rooms.influencer.classify.${value}`)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="ia-actions">
            {verifyErr
              ? <div className="banner wrong shake ia-banner">{verifyErr}</div>
              : <span className="dim t-sm">{t('rooms.influencer.stage2.hint')}</span>}
            <button className="btn btn-purple" onClick={submitVerify}>
              {t('rooms.influencer.stage2.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* -------- Emoji Decoding Card (reusable Modal) -------- */}
      <Modal
        open={decoderOpen}
        onClose={() => setDecoderOpen(false)}
        title={t('rooms.influencer.decoder.title')}
        accent="purple"
        width={520}
      >
        {!hasItem('emojiCard') && (
          <div className="banner info t-sm" style={{ marginBottom: 14 }}>
            {t('rooms.influencer.decoder.noCard')}
          </div>
        )}
        <p className="t-sm dim" style={{ marginTop: 0 }}>
          {t('rooms.influencer.decoder.help')}
        </p>
        <div className="ia-key-grid">
          {Object.entries(EMOJI_KEY).map(([emoji, letter]) => (
            <div key={letter} className="ia-key-cell">
              <span className="ia-key-emoji">{emoji}</span>
              <span className="ia-key-letter mono">{letter}</span>
            </div>
          ))}
        </div>
      </Modal>
    </RoomFrame>
  )
}
