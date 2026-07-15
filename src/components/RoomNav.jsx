import { useEffect, useRef } from 'react'
import './RoomNav.css'

/* A "look around the room" navigator: a set of viewpoints you pan between
   with ◀ ▶ arrows, the arrow keys, or the labelled tabs. Controlled — the
   parent owns the active index so it can also jump programmatically (e.g.
   auto-panning to a station when something is solved).

   Props:
   - views: [{ id, label, icon, content }]
   - index: active view index
   - onChange(nextIndex)
   - accent: 'cyan' | 'magenta' | 'purple' | 'amber' | 'green'
*/
export default function RoomNav({ views, index, onChange, accent = 'cyan' }) {
  const prev = useRef(index)
  const dir = index >= prev.current ? 1 : -1
  useEffect(() => { prev.current = index }, [index])

  const go = (next) => { if (next >= 0 && next < views.length) onChange(next) }

  // Arrow-key navigation (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'ArrowRight') go(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, views.length])

  const view = views[index]

  return (
    <div className={`rn-wrap accent-${accent}`}>
      <div className="rn-tabs">
        {views.map((v, i) => (
          <button
            key={v.id}
            className={`rn-tab ${i === index ? 'on' : ''}`}
            onClick={() => go(i)}
          >
            <span className="rn-tab-icon">{v.icon}</span>
            <span className="rn-tab-label">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="rn-viewport">
        <button className="rn-arrow left" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Look left">‹</button>

        <div className="rn-view" key={view.id} data-dir={dir}>
          {view.content}
        </div>

        <button className="rn-arrow right" onClick={() => go(index + 1)} disabled={index === views.length - 1} aria-label="Look right">›</button>
      </div>

      <div className="rn-dots">
        {views.map((v, i) => (
          <button
            key={v.id}
            className={`rn-dot ${i === index ? 'on' : ''}`}
            onClick={() => go(i)}
            aria-label={v.label}
          />
        ))}
      </div>
    </div>
  )
}
