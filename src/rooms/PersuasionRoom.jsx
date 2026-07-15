import { useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { CODES } from '../game/gameData.js'
import RoomFrame from '../components/RoomFrame.jsx'
import { Draggable, DropZone } from '../components/dnd/Dnd.jsx'
import './PersuasionRoom.css'

/* PUZZLE 4 — Persuasion Lab (drag-and-drop scene version).
   A gallery of ad posters, each leaning on ONE named persuasion
   technique. The player DRAGS a labelled translucent "frame"
   (technique name) from the tray onto the ad it matches. A correct
   drop snaps the frame over the poster and reveals a hidden LETTER;
   a wrong drop flashes the poster red and returns the frame. Read in
   poster order the letters spell a password — FOOLED — typed into a
   terminal to unlock the exit.

   Two phases via `phase`:  'match' → 'password' → solved. */

/* The six posters, in fixed display order. The hidden letters read
   top-to-bottom (poster 1..6) spell CODES.persuasion = "FOOLED".
   Structural only — headline/sub/technique text lives in i18n
   (rooms.persuasion.posters[i], rooms.persuasion.techniques[id]). */
const POSTERS = [
  { id: 'fomo', letter: 'F', emoji: '⚡', tint: 'red' },
  { id: 'social', letter: 'O', emoji: '🌟', tint: 'cyan' },
  { id: 'exagg', letter: 'O', emoji: '🔥', tint: 'amber' },
  { id: 'influencer', letter: 'L', emoji: '💄', tint: 'purple' },
  { id: 'emotional', letter: 'E', emoji: '😢', tint: 'magenta' },
  { id: 'urgency', letter: 'D', emoji: '⏰', tint: 'green' },
]

/* The draggable technique frames, in a deliberately SHUFFLED order
   (no Math.random available — this fixed scramble is intentional). */
const FRAME_ORDER = ['emotional', 'fomo', 'urgency', 'social', 'influencer', 'exagg']

export default function PersuasionRoom({ node }) {
  const { completeRoom, addEvidence } = useGame()
  const t = useT()

  const posterText = t('rooms.persuasion.posters') // array, in POSTERS order
  const posterIndex = POSTERS.reduce((m, p, i) => ((m[p.id] = i), m), {})
  const techniqueLabel = (id) => t(`rooms.persuasion.techniques.${id}`)
  const frames = FRAME_ORDER.map((id) => ({ id, technique: techniqueLabel(id) }))

  const [phase, setPhase] = useState('match') // 'match' | 'password'
  const [solved, setSolved] = useState(false)

  // Match phase state.
  const [placed, setPlaced] = useState({}) // posterId -> true once correctly framed
  const [wrongPoster, setWrongPoster] = useState(null) // posterId flashing red
  const [hint, setHint] = useState(t('rooms.persuasion.hints.start'))

  // Password phase state.
  const [entry, setEntry] = useState('')
  const [pwError, setPwError] = useState(false)

  const matchedCount = Object.keys(placed).length
  const usedFrames = new Set(Object.keys(placed)) // frame ids share poster ids

  /* A frame (data.techId) was dropped onto poster `posterId`. */
  function tryMatch(posterId, techId) {
    if (placed[posterId] || usedFrames.has(techId)) return

    if (techId === posterId) {
      // Correct match — lock the frame on, reveal the hidden letter.
      const next = { ...placed, [posterId]: true }
      setPlaced(next)
      setWrongPoster(null)

      if (Object.keys(next).length === POSTERS.length) {
        setHint(t('rooms.persuasion.hints.allDone'))
        setPhase('password')
      } else {
        setHint(t('rooms.persuasion.hints.correct'))
      }
    } else {
      // Wrong — flash the poster red; the frame stays in the tray.
      setWrongPoster(posterId)
      setHint(t('rooms.persuasion.hints.wrong'))
      window.setTimeout(() => setWrongPoster((cur) => (cur === posterId ? null : cur)), 600)
    }
  }

  /* Password terminal — validate case-insensitively against CODES. */
  function submitPassword(e) {
    e.preventDefault()
    if (entry.trim().toUpperCase() === CODES.persuasion.toUpperCase()) {
      addEvidence({
        id: 'ev-persuasion',
        label: t('rooms.persuasion.evidence'),
      })
      setSolved(true)
    } else {
      setPwError(true)
      window.setTimeout(() => setPwError(false), 500)
    }
  }

  return (
    <RoomFrame
      node={node}
      intro={t('rooms.persuasion.intro')}
      solved={solved}
      solvedTitle={t('rooms.persuasion.solvedTitle')}
      solvedText={t('rooms.persuasion.solvedText')}
      onContinue={() => completeRoom(node.id)}
    >
      {phase === 'match' && (
        <div className="pl-scene fade-in">
          {/* ---- Left rail: letter progress + technique frame tray ---- */}
          <aside className="pl-rail">
            <div className="pl-progress">
              {POSTERS.map((p) => (
                <span key={p.id} className={`pl-slot ${placed[p.id] ? 'lit' : ''}`}>
                  {placed[p.id] ? p.letter : '_'}
                </span>
              ))}
            </div>

            <div className="pl-tray">
              <span className="pl-tray-label mono">{t('rooms.persuasion.trayLabel')}</span>
              <div className="pl-chips">
                {frames.map((f) => {
                  if (usedFrames.has(f.id)) return null
                  return (
                    <Draggable
                      key={f.id}
                      id={`frame-${f.id}`}
                      kind="frame"
                      data={{ techId: f.id }}
                      className="pl-frame-drag"
                    >
                      <span className="pl-frame">
                        <span className="pl-frame-corner tl" />
                        <span className="pl-frame-corner tr" />
                        <span className="pl-frame-corner bl" />
                        <span className="pl-frame-corner br" />
                        <span className="pl-frame-label">{f.technique}</span>
                        <span className="pl-frame-note mono">{t('rooms.persuasion.dragHint')}</span>
                      </span>
                    </Draggable>
                  )
                })}
              </div>
              <div className="pl-count dim t-xs">
                {t('rooms.persuasion.count', { matched: matchedCount, total: POSTERS.length })}
              </div>
            </div>

            <p className="pl-hint mono">{hint}</p>
          </aside>

          {/* ---- Poster wall: compact 3×2 grid of drop zones ---- */}
          <div className="pl-wall">
            {POSTERS.map((p) => {
              const done = !!placed[p.id]
              const wrong = wrongPoster === p.id
              const copy = posterText[posterIndex[p.id]]
              return (
                <DropZone
                  key={p.id}
                  id={`poster-${p.id}`}
                  accept={['frame']}
                  overClassName="is-over"
                  disabled={done}
                  onDrop={(data) => tryMatch(p.id, data.techId)}
                  className={`pl-poster tint-${p.tint} ${done ? 'framed' : ''} ${wrong ? 'wrong' : ''}`}
                >
                  <div className="pl-poster-emoji">{p.emoji}</div>
                  <div className="pl-poster-head">{copy.headline}</div>
                  <div className="pl-poster-sub">{copy.sub}</div>

                  {/* Translucent labelled frame overlay, once matched. */}
                  {done && (
                    <div className="pl-frame-overlay">
                      <span className="pl-frame-corner tl" />
                      <span className="pl-frame-corner tr" />
                      <span className="pl-frame-corner bl" />
                      <span className="pl-frame-corner br" />
                      <span className="pl-poster-tag mono">{techniqueLabel(p.id)}</span>
                    </div>
                  )}

                  {/* The glowing hidden letter tile, revealed on match. */}
                  {done && (
                    <div className="pl-letter-tile" aria-label={t('rooms.persuasion.hiddenLetter', { letter: p.letter })}>
                      {p.letter}
                    </div>
                  )}
                </DropZone>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'password' && !solved && (
        <div className="pl-terminal-wrap fade-in">
          <div className="learn">
            <b>{t('rooms.persuasion.passwordLearn.lead')}</b> {t('rooms.persuasion.passwordLearn.body')}
          </div>

          <form className={`pl-terminal ${pwError ? 'shake' : ''}`} onSubmit={submitPassword}>
            <div className="pl-term-bar mono">
              <span className="pl-term-dot" />
              {t('rooms.persuasion.termBar')}
            </div>
            <div className="pl-term-body">
              <p className="pl-term-prompt mono">
                {t('rooms.persuasion.termPrompt')}
              </p>

              {/* Hint: the collected letters, in order. */}
              <div className="pl-term-letters">
                {POSTERS.map((p) => (
                  <span key={p.id} className="pl-letter-tile small">{p.letter}</span>
                ))}
              </div>

              <div className="pl-term-input row">
                <span className="pl-term-caret mono">&gt;</span>
                <input
                  className="field"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder={t('rooms.persuasion.termPlaceholder')}
                  maxLength={12}
                  autoFocus
                  aria-label={t('rooms.persuasion.termInputLabel')}
                />
                <button className="btn btn-magenta" type="submit">{t('rooms.persuasion.unlock')}</button>
              </div>

              {pwError && (
                <div className="banner wrong">
                  {t('rooms.persuasion.pwError')}
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </RoomFrame>
  )
}
