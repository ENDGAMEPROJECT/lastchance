import { useState, useRef, useEffect } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { CODES } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'
import RoomFrame from '../components/RoomFrame.jsx'
import { useStage } from '../components/Stage.jsx'
import './PersuasionRoom.css'

/* PUZZLE 4 — Persuasion Lab (free drag-and-drop scene).
   Poster wall on the LEFT, a computer/terminal on the RIGHT, and the
   labelled technique "frames" piled in the CENTRE — freely draggable
   with no gravity (they stay wherever you drop them, overlapping). Drag
   a frame onto the poster it matches: correct → the frame locks on and a
   hidden LETTER appears; wrong → the poster flashes red and the frame
   stays put. The letters (poster order) spell CODES.persuasion = FOOLED,
   typed into the terminal to unlock the exit. */

const POSTERS = [
  { id: 'fomo', letter: 'F', emoji: '⚡', tint: 'red' },
  { id: 'social', letter: 'O', emoji: '🌟', tint: 'cyan' },
  { id: 'exagg', letter: 'O', emoji: '🔥', tint: 'amber' },
  { id: 'influencer', letter: 'L', emoji: '💄', tint: 'purple' },
  { id: 'emotional', letter: 'E', emoji: '😢', tint: 'magenta' },
  { id: 'urgency', letter: 'D', emoji: '⏰', tint: 'green' },
]

const FRAME_ORDER = ['emotional', 'fomo', 'urgency', 'social', 'influencer', 'exagg']

/* Initial overlapping positions for the centre pile (scene-local px). */
const CENTER = { x: 470, y: 110 }
function initPositions() {
  const o = {}
  FRAME_ORDER.forEach((id, i) => {
    o[id] = { x: CENTER.x + i * 30, y: CENTER.y + i * 24 } // diagonal overlapping pile
  })
  return o
}

export default function PersuasionRoom({ node }) {
  const { completeRoom, addEvidence } = useGame()
  const t = useT()
  const { scale } = useStage()

  const posterText = t('rooms.persuasion.posters')
  const posterIndex = POSTERS.reduce((m, p, i) => ((m[p.id] = i), m), {})
  const techniqueLabel = (id) => t(`rooms.persuasion.techniques.${id}`)
  const frames = FRAME_ORDER.map((id) => ({ id, technique: techniqueLabel(id) }))

  const [placed, setPlaced] = useState({}) // posterId -> true once matched
  const [wrongPoster, setWrongPoster] = useState(null)
  const [overPoster, setOverPoster] = useState(null)
  const [hint, setHint] = useState(t('rooms.persuasion.hints.start'))
  const [entry, setEntry] = useState('')
  const [pwError, setPwError] = useState(false)
  const [solved, setSolved] = useState(false)

  // Free-drag state: each frame's position, stacking order, and active drag.
  const [pos, setPos] = useState(initPositions)
  const [zorder, setZorder] = useState(FRAME_ORDER)
  const [dragId, setDragId] = useState(null)

  const sceneRef = useRef(null)
  const posterRefs = useRef({})
  const dragRef = useRef(null)
  const placedRef = useRef(placed)
  placedRef.current = placed

  const matchedCount = Object.keys(placed).length
  const allMatched = matchedCount === POSTERS.length

  // Convert a screen point into scene-local design pixels (undo stage scale).
  const toLocal = (cx, cy) => {
    const r = sceneRef.current.getBoundingClientRect()
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }
  }
  // Which (unmatched) poster is under a screen point, if any.
  const posterUnder = (cx, cy) => {
    for (const p of POSTERS) {
      if (placedRef.current[p.id]) continue
      const el = posterRefs.current[p.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return p.id
    }
    return null
  }

  function onFrameDown(e, id) {
    if (e.button != null && e.button > 0) return
    e.preventDefault()
    const p = toLocal(e.clientX, e.clientY)
    dragRef.current = { id, offX: p.x - pos[id].x, offY: p.y - pos[id].y }
    setDragId(id)
    setZorder((z) => [...z.filter((x) => x !== id), id]) // bring to front
  }

  useEffect(() => {
    if (!dragId) return
    const move = (e) => {
      const d = dragRef.current
      if (!d) return
      const p = toLocal(e.clientX, e.clientY)
      setPos((cur) => ({ ...cur, [d.id]: { x: p.x - d.offX, y: p.y - d.offY } }))
      setOverPoster(posterUnder(e.clientX, e.clientY))
    }
    const up = (e) => {
      const d = dragRef.current
      const target = posterUnder(e.clientX, e.clientY)
      if (d && target) tryMatch(target, d.id)
      setDragId(null)
      dragRef.current = null
      setOverPoster(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId, scale])

  function tryMatch(posterId, techId) {
    if (placed[posterId]) return
    if (techId === posterId) {
      const next = { ...placed, [posterId]: true }
      setPlaced(next)
      setWrongPoster(null)
      setHint(
        Object.keys(next).length === POSTERS.length
          ? t('rooms.persuasion.hints.allDone')
          : t('rooms.persuasion.hints.correct'),
      )
    } else {
      // Wrong — flash the poster; the frame stays where it was dropped.
      setWrongPoster(posterId)
      setHint(t('rooms.persuasion.hints.wrong'))
      window.setTimeout(() => setWrongPoster((cur) => (cur === posterId ? null : cur)), 600)
    }
  }

  function submitPassword(e) {
    e.preventDefault()
    if (entry.trim().toUpperCase() === CODES.persuasion.toUpperCase()) {
      addEvidence({ id: 'ev-persuasion', label: t('rooms.persuasion.evidence') })
      setSolved(true)
    } else {
      setPwError(true)
      window.setTimeout(() => setPwError(false), 500)
    }
  }

  return (
    <RoomFrame
      node={node}
      bgImage={bgUrl('persuasion.png')}
      intro={t('rooms.persuasion.intro')}
      solved={solved}
      solvedTitle={t('rooms.persuasion.solvedTitle')}
      solvedText={t('rooms.persuasion.solvedText')}
      onContinue={() => completeRoom(node.id)}
    >
      <div className="pl-scene2 fade-in" ref={sceneRef}>
        {/* ---- LEFT: the poster wall ---- */}
        <div className="pl-posters">
          {POSTERS.map((p) => {
            const done = !!placed[p.id]
            const wrong = wrongPoster === p.id
            const over = overPoster === p.id
            const copy = posterText[posterIndex[p.id]]
            return (
              <div
                key={p.id}
                ref={(el) => (posterRefs.current[p.id] = el)}
                className={`pl-poster tint-${p.tint} ${done ? 'framed' : ''} ${wrong ? 'wrong' : ''} ${over ? 'is-over' : ''}`}
              >
                <div className="pl-poster-emoji">{p.emoji}</div>
                <div className="pl-poster-head">{copy.headline}</div>
                <div className="pl-poster-sub">{copy.sub}</div>

                {done && (
                  <div className="pl-frame-overlay">
                    <span className="pl-frame-corner tl" />
                    <span className="pl-frame-corner tr" />
                    <span className="pl-frame-corner bl" />
                    <span className="pl-frame-corner br" />
                    <span className="pl-poster-tag mono">{techniqueLabel(p.id)}</span>
                  </div>
                )}
                {done && (
                  <div className="pl-letter-tile" aria-label={t('rooms.persuasion.hiddenLetter', { letter: p.letter })}>
                    {p.letter}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ---- RIGHT: the computer / exit terminal ---- */}
        <div className="pl-computer">
          <form
            className={`pl-terminal ${allMatched ? 'on' : 'locked'} ${pwError ? 'shake' : ''}`}
            onSubmit={submitPassword}
          >
            <div className="pl-term-bar mono">
              <span className="pl-term-dot" />
              {t('rooms.persuasion.termBar')}
            </div>
            <div className="pl-term-body">
              <div className="pl-term-letters">
                {POSTERS.map((p) => (
                  <span key={p.id} className={`pl-letter-tile small ${placed[p.id] ? 'lit' : ''}`}>
                    {placed[p.id] ? p.letter : '_'}
                  </span>
                ))}
              </div>

              {allMatched ? (
                <>
                  <p className="pl-term-prompt mono">{t('rooms.persuasion.termPrompt')}</p>
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
                </>
              ) : (
                <p className="pl-term-locked mono">🔒 {t('rooms.persuasion.termLocked')}</p>
              )}

              {pwError && <div className="banner wrong">{t('rooms.persuasion.pwError')}</div>}
            </div>
          </form>
          <p className="pl-hint mono">{hint}</p>
        </div>

        {/* ---- CENTRE: free-floating overlapping frame pile ---- */}
        {frames.map((f) => {
          if (placed[f.id]) return null
          return (
            <div
              key={f.id}
              className={`pl-freeframe ${dragId === f.id ? 'dragging' : ''}`}
              style={{ left: pos[f.id].x, top: pos[f.id].y, zIndex: dragId === f.id ? 999 : 20 + zorder.indexOf(f.id) }}
              onPointerDown={(e) => onFrameDown(e, f.id)}
            >
              <span className="pl-frame">
                <span className="pl-frame-corner tl" />
                <span className="pl-frame-corner tr" />
                <span className="pl-frame-corner bl" />
                <span className="pl-frame-corner br" />
                <span className="pl-frame-label">{f.technique}</span>
                <span className="pl-frame-mark" aria-hidden />
              </span>
            </div>
          )
        })}
      </div>
    </RoomFrame>
  )
}
