import { useState, useRef, useEffect } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { playSound, preloadSound } from '../game/sound.js'
import RoomFrame from '../components/RoomFrame.jsx'
import { useStage } from '../components/Stage.jsx'
import './PersuasionRoom.css'

/* PUZZLE 4 — Persuasion Lab (free drag-and-drop scene).
   Poster wall on the LEFT, a computer/terminal on the RIGHT, and the
   labelled technique "frames" piled in the CENTRE — freely draggable
   with no gravity (they stay wherever you drop them, overlapping). Drag
   a frame onto the poster it matches: correct → the frame locks on and a
   circle is drawn around the poster's code letter (the first occurrence of
   the per-language letter set in i18n); wrong → the poster flashes red and the
   frame stays put. The circled letters, read left-to-right across the wall,
   spell the terminal password. */

const POSTERS = [
  { id: 'fomo', emoji: '⚡', tint: 'red' },
  { id: 'social', emoji: '🌟', tint: 'cyan' },
  { id: 'exagg', emoji: '🔥', tint: 'amber' },
  { id: 'influencer', emoji: '💄', tint: 'purple' },
  { id: 'emotional', emoji: '😢', tint: 'magenta' },
  { id: 'urgency', emoji: '⏰', tint: 'green' },
]

/* Wrap the first occurrence (case-insensitive) of `letter` in `text` with a
   circled-letter span. Used to ring the code letter inside a poster's copy. */
function circleLetter(text, letter) {
  if (!text || !letter) return text
  const idx = text.toLowerCase().indexOf(letter.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="pl-circled">{text[idx]}</span>
      {text.slice(idx + 1)}
    </>
  )
}

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
  // The terminal password is the circled letters read across the wall in poster
  // order — derived from i18n, so it follows whatever letters each language sets.
  const password = POSTERS.map((p) => posterText[posterIndex[p.id]]?.letter || '').join('')
  const techniqueLabel = (id) => t(`rooms.persuasion.techniques.${id}`)
  const frames = FRAME_ORDER.map((id) => ({ id, technique: techniqueLabel(id) }))

  const [placed, setPlaced] = useState({}) // posterId -> true once matched
  const [wrongPoster, setWrongPoster] = useState(null)
  const [overPoster, setOverPoster] = useState(null)
  const [hint, setHint] = useState(t('rooms.persuasion.hints.start'))
  const [entry, setEntry] = useState('')
  const [pwError, setPwError] = useState(false)
  const [solved, setSolved] = useState(false)
  const [computerOpen, setComputerOpen] = useState(false) // computer screen overlay
  const [bg, setBg] = useState(bgUrl('persuasion.png'))
  const [ending, setEnding] = useState(false) // playing the end animation
  const endTimer = useRef(null)

  // Free-drag state: each frame's position, stacking order, and active drag.
  const [pos, setPos] = useState(initPositions)
  const [zorder, setZorder] = useState(FRAME_ORDER)
  const [dragId, setDragId] = useState(null)

  const sceneRef = useRef(null)
  const posterRefs = useRef({})
  const dragRef = useRef(null)
  const placedRef = useRef(placed)
  placedRef.current = placed

  // Warm the pick-up chime so the first grab has no load delay.
  useEffect(() => { preloadSound('twinkle.mp3') }, [])
  // Clean up the end-animation timer on unmount.
  useEffect(() => () => clearTimeout(endTimer.current), [])

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
      playSound('twinkle.mp3') // chime on a correct frame landing
      setHint(
        Object.keys(next).length === POSTERS.length
          ? t('rooms.persuasion.hints.allDone')
          : t('rooms.persuasion.hints.correct'),
      )
    } else {
      // Wrong — flash the poster; the frame stays where it was dropped.
      playSound('wrong.mp3')
      setWrongPoster(posterId)
      setHint(t('rooms.persuasion.hints.wrongSpecific', {
        clue: t(`rooms.persuasion.posterHints.${posterId}`),
      }))
      window.setTimeout(() => setWrongPoster((cur) => (cur === posterId ? null : cur)), 600)
    }
  }

  function submitPassword(e) {
    e.preventDefault()
    if (entry.trim().toUpperCase() === password.toUpperCase()) {
      addEvidence({ id: 'ev-persuasion', label: t('rooms.persuasion.evidence') })
      // Close the computer close-up, play the ending animation over the whole
      // scene for 5.1s, then settle on the end frame and reveal the cleared bar.
      setComputerOpen(false)
      setEnding(true)
      setBg(bgUrl('persuasion_animation.gif')) // preloaded → plays instantly from frame 1
      clearTimeout(endTimer.current)
      endTimer.current = window.setTimeout(() => {
        setBg(bgUrl('persuasion_end.png'))
        setSolved(true)
      }, 5100)
    } else {
      playSound('wrong.mp3')
      setPwError(true)
      window.setTimeout(() => setPwError(false), 500)
    }
  }

  return (
    <RoomFrame
      node={node}
      bgImage={bg}
      intro={t('rooms.persuasion.intro')}
      solved={solved}
      solvedTitle={t('rooms.persuasion.solvedTitle')}
      solvedText={t('rooms.persuasion.solvedText')}
      onContinue={() => completeRoom(node.id)}
    >
      <div className="pl-scene2 fade-in" ref={sceneRef}>
        {/* Hide the puzzle during the end animation so the background clip
            plays cleanly; the cleared bar appears once it settles. */}
        {!ending && (<>
        {/* ---- LEFT: the poster wall ---- */}
        <div className="pl-posters">
          {POSTERS.map((p) => {
            const done = !!placed[p.id]
            const wrong = wrongPoster === p.id
            const over = overPoster === p.id
            const copy = posterText[posterIndex[p.id]]
            const letter = copy.letter
            // Once matched, the real poster keeps the ring on its code letter
            // (the frame carried the ring here before it was placed).
            const inHead = done && !!letter && copy.headline?.toLowerCase().includes(letter.toLowerCase())
            const inSub = done && !!letter && !inHead && copy.sub?.toLowerCase().includes(letter.toLowerCase())
            return (
              <div
                key={p.id}
                ref={(el) => (posterRefs.current[p.id] = el)}
                className={`pl-poster tint-${p.tint} ${done ? 'framed' : ''} ${wrong ? 'wrong' : ''} ${over ? 'is-over' : ''}`}
              >
                <div className="pl-poster-emoji">{p.emoji}</div>
                <div className="pl-poster-head">{inHead ? circleLetter(copy.headline, letter) : copy.headline}</div>
                <div className="pl-poster-sub">{inSub ? circleLetter(copy.sub, letter) : copy.sub}</div>

                {done && (
                  <div className="pl-frame-overlay">
                    <span className="pl-frame-corner tl" />
                    <span className="pl-frame-corner tr" />
                    <span className="pl-frame-corner bl" />
                    <span className="pl-frame-corner br" />
                    <span className="pl-poster-tag mono">{techniqueLabel(p.id)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ---- RIGHT: the computer in the scene — click it to open its screen ---- */}
        <button
          type="button"
          className={`pl-computer-hotspot ${allMatched ? 'ready' : ''}`}
          onClick={() => setComputerOpen(true)}
          aria-label={t('rooms.persuasion.openComputer')}
        >
          <span className="pl-hotspot-tag mono">{t('rooms.persuasion.openComputer')}</span>
        </button>

        {/* floating status hint */}
        <p className="pl-hint mono">{hint}</p>

        {/* ---- CENTRE: free-floating overlapping frame pile ---- */}
        {frames.map((f) => {
          if (placed[f.id]) return null
          // The frame carries an invisible clone of its poster's copy, so the
          // circle lands where the code letter sits on the real poster — the
          // player lines the ring up over the letter to place the frame.
          const fc = posterText[posterIndex[f.id]]
          const fl = fc.letter
          const fHead = !!fl && fc.headline?.toLowerCase().includes(fl.toLowerCase())
          const fSub = !!fl && !fHead && fc.sub?.toLowerCase().includes(fl.toLowerCase())
          const fEmoji = POSTERS[posterIndex[f.id]].emoji
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
                {/* invisible poster clone — only the circle shows through */}
                <span className="pl-frame-ghost" aria-hidden>
                  <span className="pl-poster-emoji">{fEmoji}</span>
                  <span className="pl-poster-head">{fHead ? circleLetter(fc.headline, fl) : fc.headline}</span>
                  <span className="pl-poster-sub">{fSub ? circleLetter(fc.sub, fl) : fc.sub}</span>
                </span>
              </span>
            </div>
          )
        })}

        {/* ---- COMPUTER SCREEN: opens when you click the computer ---- */}
        {computerOpen && (
          <div className="pl-screen" style={{ backgroundImage: `url(${bgUrl('computer.png')})` }}>
            <button
              type="button"
              className="pl-screen-close"
              onClick={() => setComputerOpen(false)}
              aria-label={t('rooms.persuasion.closeComputer')}
            >
              ✕
            </button>
            <form
              className={`pl-terminal ${allMatched ? 'on' : 'locked'} ${pwError ? 'shake' : ''}`}
              onSubmit={submitPassword}
            >
              <div className="pl-term-bar mono">
                <span className="pl-term-dot" />
                {t('rooms.persuasion.termBar')}
              </div>
              <div className="pl-term-body">
                {/*<div className="pl-term-letters">
                  {POSTERS.map((p) => (
                    <span key={p.id} className={`pl-letter-tile small ${placed[p.id] ? 'lit' : ''}`}>
                      {placed[p.id] ? p.letter : '_'}
                    </span>
                  ))}
                </div>*/}

                {allMatched ? (
                  <>
                   {/*<p className="pl-term-prompt mono">{t('rooms.persuasion.termPrompt')}</p>*/}
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
          </div>
        )}
        </>)}
      </div>
    </RoomFrame>
  )
}
