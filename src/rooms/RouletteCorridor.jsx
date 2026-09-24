import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { playSound, stopSound, preloadSound } from '../game/sound.js'
import { ROULETTE_WHEELS as WHEELS, ROULETTE_SEGMENTS, rouletteResult, correctRouletteVerdict, correctRouletteAnswer } from '../game/rouletteData.js'
import RoomFrame from '../components/RoomFrame.jsx'
import './RouletteCorridor.css'

const SLICE = 360 / ROULETTE_SEGMENTS
const MIN_SPINS = 2
const preventFocusScroll = (event) => event.preventDefault()

function PrizeWheel({ wheel, spinning, angle, disabled, onSpin, t }) {
  const segments = t(`rooms.roulette.investigation.wheels.${wheel.id}.segments`)
  const stops = segments.map((_, i) => {
    const color = i === wheel.highlight ? '#ffb92b' : i % 2 ? '#7a1a63' : '#ff2bd6'
    return `${color} ${i * SLICE}deg ${(i + 1) * SLICE}deg`
  })
  return (
    <button
      type="button"
      className="rc-wheel-wrap"
      disabled={disabled}
      onMouseDown={preventFocusScroll}
      onClick={onSpin}
      aria-label={`${t('rooms.roulette.spin')} — ${t(`rooms.roulette.investigation.wheels.${wheel.id}.name`)}`}
    >
      <span className="rc-pointer" aria-hidden="true">▼</span>
      <span className="rc-wheel-face" aria-hidden="true">
        <span className={`rc-wheel${spinning ? ' spinning' : ''}`} style={{ background: `conic-gradient(from 0deg, ${stops.join(', ')})`, transform: `rotate(${angle}deg)` }}>
          {segments.map((label, i) => (
            <span key={i} className={`rc-seg-label${i === wheel.highlight ? ' jackpot' : ''}`} style={{ transform: `rotate(${i * SLICE + SLICE / 2}deg)` }}>
              <span className="rc-seg-text" style={{ transform: `rotate(${-angle - i * SLICE - SLICE / 2}deg)` }}>{label}</span>
            </span>
          ))}
        </span>
        <span className="rc-hub">🎰</span>
      </span>
    </button>
  )
}

export default function RouletteCorridor({ node }) {
  const { completeRoom, addEvidence } = useGame()
  const t = useT()
  const [angles, setAngles] = useState({})
  const [spinning, setSpinning] = useState({})
  const [history, setHistory] = useState({})
  const [active, setActive] = useState('w1')
  const [answers, setAnswers] = useState({})
  const [verified, setVerified] = useState({})
  const [errors, setErrors] = useState({})
  const [solved, setSolved] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const timers = useRef({})
  const finished = useRef(false)

  useEffect(() => {
    preloadSound('roulette_spin.mp3')
    preloadSound('roulette_win.mp3')
    const pending = timers.current
    return () => {
      Object.values(pending).forEach(clearTimeout)
      stopSound('roulette_spin.mp3')
    }
  }, [])

  const wheel = WHEELS.find((w) => w.id === active)
  const answer = answers[active] || {}
  const verdictCorrect = correctRouletteVerdict(wheel, answer.verdict)
  const results = history[active] || []
  const checkedCount = Object.values(verified).filter(Boolean).length
  const wheelText = (id, key) => t(`rooms.roulette.investigation.wheels.${id}.${key}`)

  function spinWheel(w) {
    if (timers.current[w.id] || solved || verified[w.id]) return
    setShopOpen(false)
    setAnswers((a) => ({ ...a, [w.id]: { ...a[w.id], verdict: null } }))
    const result = rouletteResult(w)
    const target = (360 - (result * SLICE + SLICE / 2)) % 360
    setSpinning((s) => ({ ...s, [w.id]: true }))
    setAngles((a) => ({ ...a, [w.id]: (Math.floor((a[w.id] || 0) / 360) + 5) * 360 + target }))
    playSound('roulette_spin.mp3')
    timers.current[w.id] = window.setTimeout(() => {
      delete timers.current[w.id]
      setSpinning((s) => ({ ...s, [w.id]: false }))
      setHistory((h) => ({ ...h, [w.id]: [...(h[w.id] || []), result] }))
      if (w.minimumPurchase) setShopOpen(true)
      if (!Object.keys(timers.current).length) stopSound('roulette_spin.mp3')
      if (result !== 7) playSound('roulette_win.mp3')
    }, 4200)
  }

  function choose(field, value) {
    if (results.length < MIN_SPINS || spinning[active] || verified[active]) return
    setShopOpen(false)
    if (field === 'verdict' && value && !correctRouletteVerdict(wheel, value)) playSound('wrong.mp3')
    setAnswers((a) => ({ ...a, [active]: { ...a[active], [field]: value } }))
    setErrors((e) => ({ ...e, [active]: false }))
  }

  function checkAnswer(reason) {
    if (results.length < MIN_SPINS || spinning[active] || verified[active] || shopOpen) return
    if (correctRouletteAnswer(wheel, answer.verdict, reason)) {
      setVerified((v) => ({ ...v, [active]: true }))
      setErrors((e) => ({ ...e, [active]: false }))
    } else {
      playSound('wrong.mp3')
      setErrors((e) => ({ ...e, [active]: true }))
    }
  }

  function finish() {
    if (finished.current || checkedCount !== WHEELS.length) return
    finished.current = true
    addEvidence({ id: 'ev-roulette', label: t('rooms.roulette.investigation.evidence') })
    setSolved(true)
  }

  return (
    <RoomFrame node={node} bgImage={bgUrl('roulette.png')}
      intro={t('rooms.roulette.investigation.intro')}
      solved={solved} solvedTitle={t('rooms.roulette.investigation.solvedTitle')}
      solvedText={t('rooms.roulette.investigation.solvedText')}
      onContinue={() => completeRoom(node.id)}>
      <div className="rc-wrap fade-in">
        <div className="rc-topbar">
          <div className="rc-wheel-heading">
            <span className="rc-wheel-name">{wheelText(active, 'name')}</span>
            <h3 className="rc-wheel-pitch">{wheelText(active, 'rules')}</h3>
          </div>
          <span className="chip">{t('rooms.roulette.investigation.wheelProgress', { n: WHEELS.findIndex((w) => w.id === active) + 1, total: WHEELS.length })}</span>
        </div>
        <div className="rc-play">
          <div className="rc-machine">
            <PrizeWheel
              key={active}
              wheel={wheel}
              spinning={spinning[active]}
              angle={angles[active] || 0}
              disabled={!!spinning[active] || solved || !!verified[active] || verdictCorrect}
              onSpin={() => spinWheel(wheel)}
              t={t}
            />
            <div className="rc-result" aria-live="polite">
              {spinning[active] ? t('rooms.roulette.spinning') : results.length > 0
                ? t('rooms.roulette.investigation.result', { result: wheelText(active, 'segments')[results.at(-1)] })
                : null}
            </div>
            {!verified[active] && !verdictCorrect && (
              <button className={results.length >= MIN_SPINS ? 'rc-respin' : 'btn btn-magenta'} onMouseDown={preventFocusScroll} onClick={() => spinWheel(wheel)} disabled={!!spinning[active] || solved}>
                {results.length ? t('rooms.roulette.investigation.spinAgain') : t('rooms.roulette.spin')}
              </button>
            )}
            {shopOpen && (
              <div className="rc-shop-offer panel fade-in" role="status" aria-labelledby="rc-shop-title">
                <span className="chip warn">{t('rooms.roulette.investigation.shop.badge')}</span>
                <h3 id="rc-shop-title">{t('rooms.roulette.investigation.shop.title')}</h3>
                <div className="rc-coupon">{t('rooms.roulette.investigation.shop.coupon')}</div>
                <p id="rc-shop-terms">{t('rooms.roulette.investigation.shop.terms', { amount: wheel.minimumPurchase })}</p>
              </div>
            )}
            {results.length > 0 && wheel.retryBait && !spinning[active] && !verdictCorrect && !verified[active] && (
              <div className="rc-shop-offer rc-retry-offer panel fade-in" role="status">
                <p>{t('rooms.roulette.investigation.retryBait')}</p>
              </div>
            )}
          </div>
          <section className="rc-case panel scene-scroll" aria-live="polite">
            {verified[active] ? (
              <>
                <h3 className="accent-green">{t('rooms.roulette.investigation.correct')}</h3>
                <p>{wheelText(active, 'feedback')}</p>
                {checkedCount === WHEELS.length
                  ? <button className="btn btn-green" disabled={solved} onMouseDown={preventFocusScroll} onClick={finish}>{t('rooms.roulette.investigation.finish')}</button>
                  : <button className="btn btn-cyan" onMouseDown={preventFocusScroll} onClick={() => setActive(WHEELS.find((w) => !verified[w.id]).id)}>{t('rooms.roulette.investigation.next')}</button>}
              </>
            ) : (
              <>
                {!verdictCorrect && <p className="rc-observe">{t('rooms.roulette.investigation.observe', { count: MIN_SPINS })}</p>}
                {results.length > 0 && wheel.minimumPurchase && !shopOpen && <p className="rc-sales-message">{t('rooms.roulette.investigation.shop.reminder', { amount: wheel.minimumPurchase })}</p>}
                {results.length > 0 && (
                  <div className="rc-history">
                    <b>{t('rooms.roulette.investigation.historyLabel', { n: results.length })}</b>
                    <ol>
                      {results.slice(-5).map((result, index) => (
                        <li key={results.length - Math.min(results.length, 5) + index}>{wheelText(active, 'segments')[result]}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {results.length >= MIN_SPINS && !spinning[active] && (
                  <>
                    <div className="rc-verdicts">
                      {['rigged', 'fair'].map((value) => (
                        <button
                          key={value}
                          className={`btn${answer.verdict === value ? verdictCorrect ? ' rc-verdict-correct' : ' rc-verdict-wrong' : ''}`}
                          aria-pressed={answer.verdict === value}
                          aria-invalid={answer.verdict === value && !verdictCorrect}
                          onMouseDown={preventFocusScroll}
                          onClick={() => choose('verdict', value)}
                        >
                          {t(`rooms.roulette.investigation.verdicts.${value}`)}
                        </button>
                      ))}
                    </div>
                    {verdictCorrect && (
                      <>
                        <h3>{t('rooms.roulette.investigation.reasonLabel')}</h3>
                        <div className="rc-reasons">
                          {wheel.options.map((id) => <button key={id} className="rc-reason" onMouseDown={preventFocusScroll} onClick={() => checkAnswer(id)}>{t(`rooms.roulette.investigation.wheels.${active}.options.${id}`)}</button>)}
                        </div>
                        {errors[active] && <p className="rc-error" role="alert">{t('rooms.roulette.investigation.retry')}</p>}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </RoomFrame>
  )
}
