import { useId } from 'react'
import { useT } from '../i18n/index.jsx'
import './MaxReport.css'

// Vector reconstruction of the report dashboard; no video or raster assets.
export default function MaxReport() {
  const id = useId().replace(/:/g, '')
  const t = useT()
  const paint = (name) => `url(#${id}-${name})`
  const panel = (x, y, w, h) => `M${x + 12} ${y}H${x + w - 12}L${x + w} ${y + 12}V${y + h - 12}L${x + w - 12} ${y + h}H${x + 12}L${x} ${y + h - 12}V${y + 12}Z`
  // All blocks finish their entrance before the shared 3.8s loop start.
  const reveal = (delay) => ({ className: 'max-report-block', style: { '--enter': `${delay}s` } })
  const body = 'M467 139 L440 147 418 174 398 220 399 251 419 280 430 277 428 306 415 392 413 460 438 460 455 390 480 336 488 389 493 461 519 461 521 386 519 309 508 278 528 264 545 226 538 211 524 215 508 242 502 178 493 149Z'
  return (
    <svg className="max-report" viewBox="0 0 960 540" role="img" aria-label={t('rooms.algorithm.equations.profileTitle')}>
      <defs>
        <linearGradient id={`${id}-bar`} x2="0" y2="1">
          <stop stopColor="#00eaff"/><stop offset=".55" stopColor="#087cff"/><stop offset="1" stopColor="#a52dff"/>
        </linearGradient>
        <linearGradient id={`${id}-flow`}>
          <stop stopColor="#00edff"/><stop offset=".55" stopColor="#147bff"/><stop offset="1" stopColor="#e13cff"/>
        </linearGradient>
        <pattern id={`${id}-grid`} width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" stroke="#16446b" strokeWidth=".5"/>
        </pattern>
        <pattern id={`${id}-scan`} width="4" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 1H4" stroke="#54dcff" strokeWidth=".7"/>
        </pattern>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2"/><feComposite in="SourceGraphic"/>
        </filter>
        <clipPath id={`${id}-body`}><path d={body}/><ellipse cx="479" cy="116" rx="29" ry="35"/></clipPath>
      </defs>
      <rect width="960" height="540" rx="12" fill="#020718"/>
      <rect width="960" height="540" fill={paint('grid')} opacity=".5"/>
      <g fill="#040b23" stroke="#2ed8ff" strokeWidth="1.3" filter={paint('glow')}>
        {[[16,60,342,236],[16,310,342,207],[385,10,186,48],[378,76,186,439],[581,60,366,176],[581,248,207,270],[800,248,147,270]].map(([x,y,w,h], i) => <path {...reveal([.45,1,0,.15,1.55,2.1,2.65][i])} key={`${x}-${y}`} d={panel(x,y,w,h)}/>)}
      </g>
      <g fill="none" stroke="#5352ff" opacity=".7">
        {[[23,88,327,198],[23,342,327,163],[590,95,348,131],[590,280,189,226]].map(([x,y,w,h], i) => <path {...reveal([.45,1,1.55,2.1][i])} key={x+y} d={panel(x,y,w,h)}/>)}
        <path d="M0 48H211L224 58H370M577 49H672L688 38H960M364 528H566M370 60V525"/>
      </g>
      {/* Decorative header data, intentionally nonlinguistic like the source. */}
      <g fill={paint('flow')}>
        {[ [60,72,130], [61,323,120], [631,74,166], [630,261,90], [837,261,68], [406,26,142] ].map(([x,y,w], i) => <rect {...reveal([.45,1,1.55,2.1,2.65,0][i])} key={x+y} x={x} y={y} width={w} height="8"/>)}
        {Array.from({length: 12}, (_,i) => <rect key={i} x={18+i*78} y="19" width={i%2 ? 22 : 35} height="4" opacity=".65"/>)}
      </g>
      {/* Demographic radar. */}
      <g {...reveal(.45)}>
      <g transform="translate(174 202)" stroke="#24cbff" fill="none">
        {[1,.8,.6,.4,.2].map(s => <polygon key={s} points="0,-85 81,-26 50,69 -50,69 -81,-26" transform={`scale(${s})`} opacity=".65"/>)}
        <path d="M0 0V-85M0 0L81 -26M0 0L50 69M0 0L-50 69M0 0L-81 -26"/>
        <g className="max-report-radar">
        <polygon points="0,-62 54,-18 31,41 -47,50 -35,-13" fill={paint('bar')} fillOpacity=".6" stroke="#5bf3ff" strokeWidth="2"/>
        {[[0,-62],[54,-18],[31,41],[-47,50],[-35,-13]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="3" fill="#60faff"/>)}
        </g>
      </g>
      <g fill={paint('flow')}>
        {[0,1,2].map(i => <g key={i}><circle className="max-report-dot" style={{ '--travel': '35px', '--duration': `${3+i*.5}s` }} cx="285" cy={115+i*16} r="4"/><rect x="298" y={112+i*16} width="34" height="4"/></g>)}
      </g>
      </g>
      {/* Activity histogram. */}
      <g {...reveal(1)}>
      <path d="M43 354V464H332" fill="none" stroke="#49dfff"/>
      <g stroke="#225079" strokeDasharray="2 4">{[370,400,430].map(y => <path key={y} d={`M43 ${y}H331`}/>)}</g>
      {[51,32,47,69,82,101,57].map((h,i) => <g key={i}>
        <rect className="max-report-bar" style={{ '--duration': `${3+i*.37}s` }} x={56+i*42} y={463-h} width="19" height={h} fill={paint('bar')} stroke="#64dfff"/>
        <circle cx={65+i*42} cy="476" r="2" fill="#3ff4ff"/>
      </g>)}
      </g>
      {/* Holographic teenager holding a phone. */}
      <g {...reveal(.15)}>
      <g stroke="#4bddff" strokeLinejoin="round" filter={paint('glow')}>
        <path d={body} fill="#073578"/>
        <ellipse cx="479" cy="116" rx="29" ry="35" fill="#092964"/>
        <path d="M450 109L447 97 458 99 452 89 466 92 467 82 479 87 491 81 491 89 506 89 502 96 513 100 505 108 492 103 470 111Z" fill="#096ac3"/>
        <path d="M455 140Q478 162 493 143L507 169 490 181 478 165 465 181 442 158M478 165V277M442 164L435 232 448 271 430 287M501 176L492 236 508 258M428 300L478 311 517 301M478 311L452 387M420 402L438 404M492 403L520 405" fill="none"/>
        <path d="M414 459L407 487Q421 496 444 486L440 459ZM493 459L491 484Q511 494 541 487L538 479 516 462Z" fill="#073578"/>
        <path d="M519 214L528 186 549 193 538 223Z" fill="#07235e"/>
        <path d="M518 219L529 206 539 210 533 223" fill="#09508e"/>
      </g>
      <g clipPath={paint('body')}>
        <rect x="393" y="80" width="157" height="391" fill={paint('scan')}/>
        <g stroke="#39acff" fill="none" opacity=".5">
          {Array.from({length: 12}, (_,i) => <path key={i} d={`M${394+i*14} 80L${470+(i-6)*5} 290L${400+i*14} 465`}/>)}
        </g>
        <rect className="max-report-scan" x="391" y="80" width="160" height="8" fill="#7af4ff" opacity=".5"/>
      </g>
      </g>
      {/* Interests: games, football, tablets and VR. */}
      <g {...reveal(1.55)}>
      {[607,695,782,867].map(x => <path key={x} d={panel(x,105,69,91)} fill="#04091b" stroke="#365781"/>)}
      <g fill="none" stroke="#84dbff" strokeWidth="3" filter={paint('glow')}>
        <path d="M620 128Q641 120 661 129L670 154Q669 165 659 156L649 147H632L622 157Q612 162 614 151ZM623 136H635M629 130V142M650 132H653M657 139H660"/>
        <circle cx="729" cy="142" r="23"/><path d="M728 130L740 139 735 152H721L717 138ZM728 130V119M740 139L752 135M735 152L743 160M721 152L714 161M717 138L707 133"/>
        <path d="M800 120L834 116 830 164 796 166ZM803 157L824 155"/>
        <path d="M875 133Q899 124 925 135L921 153 907 157 900 149 892 156 879 152Z"/>
      </g>
      {[610,698,785,870].map((x,i) => <g key={x}><rect x={x} y="211" width="59" height="6" fill="#173052"/><rect className="max-report-meter" style={{ '--duration': `${3.5+i*.4}s` }} x={x} y="211" width="43" height="6" fill={paint('flow')}/></g>)}
      </g>
      {/* Behaviour signals and audience gauges. */}
      <g {...reveal(2.1)}>
      {[0,1,2,3,4].map(i => <g key={i}>
        <rect x="601" y={298+i*43} width="20" height="19" rx="5" fill="#092746" stroke="#42dcff"/>
        <path d={`M607 ${305+i*43}h8m-8 5h5`} stroke="#72f5ff"/>
        <rect x="638" y={301+i*43} width="132" height="9" fill="#142348"/>
        <rect className="max-report-meter" style={{ '--duration': `${4+i*.35}s` }} x="638" y={301+i*43} width={105-i*12} height="9" fill={paint('flow')}/>
      </g>)}
      </g>
      <g {...reveal(2.65)}>
      {[320,392].map((y,i) => <g key={y}>
        <circle cx="844" cy={y} r="29" fill="none" stroke="#1c2c51" strokeWidth="7"/>
        <circle className="max-report-ring" style={{ '--duration': `${6+i*2}s` }} cx="844" cy={y} r="29" fill="none" stroke={i ? '#ae66ff' : '#30dfff'} strokeWidth="7" strokeDasharray={`${i ? 108 : 137} 183`} transform={`rotate(-90 844 ${y})`}/>
        {[0,1,2].map(j => <rect key={j} x="889" y={y-15+j*12} width={35-j*6} height="4" fill="#1679c4"/>)}
      </g>)}
      <g fill="none" stroke="#22caff">{[830,898].map(x => [455,495].map(y => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="15"/><circle cx={x} cy={y-3} r="4"/><path d={`M${x-7} ${y+8}q7 -12 14 0`}/></g>))}</g>
      </g>
      <g {...reveal(.15)} fill="#0bbfff">{Array.from({length:8},(_,i) => <rect key={i} x="385" y={120+i*42} width={i%2 ? 9 : 19} height="4"/>)}</g>
    </svg>
  )
}
