import { useId } from 'react'

const PALETTES = {
  coupon: ['#fff2a6', '#f29b24'],
  phone: ['#7deafa', '#1683ae'],
  tablet: ['#dbeaf7', '#6e91b5'],
  cash: ['#9bf4bb', '#279875'],
  console: ['#ead8ff', '#8c56ca'],
  headset: ['#d2a3ff', '#7340b1'],
  laptop: ['#d7e6f6', '#718ca9'],
  none: ['#a6aec7', '#555d79'],
}

// Small arcade illustrations. Labels remain translated by the wheel itself.
export default function RoulettePrizeIcon({ type }) {
  const id = useId().replace(/:/g, '')
  const paint = (name) => `url(#${id}-${name})`
  const [light, dark] = PALETTES[type]
  let artwork

  if (type === 'coupon') artwork = (
    <g transform="rotate(-12 32 32)">
      <path d="M9 17h46v10a6 6 0 0 0 0 12v10H9V39a6 6 0 0 0 0-12Z" fill="#91500d" stroke="none" />
      <path d="M8 14h46v10a6 6 0 0 0 0 12v10H8V36a6 6 0 0 0 0-12Z" fill={paint('body')} stroke="#a55c16" />
      <path d="M15 18h32M15 42h32" stroke="#fff8d0" strokeWidth="1.4" strokeDasharray="2 3" />
      <path d="M25 38l14-16" stroke="#8c4b11" strokeWidth="3.5" />
      <circle cx="25" cy="23" r="3.5" fill="#fff9da" stroke="#9c5c1a" strokeWidth="1.8" />
      <circle cx="39" cy="37" r="3.5" fill="#fff9da" stroke="#9c5c1a" strokeWidth="1.8" />
      <path d="M9 15h44" stroke="#fff" strokeOpacity=".55" />
    </g>
  )
  else if (type === 'phone') artwork = (
    <g transform="rotate(9 32 32)">
      <rect x="20" y="8" width="28" height="50" rx="6" fill="#09546f" stroke="none" />
      <rect x="17" y="5" width="28" height="50" rx="6" fill={paint('body')} stroke="#074f71" />
      <rect x="20" y="9" width="22" height="39" rx="3" fill={paint('screen')} stroke="#173958" />
      <path d="M22 11v17l18-17Z" fill="#fff" opacity=".2" stroke="none" />
      <path d="M27 10h8" stroke="#102f4f" strokeWidth="2.4" />
      <rect x="24" y="31" width="6" height="6" rx="1.4" fill="#fff" fillOpacity=".85" stroke="none" />
      <rect x="33" y="31" width="6" height="6" rx="1.4" fill="#ffe879" stroke="none" />
      <path d="M25 41h12M28 51h6" stroke="#e1faff" strokeWidth="1.8" />
      <path d="M19 12v30" stroke="#d9fbff" strokeOpacity=".6" />
    </g>
  )
  else if (type === 'tablet') artwork = (
    <g transform="rotate(-7 32 32)">
      <rect x="14" y="10" width="40" height="46" rx="5" fill="#324d72" stroke="none" />
      <rect x="11" y="7" width="40" height="46" rx="5" fill={paint('body')} stroke="#476684" />
      <rect x="15" y="11" width="32" height="34" rx="2" fill={paint('screen')} stroke="#294b68" />
      <path d="M16 12v19l27-19Z" fill="#fff" opacity=".18" stroke="none" />
      <rect x="20" y="19" width="20" height="18" rx="2" fill="#effaff" fillOpacity=".9" stroke="none" />
      <path d="M24 24h12M24 28h8M24 32h10" stroke="#5489b6" strokeWidth="1.6" />
      <circle cx="31" cy="49" r="1.6" fill="#edf7ff" stroke="#65819a" />
      <path d="M13 13v30" stroke="#fff" strokeOpacity=".5" />
    </g>
  )
  else if (type === 'cash') artwork = (
    <>
      <rect x="7" y="13" width="47" height="30" rx="3" transform="rotate(-10 30 28)" fill="#326f62" stroke="#194d47" />
      <rect x="5" y="18" width="47" height="30" rx="3" fill={paint('body')} stroke="#185e49" />
      <rect x="10" y="23" width="37" height="20" rx="3" fill="none" stroke="#d7ffe3" strokeWidth="1.4" />
      <ellipse cx="28" cy="33" rx="8" ry="10" fill="#e1ffda" fillOpacity=".8" stroke="none" />
      <path d="M31 27q-8-3-8 6t8 6M20 31h9M20 35h8" fill="none" stroke="#327957" strokeWidth="1.5" />
      <path d="M14 30v6M43 29v5" stroke="#e1ffdd" strokeWidth="2" />
      <circle cx="48" cy="47" r="11" fill="#b87919" stroke="#70480b" />
      <circle cx="47" cy="45" r="10" fill={paint('gold')} stroke="#c48722" />
      <circle cx="47" cy="45" r="7" fill="none" stroke="#fff4b3" strokeWidth="1.2" />
      <path d="M49 41q-6-2-6 4t6 4M41 44h6M41 46h6" fill="none" stroke="#976316" strokeWidth="1.4" />
    </>
  )
  else if (type === 'console') artwork = (
    <>
      <path d="M18 19h28q6 0 9 10l4 16q1 9-6 9l-12-9H23l-12 9q-7 0-6-9l4-16q3-10 9-10Z" fill="#34254e" stroke="none" />
      <path d="M17 16h28q6 0 9 10l4 16q1 9-6 9l-12-9H22l-12 9q-7 0-6-9l4-16q3-10 9-10Z" fill={paint('silver')} stroke="#4f5473" />
      <path d="M9 33l-2 9q-1 5 3 6l11-9M53 33l2 9q1 5-3 6l-11-9" fill={paint('body')} stroke="none" />
      <path d="M17 23h6v5h5v6h-5v5h-6v-5h-5v-6h5Z" fill="#33405d" stroke="#17253c" />
      <circle cx="45" cy="24" r="3" fill="#fb759a" stroke="#aa3959" />
      <circle cx="51" cy="30" r="3" fill="#ffdf6a" stroke="#b48b29" />
      <circle cx="39" cy="30" r="3" fill="#70e4e2" stroke="#308784" />
      <circle cx="45" cy="36" r="3" fill="#b195ff" stroke="#7653b2" />
      <path d="M29 25h5M17 18h27" stroke="#fff" strokeOpacity=".65" strokeWidth="1.4" />
    </>
  )
  else if (type === 'headset') artwork = (
    <>
      <path d="M14 34V25a18 18 0 0 1 36 0v9" fill="none" stroke="#42275e" strokeWidth="10" />
      <path d="M12 32V24a20 20 0 0 1 40 0v8" fill="none" stroke={paint('body')} strokeWidth="7" />
      <path d="M14 27v-3a18 18 0 0 1 36 0v3" fill="none" stroke="#eedbff" strokeWidth="1.5" />
      <rect x="6" y="28" width="14" height="23" rx="6" fill={paint('body')} stroke="#4b2b6c" />
      <rect x="44" y="28" width="14" height="23" rx="6" fill={paint('body')} stroke="#4b2b6c" />
      <rect x="15" y="31" width="6" height="18" rx="3" fill="#273548" stroke="#172337" />
      <rect x="43" y="31" width="6" height="18" rx="3" fill="#273548" stroke="#172337" />
      <path d="M10 34v10M54 34v10" stroke="#a9ffff" strokeWidth="2.4" />
      <path d="M51 49q-2 9-13 9" fill="none" stroke="#9cafcb" strokeWidth="3" />
      <rect x="31" y="55" width="9" height="5" rx="2.5" fill="#d7effa" stroke="#617692" />
    </>
  )
  else if (type === 'laptop') artwork = (
    <g transform="rotate(-7 32 32)">
      <rect x="10" y="7" width="43" height="32" rx="3" fill={paint('body')} stroke="#4b6481" />
      <rect x="14" y="11" width="35" height="24" rx="1" fill={paint('screen')} stroke="#203954" />
      <path d="M15 12v16l28-16Z" fill="#fff" opacity=".2" stroke="none" />
      <path d="M22 27l6-7 6 3 8-9" fill="none" stroke="#d5fffd" strokeWidth="1.8" />
      <path d="M10 39h43l8 14q-1 4-5 4H6q-4 0-4-4Z" fill="#4b6079" stroke="none" />
      <path d="M10 38h43l8 13H2Z" fill={paint('silver')} stroke="#566c86" />
      <path d="M14 42h36M11 46h40" stroke="#667e9d" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M25 48h13l2 3H23Z" fill="#a8bed3" stroke="none" />
      <path d="M5 52h52" stroke="#d2e2f4" strokeWidth="1.3" />
    </g>
  )
  else artwork = (
    <>
      <path d="M30 19q-14-1-14-8 1-7 8-3l8 11q7-16 14-11 8 8-12 11" fill="none" stroke="#d7dcef" strokeWidth="3" />
      <rect x="12" y="29" width="37" height="25" rx="2" fill={paint('body')} stroke="#41465f" />
      <rect x="9" y="19" width="43" height="11" rx="2" fill={paint('silver')} stroke="#616880" />
      <path d="M28 20h8v34h-8Z" fill="#525d7b" stroke="none" />
      <path d="M14 33h10" stroke="#d2d8ec" strokeOpacity=".6" />
      <circle cx="49" cy="47" r="12" fill="#832d50" stroke="none" />
      <circle cx="48" cy="45" r="11" fill={paint('red')} stroke="#fa9da5" strokeWidth="1" />
      <path d="M44 41l8 8M52 41l-8 8" stroke="#fff5f3" strokeWidth="3" />
    </>
  )

  return (
    <svg className={`rc-prize-icon rc-prize-icon-${type}`} viewBox="0 0 64 64" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={light} /><stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#226dd8" /><stop offset=".5" stopColor="#8060e9" /><stop offset="1" stopColor="#f17fb9" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff5ab" /><stop offset=".45" stopColor="#ffc54d" /><stop offset="1" stopColor="#dc911c" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff" /><stop offset=".55" stopColor="#dbe7f5" /><stop offset="1" stopColor="#9cadc8" />
        </linearGradient>
        <linearGradient id={`${id}-red`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ff929a" /><stop offset="1" stopColor="#de416a" />
        </linearGradient>
      </defs>
      {artwork}
    </svg>
  )
}
