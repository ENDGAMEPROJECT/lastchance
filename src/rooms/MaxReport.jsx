import { useId } from 'react'
import { assetUrl } from '../game/assets.js'
import './MaxReport.css'

/* Max's data profile: a vector rebuild of the "user analysis" dashboard.
   Every module animates on its own clock (bars breathe, lines morph, rings
   fill, nodes pulse) while all text stays static. The centre column is left
   hosts the hologram of Max (`figure`, an image URL; defaults to his PNG).
   Labels are deliberately English-only (decorative UI, never translated). */
const W = 1600
const H = 800
const L = {
  title: 'USER PROFILE',
  loading: 'LOADING',
  profile: 'PROFILE',
  id: 'ID',
  age: 'AGE',
  gender: 'GENDER',
  genderValue: 'M',
  status: 'STATUS',
  online: 'ONLINE',
  location: 'LOCATION',
  locationValue: 'TOKYO',
  locationCity: 'TOKYO, JP',
  joined: 'JOINED',
  creative: 'CREATIVE',
  tech: 'TECH',
  social: 'SOCIAL',
  intellect: 'INTELLECT',
  gaming: 'GAMING',
  other: 'OTHER',
  analytics: 'ANALYTICS',
  totalActivity: 'TOTAL ACTIVITY',
  mood: 'MOOD TRACKER',
  days: ['MON','TUE','WED','THU','FRI','SAT','SUN'],
  behavior: 'BEHAVIOR TREND',
  behaviorRows: ['Online','Social','Creative'],
  emotion: 'EMOTION',
  emotions: ['FOCUSED','RELAXED','STRESSED'],
  network: 'NETWORK',
  global: 'GLOBAL',
  nodes: 'NODES',
  regions: ['ASIA','N. AM','EU','OTHER'],
  activity: 'ACTIVITY',
  hoursOnline: 'HOURS ONLINE',
  app: 'APP',
  web: 'WEB',
  game: 'GAME',
  interaction: 'INTERACTION',
  connections: 'CONNECTIONS',
  interactionRows: ['FRIENDS','FOLLOWERS','CREATORS','BRANDS'],
  habits: 'HABITS',
  habitRows: ['SLEEP','STEPS','CAL','BATTERY'],
  interests: 'INTERESTS',
  interestRows: ['GAMING','TECH','MUSIC','ANIME','AI / SCIENCE'],
  media: 'MEDIA CONSUMPTION',
  mediaLine: 'VIDEO 56%  MUSIC 22%  READ 12%  OTHER 10%',
  tags: 'TOP TAGS',
  tagRows: ['#gaming','#tech','#anime'],
  system: 'SYSTEM STATUS',
  cpu: 'CPU',
  gpu: 'GPU',
  scanComplete: 'SCAN COMPLETE',
  states: ['ONLINE','ACTIVE','STABLE','SYNCED'],
  lastSeen: 'LAST SEEN',
  prefs: 'INTERESTS & PREFERENCES',
  prefRows: ['GAMING','SPORTS','MUSIC','TECH'],
  device: 'DEVICE USAGE',
  deviceRows: ['PHONE','PC','TABLET','TV'],
  content: 'CONTENT ANALYSIS',
  contentRows: ['ENTERTAINMENT','EDUCATION','TECH NEWS','GAMING','LIFESTYLE'],
  sentiment: 'SENTIMENT',
  sentimentRows: ['POSITIVE','NEUTRAL','NEGATIVE'],
  engagement: 'ENGAGEMENT',
  last7: 'LAST 7 DAYS',
  scan: 'SCAN',
  scanRows: ['FACE','VOICE','BEHAV','DEVICE','GEOF','RISK'],
  verified: 'IDENTITY VERIFIED',
  platform: 'PLATFORM ACTIVITY',
  skills: 'SKILL MAP',
  skillRows: ['PROGRAMMING','DESIGN','COMMUNICATION','LANGUAGES','PROBLEM SOLVING'],
  community: 'COMMUNITY',
  groups: 'GROUPS',
  active: 'ACTIVE',
  tracking: 'TRACKING',
  weekly: 'WEEKLY ACTIVITY',
  weeklyRows: ['Online','Social','Gaming','Learning','Other'],
  goals: 'GOALS',
  goalRows: ['LEARN','FITNESS','PROJECT','TRAVEL'],
  insights: 'AI INSIGHTS',
  insightRows: ['High creative activity','Increased social engagement'],
  recs: 'RECOMMENDATIONS',
  recRows: ['New games for you','Tech videos to watch'],
  events: 'NEXT EVENTS',
  eventRows: ['Online Event','Project Deadline'],
}
const C = { cyan: '#36e6ff', blue: '#2f7bff', violet: '#8a4dff', magenta: '#e04cff', green: '#3dffa8', track: '#13234a' }

// Deterministic pseudo-random so every render (and reload) looks the same.
const rnd = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v) }
const cut = (x, y, w, h, c = 10) => `M${x + c} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h - c}L${x + w - c} ${y + h}H${x + c}L${x} ${y + h - c}V${y + c}Z`
const sec = (n) => `${n.toFixed(2)}s`
const timing = (d, dur, extra) => ({ '--d': sec(d), '--dur': sec(dur), ...extra })
const toPts = (vals, x, y, w, h, max = 100) =>
  vals.map((v, i) => `${+(x + (i * w) / (vals.length - 1)).toFixed(1)},${+(y + h - (v / max) * h).toFixed(1)}`).join(' ')
// SMIL props that cycle through `frames` with eased transitions and loop seamlessly.
const loop = (frames) => ({
  values: [...frames, frames[0]].join(';'),
  keyTimes: [...frames, 0].map((_, i) => +(i / frames.length).toFixed(3)).join(';'),
  keySplines: frames.map(() => '.45 0 .55 1').join(';'),
  calcMode: 'spline',
  repeatCount: 'indefinite',
})
// Periodic waveform (harmonics of `period`) so translating it by one period loops cleanly.
const wave = (x0, y0, amp, period, periods, seed = 0) => {
  let d = ''
  for (let t = 0; t <= period * periods; t += 3) {
    const a = (2 * Math.PI * t) / period
    const y = y0 + amp * (0.55 * Math.sin(a + seed) + 0.3 * Math.sin(3 * a + seed * 2) + 0.15 * Math.sin(7 * a))
    d += `${t ? 'L' : 'M'}${(x0 + t).toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}
const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)]

// Rough continents in a unit box, drawn as a dot matrix.
const LAND = [
  [[.05, .15], [.3, .06], [.34, .24], [.26, .44], [.18, .5], [.09, .34]],
  [[.24, .55], [.33, .58], [.31, .82], [.26, .96], [.22, .7]],
  [[.44, .12], [.55, .08], [.57, .3], [.46, .33]],
  [[.44, .38], [.58, .36], [.63, .55], [.54, .86], [.48, .66], [.42, .48]],
  [[.56, .07], [.93, .12], [.96, .3], [.86, .48], [.76, .56], [.66, .45], [.58, .32]],
  [[.8, .7], [.92, .67], [.95, .82], [.82, .86]],
]

const ICONS = {
  pad: 'M-22 -8Q-24 -15 -15 -15H15Q24 -15 22 -8L26 10Q27 19 18 15L10 7H-10L-18 15Q-27 19 -26 10ZM-15 -4H-5M-10 -9V1',
  ball: 'M0 -20A20 20 0 1 0 0.1 -20ZM0 -7L7 -2 4 6H-4L-7 -2ZM0 -7V-20M7 -2L19 -6M4 6L11 17M-4 6L-11 17M-7 -2L-19 -6',
  note: 'M-4 12V-14L18 -19V7M-4 -5L18 -10M-4 12A6 5 0 1 1 -4 11.9M18 7A6 5 0 1 1 18 6.9',
  vr: 'M-24 -6Q-24 -13 -16 -13H16Q24 -13 24 -6V5Q24 12 16 12H6L0 6L-6 12H-16Q-24 12 -24 5ZM-24 -3H-29M24 -3H29M-14 -2H-4M4 -2H14',
}

export default function MaxReport({ figure = assetUrl('algorithm-room/max-figure-nobg.png') }) {
  const id = useId().replace(/:/g, '')
  const ref = (name) => `url(#${id}-${name})`

  const text = (x, y, str, cls = 'mr-t', anchor) => <text x={x} y={y} className={cls} textAnchor={anchor}>{str}</text>

  // One loading screen over the whole dashboard; modules power on (staggered) once it clears.
  const loader = () => {
    const cx = W / 2
    const cy = H / 2
    const barW = 420
    return (
      <g className="mr-loader" style={{ '--d': '0s' }}>
        <rect width={W} height={H} fill="#030a22"/>
        <path d={cut(8, 8, W - 16, H - 16, 18)} fill="none" stroke={C.cyan} strokeOpacity=".55" strokeDasharray="10 7"/>
        <rect x="10" y="10" width={W - 20} height={H - 20} fill={ref('lines')}/>
        <rect className="mr-ld-sweep" x="10" y="10" width={W - 20} height="3" fill="#9ff6ff" opacity=".6" style={{ '--h': `${H - 24}px` }}/>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} className="mr-ld-tear" x={20 + rnd(i + 3) * W * 0.4} y={20 + rnd(i * 7 + 1) * (H - 40)}
            width={W * (0.15 + rnd(i + 11) * 0.45)} height={1 + rnd(i + 5) * 8} fill={[C.cyan, C.magenta, '#ffffff'][i % 3]}
            style={{ '--dur': sec(0.5 + rnd(i * 3) * 0.9), '--dl': sec(rnd(i + 9) * 1.2) }}/>
        ))}
        <circle className="mr-spin" cx={cx} cy={cy - 70} r="26" fill="none" stroke={C.cyan} strokeWidth="5"
          strokeDasharray="55 108" strokeLinecap="round" filter={ref('glow')} style={{ '--dur': '.8s' }}/>
        <circle className="mr-spin mr-rev" cx={cx} cy={cy - 70} r="38" fill="none" stroke={C.magenta} strokeWidth="2"
          strokeDasharray="30 50" strokeOpacity=".8" style={{ '--dur': '1.6s' }}/>
        {['mr-ld mr-ld-m', 'mr-ld mr-ld-c', 'mr-ld mr-ld-main'].map((cls) => (
          <text key={cls} x={cx} y={cy + 12} className={cls} textAnchor="middle" style={{ fontSize: '40px' }}>{L.loading}</text>
        ))}
        <rect x={cx - barW / 2} y={cy + 42} width={barW} height="6" fill={C.track}/>
        <rect className="mr-ld-bar" x={cx - barW / 2} y={cy + 42} width={barW} height="6" fill={ref('flow')} filter={ref('glow')}/>
      </g>
    )
  }

  const panel = (key, x, y, w, h, title, d, children, small, deco = !small) => {
    // Orbitron runs ~0.8em per glyph; squeeze titles that would overflow.
    const est = (title?.length || 0) * (small ? 11 : 15) * 0.8
    const showDeco = deco && est <= w - 104
    const room = w - 34 - (showDeco ? 70 : 14)
    return (
    <g key={key}>
    <g className="mr-panel" style={{ '--d': sec(d) }}>
      <path d={cut(x, y, w, h)} fill={ref('panel')} stroke={C.cyan} strokeOpacity=".75" strokeWidth="1.5"/>
      <path d={cut(x + 5, y + 5, w - 10, h - 10, 7)} fill="none" stroke={C.violet} strokeOpacity=".45"/>
      <path d={cut(x, y, w, h)} pathLength="100" className="mr-flow" style={timing(d, 5 + rnd(x + y) * 6)}/>
      {title && <>
        <rect x={x + 14} y={y + (small ? 9 : 12)} width={small ? 10 : 13} height={small ? 10 : 13} rx="3" fill="none" stroke={C.cyan} strokeWidth="2"/>
        <text x={x + (small ? 30 : 34)} y={y + (small ? 18 : 24)} className={small ? 'mr-h mr-h-s' : 'mr-h'}
          {...(!small && est > room ? { textLength: room, lengthAdjust: 'spacingAndGlyphs' } : {})}>{title}</text>
        {showDeco && <path className="mr-blink" style={{ '--d': sec(rnd(x) * 3), '--dur': sec(2 + rnd(y) * 3) }}
          d={`M${x + w - 58} ${y + 23}l6 -10M${x + w - 50} ${y + 23}l6 -10M${x + w - 42} ${y + 23}l6 -10M${x + w - 34} ${y + 23}l6 -10`} stroke={C.violet} strokeWidth="2"/>}
      </>}
      {children}
    </g>
    </g>
    )
  }

  const bars = (key, x, base, w, h, vals, d, fill = ref('bar'), gap = 3) => {
    const bw = (w - gap * (vals.length - 1)) / vals.length
    return vals.map((v, i) => {
      const bh = Math.max(2, (v / 100) * h)
      return <rect key={`${key}${i}`} className="mr-bar" x={x + i * (bw + gap)} y={base - bh} width={bw} height={bh} fill={fill}
        style={timing(d + i * 0.035, 1.4 + rnd(i + x) * 2.6, { '--lo': (0.4 + rnd(i * 3 + base) * 0.45).toFixed(2) })}/>
    })
  }

  const hbar = (key, x, y, w, v, d, fill = ref('flow'), hh = 6) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={hh} fill={C.track}/>
      <rect className="mr-hbar" x={x} y={y} width={(w * v) / 100} height={hh} fill={fill}
        style={timing(d, 2.2 + rnd(x + y) * 3, { '--lo': (0.78 + rnd(y) * 0.14).toFixed(2) })}/>
    </g>
  )

  const ring = (key, cx, cy, r, v, d, color = C.cyan, sw = 6) => (
    <g key={key}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.track} strokeWidth={sw}/>
      <circle className="mr-arc" cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        pathLength="100" strokeDasharray="100 100" transform={`rotate(-90 ${cx} ${cy})`} filter={ref('glow')}
        style={timing(d, 2.5 + rnd(cx) * 3, { '--v': v })}/>
      <circle className="mr-spin" cx={cx} cy={cy} r={r + sw} fill="none" stroke={color} strokeOpacity=".5" strokeDasharray="2 7"
        style={timing(0, 8 + rnd(cy + cx) * 8)}/>
    </g>
  )

  // Line chart whose data morphs between frames, drawn in on entrance.
  const line = (key, x, y, w, h, sets, d, color, area) => {
    const frames = sets.map((s) => toPts(s, x, y, w, h))
    const base = ` ${x + w},${y + h} ${x},${y + h}`
    const dur = `${sets.length * 2.6}s`
    return (
      <g key={key}>
        {area && <polygon points={frames[0] + base} fill={area} opacity=".35">
          <animate attributeName="points" dur={dur} {...loop(frames.map((f) => f + base))}/>
        </polygon>}
        <polyline className="mr-line" points={frames[0]} pathLength="1" fill="none" stroke={color} strokeWidth="2.5"
          strokeLinejoin="round" filter={ref('glow')} style={{ '--d': sec(d) }}>
          <animate attributeName="points" dur={dur} {...loop(frames)}/>
        </polyline>
        <rect className="mr-cursor" x={x} y={y} width="2" height={h} fill={C.cyan}
          style={timing(d + 1, 3 + rnd(x) * 2, { '--w': `${w}px` })}/>
      </g>
    )
  }

  const ripple = (key, cx, cy, r, d, dur, color = C.cyan) =>
    <circle key={key} className="mr-ripple" cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2" style={timing(d, dur)}/>

  // ---------- data ----------
  const radarC = [250, 200]
  const radarSets = [[78, 92, 88, 56, 84], [70, 97, 80, 63, 89], [85, 86, 93, 50, 77]]
  const radarPt = (v, k) => polar(radarC[0], radarC[1], (50 * v) / 100, -90 + 72 * k)
  const radarFrames = radarSets.map((s) => s.map((v, k) => radarPt(v, k).map((n) => n.toFixed(1)).join(',')).join(' '))
  const mapBox = [22, 345, 230, 112]
  const mp = ([u, v]) => [mapBox[0] + u * mapBox[2], mapBox[1] + v * mapBox[3]]
  const tokyo = mp([.89, .33])
  const hubs = [mp([.2, .3]), mp([.5, .2]), mp([.27, .7]), mp([.87, .76])]
  const nodes = [[385, 525], [432, 507], [482, 522], [412, 560], [462, 566], [497, 596], [392, 600], [442, 604]]
  const edges = [[0, 1], [1, 2], [0, 3], [1, 3], [3, 4], [2, 4], [4, 5], [3, 6], [6, 7], [4, 7], [5, 7], [1, 4]]
  const days = L.days || []

  return (
    <svg className="max-report" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={L.title}>
      <defs>
        <linearGradient id={`${id}-panel`} x2="0" y2="1"><stop stopColor="#071233"/><stop offset="1" stopColor="#040920"/></linearGradient>
        <linearGradient id={`${id}-bar`} x2="0" y2="1"><stop stopColor={C.cyan}/><stop offset=".6" stopColor={C.blue}/><stop offset="1" stopColor={C.violet}/></linearGradient>
        <linearGradient id={`${id}-barM`} x2="0" y2="1"><stop stopColor="#ff6bf0"/><stop offset="1" stopColor={C.violet}/></linearGradient>
        <linearGradient id={`${id}-flow`}><stop stopColor={C.blue}/><stop offset=".6" stopColor={C.cyan}/><stop offset="1" stopColor="#c8fbff"/></linearGradient>
        <linearGradient id={`${id}-flowM`}><stop stopColor={C.violet}/><stop offset="1" stopColor={C.magenta}/></linearGradient>
        <linearGradient id={`${id}-areaC`} x2="0" y2="1"><stop stopColor={C.cyan} stopOpacity=".7"/><stop offset="1" stopColor={C.cyan} stopOpacity="0"/></linearGradient>
        <linearGradient id={`${id}-areaM`} x2="0" y2="1"><stop stopColor={C.magenta} stopOpacity=".7"/><stop offset="1" stopColor={C.magenta} stopOpacity="0"/></linearGradient>
        <linearGradient id={`${id}-beam`} x2="0" y2="1"><stop stopColor={C.cyan} stopOpacity="0"/><stop offset=".5" stopColor="#bff8ff" stopOpacity=".8"/><stop offset="1" stopColor={C.cyan} stopOpacity="0"/></linearGradient>
        <linearGradient id={`${id}-scanx`}><stop stopColor={C.cyan} stopOpacity="0"/><stop offset="1" stopColor="#bff8ff" stopOpacity=".9"/></linearGradient>
        <linearGradient id={`${id}-streak`}><stop stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#bff4ff"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
        <radialGradient id={`${id}-holo`} cy="1" r="1"><stop stopColor={C.blue} stopOpacity=".35"/><stop offset="1" stopColor={C.blue} stopOpacity="0"/></radialGradient>
        <radialGradient id={`${id}-sweep`} r=".5"><stop stopColor={C.cyan} stopOpacity=".05"/><stop offset="1" stopColor={C.cyan} stopOpacity=".55"/></radialGradient>
        <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#0f2c55" strokeWidth=".6"/></pattern>
        <pattern id={`${id}-lines`} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill={C.cyan} opacity=".22"/></pattern>
        <pattern id={`${id}-dots`} width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.25" fill="#3d7dff"/></pattern>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id={`${id}-land`}>{LAND.map((poly, i) => <polygon key={i} points={poly.map(mp).map((p) => p.join(',')).join(' ')}/>)}</clipPath>
        <clipPath id={`${id}-wave1`}><rect x="1090" y="300" width="88" height="70"/></clipPath>
        <clipPath id={`${id}-wave2`}><rect x="1208" y="300" width="110" height="22"/></clipPath>
        <clipPath id={`${id}-face`}><circle cx="1420" cy="170" r="54"/></clipPath>
        <clipPath id={`${id}-slot`}><rect x="690" y="80" width="220" height="660"/></clipPath>
        <clipPath id={`${id}-bay`}><rect x="656" y="76" width="288" height="672"/></clipPath>
      </defs>

      {/* ---------- backdrop ---------- */}
      <rect width={W} height={H} fill="#02051a"/>
      <rect width={W} height={H} fill={ref('grid')} opacity=".55"/>
      <g fill="none" stroke={C.cyan} strokeOpacity=".5">
        <path d="M10 66H300L312 56H560L572 66H640M960 66H1000L1012 56H1300L1312 66H1590"/>
        <path d="M640 30H600L590 20H420M960 30H1000L1010 20H1180" strokeOpacity=".35"/>
      </g>
      <g fill={ref('flow')}>
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} className="mr-blink" x={i < 8 ? 20 + i * 48 : 1000 + (i - 8) * 70} y="40" width={i % 3 ? 26 : 40} height="5"
            style={{ '--d': sec(rnd(i) * 3), '--dur': sec(2 + rnd(i + 9) * 4) }}/>
        ))}
      </g>

      {/* ---------- header ---------- */}
      <g className="mr-panel" style={{ '--d': '0s' }}>
        <path d={cut(650, 6, 300, 66, 14)} fill={ref('panel')} stroke={C.cyan} strokeWidth="2"/>
        <path d={cut(650, 6, 300, 66, 14)} pathLength="100" className="mr-flow" style={timing(0, 4)}/>
        <circle cx="684" cy="28" r="8" fill={C.blue}/><path d="M670 52Q684 34 698 52Z" fill={C.blue}/>
        {text(716, 38, L.title, 'mr-h mr-h-l')}
        {Array.from({ length: 34 }, (_, i) => (
          <rect key={i} className="mr-flick" x={716 + i * 6.3} y="46" width={rnd(i) > .5 ? 3 : 1.5} height="16" fill="#9ae9ff"
            style={timing(rnd(i + 3) * 4, 1.5 + rnd(i + 7) * 3)}/>
        ))}
      </g>

      {/* ---------- column A ---------- */}
      {panel('profile', 10, 78, 330, 222, L.profile, .25, <>
        {[[L.id, '#0427-8A'], [L.age, '17'], [L.gender, L.genderValue], [L.status, L.online], [L.location, L.locationValue], [L.joined, '2022.04.16']].map(([k, v], i) => (
          <g key={i}>
            {text(26, 134 + i * 25, k)}
            {text(100, 134 + i * 25, v, i === 3 ? 'mr-v mr-green' : 'mr-v')}
          </g>
        ))}
        <circle className="mr-blink" cx="166" cy="205" r="5" fill={C.green} style={timing(0, 1.6)}/>
        <g fill="none" stroke={C.cyan} strokeOpacity=".5">
          {[1, .75, .5, .25].map((s) => <polygon key={s} points={[0, 1, 2, 3, 4].map((k) => radarPt(100 * s, k).join(',')).join(' ')}/>)}
          {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={radarC[0]} y1={radarC[1]} x2={radarPt(100, k)[0]} y2={radarPt(100, k)[1]}/>)}
        </g>
        <g transform={`translate(${radarC[0]} ${radarC[1]})`}>
          <line className="mr-spin0" x2="50" stroke={C.cyan} strokeWidth="2" strokeOpacity=".7" style={timing(0, 4)}/>
        </g>
        <g className="mr-draw-in" style={{ '--d': '.6s' }} filter={ref('glow')}>
          <polygon points={radarFrames[0]} fill={C.violet} fillOpacity=".5" stroke="#6ff6ff" strokeWidth="2">
            <animate attributeName="points" dur="9s" {...loop(radarFrames)}/>
          </polygon>
          {[0, 1, 2, 3, 4].map((k) => {
            const frames = radarSets.map((s) => radarPt(s[k], k))
            return <circle key={k} r="3.5" fill="#bffcff" cx={frames[0][0]} cy={frames[0][1]}>
              <animate attributeName="cx" dur="9s" {...loop(frames.map((p) => p[0].toFixed(1)))}/>
              <animate attributeName="cy" dur="9s" {...loop(frames.map((p) => p[1].toFixed(1)))}/>
            </circle>
          })}
        </g>
        {text(250, 135, `${L.creative} 78`, 'mr-t mr-xs', 'middle')}
        {text(302, 180, L.tech, 'mr-t mr-xs')}{text(302, 194, '92', 'mr-v mr-xs')}
        {text(198, 180, L.social, 'mr-t mr-xs', 'end')}{text(198, 194, '84', 'mr-v mr-xs', 'end')}
        {text(230, 262, `${L.intellect} 56`, 'mr-t mr-xs', 'middle')}
        {text(306, 262, `${L.gaming} 88`, 'mr-t mr-xs', 'middle')}
        {hbar('pb', 26, 282, 140, 64, .5)}
      </>)}

      {panel('location', 10, 308, 340, 160, L.location, .55, <>
        {text(338, 333, `• ${L.locationCity}`, 'mr-t mr-xs', 'end')}
        <rect x={mapBox[0]} y={mapBox[1]} width={mapBox[2]} height={mapBox[3]} fill={ref('dots')} clipPath={ref('land')}/>
        <rect className="mr-scanx" x={mapBox[0]} y={mapBox[1]} width="26" height={mapBox[3]} fill={ref('scanx')}
          style={timing(1, 5, { '--w': `${mapBox[2] - 26}px` })}/>
        {hubs.map(([hx, hy], i) => {
          const path = `M${tokyo[0]} ${tokyo[1]}Q${(tokyo[0] + hx) / 2} ${Math.min(tokyo[1], hy) - 30} ${hx} ${hy}`
          return <g key={i}>
            <path className="mr-dash" d={path} fill="none" stroke={C.magenta} strokeWidth="1.2" style={timing(0, 1.5 + i * .3)}/>
            <circle r="2.5" fill="#fff"><animateMotion path={path} dur={`${2.4 + i * .5}s`} begin={`${i * .7}s`} repeatCount="indefinite"/></circle>
            {ripple(`h${i}`, hx, hy, 8, 1 + i * .6, 3 + i * .4)}
            <circle cx={hx} cy={hy} r="2.5" fill={C.cyan}/>
          </g>
        })}
        {ripple('tk', tokyo[0], tokyo[1], 12, .8, 2.4, C.magenta)}
        <circle cx={tokyo[0]} cy={tokyo[1]} r="4" fill={C.magenta} filter={ref('glow')}/>
        <g className="mr-spin" style={timing(0, 6)} fill="none" stroke={C.cyan}>
          <circle cx="44" cy="440" r="12" strokeDasharray="6 4"/>
        </g>
        <path d="M44 424V456M28 440H60" stroke={C.cyan} strokeOpacity=".6"/>
        {[['JP', 58], ['US', 18], ['KR', 9], ['TW', 7], ['EU', 5], [L.other, 3]].map(([k, v], i) => (
          <g key={k}>
            <rect className="mr-hbar" x="262" y={348 + i * 18} width="3" height="13" fill={i ? C.violet : C.magenta} style={timing(.6 + i * .1, 3, { '--lo': '.6' })}/>
            {text(272, 359 + i * 18, k, 'mr-t mr-xs')}
            {text(338, 359 + i * 18, `${v}%`, 'mr-v mr-xs', 'end')}
          </g>
        ))}
      </>, false, false)}

      {panel('activity', 10, 476, 340, 144, L.activity, .85, <>
        {text(26, 522, L.hoursOnline)}{text(150, 524, '7.4 h', 'mr-v mr-big')}
        {text(26, 538, '+12%', 'mr-t mr-xs mr-green')}
        <path d="M24 598H226" stroke={C.cyan} strokeOpacity=".4"/>
        {bars('act', 26, 598, 198, 52, Array.from({ length: 24 }, (_, i) => 20 + 80 * Math.abs(Math.sin(i / 3.6)) * (0.5 + rnd(i) * 0.5)), .9)}
        {['0', '6', '12', '18', '24'].map((n, i) => text(26 + i * 48, 612, n, 'mr-t mr-xs'))}
        {[[L.app, 35, C.cyan], [L.web, 28, C.violet], [L.game, 22, C.blue], [L.social, 15, C.magenta]].map(([k, v, c], i) => (
          <g key={i}>
            <circle className="mr-blink" cx="244" cy={518 + i * 22} r="5" fill="none" stroke={c} strokeWidth="2.5" style={timing(i * .4, 2.5 + i * .3)}/>
            {text(256, 522 + i * 22, k, 'mr-t mr-xs')}{text(338, 522 + i * 22, `${v}%`, 'mr-v mr-xs', 'end')}
          </g>
        ))}
      </>)}

      {panel('habits', 10, 628, 330, 118, L.habits, 1.15, <>
        {[['6.8 h', 75, C.cyan], ['8.2K', 82, C.cyan], ['420', 60, C.magenta], ['76%', 76, C.cyan]].map(([v, p, c], i) => (
          <g key={i}>
            {ring(`hr${i}`, 55 + i * 80, 684, 24, p, 1.2 + i * .15, c, 5)}
            {text(55 + i * 80, 688, v, 'mr-v mr-xs', 'middle')}
            {text(55 + i * 80, 736, L.habitRows?.[i], 'mr-t mr-xs', 'middle')}
          </g>
        ))}
      </>)}

      {panel('media', 10, 754, 420, 42, L.media, 1.45, <>
        {text(200, 772, L.mediaLine, 'mr-t mr-xxs mr-magenta')}
        {bars('med', 24, 792, 396, 14, Array.from({ length: 56 }, (_, i) => 25 + rnd(i * 5) * 75), 1.5, ref('barM'), 2)}
      </>, true)}

      {/* ---------- column B ---------- */}
      {panel('analytics', 350, 78, 140, 118, L.analytics, .4, <>
        {text(362, 124, L.totalActivity, 'mr-t mr-xs')}
        {text(362, 150, '+42%', 'mr-v mr-big')}
        <path className="mr-line" d="M420 146L436 132M430 131H437V138" pathLength="1" fill="none" stroke={C.green} strokeWidth="2" style={{ '--d': '1s' }}/>
        {bars('an', 446, 186, 34, 46, [40, 62, 55, 88], .6)}
        {bars('an2', 362, 186, 78, 26, [30, 48, 36, 60, 44, 70], .5)}
      </>)}

      {panel('mood', 498, 78, 152, 118, L.mood, .5, <>
        {text(506, 115, '100', 'mr-t mr-xxs')}{text(506, 142, '50', 'mr-t mr-xxs')}
        <g stroke={C.cyan} strokeOpacity=".2">{[112, 138, 164].map((y) => <path key={y} d={`M524 ${y}H642`}/>)}</g>
        {line('mood', 524, 108, 118, 60, [[40, 70, 35, 85, 50, 90, 60], [55, 45, 80, 60, 88, 52, 76], [30, 82, 50, 70, 40, 75, 92]], .7, '#6ff0ff', ref('areaC'))}
        {days.map((dd, i) => text(524 + i * 19.7, 186, dd, 'mr-t mr-xxs', 'middle'))}
      </>)}

      {panel('behavior', 350, 204, 150, 96, L.behavior, .65, <>
        {[[72, C.cyan], [54, C.magenta], [38, C.violet]].map(([v, c], i) => (
          <g key={i}>
            <circle cx="366" cy={238 + i * 22} r="4.5" fill="none" stroke={c} strokeWidth="2.5"/>
            {text(378, 242 + i * 22, L.behaviorRows?.[i], 'mr-t mr-xs')}
            {text(490, 242 + i * 22, `${v}%`, 'mr-v mr-xs', 'end')}
            {hbar(`bt${i}`, 378, 246 + i * 22, 112, v, .8 + i * .1, c === C.cyan ? ref('flow') : ref('flowM'), 2)}
          </g>
        ))}
      </>)}

      {panel('emotion', 508, 204, 142, 96, L.emotion, .75, <>
        {[[68, C.cyan], [21, C.violet], [11, C.magenta]].map(([v, c], i) => (
          <g key={i}>
            {ring(`em${i}`, 534 + i * 45, 252, 16, v, .9 + i * .15, c, 4)}
            {text(534 + i * 45, 256, `${v}%`, 'mr-v mr-xxs', 'middle')}
            {text(534 + i * 45, 290, L.emotions?.[i], 'mr-t mr-xxs', 'middle')}
          </g>
        ))}
      </>)}

      {panel('network', 360, 308, 290, 160, L.network, .6, <>
        <g filter={ref('glow')} fill="none" stroke={C.cyan} strokeWidth="1.2">
          <circle cx="440" cy="396" r="54" strokeWidth="2"/>
          {[-36, -18, 0, 18, 36].map((dy) => <ellipse key={dy} cx="440" cy={396 + dy} rx={Math.sqrt(54 * 54 - dy * dy)} ry={Math.abs(dy) / 6 + 3} strokeOpacity=".55"/>)}
          {[0, 1.5, 3, 4.5].map((b) => (
            <ellipse key={b} cx="440" cy="396" rx="54" ry="54" strokeOpacity=".7">
              <animate attributeName="rx" values="54;0;54" dur="6s" begin={`-${b}s`} repeatCount="indefinite"/>
            </ellipse>
          ))}
        </g>
        <ellipse className="mr-dash" cx="440" cy="396" rx="76" ry="18" fill="none" stroke={C.magenta} strokeWidth="1.5" transform="rotate(-18 440 396)" style={timing(0, 2)}/>
        <circle r="3.5" fill="#fff" filter={ref('glow')}>
          <animateMotion dur="4s" repeatCount="indefinite" path="M516 396A76 18 0 1 1 364 396A76 18 0 1 1 516 396" rotate="0"/>
        </circle>
        {[[410, 370], [462, 380], [430, 420], [470, 410], [448, 352]].map(([x, y], i) => ripple(`g${i}`, x, y, 5, i * .7, 2.6, C.magenta))}
        <rect className="mr-scany" x="384" y="342" width="112" height="3" fill={ref('streak')} style={timing(1, 4, { '--h': '106px' })}/>
        {text(512, 344, L.global)}
        {text(512, 374, '983', 'mr-v mr-big')}{text(566, 374, L.nodes, 'mr-t mr-xs')}
        {[[L.regions?.[0], 42, C.magenta], [L.regions?.[1], 28, C.violet], [L.regions?.[2], 18, C.blue], [L.regions?.[3], 12, C.cyan]].map(([k, v, c], i) => (
          <g key={i}>
            <circle className="mr-blink" cx="518" cy={396 + i * 18} r="4" fill="none" stroke={c} strokeWidth="2" style={timing(i * .5, 3)}/>
            {text(530, 400 + i * 18, k, 'mr-t mr-xs')}{text(638, 400 + i * 18, `${v}%`, 'mr-v mr-xs', 'end')}
          </g>
        ))}
      </>)}

      {panel('interaction', 360, 476, 290, 144, L.interaction, .95, <>
        {edges.map(([a, b], i) => {
          const path = `M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`
          return <g key={i}>
            <path className="mr-dash" d={path} stroke={C.violet} strokeWidth="1.3" style={timing(0, 1.2 + rnd(i) * 1.5)}/>
            {i % 3 === 0 && <circle r="2.3" fill={C.cyan}><animateMotion path={path} dur={`${1.6 + rnd(i) * 1.4}s`} begin={`${rnd(i + 4) * 2}s`} repeatCount="indefinite"/></circle>}
          </g>
        })}
        {nodes.map(([x, y], i) => (
          <g key={i}>
            {ripple(`n${i}`, x, y, 7, rnd(i) * 3, 2.5 + rnd(i + 2) * 2, i % 2 ? C.magenta : C.cyan)}
            <circle cx={x} cy={y} r={i % 3 ? 4 : 6} fill={i % 2 ? C.magenta : C.cyan} filter={ref('glow')}/>
          </g>
        ))}
        {text(516, 516, L.social)}
        {text(516, 542, '1.2K', 'mr-v mr-big')}{text(568, 542, L.connections, 'mr-t mr-xxs')}
        {[[L.interactionRows?.[0], 68, C.cyan], [L.interactionRows?.[1], 24, C.magenta], [L.interactionRows?.[2], 6, C.violet], [L.interactionRows?.[3], 2, C.blue]].map(([k, v, c], i) => (
          <g key={i}>
            <circle cx="522" cy={559 + i * 16} r="3.5" fill="none" stroke={c} strokeWidth="2"/>
            {text(532, 563 + i * 16, k, 'mr-t mr-xs')}{text(638, 563 + i * 16, `${v}%`, 'mr-v mr-xs', 'end')}
          </g>
        ))}
      </>)}

      {panel('interests', 350, 628, 300, 118, L.interests, 1.25, <>
        <g filter={ref('glow')} fill="none" stroke={C.cyan} strokeWidth="2">
          <path d="M392 652L420 668V700L392 716L364 700V668Z" fill={C.blue} fillOpacity=".25"/>
          <path d="M364 668L392 684L420 668M392 684V716" strokeOpacity=".7"/>
        </g>
        <circle className="mr-spin" cx="392" cy="684" r="40" fill="none" stroke={C.violet} strokeDasharray="10 8" style={timing(0, 10)}/>
        {ripple('cube', 392, 684, 30, .5, 3.2, C.cyan)}
        {[88, 76, 69, 62, 48].map((v, i) => (
          <g key={i}>
            {text(446, 674 + i * 16, L.interestRows?.[i], 'mr-t mr-xs')}
            {hbar(`in${i}`, 540, 668 + i * 16, 64, v, 1.3 + i * .1, i % 2 ? ref('flowM') : ref('flow'), 6)}
            {text(640, 674 + i * 16, `${v}%`, 'mr-v mr-xs', 'end')}
          </g>
        ))}
      </>)}

      {panel('tags', 440, 754, 210, 42, L.tags, 1.55, <>
        {L.tagRows?.map((tag, i) => text(452 + i * 66, 790, tag, 'mr-t mr-xxs'))}
        {[1, .87, .7].map((v, i) => hbar(`tg${i}`, 548 + i * 34, 766, 28, v * 100, 1.6 + i * .1, ref('flow'), 4))}
      </>, true)}

      {/* ---------- centre: hologram bay with Max's figure ---------- */}
      <g className="mr-panel" style={{ '--d': '.1s' }}>
        <ellipse cx="800" cy="560" rx="150" ry="240" fill={ref('holo')}/>
        <g fill="none" stroke={C.cyan} strokeWidth="2" strokeOpacity=".8">
          <path d="M672 120V96H696M928 120V96H904M672 700V724H696M928 700V724H904"/>
          <path d="M672 140V680M928 140V680" strokeOpacity=".25" strokeDasharray="2 10"/>
        </g>
        {[[120, 24, 0], [94, 18, 1.5], [66, 12, 3]].map(([rx, ry, b], i) => (
          <g key={i}>
            <ellipse cx="800" cy="720" rx={rx} ry={ry} fill="none" stroke={i === 1 ? C.violet : C.cyan} strokeWidth="2" filter={ref('glow')}/>
            <ellipse className="mr-dash" cx="800" cy="720" rx={rx + 8} ry={ry + 3} fill="none" stroke={C.cyan} strokeOpacity=".6" style={timing(0, 1 + i * .6)}/>
            <ellipse className="mr-ripple" cx="800" cy="720" rx={rx} ry={ry} fill="none" stroke={C.cyan} strokeWidth="2" style={timing(b, 4.5)}/>
          </g>
        ))}
      </g>
      {figure && (
        // Source is 1024×1536 with feet at ~94% height: scaled to stand on the platform at (800, 720).
        <g clipPath={ref('bay')}>
          <image className="mr-holo" href={figure} x="600" y="144" width="410" height="614"/>
        </g>
      )}
      {/* Labels sit above the figure so its glow never dims them. */}
      <g className="mr-panel" style={{ '--d': '.1s' }}>
        {[0, 1, 2, 3].map((i) => <rect key={i} x="680" y={150 + i * 12} width={i % 2 ? 12 : 22} height="5" fill={C.cyan} opacity=".8"/>)}
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} className="mr-blink" x="912" y={300 + i * 14} width="8" height="8" fill="none" stroke={C.cyan} style={timing(i * .3, 2.4)}/>)}
        {text(920, 132, L.scanComplete, 'mr-t mr-xs', 'end')}
        <path className="mr-line" d="M854 138H920" pathLength="1" stroke={C.cyan} style={{ '--d': '1.4s' }}/>
        {L.states?.map((s, i) => (
          <g key={i}>
            <circle className={i === 3 ? 'mr-blink' : undefined} cx="672" cy={520 + i * 22} r="5" fill={i === 3 ? C.cyan : 'none'} stroke={C.cyan} strokeWidth="1.5" style={timing(0, 1.4)}/>
            {text(682, 524 + i * 22, s, 'mr-t mr-xs')}
          </g>
        ))}
        {text(920, 636, L.lastSeen, 'mr-t mr-xs', 'end')}
        {text(920, 652, '2025.04.27', 'mr-v mr-xs', 'end')}
        {text(920, 668, '21:36:12', 'mr-v mr-xs', 'end')}
        {[[700, 260], [900, 420], [705, 430], [895, 560]].map(([x, y], i) => (
          <path key={i} className="mr-blink" d={`M${x - 6} ${y}H${x + 6}M${x} ${y - 6}V${y + 6}`} stroke={C.cyan} style={timing(i * .6, 3)}/>
        ))}
      </g>
      <g clipPath={ref('slot')}>
        <rect className="mr-scany" x="690" y="90" width="220" height="18" fill={ref('beam')} style={timing(.5, 4.8, { '--h': '620px' })}/>
        <rect className="mr-scany" x="690" y="90" width="220" height="2" fill="#9ff6ff" opacity=".6" style={timing(2.1, 4.8, { '--h': '620px' })}/>
      </g>

      {panel('system', 660, 754, 280, 42, L.system, 1.65, <>
        {ring('sys', 828, 775, 11, 62, 1.7, C.cyan, 4)}
        {[[L.cpu, 24], [L.gpu, 37]].map(([k, v], i) => (
          <g key={i}>
            {text(846, 773 + i * 15, k, 'mr-t mr-xxs')}
            {hbar(`sy${i}`, 868, 767 + i * 15, 38, v * 2, 1.7, ref('flow'), 4)}
            {text(930, 773 + i * 15, `${v}%`, 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>, true)}

      {/* ---------- column D ---------- */}
      {panel('prefs', 950, 78, 380, 196, L.prefs, .35, <>
        {['pad', 'ball', 'note', 'vr'].map((icon, i) => {
          const tx = 962 + i * 91
          return <g key={icon}>
            <path d={cut(tx, 108, 84, 104, 8)} fill="#050d29" stroke="#2c5a8f"/>
            <path className="mr-tile" d={cut(tx, 108, 84, 104, 8)} fill="none" stroke={C.cyan} strokeWidth="2" style={timing(1 + i * .9, 3.6)}/>
            <g className="mr-pulse" transform={`translate(${tx + 42} 148)`} style={timing(i * .5, 2.6)}>
              <path d={ICONS[icon]} fill="none" stroke="#8be8ff" strokeWidth="3" strokeLinejoin="round" filter={ref('glow')}/>
            </g>
            {text(tx + 42, 198, L.prefRows?.[i], 'mr-t mr-xs', 'middle')}
            {text(tx + 42, 236, `${[88, 61, 69, 76][i]}%`, 'mr-v mr-big', 'middle')}
            {hbar(`pr${i}`, tx + 6, 252, 72, [88, 61, 69, 76][i], .6 + i * .15, ref('flow'), 6)}
          </g>
        })}
      </>)}

      {panel('device', 950, 282, 236, 96, L.device, .7, <>
        {[[L.deviceRows?.[0], 62], [L.deviceRows?.[1], 28], [L.deviceRows?.[2], 3], [L.deviceRows?.[3], 7]].map(([k, v], i) => (
          <g key={i}>
            <rect x={962 + (i % 2) * 62} y={316 + Math.floor(i / 2) * 26} width="9" height="13" rx="2" fill="none" stroke={C.cyan} strokeWidth="1.5"/>
            {text(976 + (i % 2) * 62, 324 + Math.floor(i / 2) * 26, k, 'mr-t mr-xxs')}
            {text(976 + (i % 2) * 62, 334 + Math.floor(i / 2) * 26, `${v}%`, 'mr-v mr-xxs')}
          </g>
        ))}
        <g clipPath={ref('wave1')}>
          <path className="mr-wave" d={wave(1090, 335, 22, 44, 4, 1)} fill="none" stroke={C.cyan} strokeWidth="1.5" filter={ref('glow')} style={timing(0, 1.6, { '--p': '-44px' })}/>
          <path className="mr-wave" d={wave(1090, 340, 12, 44, 4, 3)} fill="none" stroke={C.violet} strokeWidth="1.2" style={timing(0, 2.4, { '--p': '-44px' })}/>
        </g>
      </>)}

      {panel('hex', 1194, 282, 136, 96, null, .8, <>
        <g clipPath={ref('wave2')}>
          <path className="mr-wave" d={wave(1208, 311, 8, 30, 6, 2)} fill="none" stroke={C.cyan} strokeWidth="1.5" style={timing(0, 1.1, { '--p': '-30px' })}/>
        </g>
        {Array.from({ length: 11 }, (_, i) => {
          const row = i < 6 ? 0 : 1
          const hx = 1215 + (row ? i - 6 : i) * 19 + row * 9.5
          const hy = 340 + row * 18
          return <path key={i} className="mr-hex" d={`M${hx} ${hy - 9}l8 4.5v9l-8 4.5l-8 -4.5v-9Z`} fill={i % 3 ? C.blue : C.violet} stroke={C.cyan}
            style={timing(rnd(i) * 3, 2 + rnd(i + 5) * 2)}/>
        })}
      </>)}

      {panel('content', 950, 386, 240, 124, L.content, .9, <>
        <g className="mr-spin" style={timing(0, 18)} filter={ref('glow')}>
          {[[34, 0, C.cyan], [26, 34, C.violet], [18, 60, C.blue], [14, 78, C.magenta], [8, 92, '#9fa8ff']].map(([len, off, c]) => (
            <circle key={off} cx="998" cy="456" r="28" fill="none" stroke={c} strokeWidth="11" pathLength="100"
              strokeDasharray={`${len - 1.5} ${101.5 - len}`} strokeDashoffset={-off}/>
          ))}
        </g>
        {[34, 26, 18, 14, 8].map((v, i) => (
          <g key={i}>
            <rect className="mr-hbar" x="1040" y={424 + i * 16} width={v * 1.2} height="5" fill={[C.cyan, C.violet, C.blue, C.magenta, '#9fa8ff'][i]}
              style={timing(1 + i * .1, 2 + rnd(i) * 2, { '--lo': '.6' })}/>
            {text(1084, 431 + i * 16, L.contentRows?.[i], 'mr-t mr-xxs')}
            {text(1180, 431 + i * 16, `${v}%`, 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>)}

      {panel('sentiment', 1198, 386, 192, 124, L.sentiment, 1, <>
        {Array.from({ length: 44 }, (_, i) => {
          const a = rnd(i) * Math.PI * 2
          const r = Math.pow(rnd(i + 50), .7) * 36
          return <circle key={i} className="mr-twinkle" cx={1250 + Math.cos(a) * r * 1.15} cy={460 + Math.sin(a) * r * .85} r={rnd(i + 9) * 1.6 + .6}
            fill={i % 4 ? C.cyan : C.magenta} style={timing(rnd(i + 3) * 3, .8 + rnd(i + 7) * 1.6)}/>
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const [x2, y2] = polar(1250, 460, 34, i * 72 + 20)
          return <path key={i} className="mr-dash" d={`M1250 460L${x2} ${y2}`} stroke={C.cyan} strokeOpacity=".5" style={timing(0, 1.5)}/>
        })}
        {ripple('sc', 1250, 460, 10, 0, 2.2)}
        <circle cx="1250" cy="460" r="5" fill="#dffcff" filter={ref('glow')}/>
        {[[68, C.magenta], [24, C.cyan], [8, C.violet]].map(([v, c], i) => (
          <g key={i}>
            <rect x="1300" y={426 + i * 24} width="4" height="12" fill={c}/>
            {text(1310, 436 + i * 24, L.sentimentRows?.[i], 'mr-t mr-xxs')}
            {text(1380, 436 + i * 24, `${v}%`, 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>)}

      {panel('engagement', 1398, 386, 192, 124, L.engagement, 1.1, <>
        {text(1410, 424, '100', 'mr-t mr-xxs')}{text(1410, 454, '50', 'mr-t mr-xxs')}{text(1410, 482, '0', 'mr-t mr-xxs')}
        <g stroke={C.cyan} strokeOpacity=".2">{[420, 450, 478].map((y) => <path key={y} d={`M1436 ${y}H1578`}/>)}</g>
        {line('eng', 1436, 418, 142, 60, [[30, 55, 42, 70, 58, 84, 90], [40, 38, 65, 52, 80, 66, 92], [25, 60, 50, 62, 72, 78, 88]], 1.2, C.magenta)}
        {line('eng2', 1436, 418, 142, 60, [[20, 30, 35, 28, 45, 50, 62], [28, 22, 40, 36, 38, 58, 55], [18, 35, 30, 42, 40, 46, 66]], 1.3, C.cyan)}
        {text(1410, 500, L.last7, 'mr-t mr-xs')}{text(1580, 501, '+27%', 'mr-v mr-magenta', 'end')}
      </>)}

      {/* ---------- column E ---------- */}
      {panel('scan', 1340, 78, 250, 196, L.scan, .3, <>
        {text(1580, 102, '2025.04.27 21:36', 'mr-t mr-xxs', 'end')}
        <circle cx="1420" cy="170" r="54" fill="#061538" stroke={C.cyan} strokeWidth="2"/>
        <circle className="mr-spin" cx="1420" cy="170" r="62" fill="none" stroke={C.cyan} strokeWidth="2" strokeDasharray="18 6 4 6" style={timing(0, 12)}/>
        <circle className="mr-spin mr-rev" cx="1420" cy="170" r="70" fill="none" stroke={C.violet} strokeWidth="1.5" strokeDasharray="40 30" style={timing(0, 9)}/>
        <g clipPath={ref('face')}>
          <g fill="none" stroke="#56d9ff" strokeWidth="1.5" filter={ref('glow')}>
            <ellipse cx="1420" cy="160" rx="20" ry="25"/>
            <path d="M1384 226Q1388 192 1420 190Q1452 192 1456 226M1405 155H1413M1427 155H1435M1414 173H1426"/>
            <path d="M1400 160H1440M1420 135V185M1404 145Q1420 140 1436 145" strokeOpacity=".35"/>
          </g>
          <g transform="translate(1420 170)">
            <path className="mr-spin0" d="M0 0L54 0A54 54 0 0 1 38.2 38.2Z" fill={ref('sweep')} style={timing(0, 3.5)}/>
          </g>
          <rect className="mr-scany" x="1366" y="116" width="108" height="3" fill="#b8f6ff" opacity=".8" style={timing(.4, 3, { '--h': '106px' })}/>
        </g>
        {ripple('face', 1420, 170, 60, .5, 3.5, C.cyan)}
        {[['FACE', 99], ['VOICE', 97], ['BEHAV', 89], ['DEVICE', 98], ['GEOF', 92], ['RISK', 12]].map(([k, v], i) => (
          <g key={k}>
            {text(1502, 124 + i * 20, L.scanRows?.[i], 'mr-t mr-xxs')}
            {text(1580, 124 + i * 20, `${v}%`, i === 5 ? 'mr-v mr-xxs mr-magenta' : 'mr-v mr-xxs', 'end')}
          </g>
        ))}
        {[0, 1, 2].map((i) => <circle key={i} className="mr-blink" cx="1494" cy={232 + i * 12} r="3.5" fill={i ? C.magenta : C.cyan} style={timing(i * .5, 2)}/>)}
        <circle cx="1358" cy="256" r="7" fill="none" stroke={C.green} strokeWidth="2"/><path d="M1354 256l3 3 5 -6" fill="none" stroke={C.green} strokeWidth="2"/>
        {text(1372, 261, L.verified, 'mr-t mr-xs')}
        {[0, 1, 2].map((i) => <circle key={i} className="mr-pulse" cx={1534 + i * 20} cy="256" r="8" fill="none" stroke={C.cyan} strokeWidth="1.5" style={timing(i * .4, 2.4)}/>)}
      </>, false, false)}

      {panel('platform', 1340, 282, 250, 96, L.platform, .85, <>
        {[[43, C.magenta, 'M-6 -6H6V6H-6ZM0 -3A3 3 0 1 0 0.1 -3'], [28, C.magenta, 'M-4 -6L7 0L-4 6Z'], [18, C.cyan, 'M-6 -6L6 6M6 -6L-6 6'], [11, C.violet, 'M-7 -4Q0 -9 7 -4V3Q0 7 -7 3ZM-3 0H-1M1 0H3']].map(([v, c, d], i) => (
          <g key={i}>
            {ring(`pl${i}`, 1376 + i * 56, 330, 17, v * 1.6, 1 + i * .15, c, 4)}
            <path d={d} transform={`translate(${1376 + i * 56} 330)`} fill="none" stroke="#e6faff" strokeWidth="2" strokeLinejoin="round"/>
            {text(1376 + i * 56, 368, `${v}%`, 'mr-v mr-xs', 'middle')}
          </g>
        ))}
      </>)}

      {panel('skills', 950, 518, 284, 122, L.skills, 1.2, <>
        {[76, 59, 63, 41, 68].map((v, i) => (
          <g key={i}>
            <rect x="962" y={553 + i * 16} width="7" height="7" fill="none" stroke={C.cyan}/>
            {text(976, 560 + i * 16, L.skillRows?.[i], 'mr-t mr-xxs')}
            {hbar(`sk${i}`, 1100, 554 + i * 16, 92, v, 1.3 + i * .1, ref('flow'), 6)}
            {text(1224, 560 + i * 16, `${v}%`, 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>)}

      {panel('community', 1242, 518, 148, 122, L.community, 1.3, <>
        <g className="mr-pulse" style={timing(0, 2.8)} fill={C.blue} stroke={C.cyan} strokeWidth="1.5" filter={ref('glow')}>
          <circle cx="1270" cy="568" r="7"/><circle cx="1302" cy="568" r="7"/>
          <path d="M1256 594Q1270 576 1284 594ZM1288 594Q1302 576 1316 594Z"/>
          <circle cx="1286" cy="562" r="9"/><path d="M1268 600Q1286 576 1304 600Z"/>
        </g>
        {text(1352, 568, '12', 'mr-v mr-big', 'middle')}{text(1352, 582, L.groups, 'mr-t mr-xxs', 'middle')}
        {text(1352, 608, '3', 'mr-v mr-big', 'middle')}{text(1352, 622, L.active, 'mr-t mr-xxs', 'middle')}
        {hbar('cm', 1256, 618, 64, 70, 1.4, ref('flow'), 4)}
      </>)}

      {panel('tracking', 1398, 518, 192, 122, L.tracking, 1.4, <>
        {text(1410, 554, '100', 'mr-t mr-xxs')}{text(1410, 592, '50', 'mr-t mr-xxs')}{text(1410, 628, '0', 'mr-t mr-xxs')}
        {bars('pd', 1436, 628, 96, 70, [38, 52, 44, 66, 58, 78, 70, 92], 1.45)}
        {text(1580, 562, '+18%', 'mr-v mr-big', 'end')}
        <path className="mr-line" d="M1540 620L1554 606L1564 612L1582 588M1574 588H1582V596" pathLength="1" fill="none" stroke={C.green} strokeWidth="2" style={{ '--d': '1.9s' }}/>
      </>)}

      {panel('weekly', 950, 648, 440, 98, L.weekly, 1.5, <>
        {text(962, 678, '90', 'mr-t mr-xxs')}{text(962, 702, '50', 'mr-t mr-xxs')}{text(962, 724, '0', 'mr-t mr-xxs')}
        <g stroke={C.cyan} strokeOpacity=".2">{[674, 698, 722].map((y) => <path key={y} d={`M984 ${y}H1240`}/>)}</g>
        {line('wk1', 984, 672, 256, 50, [[30, 60, 45, 80, 55, 90, 50], [45, 50, 70, 60, 85, 65, 75], [35, 70, 55, 65, 50, 80, 60]], 1.6, C.cyan, ref('areaC'))}
        {line('wk2', 984, 672, 256, 50, [[20, 35, 55, 40, 70, 45, 30], [30, 25, 40, 60, 50, 35, 45], [25, 45, 35, 50, 60, 55, 25]], 1.7, C.magenta, ref('areaM'))}
        {days.map((dd, i) => text(984 + i * 42.7, 738, dd, 'mr-t mr-xxs', 'middle'))}
        {['7.4 h', '3.1 h', '4.8 h', '2.2 h', '1.6 h'].map((v, i) => (
          <g key={i}>
            <circle cx="1262" cy={683 + i * 13} r="3.5" fill="none" stroke={[C.cyan, C.magenta, C.violet, C.blue, '#9fa8ff'][i]} strokeWidth="2"/>
            {text(1272, 686 + i * 13, L.weeklyRows?.[i], 'mr-t mr-xxs')}
            {text(1380, 686 + i * 13, v, 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>)}

      {panel('goals', 1398, 648, 192, 98, L.goals, 1.6, <>
        {[65, 42, 78, 31].map((v, i) => (
          <g key={i}>
            <rect x="1410" y={682 + i * 15} width="7" height="7" fill="none" stroke={C.magenta}/>
            {text(1424, 689 + i * 15, L.goalRows?.[i], 'mr-t mr-xxs')}
            {hbar(`gl${i}`, 1488, 683 + i * 15, 60, v, 1.7 + i * .1, i % 2 ? ref('flowM') : ref('flow'), 6)}
            {text(1582, 689 + i * 15, `${v}%`, 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>)}

      {panel('insights', 950, 754, 206, 42, L.insights, 1.75, <>
        {L.insightRows?.map((r, i) => (
          <g key={i}>
            <circle className="mr-blink" cx="964" cy={781 + i * 10} r="2.5" fill={C.violet} style={timing(i * .7, 2)}/>
            {text(972, 784 + i * 10, r, 'mr-t mr-xxs')}
          </g>
        ))}
      </>, true)}
      {panel('recs', 1166, 754, 206, 42, L.recs, 1.85, <>
        {L.recRows?.map((r, i) => (
          <g key={i}>
            <circle className="mr-blink" cx="1180" cy={781 + i * 10} r="2.5" fill={C.magenta} style={timing(.3 + i * .7, 2)}/>
            {text(1188, 784 + i * 10, r, 'mr-t mr-xxs')}
          </g>
        ))}
      </>, true)}
      {panel('events', 1382, 754, 208, 42, L.events, 1.95, <>
        {L.eventRows?.map((r, i) => (
          <g key={i}>
            {text(1396, 784 + i * 10, ['APR 28', 'APR 29'][i], 'mr-v mr-xxs')}
            {text(1438, 784 + i * 10, r, 'mr-t mr-xxs')}
            {i === 0 && text(1580, 784, '19:00', 'mr-v mr-xxs', 'end')}
          </g>
        ))}
      </>, true)}

      {loader()}

      {/* ---------- boot interference: scanlines, rolling bar, tearing ---------- */}
      <g className="mr-boot-fx">
        <rect width={W} height={H} fill={ref('lines')} opacity=".6"/>
        <rect className="mr-fx-roll" x="0" y="-60" width={W} height="60" fill={ref('beam')} opacity=".18" style={{ '--h': `${H + 60}px` }}/>
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} className="mr-ld-tear" x={rnd(i + 40) * W * 0.5} y={rnd(i + 20) * H} width={W * (0.2 + rnd(i + 30) * 0.6)}
            height={1 + rnd(i + 60) * 7} fill={[C.cyan, C.magenta, '#ffffff'][i % 3]}
            style={{ '--dur': sec(0.6 + rnd(i + 70) * 0.9), '--dl': sec(rnd(i + 80) * 1.5) }}/>
        ))}
      </g>

      {/* ---------- ambient light streaks ---------- */}
      {[[250, 9, 1.5], [596, 12, 6]].map(([y, dur, d]) => (
        <rect key={y} className="mr-streak" x="-300" y={y} width="300" height="2" fill={ref('streak')} style={timing(d, dur)}/>
      ))}
    </svg>
  )
}
