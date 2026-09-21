import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { NARRATIVE } from '../../game/gameData.js'
import { bgUrl } from '../../game/assets.js'
import './pretest.css'

/* In-person diagnostic conversation. Inspecting Max's phone unlocks the
   first round; every answer advances, with no right/wrong feedback. */
export default function PretestScreen() {
  const { startGame, reducedMotion } = useGame()
  const t = useT()
  const friend = NARRATIVE.friend
  const p = t('story.pretest')
  const rounds = t('story.rounds')
  const [phase, setPhase] = useState('opening')
  const [round, setRound] = useState(0)
  const [answer, setAnswer] = useState('')
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [phoneViewed, setPhoneViewed] = useState(false)
  const phoneRef = useRef(null)
  const closeRef = useRef(null)
  const returnFocusRef = useRef(false)
  const speechClock = useRef({ key: '', elapsed: 0 })
  const [speechProgress, setSpeechProgress] = useState({ key: '', elapsed: 0 })
  const playerSpeaking = ['reply', 'endingYou'].includes(phase)
  const line = phase === 'opening' ? p.opening
    : phase === 'options' ? (round === 0 ? p.opening : p.responses[round - 1])
    : phase === 'reply' ? answer
    : phase === 'response' ? p.responses[round]
    : phase === 'endingFriend' ? p.endingFriend
    : phase === 'endingYou' ? p.endingYou : ''
  const speechKey = `${phase}:${round}:${line}`
  const readingTime = Math.max(3500, line.length * 18 + 1500, line.trim().split(/\s+/).length * 280 + 800)
  const elapsed = speechProgress.key === speechKey ? speechProgress.elapsed : 0
  const speechReady = phase === 'options' || elapsed >= readingTime
  const visibleLetters = reducedMotion || phase === 'options' ? line.length : Math.floor(elapsed / 18)

  function closePhone() {
    setPhoneOpen(false)
  }

  // Reserve reading time for each turn. Inspecting the phone or hiding the
  // browser tab pauses this clock, so no dialogue is skipped offscreen.
  useEffect(() => {
    if (speechClock.current.key !== speechKey) {
      speechClock.current = { key: speechKey, elapsed: 0 }
      setSpeechProgress(speechClock.current)
    }
    if (phase === 'options' || phoneOpen) return
    const timer = window.setInterval(() => {
      if (document.hidden) return
      const next = Math.min(readingTime, speechClock.current.elapsed + 50)
      speechClock.current = { key: speechKey, elapsed: next }
      setSpeechProgress(speechClock.current)
      if (next >= readingTime) window.clearInterval(timer)
    }, 50)
    return () => window.clearInterval(timer)
  }, [speechKey, readingTime, phase, phoneOpen])

  useEffect(() => {
    if (phoneOpen) {
      returnFocusRef.current = true
      closeRef.current?.focus({ preventScroll: true })
    } else if (returnFocusRef.current) {
      returnFocusRef.current = false
      phoneRef.current?.focus({ preventScroll: true })
    }
  }, [phoneOpen])

  useEffect(() => {
    if (!speechReady || phoneOpen) return
    if (phase === 'opening') {
      if (phoneViewed) setPhase('options')
    } else if (phase === 'reply') {
      if (round === rounds.length - 1) setPhase('endingFriend')
      else if (p.responses[round]) setPhase('response')
      else {
        setRound((value) => value + 1)
        setPhase('options')
      }
    } else if (phase === 'response') {
      setRound((value) => value + 1)
      setPhase('options')
    } else if (phase === 'endingFriend') setPhase('endingYou')
  }, [speechReady, phoneOpen, phoneViewed, phase, round, rounds.length, p.responses])

  return (
    <div className="scene pretest-scene">
      <div className="pretest-content" inert={phoneOpen ? '' : undefined}>
        <div className="pretest-art">
          <img className={`pretest-backdrop ${playerSpeaking ? '' : 'is-visible'}`} src={bgUrl('max-talking.png')} alt="" />
          <img className={`pretest-backdrop ${playerSpeaking ? 'is-visible' : ''}`} src={bgUrl('player-talking.png')} alt="" />
          <button
            ref={phoneRef}
            type="button"
            className={`pretest-phone ${phoneViewed ? '' : 'is-unseen'}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setPhoneOpen(true)}
            aria-label={t('story.product.offerLabel')}
            title={t('story.product.offerLabel')}
            aria-haspopup="dialog"
          >
            <svg className="pretest-phone-light" viewBox="650 490 110 90" aria-hidden="true">
              {/* Trace only the exposed handset; the fingers stay unlit. */}
              <path d="M677 548 L699 511 Q704 502 713 503 L742 505 Q750 506 747 514 L730 540 C721 538 710 532 703 536 C697 539 699 546 706 550 L718 555 L721 560 C707 556 691 550 677 548 Z" />
            </svg>
          </button>
        </div>

        <div
          className={`pretest-speech ${playerSpeaking ? 'is-player' : ''} ${line.length > 210 ? 'is-long' : ''}`}
          aria-label={playerSpeaking ? t('story.you') : friend}
        >
          <p className="pretest-line" aria-label={line} aria-live="polite" aria-atomic="true">
            <span aria-hidden="true">
              <span className="pretest-line-visible">{line.slice(0, visibleLetters)}</span>
              <span className="pretest-line-pending">{line.slice(visibleLetters)}</span>
            </span>
          </p>
          {!speechReady && (
            <span className="pretest-reading-progress" aria-hidden="true" style={{ width: `${Math.min(100, elapsed / readingTime * 100)}%` }} />
          )}
        </div>

        <div className="pretest-dialogue">
          {phase === 'options' && phoneViewed ? (
            <>
              <div className="pretest-speaker">{t('story.respondPrompt', { friend })}</div>
              <div className="pretest-options">
                {rounds[round].options.map((option) => (
                  <button
                    key={`${round}-${option.k}`}
                    type="button"
                    className="pretest-option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setAnswer(option.text)
                      setPhase('reply')
                    }}
                  >
                    <span>{option.text}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="pretest-line-row">
                {phase === 'endingYou' && speechReady && (
                  <button className="btn btn-cyan" onMouseDown={(event) => event.preventDefault()} onClick={startGame}>
                    {p.begin}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {phoneOpen && (
        <div
          className="pretest-phone-view"
          role="dialog"
          aria-modal="true"
          aria-label={t('story.product.offerLabel')}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { event.stopPropagation(); closePhone() }
            if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus({ preventScroll: true }) }
          }}
        >
          <img src={bgUrl('phone-with-ad.png')} alt={t('story.product.offerLabel')} onLoad={() => setPhoneViewed(true)} />
          <button
            ref={closeRef}
            type="button"
            className="pretest-phone-close"
            onMouseDown={(event) => event.preventDefault()}
            onClick={closePhone}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </div>
  )
}
