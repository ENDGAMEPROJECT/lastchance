import { useT } from '../i18n/index.jsx'
import '../rooms/LinkDistrict.css'

/* The "Tablet Nova" flash-sale ad copy (fake lunawear.com-official.shop).
   Shared by the Link District door (luna-3) and the phone images
   (phone-with-ad / offer-phone-only), so the text is translated the same
   everywhere. Styles live in LinkDistrict.css (.luna-ad-3-*) and are sized
   in --pu, set by whichever .door-page wraps this. */
export default function LunaOfferAd() {
  const t = useT()
  return (
    <div className="luna-ad-copy">
      <div className="luna-ad-3-headline">{t('rooms.link.lunaAd3.headline')}</div>
      <div className="luna-ad-3-prices">
        <span className="luna-ad-3-discount">{t('rooms.link.lunaAd3.discount')}</span>
        <span className="luna-ad-3-oldprice">{t('rooms.link.lunaAd3.oldPrice')}</span>
      </div>
      <div className="luna-ad-3-flash" style={{ transform: 'rotate(-5deg)' }}>
        <div className="luna-ad-3-second-headline">{t('rooms.link.lunaAd3.headlineSecond')}</div>
      </div>
      <p className="luna-ad-3-text">
        {t('rooms.link.lunaAd3.text')} 😱😱😱
      </p>
      <div className="luna-ad-3-button">
        <p
          style={{
            fontSize: '1.7em',
            textTransform: 'uppercase',
            color: 'white',
            margin: '0',
            height: '40px',
          }}
        >
          {t('rooms.link.lunaAd3.cta')}
        </p>
        <p style={{ margin: '0', padding: '0 0 8px 0' }}>
          {t('rooms.link.lunaAd3.timePressure')}
        </p>
      </div>
    </div>
  )
}
