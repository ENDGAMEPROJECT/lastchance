import { useMemo, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { CODES, NARRATIVE } from '../game/gameData.js'
import { useT } from '../i18n/index.jsx'
import RoomFrame from '../components/RoomFrame.jsx'
import RoomNav from '../components/RoomNav.jsx'
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

/* The tray: the four tiles that complete the rows above, plus a couple of
   distractors that fit nowhere (so it isn't just process-of-elimination).
   Labels live in i18n (rooms.algorithm.tiles.<id>); ids stay stable for
   correctness matching. */
const TRAY = [
  { id: 't-skin', icon: '🫣' }, // Insecure about her skin (demographic? no — insecurity)
  { id: 't-boy', icon: '👦' }, // Boy, 15–25 (demographic)
  { id: 't-bald', icon: '🧑‍🦲' }, // Worried about going bald (insecurity)
  { id: 't-diet', icon: '🥗' }, // Follows diet & lifestyle pages (follows)
  // distractors — plausible data points that match no equation
  { id: 't-pets', icon: '🐶' }, // Follows pet accounts
  { id: 't-retiree', icon: '🧓' }, // Retired, 65+
]

/* Three factor columns; headings come from i18n (rooms.algorithm.cols). */
const COL_COUNT = 3

export default function AlgorithmRoom({ node }) {
  const { completeRoom, addEvidence } = useGame()
  const t = useT()
  const [phase, setPhase] = useState('unlock') // 'unlock' | 'choice' | 'equations'
  const [solved, setSolved] = useState(false)

  /* ----- phase 'unlock' state ----- */
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState(false)

  /* ----- phase 'choice' state ----- */
  const [choice, setChoice] = useState(null) // 'A' | 'B' | null

  /* ----- phase 'equations' state ----- */
  // placements: rowId -> tileId dropped into that row's blank slot.
  const [placements, setPlacements] = useState({})
  // Feedback is withheld until the player runs the whole algorithm.
  const [checked, setChecked] = useState(false)
  // Which control-room station is in view (0 mainframe, 1 data wall, 2 terminal).
  const [view, setView] = useState(0)

  const tileById = useMemo(() => Object.fromEntries(TRAY.map((tile) => [tile.id, tile])), [])

  /* ---- unlock handlers ---- */
  function submitCode() {
    if (code === CODES.algorithmRoom) {
      setCodeErr(false)
      setPhase('choice')
    } else {
      setCodeErr(true)
    }
  }

  /* ---- equations helpers ---- */
  const blankSlot = (row) => row.slots.find((s) => s.blank)
  const rowSolved = (row) => placements[row.id] === blankSlot(row).tileId

  // A tile is "used" once placed in any slot, so it leaves the tray.
  const usedTileIds = useMemo(
    () => new Set(Object.values(placements)),
    [placements]
  )
  const allFilled = ROWS.every((row) => placements[row.id]) // every blank slot filled
  const allRowsSolved = ROWS.every(rowSolved)

  // A tile dropped into a row's blank slot. No correctness feedback here —
  // any tile can be placed; the player fills every slot, then runs the
  // algorithm to see which rows are right. If the tile was already in
  // another slot, it moves. Placing/removing clears prior feedback.
  function placeTile(row, tileId) {
    setChecked(false)
    setPlacements((p) => {
      const next = {}
      for (const [rid, tid] of Object.entries(p)) if (tid !== tileId) next[rid] = tid
      next[row.id] = tileId
      return next
    })
  }

  // Return a placed tile back to the tray (drag it out or click the slot).
  function clearSlot(rowId) {
    setChecked(false)
    setPlacements((p) => {
      const next = { ...p }
      delete next[rowId]
      return next
    })
  }

  // Run the algorithm: reveal feedback only now, once every slot is filled.
  // A clean run auto-pans to the Ad Terminal to show the profile it fires.
  function runCheck() {
    if (!allFilled) return
    setChecked(true)
    if (ROWS.every(rowSolved)) setView(2)
  }

  // Fires exactly once, when the player logs the evidence after a clean run.
  function finish() {
    addEvidence({
      id: 'ev-algo',
      label: t('rooms.algorithm.evidence', { friend: NARRATIVE.friend }),
    })
    setSolved(true)
  }

  return (
    <RoomFrame
      node={node}
      bgImage="/bg/algorithm.png"
      intro={t('rooms.algorithm.intro')}
      solved={solved}
      solvedTitle={t('rooms.algorithm.solvedTitle')}
      solvedText={t('rooms.algorithm.solvedText', { friend: NARRATIVE.friend })}
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

      {/* ================= PHASE: EQUATIONS (control room) ================= */}
      {phase === 'equations' && (
        <div className="ar-eq fade-in">
          <div className="ar-eq-head">
            <span className="chip">{t('rooms.algorithm.equations.badge')}</span>
            <span className="dim t-xs">{t('rooms.algorithm.equations.navHint')}</span>
          </div>

          <RoomNav
            accent="cyan"
            index={view}
            onChange={setView}
            views={[
              /* ---------- Station 1 · Mainframe (the puzzle) ---------- */
              {
                id: 'mainframe',
                icon: '🖥️',
                label: t('rooms.algorithm.equations.navMainframe'),
                content: (
                  <div className="ar-station ar-mainframe scene-scroll">
                    <p className="ar-prompt ar-mini-prompt">{t('rooms.algorithm.equations.prompt')}</p>

                    <div className="ar-eq-cols">
                      {Array.from({ length: COL_COUNT }).map((_, i) => (
                        <span key={i} className="ar-col-head">{t('rooms.algorithm.cols')[i]}</span>
                      ))}
                      <span className="ar-col-head result">{t('rooms.algorithm.equations.resultCol')}</span>
                    </div>

                    <div className="ar-eq-rows">
                      {ROWS.map((row) => {
                        const placedId = placements[row.id]
                        const placed = placedId ? tileById[placedId] : null
                        const done = checked && rowSolved(row)
                        const wrong = checked && placedId && !rowSolved(row)
                        return (
                          <div key={row.id} className={`ar-row ${done ? 'done' : ''} ${wrong ? 'wrong' : ''}`}>
                            {row.slots.map((slot, i) => (
                              <div key={slot.col} className="ar-slot-wrap">
                                {slot.blank ? (
                                  <DropZone
                                    id={`slot-${row.id}`}
                                    accept={['tile']}
                                    className={`ar-tile slot ${placed ? 'filled' : 'empty'}`}
                                    overClassName="is-over"
                                    onDrop={(data) => placeTile(row, data.tileId)}
                                  >
                                    {placed ? (
                                      <Draggable
                                        id={`placed-${row.id}`}
                                        kind="tile"
                                        data={{ tileId: placed.id }}
                                        className="ar-tile-inner"
                                        onClick={() => clearSlot(row.id)}
                                      >
                                        <span className="ar-tile-icon">{placed.icon}</span>
                                        <span className="ar-tile-label">{t(`rooms.algorithm.tiles.${placed.id}`)}</span>
                                      </Draggable>
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
                                {i < row.slots.length - 1 && <span className="ar-op">+</span>}
                              </div>
                            ))}

                            <span className="ar-op eq">=</span>

                            <div className={`ar-ad ${done ? 'active' : ''}`}>
                              <span className="ar-ad-icon">{row.ad.icon}</span>
                              <span className="ar-ad-label">{t(`rooms.algorithm.rows.${row.id}.ad`)}</span>
                              {done && <span className="ar-ad-flag">{t('rooms.algorithm.equations.adFlag')}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="ar-tray">
                      <div className="ar-tray-label mono t-xs dim">{t('rooms.algorithm.equations.trayLabel')}</div>
                      <div className="ar-tray-tiles">
                        {TRAY.map((tile) => {
                          if (usedTileIds.has(tile.id)) return null
                          return (
                            <Draggable
                              key={tile.id}
                              id={`tile-${tile.id}`}
                              kind="tile"
                              data={{ tileId: tile.id }}
                              className="ar-tile tray"
                            >
                              <span className="ar-tile-icon">{tile.icon}</span>
                              <span className="ar-tile-label">{t(`rooms.algorithm.tiles.${tile.id}`)}</span>
                            </Draggable>
                          )
                        })}
                      </div>
                    </div>

                    {!(checked && allRowsSolved) && (
                      <div className="ar-run">
                        {checked && !allRowsSolved && (
                          <div className="banner wrong ar-run-banner">{t('rooms.algorithm.equations.wrongBanner')}</div>
                        )}
                        <button className="btn btn-cyan btn-lg" onClick={runCheck} disabled={!allFilled}>
                          {t('rooms.algorithm.equations.runBtn')}
                        </button>
                        {!allFilled && <span className="dim t-xs">{t('rooms.algorithm.equations.fillHint')}</span>}
                      </div>
                    )}
                  </div>
                ),
              },

              /* ---------- Station 2 · Data Wall (atmosphere + lesson) ---------- */
              {
                id: 'datawall',
                icon: '📡',
                label: t('rooms.algorithm.equations.navDataWall'),
                content: (
                  <div className="ar-station ar-datawall scene-scroll">
                    <div className="ar-dw-panel panel clip panel-glow-cyan">
                      <div className="ar-dw-title">{t('rooms.algorithm.equations.dataWallTitle')}</div>
                      <div className="ar-dw-sub muted t-sm">
                        {t('rooms.algorithm.equations.dataWallSub', { friend: NARRATIVE.friend })}
                      </div>
                      <ul className="ar-dw-feed">
                        {t('rooms.algorithm.equations.dataWallFeed').map((line, i) => (
                          <li key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                            <span className="ar-dw-dot" />{line}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="learn ar-dw-learn">
                      <b>{t('rooms.algorithm.equations.learnTitle')}</b>
                      {t('rooms.algorithm.equations.learnBefore')}
                      <i>{t('rooms.algorithm.equations.learnItalic')}</i>
                      {t('rooms.algorithm.equations.learnAfter')}
                    </div>
                  </div>
                ),
              },

              /* ---------- Station 3 · Ad Terminal (output) ---------- */
              {
                id: 'terminal',
                icon: '📺',
                label: t('rooms.algorithm.equations.navTerminal'),
                content: (
                  <div className="ar-station ar-adterminal scene-scroll">
                    <div className="ar-term-screen panel clip panel-glow-cyan">
                      <div className="ar-dw-title">{t('rooms.algorithm.equations.terminalTitle')}</div>
                      {checked && allRowsSolved ? (
                        <div className="ar-reveal fade-in">
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
                          {!solved && (
                            <button className="btn btn-green btn-lg" onClick={finish}>
                              {t('rooms.algorithm.equations.logEvidence')}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="ar-term-idle muted">{t('rooms.algorithm.equations.terminalIdle')}</p>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </RoomFrame>
  )
}
