import { bgUrl } from '../game/assets.js'
import LunaOfferAd from './LunaOfferAd.jsx'
import './PhoneAd.css'

/* Phone artwork whose screen holds only the ad's background; the ad text is
   rendered on top as live, translated HTML (same copy + CSS as the Link
   District luna-3 door).

   `screen` is the purple screen area measured in the source image's pixels
   (below the browser bar, which is part of the artwork). */
const PHONES = {
  'phone-with-ad': {
    file: 'phone-with-ad.png',
    w: 1728, h: 998,
    screen: { x: 703, y: 183, w: 390, h: 684 },
  },
  'offer-phone-only': {
    file: 'offer-phone-only.png',
    w: 472, h: 915,
    screen: { x: 34, y: 144, w: 404, h: 684 },
  },
}

/* The door page is ~242px wide at --pu 16px; scale --pu with the phone's
   screen width so the ad keeps the same proportions at any size. Raise
   PU_PER_SCREEN to make the text smaller. */
const PU_PER_SCREEN = 17

const pct = (v, total) => `${(v / total) * 100}%`

export default function PhoneAd({ variant = 'phone-with-ad', className = '', alt, onLoad }) {
  const p = PHONES[variant]
  const s = p.screen
  return (
    <div
      className={`phone-ad phone-ad--${variant} ${className}`}
      style={{ aspectRatio: `${p.w} / ${p.h}` }}
      role="img"
      aria-label={alt}
    >
      <img className="phone-ad-img" src={bgUrl(p.file)} alt="" onLoad={onLoad} draggable={false} />
      <div
        className="door-page phone-ad-screen"
        aria-hidden="true"
        style={{
          left: pct(s.x, p.w),
          top: pct(s.y, p.h),
          width: pct(s.w, p.w),
          height: pct(s.h, p.h),
          '--pu': `${((s.w / p.w) * 100) / PU_PER_SCREEN}cqw`,
        }}
      >
        <LunaOfferAd />
      </div>
    </div>
  )
}
