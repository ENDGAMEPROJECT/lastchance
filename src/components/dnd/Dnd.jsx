import {
  createContext, useContext, useRef, useState, useEffect, useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import { useStage } from '../Stage.jsx'
import './Dnd.css'

/* ============================================================
   Pointer-based drag-and-drop.

   Why not native HTML5 DnD? The whole game lives inside a CSS
   transform: scale() stage, which breaks native drag images and
   coordinate math. This primitive uses pointer events + screen-space
   getBoundingClientRect hit-testing, so it is correct at any scale and
   works with mouse and touch. It also supports a tap-to-select then
   tap-to-place fallback for touch / accessibility.

   API:
     <DndProvider> ... </DndProvider>          (place inside <Stage>)
     <Draggable id data kind>{visual}</Draggable>
     <DropZone id accept={['label']} onDrop={(data, sourceId) => {}}>…</DropZone>
   ============================================================ */

const DndContext = createContext(null)
const cx = (...a) => a.filter(Boolean).join(' ')

export function useDnd() {
  const ctx = useContext(DndContext)
  if (!ctx) throw new Error('useDnd must be used within <DndProvider>')
  return ctx
}

export function DndProvider({ children }) {
  const { scale } = useStage()
  const zones = useRef(new Map()) // id -> { getEl, accepts, onDrop }
  const [drag, setDrag] = useState(null) // active pointer drag
  const [overId, setOverId] = useState(null)
  const [selected, setSelected] = useState(null) // tap-to-place selection
  const dragRef = useRef(null)
  const selectedRef = useRef(null)
  dragRef.current = drag
  selectedRef.current = selected

  const registerZone = useCallback((id, api) => {
    zones.current.set(id, api)
    return () => zones.current.delete(id)
  }, [])

  const zoneUnderPoint = useCallback((x, y) => {
    for (const [id, api] of zones.current) {
      const el = api.getEl()
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { id, api }
    }
    return null
  }, [])

  const beginDrag = useCallback((payload) => {
    setSelected(null)
    setDrag({ ...payload, moved: false, startX: payload.x, startY: payload.y })
  }, [])

  // Tap-to-place: drop the currently selected item into a zone by id.
  const dropSelected = useCallback((zoneId) => {
    const z = zones.current.get(zoneId)
    const sel = selectedRef.current
    if (z && sel && z.accepts(sel.kind)) z.onDrop(sel.data, sel.sourceId)
    setSelected(null)
  }, [])

  const clearSelection = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!drag) return
    const move = (e) => {
      const x = e.clientX, y = e.clientY
      setDrag((d) => (d ? { ...d, x, y, moved: d.moved || Math.hypot(x - d.startX, y - d.startY) > 6 } : d))
      const hit = zoneUnderPoint(x, y)
      setOverId(hit && hit.api.accepts(drag.kind) ? hit.id : null)
    }
    const up = (e) => {
      const d = dragRef.current
      const x = e.clientX ?? d?.x, y = e.clientY ?? d?.y
      const hit = zoneUnderPoint(x, y)
      if (d && d.moved && hit && hit.api.accepts(d.kind)) {
        hit.api.onDrop(d.data, d.sourceId)
      } else if (d && !d.moved) {
        // A tap (no real movement) → select for tap-to-place.
        setSelected({ data: d.data, kind: d.kind, sourceId: d.sourceId })
      }
      setDrag(null)
      setOverId(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [drag, zoneUnderPoint])

  const value = { beginDrag, registerZone, dropSelected, clearSelection, drag, overId, selected }

  return (
    <DndContext.Provider value={value}>
      {children}
      {drag && drag.moved &&
        createPortal(
          <div className="dnd-ghost" style={{ left: drag.x, top: drag.y, width: drag.w, height: drag.h }}>
            <div
              className="dnd-ghost-inner"
              style={{ width: drag.w / scale, height: drag.h / scale, transform: `scale(${scale})` }}
            >
              {drag.children}
            </div>
          </div>,
          document.body,
        )}
    </DndContext.Provider>
  )
}

/* A draggable element. Renders `children` as its visual; while being
   dragged, the same visual follows the pointer as a ghost. */
export function Draggable({
  id, data, kind, disabled, className, as: Tag = 'div', children, ...rest
}) {
  const { beginDrag, drag, selected } = useDnd()
  const ref = useRef(null)
  const isDragging = drag?.sourceId === id
  const isSelected = selected?.sourceId === id

  const onPointerDown = (e) => {
    if (disabled) return
    if (e.button != null && e.button > 0) return
    const rect = ref.current.getBoundingClientRect()
    e.preventDefault()
    beginDrag({ id, sourceId: id, data, kind, rect, x: e.clientX, y: e.clientY, w: rect.width, h: rect.height, children })
  }

  return (
    <Tag
      ref={ref}
      className={cx('dnd-draggable', className, isDragging && 'dnd-dragging', isSelected && 'dnd-selected', disabled && 'dnd-disabled')}
      onPointerDown={onPointerDown}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* A drop target. `accept` is a list of kinds (omit to accept anything). */
export function DropZone({
  id, accept, onDrop, disabled, className, overClassName, as: Tag = 'div', children, ...rest
}) {
  const { registerZone, overId, selected, dropSelected } = useDnd()
  const ref = useRef(null)
  const api = useRef({})
  api.current.accepts = (k) => !disabled && (accept ? accept.includes(k) : true)
  api.current.onDrop = (data, sourceId) => onDrop?.(data, sourceId)

  useEffect(
    () => registerZone(id, {
      getEl: () => ref.current,
      accepts: (k) => api.current.accepts(k),
      onDrop: (d, s) => api.current.onDrop(d, s),
    }),
    [id, registerZone],
  )

  const isOver = overId === id
  const canTapDrop = selected && api.current.accepts(selected.kind)

  const onClick = () => { if (canTapDrop) dropSelected(id) }

  return (
    <Tag
      ref={ref}
      className={cx('dnd-zone', className, isOver && 'dnd-over', isOver && overClassName, canTapDrop && 'dnd-can-drop')}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Tag>
  )
}
