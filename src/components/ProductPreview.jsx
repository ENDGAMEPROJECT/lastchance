import { useEffect, useState } from 'react'
import { useT } from '../i18n/index.jsx'
import './ProductPreview.css'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/* The scam "deal" the friend is looking at: an influencer flash-sale post
   in a phone frame, with a live-ticking countdown. Pure CSS/SVG. Shown
   beside the pre/post-test conversation for context. */
export default function ProductPreview({ seconds = 1680, urgent = false }) {
  const t = useT()
  const p = t('story.product')
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    setLeft(seconds)
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [seconds])

  const low = urgent || left <= 300

  return (
    <div className="pp-phone">
      <div className="pp-notch" />
      <div className="pp-screen">
        {/* Status bar — the notch sits over this, not the content below. */}
        <div className="pp-statusbar">
          <span className="pp-time mono">9:41</span>
          <span className="pp-status-icons" aria-hidden>▮▮▮ 🔋</span>
        </div>
        {/* Browser address bar — the store link is visible for inspection
            (it's the spoofed URL), but it is not a clickable element. */}
        <div className="pp-linkbar" aria-label={p.url}>
          <span className="pp-lock" aria-hidden>🔒</span>
          <span className="pp-url">{p.url}</span>
        </div>
        <div className="pp-head">
          <div className="pp-ava" aria-hidden>🙋‍♀️</div>
          <div className="pp-who">
            <span className="pp-handle">@{p.handle} <span className="pp-verified">✓</span></span>
            <span className="pp-sponsored">{p.sponsored}</span>
          </div>
          <span className="pp-more">⋯</span>
        </div>

        <div className="pp-media">
          <div className="pp-sale">{p.saleBadge}</div>
          <div className="pp-tablet"><span className="pp-tablet-screen">{p.name}</span></div>
          <div className="pp-price">
            <span className="pp-was">{p.wasPrice}</span>
            <span className="pp-now">{p.nowPrice}</span>
          </div>
          <div className={`pp-timer ${low ? 'low' : ''}`}>
            <span>{p.endsIn}</span>
            <b className="mono">{fmt(left)}</b>
          </div>
        </div>

        <button className="pp-buy" disabled>{p.buy}</button>
        <div className="pp-likes">{p.likes}</div>
        <div className="pp-caption"><b>@{p.handle}</b> {p.caption}</div>
      </div>
    </div>
  )
}
