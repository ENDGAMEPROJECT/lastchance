import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import { DEBUG } from '../game/settings.js'
import { bgUrl } from '../game/assets.js'
import './GameMap.css'

/* Art key per node id — the file-name stem under public/bg/map, which holds a
   lit `-color` and a powered-down `-gray` render of every station. */
const ART = {
  'link-district': 'link',
  'roulette-corridor': 'roulette',
  'influencer-avenue': 'influencer',
  'algorithm-room': 'algorithm',
  'ads-corridor': 'ads',
  'persuasion-room': 'persuasion',
}

const artUrl = (art, locked) => bgUrl(`map/node-${art}-${locked ? 'gray' : 'color'}.png`)

/* The generated art is not consistently framed: inside the same 512px box the
   podiums range 359–490px wide, their bases sit anywhere from 89% to 98% down,
   and the artwork starts anywhere from 4% to 30% down — the console in the
   Algorithm Control Room has a third of its frame empty above it, the phone in
   Influencer Avenue almost none. All three are measured from the PNG alpha (the
   gray renders match their colour twins exactly):
     s    scale, evening the podiums to a common width
     dy   nudge in % of the frame, dropping every base onto one line
     top  where the artwork actually begins, as a fraction of the frame, so the
          label can hang off the art instead of off the empty box */
const ART_FIT = {
  start: { s: 0.981, dy: 0.6, top: 0.057 },
  link: { s: 0.996, dy: 1.4, top: 0.158 },
  roulette: { s: 1.031, dy: 0.7, top: 0.059 },
  influencer: { s: 1.295, dy: 8.9, top: 0.123 },
  algorithm: { s: 0.983, dy: -2.9, top: 0.301 },
  ads: { s: 1.013, dy: 0.4, top: 0.068 },
  persuasion: { s: 1.006, dy: -0.1, top: 0.074 },
  final: { s: 0.949, dy: -3.5, top: 0.041 },
}

const LABEL_GAP = 12 // px of clear air between a label pill and the art below it

/* Where the label's lower edge sits, measured up from the bottom of the art
   box: the artwork's own top, after the fit transform, less the gap. */
function labelBottom(art) {
  const { s, dy, top } = ART_FIT[art]
  const artTop = 1 - s * (1 - top) + dy / 100
  return `calc(${((1 - artTop) * 100).toFixed(1)}% + ${LABEL_GAP}px)`
}

/* Station centres as fractions of the node field, in travel order — the board
   shape is authored in normalized coordinates so it can be retuned without
   touching any pixel maths. */
const PLACES = [
  [0.18, 0.10], // Start
  [0.35, -0.08], // Link District
  [0.55, -0.08], // Roulette Corridor
  [0.74, 0.10], // Influencer Avenue
  [0.74, 0.65], // Algorithm Control Room
  [0.55, 0.83], // Ads Corridor
  [0.35, 0.83], // Persuasion Lab
  [0.18, 0.66], // Final Decision
]

const BOARD = { w: 1180, h: 510 }
/* PLACES are resolved against this field. Its size sets how far apart the
   stations sit; its origin is tuned so the cluster lands centred on the board,
   which is what keeps the top row clear of the header.
   To re-centre after moving stations, with nx/ny the smallest and largest
   fractions used above (currently 0.18–0.74 across, -0.08–0.83 down):
     x = 590 - (nxMin + nxMax) / 2 * w
     y = 255 - ((nyMin * h - 96) + (nyMax * h + 76)) / 2
   The 96 and 76 are how far a station reaches above (art + label pill) and
   below (art) its centre. */
const FIELD = { x: 139, y: 140, w: 980, h: 330 }

const STATIONS = PLACES.map(([nx, ny]) => ({
  x: FIELD.x + nx * FIELD.w,
  y: FIELD.y + ny * FIELD.h,
}))

/* Centre the stations horizontally by what is actually on screen, not by their
   coordinates. The art is symmetric about the board's middle, but the label
   pills are not — a long one ("Algorithm Control Room") reaches further out
   than a short one ("Final Decision"), which drags the visual centre sideways.
   Label widths depend on the text, so they change with every translation; this
   measures the rendered span and nudges the whole cluster to balance it.
   The correction is applied on top of the current shift, so the second pass
   settles at zero and it does not loop. */
function useCentred(ref, deps) {
  const [shift, setShift] = useState(0)
  const [tick, setTick] = useState(0)

  // Late webfont swaps change label widths without re-rendering — re-measure.
  useEffect(() => {
    document.fonts?.ready.then(() => setTick((n) => n + 1))
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const board = el.getBoundingClientRect()
    if (!board.width) return
    let min = Infinity
    let max = -Infinity
    for (const part of el.querySelectorAll('.mnode, .mnode-label')) {
      const r = part.getBoundingClientRect()
      if (!r.width) continue
      min = Math.min(min, r.left)
      max = Math.max(max, r.right)
    }
    if (min === Infinity) return
    // rects come back in screen pixels, so undo the stage's scale
    const scale = board.width / BOARD.w
    const off = ((board.left + board.right) / 2 - (min + max) / 2) / scale
    if (Math.abs(off) > 0.5) setShift((s) => s + off)
  }, [ref, shift, tick, ...deps])

  return shift
}

export default function GameMap() {
  const { NODES, progress, openNode, gotoScreen } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend }
  const boardRef = useRef(null)
  const shift = useCentred(boardRef, [t])

  const doneCount = NODES.filter((n) => progress[n.id] === 'done').length
  const pct = Math.round((doneCount / NODES.length) * 100)
  const allDone = doneCount === NODES.length

  /* The six playable districts, book-ended by the two story stations. "Start"
     is a signpost only — the pre-test's exit restarts the countdown, so it must
     not be re-openable mid-run. The Final Decision is normally auto-entered when
     the last district is cleared; the click path covers debug mode. */
  const stations = [
    { id: 'start', art: 'start', kind: 'gate', accent: 'cyan', status: 'done' },
    ...NODES.map((n) => ({
      id: n.id,
      art: ART[n.id],
      kind: n.kind,
      accent: n.accent,
      status: progress[n.id],
      onOpen: () => openNode(n.id),
    })),
    {
      id: 'final-decision',
      art: 'final',
      kind: 'gate',
      accent: 'magenta',
      status: allDone || DEBUG ? 'available' : 'locked',
      onOpen: () => gotoScreen('posttest'),
    },
  ]

  return (
    <div className="stage-scroll map-scroll">
      <div className="bg-slot" style={{ backgroundImage: `url(${bgUrl('map/map-bg.png')})` }} />

      <div className="map-head fade-in">
        <div className="eyebrow">{t('map.eyebrow')}</div>
        <h2>{t('map.titleLead')} <span style={{ color: 'var(--cyan)' }}>{t('map.titleAccent')}</span></h2>
        <div className="map-progress">
          <div className="map-progress-bar"><span style={{ width: `${pct}%` }} /></div>
          <span className="mono t-sm">{doneCount}/{NODES.length} · {pct}%</span>
        </div>
        {DEBUG && (
          <div className="map-debug">
            <span className="chip bad">🐞 DEBUG · jump to</span>
            <button className="btn btn-sm btn-ghost" onClick={() => gotoScreen('pretest')}>Pre-test</button>
            <button className="btn btn-sm btn-ghost" onClick={() => gotoScreen('posttest')}>Post-test</button>
            <button className="btn btn-sm btn-ghost" onClick={() => gotoScreen('win')}>Win</button>
            <button className="btn btn-sm btn-ghost" onClick={() => gotoScreen('lose')}>Lose</button>
          </div>
        )}
      </div>

      <div className="map-board" ref={boardRef} style={{ width: BOARD.w, height: BOARD.h }}>
        <div className="map-nodes" style={{ transform: `translateX(${shift.toFixed(1)}px)` }}>
        {stations.map((s, i) => {
          const locked = s.status === 'locked'
          const { x, y } = STATIONS[i]
          const title = t(`nodes.${s.id}.title`, vars)
          return (
            <button
              key={s.id}
              className={`mnode accent-${s.accent} ${s.status} ${s.kind}`}
              /* stack by depth: a station lower on the board is nearer the
                 viewer, so it overlaps the ones behind it */
              style={{ left: `${x}px`, top: `${y}px`, zIndex: Math.round(y) }}
              disabled={locked || !s.onOpen}
              onClick={s.onOpen}
              onMouseDown={(e) => e.preventDefault()} /* don't take focus — it scrolls the stage */
              title={locked ? t('map.lockedTip') : title}
            >
              <span className="mnode-label" style={{ bottom: labelBottom(s.art) }}>{title}</span>
              <span className="mnode-glow" />
              <span className="mnode-art">
                <img
                  className="mnode-img"
                  style={{ transform: `translateY(${ART_FIT[s.art].dy}%) scale(${ART_FIT[s.art].s})` }}
                  src={artUrl(s.art, locked)}
                  alt=""
                  draggable={false}
                />
                {locked && <img className="mnode-lock" src={bgUrl('map/lock-closed.png')} alt="" draggable={false} />}
              </span>
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}
