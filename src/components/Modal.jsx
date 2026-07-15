import { useEffect } from 'react'
import './Modal.css'

/* Reusable neon modal. Pass accent: 'cyan' | 'magenta' | 'purple' | 'green'. */
export default function Modal({ open, onClose, title, accent = 'cyan', children, width = 560 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal panel clip panel-glow-${accent} fade-in`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          {title && <h3 className={`accent-${accent}`}>{title}</h3>}
          <button className="modal-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
