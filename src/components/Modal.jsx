import { useEffect } from 'react'
import CloseButton from './CloseButton.jsx'
import './Modal.css'

/* Reusable neon modal. Pass accent: 'cyan' | 'magenta' | 'purple' | 'green'. */
export default function Modal({ open, onClose, title, accent = 'cyan', children, width = 560, className = '' }) {
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
        className={`modal panel clip panel-glow-${accent} fade-in ${className}`}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          {title && <h3 className={`accent-${accent}`}>{title}</h3>}
          <CloseButton onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
