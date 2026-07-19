import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { playSound, stopSound, preloadSound } from '../game/sound.js'
import RoomFrame from '../components/RoomFrame.jsx'
import './RouletteCorridor.css'

/* CORRIDOR — Gamified Bait (between Puzzle 1 and Puzzle 2).
   Per the brief: a corridor of shiny prize wheels that look like
   free money but are RIGGED. Every spin — no matter what — decelerates
   onto the jackpot segment. Once the player has spun a few and noticed
   the pattern, they mark each wheel "Rigged". Marking all four clears
   the corridor. Learning point: spin-to-win / daily bonuses / loot
   boxes are advertising & engagement tricks — nobody hands you €300
   (or a free tablet) for a spin. */

/* Each wheel: 8 segments. `jackpot` is the slice the rigged spin ALWAYS
   lands on — deliberately a trivial "30¢ OFF" coupon, so the player sees
   that the guaranteed "win" is worth almost nothing. Structural data
   (id + landing slice index) lives here; all display text (name, tag,
   segment labels) comes from i18n (rooms.roulette.wheels.<id>.*).
   The index must match the "30¢ OFF" slot in each wheel's segments. */
const WHEELS = [
  { id: 'w1', jackpot: 3 }, // "30¢ OFF"
  { id: 'w2', jackpot: 2 }, // "30¢ OFF"
  { id: 'w3', jackpot: 5 }, // "30¢ OFF"
  { id: 'w4', jackpot: 6 }, // "30¢ OFF"
]

const SEG = 8 // segments per wheel
const SLICE = 360 / SEG // degrees per slice

/* Segment colours (magenta-accent neon), alternating so the wheel reads. */
const SEG_COLORS = [
  '#ff2bd6', '#7a1a63', '#ff2bd6', '#7a1a63',
  '#ff2bd6', '#7a1a63', '#ff2bd6', '#7a1a63',
]
const JACKPOT_COLOR = '#ffb92b' // amber — the "prize" always glows gold

/* Build a conic-gradient string for the wheel face, highlighting the
   jackpot slice in gold. Slice i occupies [i*SLICE, (i+1)*SLICE). */
function wheelGradient(jackpot) {
  const stops = []
  for (let i = 0; i < SEG; i++) {
    const color = i === jackpot ? JACKPOT_COLOR : SEG_COLORS[i]
    stops.push(`${color} ${i * SLICE}deg ${(i + 1) * SLICE}deg`)
  }
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
}

function PrizeWheel({ wheel, spinning, angle, won, onSpin, t }) {
  const segments = t(`rooms.roulette.wheels.${wheel.id}.segments`)
  const jackpotLabel = segments[wheel.jackpot]
  return (
    <div className="rc-wheel-wrap">
      {/* Fixed pointer at the top — this is what the wheel lands under. */}
      <div className="rc-pointer" aria-hidden>▼</div>

      <div className="rc-wheel-face">
        <div
          className={`rc-wheel${spinning ? ' spinning' : ''}`}
          style={{
            background: wheelGradient(wheel.jackpot),
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Slice labels, rotated to sit along the middle of each slice. */}
          {segments.map((label, i) => (
            <span
              key={i}
              className={`rc-seg-label${i === wheel.jackpot ? ' jackpot' : ''}`}
              style={{ transform: `rotate(${i * SLICE + SLICE / 2}deg)` }}
            >
              <span className="rc-seg-text">{label}</span>
            </span>
          ))}
        </div>

        {/* Glowing hub in the centre. */}
        <div className="rc-hub">🎰</div>

        {/* Win flag that pops after a spin settles. */}
        {won && (
          <div className="rc-win-flag fade-in">{t('rooms.roulette.won')}<b>{jackpotLabel}</b>{t('rooms.roulette.wonSuffix')}</div>
        )}
      </div>
    </div>
  )
}

export default function RouletteCorridor({ node }) {
  const { completeRoom, addEvidence } = useGame()
  const t = useT()

  // Per-wheel spin angle (accumulates so it keeps turning one direction).
  const [angles, setAngles] = useState(() => Object.fromEntries(WHEELS.map((w) => [w.id, 0])))
  // Which wheels are currently mid-spin (buttons disabled while true).
  const [spinning, setSpinning] = useState({})
  // Which wheels have finished at least one spin (show the win flag).
  const [won, setWon] = useState({})
  // Which wheels the player has marked as rigged.
  const [rigged, setRigged] = useState({})
  const [solved, setSolved] = useState(false)
  const [hint, setHint] = useState('')

  // Guard against overlapping timers per wheel.
  const timers = useRef({})

  // Warm the spin/win sounds so the first spin has no load delay.
  useEffect(() => {
    preloadSound('roulette_spin.mp3')
    preloadSound('roulette_win.mp3')
  }, [])

  const spunCount = useMemo(() => Object.values(won).filter(Boolean).length, [won])
  const riggedCount = useMemo(() => Object.values(rigged).filter(Boolean).length, [rigged])

  /* RIGGED SPIN — always lands on the jackpot.
     We compute the extra rotation needed so the jackpot slice ends up
     centred under the fixed top pointer, then add several full turns for
     the "spin" feel. The pointer sits at 0deg (top); slice j is centred
     at j*SLICE + SLICE/2, so we must rotate by -(that) mod 360. */
  function spinWheel(w) {
    if (spinning[w.id]) return
    setHint('')
    setSpinning((s) => ({ ...s, [w.id]: true }))
    playSound('roulette_spin.mp3') // whir while the wheel turns

    const current = angles[w.id]
    const jackpotCentre = w.jackpot * SLICE + SLICE / 2
    // Target orientation (0..360) that puts the jackpot under the pointer.
    const target = (360 - jackpotCentre) % 360
    // Keep turning forward: advance to the next full-turn boundary that is at
    // least a few spins ahead, then add the target offset. This guarantees the
    // wheel always rotates clockwise and settles with the jackpot up top.
    const turns = 5 // full spins for drama
    const next = (Math.floor(current / 360) + turns) * 360 + target

    setAngles((a) => ({ ...a, [w.id]: next }))

    // Match the CSS transition duration; then reveal the win flag.
    clearTimeout(timers.current[w.id])
    timers.current[w.id] = setTimeout(() => {
      setSpinning((s) => ({ ...s, [w.id]: false }))
      setWon((wn) => ({ ...wn, [w.id]: true }))
      stopSound('roulette_spin.mp3') // whir ends…
      playSound('roulette_win.mp3') // …and the "you won!" jingle plays
    }, 4200)
  }

  function spinAll() {
    WHEELS.forEach((w) => spinWheel(w))
  }

  /* Mark / unmark a wheel as rigged. The player must have actually spun a
     couple of wheels first, so they experience the trick before judging. */
  function toggleRigged(w) {
    if (!won[w.id] && spunCount < 2) {
      setHint(t('rooms.roulette.hintSpinFirst'))
      return
    }
    if (!won[w.id]) {
      setHint(t('rooms.roulette.hintSpinThis'))
      return
    }
    setHint('')
    setRigged((r) => {
      const nextRigged = { ...r, [w.id]: !r[w.id] }
      // When all four are marked rigged, the corridor is solved.
      const allRigged = WHEELS.every((x) => nextRigged[x.id])
      if (allRigged && !solved) {
        setSolved(true)
        addEvidence({
          id: 'ev-roulette',
          label: t('rooms.roulette.evidenceLabel'),
        })
      }
      return nextRigged
    })
  }

  return (
    <RoomFrame
      node={node}
      bgImage={bgUrl('roulette.png')}
      intro={t('rooms.roulette.intro')}
      solved={solved}
      solvedTitle={t('rooms.roulette.solvedTitle')}
      solvedText={t('rooms.roulette.solvedText')}
      onContinue={() => completeRoom(node.id)}
    >
      <div className="rc-wrap fade-in">
        <div className="rc-topbar">
          <span className="chip warn">{t('rooms.roulette.spunBadge', { spun: spunCount, total: WHEELS.length })}</span>
          <span className={`chip ${riggedCount === WHEELS.length ? 'ok' : ''}`}>
            {t('rooms.roulette.riggedBadge', { rigged: riggedCount, total: WHEELS.length })}
          </span>
          <button className="btn btn-magenta btn-sm" onClick={spinAll}>{t('rooms.roulette.spinAll')}</button>
        </div>

        <div className="rc-stage">
        <div className="rc-grid">
          {WHEELS.map((w) => {
            const isRigged = !!rigged[w.id]
            const isSpinning = !!spinning[w.id]
            return (
              <div key={w.id} className={`rc-card${isRigged ? ' rigged' : ''}`}>
                <div className="rc-card-head">
                  <span className="rc-wheel-name">{t(`rooms.roulette.wheels.${w.id}.name`)}</span>
                  <span className="chip">{t(`rooms.roulette.wheels.${w.id}.tag`)}</span>
                </div>

                <PrizeWheel
                  wheel={w}
                  spinning={isSpinning}
                  angle={angles[w.id]}
                  won={!!won[w.id]}
                  onSpin={() => spinWheel(w)}
                  t={t}
                />

                <button
                  className="btn btn-magenta btn-sm rc-spin-btn"
                  onClick={() => spinWheel(w)}
                  disabled={isSpinning}
                >
                  {isSpinning ? t('rooms.roulette.spinning') : t('rooms.roulette.spin')}
                </button>

                {/* Rig toggle — only meaningful after the player has spun. */}
                <label className={`rc-rig ${isRigged ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isRigged}
                    onChange={() => toggleRigged(w)}
                  />
                  <span className="rc-rig-box" />
                  <span>{t('rooms.roulette.markRiggedLabel')} <b>{t('rooms.roulette.markRiggedWord')}</b></span>
                </label>
              </div>
            )
          })}
        </div>
        </div>

        {hint && <div className="banner info rc-hint">{hint}</div>}

        <div className="learn rc-learn">
          <b>{t('rooms.roulette.learnLead')}</b> {t('rooms.roulette.learnBody')}
        </div>
      </div>
    </RoomFrame>
  )
}
