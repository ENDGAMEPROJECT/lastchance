import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
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

/* The city map / progress tracker. Nodes sit on a neon route; the
   player travels Start → … → Final. Locked nodes can't be entered. */
export default function GameMap() {
  const { NODES, progress, openNode } = useGame()
  const t = useT()
  const vars = { friend: NARRATIVE.friend }

  const doneCount = NODES.filter((n) => progress[n.id] === 'done').length
  const pct = Math.round((doneCount / NODES.length) * 100)

  return (
    <div className="stage-scroll">
      <div className="map-head fade-in">
        <div className="eyebrow">{t('map.eyebrow')}</div>
        <h2>{t('map.titleLead')} <span style={{ color: 'var(--cyan)' }}>{t('map.titleAccent')}</span></h2>
        <p className="muted">{t('map.subtitle')}</p>
        <div className="map-progress">
          <div className="map-progress-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="mono t-sm">{doneCount}/{NODES.length} · {pct}%</span>
        </div>
      </div>

      <div className="map-route">
        <div className="route-start chip ok">{t('map.start', vars)}</div>

        <div className="route-nodes">
          {NODES.map((node, i) => {
            const status = progress[node.id]
            const locked = status === 'locked'
            const done = status === 'done'
            const title = t(`nodes.${node.id}.title`, vars)
            return (
              <div className="route-cell" key={node.id}>
                {i > 0 && <div className={`route-link ${progress[NODES[i - 1].id] === 'done' ? 'lit' : ''}`} />}
                <button
                  className={`map-node accent-${node.accent} ${status} ${node.kind}`}
                  disabled={locked}
                  onClick={() => openNode(node.id)}
                  title={locked ? t('map.lockedTip') : title}
                >
                  <div className="node-index mono">{String(node.index).padStart(2, '0')}</div>
                  <div className="node-icon">{locked ? '🔒' : NODE_ICON[node.id]}</div>
                  <div className="node-title">{title}</div>
                  <div className="node-sub mono">{t(`nodes.${node.id}.subtitle`, vars)}</div>
                  <div className="node-blurb">{t(`nodes.${node.id}.blurb`, vars)}</div>
                  <div className="node-status">
                    {done && <span className="chip ok">{t('common.cleared')}</span>}
                    {status === 'available' && <span className="chip warn pulse">{t('common.enterNode')}</span>}
                    {locked && <span className="chip">{t('common.locked')}</span>}
                  </div>
                  <span className="node-kind-tag mono">{t(`nodes.${node.id}.kind`)}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
