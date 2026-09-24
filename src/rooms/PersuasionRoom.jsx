import { useState, useRef, useEffect, useCallback } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { playSound } from '../game/sound.js'
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

/* Frames shrink as they move toward the right of the wall, matching the
   receding perspective plane (so a frame reads the same apparent size as the
   poster it's hovering). */
function getFrameScale(x) {
  const minX = 0
  const maxX = 760
  const t = (Math.min(Math.max(x, minX), maxX) - minX) / (maxX - minX)
  return 1 - t * 0.3
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

  const [placement, setPlacement] = useState({}) // frameId -> posterId it's sitting on
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
  const frameRefs = useRef({})
  const dragRef = useRef(null)
  const placementRef = useRef(placement)
  placementRef.current = placement

  // Ring position per poster: the code letter's centre, measured from the REAL
  // rendered poster in its own layout coords (x/y in border-box px within the
  // 164×190 poster, plus a diameter `d`). Intra-poster layout is unaffected by
  // the wall's rotateY, so this is exact; the frame reuses it to draw its ring
  // at the identical spot, so a frame dropped on its poster rings that letter.
  const [ringPos, setRingPos] = useState({})
  const measureRings = useCallback(() => {
    const next = {}
    for (const p of POSTERS) {
      const el = posterRefs.current[p.id]
      const mark = el?.querySelector('.pl-circled')
      if (!mark) continue
      const w = mark.offsetWidth, h = mark.offsetHeight
      if (!w && !h) continue // not laid out yet — don't record a bogus 0,0
      // Ring size tracks the line-box height, which is identical for upper and
      // lowercase — so a lowercase glyph (o, l, e) would get an oversized ring.
      // Tighten it for lowercase.
      const ch = mark.textContent || ''
      const isLower = ch && ch === ch.toLowerCase() && ch !== ch.toUpperCase()
      const d = Math.max(w, h) * (isLower ? 1.12 : 1.28)
      next[p.id] = { x: mark.offsetLeft + w / 2, y: mark.offsetTop + h / 2, d }
    }
    // Merge, never replace — a transient empty read must not wipe good values.
    if (Object.keys(next).length) setRingPos((prev) => ({ ...prev, ...next }))
  }, [])

  // Re-measure when web fonts settle (letter metrics shift) and on window resize.
  // Measurement is in design pixels, so the stage's scale transform is irrelevant.
  useEffect(() => {
    if (document.fonts?.ready) document.fonts.ready.then(() => measureRings())
    window.addEventListener('resize', measureRings)
    return () => window.removeEventListener('resize', measureRings)
  }, [measureRings])

  // Callback ref on the poster wall. The wall is a RoomFrame child, mounted only
  // AFTER the player clicks "Begin" — so mount-time effects run too early. This
  // fires the instant the wall is actually in the DOM; a ResizeObserver then
  // keeps the rings measured across any later layout change.
  const wallObs = useRef(null)
  const attachWall = useCallback((el) => {
    if (wallObs.current) { wallObs.current.disconnect(); wallObs.current = null }
    if (el) {
      const ro = new ResizeObserver(() => measureRings())
      ro.observe(el)
      wallObs.current = ro
      requestAnimationFrame(() => measureRings())
    }
  }, [measureRings])

  // Clean up the end-animation timer on unmount.
  useEffect(() => () => clearTimeout(endTimer.current), [])

  // Every poster now carries a frame (no right/wrong — the password is the check).
  const allPlaced = Object.keys(placement).length === POSTERS.length


  // Convert a screen point into scene-local design pixels (undo stage scale).
  const toLocal = (cx, cy) => {
    const r = sceneRef.current.getBoundingClientRect()
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }
  }
  // Which poster is under a screen point, if any — skipping ones that already
  // hold a (different) frame.
  const posterUnder = (cx, cy) => {
    const occupied = new Set(Object.values(placementRef.current))
    const dragging = dragRef.current?.id
    for (const p of POSTERS) {
      if (occupied.has(p.id) && placementRef.current[dragging] !== p.id) continue
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

  // Snap a frame onto a poster. Because the frame and the poster live in
  // different transform contexts (per-frame rotateY vs. the wall's), matching
  // the poster's projected top-left directly leaves an offset. So we set a rough
  // position, then on the next frame measure both RENDERED rects and nudge by
  // the residual delta — the frame's projected top-left ends up exactly on the
  // poster's, independent of transform origins.
  function snapToPoster(frameId, posterId) {
    const posterEl = posterRefs.current[posterId]
    const sceneEl = sceneRef.current
    if (!posterEl || !sceneEl) return
    const pr = posterEl.getBoundingClientRect()
    const sr = sceneEl.getBoundingClientRect()
    setPos((cur) => ({ ...cur, [frameId]: { x: (pr.left - sr.left) / scale, y: (pr.top - sr.top) / scale } }))
    // Next frame, nudge so the frame's CENTRE sits on the poster's centre — the
    // frame is the same size as the poster, so it covers it (not a corner).
    requestAnimationFrame(() => {
      const frameEl = frameRefs.current[frameId]
      if (!frameEl) return
      const fr = frameEl.getBoundingClientRect()
      const pr2 = posterEl.getBoundingClientRect()
      const dx = ((pr2.left + pr2.width / 2) - (fr.left + fr.width / 2)) / scale
      const dy = ((pr2.top + pr2.height / 2) - (fr.top + fr.height / 2)) / scale
      setPos((cur) => ({ ...cur, [frameId]: { x: cur[frameId].x + dx, y: cur[frameId].y + dy } }))
    })
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
      if (d && target) {
        // Just place it — no right/wrong feedback; the terminal is the check.
        setPlacement((cur) => ({ ...cur, [d.id]: target }))
        snapToPoster(d.id, target)
      } else if (d) {
        // Dropped off the wall → it's no longer on any poster.
        setPlacement((cur) => { const n = { ...cur }; delete n[d.id]; return n })
      }
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
        <div className="pl-posters" ref={attachWall}>
          {POSTERS.map((p) => {
            const over = overPoster === p.id
            const copy = posterText[posterIndex[p.id]]
            const letter = copy.letter
            // Wrap the code letter so we can MEASURE it (the ring itself is
            // hidden on the poster — no right/wrong feedback; the frame carries
            // the visible ring). Prefer the headline, fall back to the sub.
            const inHead = !!letter && copy.headline?.toLowerCase().includes(letter.toLowerCase())
            return (
              <div
                key={p.id}
                ref={(el) => (posterRefs.current[p.id] = el)}
                className={`pl-poster pl-${p.id} tint-${p.tint} ${over ? 'is-over' : ''}`}
              >
                <div className="pl-poster-head">{inHead ? circleLetter(copy.headline, letter) : copy.headline}</div>
                <div className="pl-poster-sub">{inHead ? copy.sub : circleLetter(copy.sub, letter)}</div>
              </div>
            )
          })}
        </div>

        {/* ---- RIGHT: the computer in the scene — click it to open its screen ---- */}
        <button
          type="button"
          className={`pl-computer-hotspot ${allPlaced ? 'ready' : ''}`}
          onClick={() => setComputerOpen(true)}
          aria-label={t('rooms.persuasion.openComputer')}
        >
          <span className="pl-hotspot-tag mono">{t('rooms.persuasion.openComputer')}</span>
        </button>

        {/* floating status hint */}
        <p className="pl-hint mono">{hint}</p>

        {/* ---- CENTRE: free-floating draggable frames ----
            Every frame is always present and carries its own red circle from the
            start. The circle is auto-positioned by rendering this poster's copy
            (transparent — text hidden, only the ring shows) and ringing the first
            occurrence of its letter, so when the frame is dropped onto a poster
            the ring lands exactly on that poster's matching letter. */}
        {frames.map((f) => {
          const fScale = getFrameScale(pos[f.id].x) // recede with the wall's perspective
          const ring = ringPos[f.id] // {x,y,d} measured from the matching poster
          return (
            <div
              key={f.id}
              ref={(el) => (frameRefs.current[f.id] = el)}
              className={`pl-freeframe ${dragId === f.id ? 'dragging' : ''}`}
              style={{
                left: pos[f.id].x,
                top: pos[f.id].y,
                transform: `rotateY(10deg) scale(${fScale})`,
                transformOrigin: 'left center',
                zIndex: dragId === f.id ? 999 : 20 + zorder.indexOf(f.id),
              }}
              onPointerDown={(e) => onFrameDown(e, f.id)}
            >
              <span className="pl-frame">
                <span className="pl-frame-corner tl" />
                <span className="pl-frame-corner tr" />
                <span className="pl-frame-corner bl" />
                <span className="pl-frame-corner br" />
                <span className="pl-frame-label">{f.technique}</span>
              </span>
              {/* The code-letter ring, drawn at the letter's exact spot inside
                  the matching poster — present from the start. */}
              {ring && (
                <span
                  className="pl-frame-ring"
                  style={{ left: ring.x, top: ring.y, width: ring.d, height: ring.d }}
                  aria-hidden
                />
              )}
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
              className={`pl-terminal ${allPlaced ? 'on' : 'locked'} ${pwError ? 'shake' : ''}`}
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

                {allPlaced ? (
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
