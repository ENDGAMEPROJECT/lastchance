import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import { DEBUG } from '../game/settings.js'
import './GameMap.css'

const NODE_ICON = {
  'link-district': '🚪',
  'roulette-corridor': '🎡',
  'influencer-avenue': '📱',
  'algorithm-room': '🖥️',
  'ads-corridor': '📢',
  'persuasion-room': '🖼️',
  'final-decision': '🔓',
}

/* Board geometry — the nodes sit on a serpentine neon path of glowing
   pedestals. The board is a fixed size inside the scaled stage, so the SVG
   trail and the absolutely-positioned nodes share the same coordinates. */
const BOARD = { w: 1160, h: 470 }
const TRAIL_DY = 44 // trail sits at pedestal level, just below node centres
/* Nodes ride an oval "racetrack": from the upper-left, clockwise over the
   top, down the right, across the bottom, to the lower-left (open on the
   left). */
const OVAL = { cx: 580, cy: 228, rx: 432, ry: 150 }
const ARC = { start: 214, span: 292 } // degrees

function nodePos(i, total) {
  const deg = ARC.start + (total > 1 ? (i * ARC.span) / (total - 1) : 0)
  const a = (deg * Math.PI) / 180
  return {
    x: OVAL.cx + OVAL.rx * Math.cos(a),
    y: OVAL.cy + OVAL.ry * Math.sin(a),
  }
}

/* A smooth Catmull-Rom spline through the points, emitted as cubic béziers,
   so the trail flows as one winding curve rather than straight segments. */
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }
  return d
}

function trailPath(total) {
  const pts = Array.from({ length: total }, (_, i) => {
    const p = nodePos(i, total)
    return { x: p.x, y: p.y + TRAIL_DY }
  })
  return smoothPath(pts)
}

export default function GameMap() {
  const { NODES, progress, openNode, gotoScreen } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend }

  const doneCount = NODES.filter((n) => progress[n.id] === 'done').length
  const pct = Math.round((doneCount / NODES.length) * 100)
  const path = trailPath(NODES.length)

  return (
    <div className="stage-scroll map-scroll">
      <div className="bg-slot" style={{ backgroundImage: 'url(/bg/map.png)' }} />

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

      <div className="map-board" style={{ width: BOARD.w, height: BOARD.h }}>
        <svg className="map-trail" viewBox={`0 0 ${BOARD.w} ${BOARD.h}`} aria-hidden>
          <defs>
            <linearGradient id="trailgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#16f2ff" />
              <stop offset="0.5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ff2bd6" />
            </linearGradient>
            <path id="maptrail" d={path} fill="none" />
          </defs>
          {/* glowing base line */}
          <use href="#maptrail" className="mt-base" />
          {/* directional chevrons flowing along the curve */}
          <text className="mt-arrows" dominantBaseline="central">
            <textPath href="#maptrail" startOffset="0">
              {'❯'.repeat(120)}
              <animate attributeName="startOffset" from="0" to="47" dur="1.3s" repeatCount="indefinite" />
            </textPath>
          </text>
        </svg>

        {NODES.map((node, i) => {
          const status = progress[node.id]
          const locked = status === 'locked'
          const done = status === 'done'
          const { x, y } = nodePos(i, NODES.length)
          const title = t(`nodes.${node.id}.title`, vars)
          return (
            <button
              key={node.id}
              className={`mnode accent-${node.accent} ${status} ${node.kind}`}
              style={{ left: `${x}px`, top: `${y}px` }}
              disabled={locked}
              onClick={() => openNode(node.id)}
              title={locked ? t('map.lockedTip') : title}
            >
              <span className="mnode-index mono">{String(node.index).padStart(2, '0')}</span>
              <span className="mnode-label">{title}</span>
              <span className="mnode-orb">
                <span className="mnode-icon">{locked ? '🔒' : NODE_ICON[node.id]}</span>
              </span>
              <span className="mnode-pedestal" />
              <span className="mnode-status">
                {done && <span className="chip ok">✓</span>}
                {status === 'available' && <span className="chip warn pulse">▶</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
