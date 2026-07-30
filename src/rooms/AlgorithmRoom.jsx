import { Fragment, useMemo, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { CODES, ITEMS, NARRATIVE } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'
import { playSound } from '../game/sound.js'
import { useT } from '../i18n/index.jsx'
import RoomFrame from '../components/RoomFrame.jsx'
import { Draggable, DropZone } from '../components/dnd/Dnd.jsx'
import './AlgorithmRoom.css'

/* PUZZLE 3 — Personalization / the targeting algorithm.
   Three phases, driven by `phase` state:
     'unlock'    → type the 6-digit code off the Data Report.
     'choice'    → the privacy trade-off (personalised ads vs. your data).
     'equations' → the core puzzle: a giant computer solving "targeting
                   equations". Each row combines age + interests + behaviour
                   to output a hand-picked ad. The player fills one blank
                   slot per row from a shared tray.
   Reward: evidence that Max's ad was chosen by an algorithm using his
   age, interests and insecurities. */

/* ---- Phase 'equations' content ------------------------------------------
   Every row has three factor slots and a target ad. Exactly ONE slot per
   row is left blank (`blank: true`) and must be filled from the tray. The
   `tileId` on a blank slot is the id of the tile that correctly fills it. */
/* Columns, in order: 0 = Demographic, 1 = Follows / likes, 2 = Insecurity.
   Each row combines a person's demographic + what they follow + an
   insecurity, which the algorithm turns into an insecurity-exploiting ad. */
const ROWS = [
  {
    id: 'r1',
    ad: { icon: '🧴' }, // Miracle skincare cream
    slots: [
      { col: 0, icon: '👧' }, // Girl, 13–17
      { col: 1, icon: '💄' }, // Follows beauty influencers
      { col: 2, blank: true, tileId: 't-skin' }, // Insecure about her skin
    ],
  },
  {
    id: 'r2',
    ad: { icon: '🥤' }, // Muscle-gain supplement
    slots: [
      { col: 0, blank: true, tileId: 't-boy' }, // Boy, 15–25
      { col: 1, icon: '🏋️' }, // Follows fitness influencers
      { col: 2, icon: '🦴' }, // Insecure about being skinny
    ],
  },
  {
    id: 'r3',
    ad: { icon: '💊' }, // Baldness cream
    slots: [
      { col: 0, icon: '🧑' }, // Man, 25–35
      { col: 1, icon: '💻' }, // Follows tech channels
      { col: 2, blank: true, tileId: 't-bald' }, // Worried about going bald
    ],
  },
  {
    id: 'r4',
    ad: { icon: '⚖️' }, // Weight-loss pills
    slots: [
      { col: 0, icon: '👩' }, // Woman, 30–45
      { col: 1, blank: true, tileId: 't-diet' }, // Follows diet & lifestyle pages
      { col: 2, icon: '😟' }, // Insecure about her weight
    ],
  },
]

/* The tile pool. Each tile has a `kind` matching one of the three factor
   columns (demographic / follows / insecurity). Per equation, the options are
   drawn from the SAME kind as the blank, so the player must pick the RIGHT
   insecurity/demographic/follow for this exact person — not just the right
   type. Labels live in i18n (rooms.algorithm.tiles.<id>); ids stay stable for
   correctness matching. The four "correct" tiles complete the rows above. */
const TRAY = [
  // ---- correct tiles (one completes each row's blank) ----
  { id: 't-skin', icon: '🫣', kind: 'insecurity' },
  { id: 't-boy', icon: '👦', kind: 'demographic' },
  { id: 't-bald', icon: '🧑‍🦲', kind: 'insecurity' },
  { id: 't-diet', icon: '🥗', kind: 'follows' },
  // ---- demographic distractors ----
  { id: 't-retiree', icon: '🧓', kind: 'demographic' },
  { id: 't-tween', icon: '🧒', kind: 'demographic' },
  { id: 't-gran', icon: '👵', kind: 'demographic' },
  { id: 't-dad', icon: '🧔', kind: 'demographic' },
  // ---- follows distractors ----
  { id: 't-pets', icon: '🐶', kind: 'follows' },
  { id: 't-gamer', icon: '🎮', kind: 'follows' },
  { id: 't-cook', icon: '🍳', kind: 'follows' },
  { id: 't-travel', icon: '✈️', kind: 'follows' },
  // ---- insecurity distractors ----
  { id: 't-money', icon: '💸', kind: 'insecurity' },
  { id: 't-lonely', icon: '😔', kind: 'insecurity' },
  { id: 't-height', icon: '📏', kind: 'insecurity' },
  { id: 't-teeth', icon: '😬', kind: 'insecurity' },
]

/* Column index → tile kind (matches the `cols` i18n order). */
const COL_KIND = ['demographic', 'follows', 'insecurity']

export default function AlgorithmRoom({ node }) {
  const { completeRoom, addEvidence, addItem } = useGame()
  const t = useT()
  const [phase, setPhase] = useState('unlock') // 'unlock' | 'choice' | 'equations'
  const [solved, setSolved] = useState(false)

  /* ----- phase 'unlock' state ----- */
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState(false)

  /* ----- phase 'choice' state ----- */
  const [choice, setChoice] = useState(null) // 'A' | 'B' | null

  /* ----- phase 'equations' state (one equation at a time) ----- */
  const [step, setStep] = useState(0) // current equation index; ROWS.length = the profile
  const [placements, setPlacements] = useState({}) // rowId -> tileId placed in its blank slot
  const [wrongFlash, setWrongFlash] = useState(false) // transient wrong-tile feedback

  const tileById = useMemo(() => Object.fromEntries(TRAY.map((tile) => [tile.id, tile])), [])
  const blankSlot = (row) => row.slots.find((s) => s.blank)

  /* Per-equation options: the correct tile + up to four SAME-CATEGORY
     distractors, arranged deterministically so the answer isn't always in the
     same spot and it isn't pure process-of-elimination. */
  const OPTIONS_BY_ROW = useMemo(() => {
    const OPTION_TOTAL = 5
    const map = {}
    ROWS.forEach((row, i) => {
      const blank = row.slots.find((s) => s.blank)
      const kind = COL_KIND[blank.col]
      const correct = blank.tileId
      const pool = TRAY.filter((tl) => tl.kind === kind && tl.id !== correct).map((tl) => tl.id)
      const k = i % pool.length
      const rotated = pool.slice(k).concat(pool.slice(0, k))
      const opts = [correct, ...rotated.slice(0, OPTION_TOTAL - 1)]
      // vary where the correct answer sits
      if (i % 2 === 0) opts.reverse()
      else { const c = opts.shift(); opts.splice(Math.min(2, opts.length), 0, c) }
      map[row.id] = opts
    })
    return map
  }, [])

  /* ---- unlock handlers ---- */
  function submitCode() {
    if (code === CODES.algorithmRoom) {
      setCodeErr(false)
      setPhase('choice')
    } else {
      playSound('wrong.mp3')
      setCodeErr(true)
    }
  }

  /* ---- equations helpers ---- */
  // Drop a tile into the current equation's blank: correct → it locks in and the
  // reflection unlocks; wrong → a red flash + a nudge (tile stays in the tray).
  function handleDrop(row, tileId) {
    if (tileId === blankSlot(row).tileId) {
      setWrongFlash(false)
      setPlacements((p) => ({ ...p, [row.id]: tileId }))
    } else {
      playSound('wrong.mp3')
      setWrongFlash(true)
      window.setTimeout(() => setWrongFlash(false), 1200)
    }
  }
  function nextEquation() {
    setWrongFlash(false)
    setStep((s) => s + 1)
  }

  // Fires exactly once, when the player logs the evidence after a clean run.
  function finish() {
    addEvidence({
      id: 'ev-algo',
      label: t('rooms.algorithm.evidence', { friend: NARRATIVE.friend }),
    })
    // Reward: the Truth Flashlight the player will need in the Ads Corridor.
    addItem(ITEMS.truthLight)
    setSolved(true)
  }

  return (
    <RoomFrame
      node={node}
      bgImage={bgUrl('algorithm.png')}
      intro={t('rooms.algorithm.intro')}
      solved={solved}
      solvedTitle={t('rooms.algorithm.solvedTitle')}
      solvedText={t('rooms.algorithm.solvedText', { friend: NARRATIVE.friend })}
      reward={ITEMS.truthLight}
      onContinue={() => completeRoom(node.id)}
    >
      {/* ================= PHASE: UNLOCK ================= */}
      {phase === 'unlock' && (
        <div className="ar-unlock fade-in">
          <div className="ar-terminal panel clip panel-glow-cyan">
            <div className="ar-term-head">
              <span className="chip">{t('rooms.algorithm.unlock.badge')}</span>
              <span className="ar-dots"><i /><i /><i /></span>
            </div>

            <p className="ar-term-prompt">
              {t('rooms.algorithm.unlock.prompt')}
            </p>

            {/* six-cell display of the code so far */}
            <div className={`ar-code-display ${codeErr ? 'shake' : ''}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className={`ar-cell ${code[i] ? 'filled' : ''}`}>
                  {code[i] || ''}
                </span>
              ))}
            </div>

            {/* keypad */}
            <div className="ar-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  className={`ar-key ${k === 'C' || k === '⌫' ? 'alt' : ''}`}
                  onClick={() => {
                    setCodeErr(false)
                    if (k === 'C') setCode('')
                    else if (k === '⌫') setCode((c) => c.slice(0, -1))
                    else if (code.length < 6) setCode((c) => c + k)
                  }}
                >
                  {k}
                </button>
              ))}
            </div>

            {codeErr && <div className="banner wrong shake">{t('rooms.algorithm.unlock.error')}</div>}

            <div className="ar-unlock-actions">
              <button className="btn btn-cyan" onClick={submitCode} disabled={code.length !== 6}>
                {t('rooms.algorithm.unlock.submit')}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPhase('choice')}
              >
                {t('rooms.algorithm.unlock.skip')}
              </button>
            </div>

            <p className="ar-hint t-xs dim">{t('rooms.algorithm.unlock.hint')}</p>
          </div>
        </div>
      )}

      {/* ================= PHASE: CHOICE ================= */}
      {phase === 'choice' && (
        <div className="ar-choice fade-in">
          <div className="ar-choice-head">
            <span className="chip warn">{t('rooms.algorithm.choice.badge')}</span>
            <p className="ar-prompt">
              {t('rooms.algorithm.choice.prompt')}
            </p>
          </div>

          <div className="ar-options">
            <button
              className={`ar-option ${choice === 'A' ? 'picked' : ''}`}
              onClick={() => setChoice('A')}
            >
              <div className="ar-opt-tag">{t('rooms.algorithm.choice.optionATag')}</div>
              <div className="ar-opt-icon">🎯</div>
              <div className="ar-opt-text">
                {t('rooms.algorithm.choice.optionABefore')}
                <b>{t('rooms.algorithm.choice.optionABold')}</b>
                {t('rooms.algorithm.choice.optionAAfter')}
              </div>
            </button>

            <button
              className={`ar-option ${choice === 'B' ? 'picked' : ''}`}
              onClick={() => setChoice('B')}
            >
              <div className="ar-opt-tag">{t('rooms.algorithm.choice.optionBTag')}</div>
              <div className="ar-opt-icon">🛡️</div>
              <div className="ar-opt-text">
                {t('rooms.algorithm.choice.optionBBefore')}
                <b>{t('rooms.algorithm.choice.optionBBold')}</b>
                {t('rooms.algorithm.choice.optionBAfter')}
              </div>
            </button>
          </div>

          {/* verdict banner */}
          {choice === 'A' && (
            <div className="banner wrong fade-in">
              <b>{t('rooms.algorithm.choice.wrongTitle')}</b> {t('rooms.algorithm.choice.wrongText')}
            </div>
          )}
          {choice === 'B' && (
            <div className="banner correct fade-in">
              <b>{t('rooms.algorithm.choice.goodTitle')}</b> {t('rooms.algorithm.choice.goodText')}
            </div>
          )}

          {choice && (
            <div className="ar-choice-actions fade-in">
              <span className="dim t-sm">
                {t('rooms.algorithm.choice.afterNote')}
              </span>
              <button className="btn btn-cyan" onClick={() => setPhase('equations')}>
                {t('rooms.algorithm.choice.continue')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= PHASE: EQUATIONS (one at a time) ================= */}
      {phase === 'equations' && (
        <div className="ar-eq fade-in">
          <div className="ar-eq-head">
            <span className="chip">{t('rooms.algorithm.equations.badge')}</span>
            <span className="ar-step-badge mono">
              {step < ROWS.length
                ? t('rooms.algorithm.equations.stepBadge', { n: step + 1, total: ROWS.length })
                : t('rooms.algorithm.equations.profileBadge')}
            </span>
          </div>

          {step < ROWS.length ? (() => {
            const row = ROWS[step]
            const placedId = placements[row.id]
            const placed = placedId ? tileById[placedId] : null
            const stepSolved = placedId === blankSlot(row).tileId
            return (
              <div className="ar-step scene-scroll">
                <p className="ar-prompt ar-mini-prompt">{t('rooms.algorithm.equations.prompt')}</p>

                {/* The single equation */}
                <div className={`ar-equation ${stepSolved ? 'solved' : ''} ${wrongFlash ? 'wrong' : ''}`}>
                  {row.slots.map((slot, i) => (
                    <Fragment key={slot.col}>
                      <div className="ar-slot-wrap">
                        <span className="ar-col-tag t-xs dim">{t('rooms.algorithm.cols')[slot.col]}</span>
                        {slot.blank ? (
                          <DropZone
                            id={`slot-${row.id}`}
                            accept={['tile']}
                            className={`ar-tile slot ${placed ? 'filled' : 'empty'}`}
                            overClassName="is-over"
                            onDrop={(data) => handleDrop(row, data.tileId)}
                          >
                            {placed ? (
                              <span className="ar-tile-inner">
                                <span className="ar-tile-icon">{placed.icon}</span>
                                <span className="ar-tile-label">{t(`rooms.algorithm.tiles.${placed.id}`)}</span>
                              </span>
                            ) : (
                              <span className="ar-slot-ph">{t('rooms.algorithm.equations.slotPlaceholder')}</span>
                            )}
                          </DropZone>
                        ) : (
                          <div className="ar-tile locked">
                            <span className="ar-tile-icon">{slot.icon}</span>
                            <span className="ar-tile-label">{t(`rooms.algorithm.rows.${row.id}.slots.${slot.col}`)}</span>
                          </div>
                        )}
                      </div>
                      {i < row.slots.length - 1 && <span className="ar-op">+</span>}
                    </Fragment>
                  ))}

                  <span className="ar-op eq">=</span>

                  <div className={`ar-ad ${stepSolved ? 'active' : ''}`}>
                    <span className="ar-ad-icon">{row.ad.icon}</span>
                    <span className="ar-ad-label">{t(`rooms.algorithm.rows.${row.id}.ad`)}</span>
                    {stepSolved && <span className="ar-ad-flag">{t('rooms.algorithm.equations.adFlag')}</span>}
                  </div>
                </div>

                {!stepSolved ? (
                  <div className="ar-opts">
                    <div className="ar-opts-hint dim t-sm">{t('rooms.algorithm.equations.dragHint')}</div>
                    <div className="ar-opts-tiles">
                      {OPTIONS_BY_ROW[row.id].map((id) => (
                        <Draggable
                          key={id}
                          id={`opt-${id}`}
                          kind="tile"
                          data={{ tileId: id }}
                          className="ar-tile tray"
                        >
                          <span className="ar-tile-icon">{tileById[id].icon}</span>
                          <span className="ar-tile-label">{t(`rooms.algorithm.tiles.${id}`)}</span>
                        </Draggable>
                      ))}
                    </div>
                    {wrongFlash && <div className="banner wrong shake ar-wrong">{t('rooms.algorithm.equations.wrongHint')}</div>}
                  </div>
                ) : (
                  <div className="ar-reflection panel clip panel-glow-cyan fade-in">
                    <div className="ar-reflect-title">{t('rooms.algorithm.equations.reflectTitle')}</div>
                    <p className="ar-reflect-text">{t(`rooms.algorithm.rows.${row.id}.explain`, { friend: NARRATIVE.friend })}</p>
                    <button className="btn btn-cyan" onClick={nextEquation}>
                      {step < ROWS.length - 1
                        ? t('rooms.algorithm.equations.nextBtn')
                        : t('rooms.algorithm.equations.lastBtn', { friend: NARRATIVE.friend })}
                    </button>
                  </div>
                )}
              </div>
            )
          })() : (
            /* ---------- Final: the reconstructed profile + the lesson ---------- */
            <div className="ar-final scene-scroll fade-in">
              <div className="ar-term-screen panel clip panel-glow-cyan">
                <div className="ar-dw-title">{t('rooms.algorithm.equations.terminalTitle')}</div>
                <div className="ar-profile">
                  <div className="ar-profile-title">{t('rooms.algorithm.equations.profileTitle')}</div>
                  <p>
                    {t('rooms.algorithm.equations.profileP1')}
                    <b>{t('rooms.algorithm.equations.profileB1', { friend: NARRATIVE.friend })}</b>
                    {t('rooms.algorithm.equations.profileP2')}
                    <b>{t('rooms.algorithm.equations.profileB2')}</b>
                    {t('rooms.algorithm.equations.profileP3')}
                    <b>{t('rooms.algorithm.equations.profileB3')}</b>
                    {t('rooms.algorithm.equations.profileP4', { friend: NARRATIVE.friend })}
                  </p>
                </div>
                <div className="learn ar-dw-learn">
                  <b>{t('rooms.algorithm.equations.learnTitle')}</b>
                  {t('rooms.algorithm.equations.learnBefore')}
                  <i>{t('rooms.algorithm.equations.learnItalic')}</i>
                  {t('rooms.algorithm.equations.learnAfter')}
                </div>
                {!solved && (
                  <button className="btn btn-green btn-lg" onClick={finish}>
                    {t('rooms.algorithm.equations.logEvidence')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </RoomFrame>
  )
}
