import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../game/GameContext.jsx'
import { useT } from '../../i18n/index.jsx'
import { bgUrl } from '../../game/assets.js'
import { passedPosttest } from '../../game/posttestOutcome.js'
import './pretest.css'

// How long a speech bubble / the answer panel takes to fade out (matches pretest.css).
const FADE_MS = 350

/* Shared scene for the diagnostic conversations and the post-test review. */
export default function InPersonTest({ script: p, masteryOpening, actions = [], requirePhoneView = true, assessment = false, questionIndices, skipOpening = false, assessmentEnding, onComplete }) {
  const { reducedMotion, narrative } = useGame()
  const t = useT()
  const friend = narrative.friend
  const allRounds = t('story.rounds')
  const rounds = questionIndices ? questionIndices.map((index) => allRounds[index]) : allRounds
  const [phase, setPhase] = useState(skipOpening ? 'options' : 'opening')
  const [round, setRound] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [answers, setAnswers] = useState([])
  // The option just clicked: the panel fades out before the reply starts.
  const [choosing, setChoosing] = useState(null)
  const chooseTimer = useRef(0)
  const mastery = Boolean(masteryOpening)
  const [prompt, setPrompt] = useState(skipOpening ? masteryOpening : p.opening)
  const completed = useRef(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [phoneViewed, setPhoneViewed] = useState(false)
  // Highlight strength only: strong pulse until the phone is clicked, then a
  // soft border pulse (independent of requirePhoneView, so post-test too).
  const [phoneClicked, setPhoneClicked] = useState(false)
  const needsPhoneView = requirePhoneView && !phoneViewed
  const phoneRef = useRef(null)
  const closeRef = useRef(null)
  const returnFocusRef = useRef(false)
  const speechClock = useRef({ key: '', elapsed: 0 })
  const [speechProgress, setSpeechProgress] = useState({ key: '', elapsed: 0 })
  const playerSpeaking = ['reply', 'endingYou'].includes(phase)
  const miaSpeaking = (playerSpeaking ? narrative.player : friend) === 'Mia'
  const line = ['opening', 'masteryIntro', 'options'].includes(phase) ? prompt
    : phase === 'reply' ? answer.text
    : phase === 'response' ? (mastery ? (answer.correct ? rounds[round].why : rounds[round].nudge) : p.responses[round])
    : phase === 'endingFriend' ? (assessmentEnding ? assessmentEnding(passedPosttest(answers, rounds.length)) : p.endingFriend)
    : phase === 'endingYou' ? p.endingYou : ''
  const speechKey = `${mastery}:${phase}:${round}:${line}`
  const readingTime = Math.max(3500, line.length * 18 + 1500, line.trim().split(/\s+/).length * 280 + 800)
  const elapsed = speechProgress.key === speechKey ? speechProgress.elapsed : 0
  const speechReady = phase === 'options' || elapsed >= readingTime
  const visibleLetters = reducedMotion || phase === 'options' ? line.length : Math.floor(elapsed / 18)
  const showActions = phase === (p.endingYou ? 'endingYou' : 'endingFriend') && speechReady && actions.length > 0
  const showOptions = phase === 'options' && !needsPhoneView
  // While the player must answer, the bubble slides up to make room below it.
  const asking = showOptions || showActions
  // Lines that flow into the options keep their bubble (it only slides up);
  // every other line fades out at the end of its reading time.
  const lastRound = round === rounds.length - 1
  const continuesIntoOptions = phase === 'masteryIntro' || (phase === 'opening' && !mastery)
    || (phase === 'response' && (!lastRound || (mastery && !assessment && !answer?.correct)))
  const hasNextLine = !(phase === 'options' || phase === 'endingYou' || (phase === 'opening' && needsPhoneView)
    || (phase === 'endingFriend' && !p.endingYou && !assessment))
  const leaving = Boolean(choosing)
    || (!reducedMotion && hasNextLine && !continuesIntoOptions && elapsed >= readingTime - FADE_MS)

  function choose(option) {
    if (choosing) return
    const commit = () => {
      setChoosing(null)
      setAnswer(option)
      setAnswers((previous) => {
        const next = [...previous]
        next[round] = option.correct === true
        return next
      })
      setPhase('reply')
    }
    if (reducedMotion) return commit()
    setChoosing(option)
    chooseTimer.current = window.setTimeout(commit, FADE_MS)
  }

  useEffect(() => () => window.clearTimeout(chooseTimer.current), [])

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
    if (assessment && onComplete && phase === 'endingFriend') {
      if (!completed.current) {
        completed.current = true
        onComplete(answers)
      }
      return
    }
    if (phase === 'opening') {
      if (needsPhoneView) return
      if (mastery) {
        setPrompt(masteryOpening)
        setPhase('masteryIntro')
      } else setPhase('options')
    } else if (phase === 'masteryIntro') {
      setPhase('options')
    } else if (phase === 'reply') {
      if (mastery) setPhase('response')
      else if (round === rounds.length - 1) setPhase('endingFriend')
      else if (p.responses[round]) setPhase('response')
      else {
        setRound((value) => value + 1)
        setPhase('options')
      }
    } else if (phase === 'response') {
      setPrompt(line)
      if (mastery && !assessment && !answer.correct) setPhase('options')
      else if (round === rounds.length - 1) setPhase('endingFriend')
      else {
        setRound((value) => value + 1)
        setPhase('options')
      }
    } else if (phase === 'endingFriend' && p.endingYou) setPhase('endingYou')
  }, [speechReady, phoneOpen, needsPhoneView, phase, round, rounds.length, p.responses, p.endingYou, mastery, masteryOpening, assessment, answer, answers, onComplete, line])

  return (
    <div className="scene pretest-scene">
      <div className="pretest-content" inert={phoneOpen ? '' : undefined}>
        <div className="pretest-art">
          <img className={`pretest-backdrop ${playerSpeaking ? '' : 'is-visible'}`} src={bgUrl(narrative.friendTalkingImage)} alt="" />
          <img className={`pretest-backdrop ${playerSpeaking ? 'is-visible' : ''}`} src={bgUrl(narrative.playerTalkingImage)} alt="" />
          {/* Darkens the scene while the player has to answer (below the phone). */}
          <div className={`pretest-shade ${asking ? 'is-on' : ''}`} aria-hidden="true" />
          <button
            ref={phoneRef}
            type="button"
            className={`pretest-phone ${narrative.character === 'max' ? 'phone-mia' : ''} ${phoneClicked ? '' : 'is-unseen'} ${asking ? 'is-dimmed' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { setPhoneClicked(true); setPhoneOpen(true) }}
            aria-label={t('story.product.offerLabel')}
            title={t('story.product.offerLabel')}
            aria-haspopup="dialog"
          >
            <svg className="pretest-phone-light" viewBox={narrative.character === 'max' ? '1008 418 96 108' : '648 496 108 100'} aria-hidden="true">
              {/* Trace only the exposed handset; the fingers stay unlit. */}
              <path d={narrative.character === 'max'
                ? 'M1017 434 Q1014 429 1022 428 L1058 425 Q1064 425 1067 432 L1085 479 C1074 478 1052 482 1037 486 L1036 482 L1053 473 Q1061 468 1058 464 Q1057 461 1053 463 C1045 464 1036 468 1029 471 Z M1041 498 C1057 493 1076 490 1086 488 L1089 493 C1072 493 1052 500 1041 504 Z M1048 518 C1062 510 1081 507 1093 502 L1095 507 Q1097 514 1090 515 L1080 515 L1075 513 C1065 513 1057 517 1048 518 Z'
                : 'M676 548 L699 509 Q703 502 710 503 L742 505 Q750 506 747 514 L729 541 C721 538 710 533 704 535 Q698 536 699 542 Q699 547 706 550 L718 555 L718 560 C704 555 689 551 676 548 Z M666 560 C679 564 694 571 705 576 L702 578 C690 573 676 568 663 564 Z M657 575 C663 578 671 581 678 584 L660 582 Q654 581 655 577 Z'} />
            </svg>
          </button>
        </div>

        {/* Keyed by speaker + text: a new line remounts (fades in); the same
            line flowing into the options stays mounted and just slides up. */}
        <div
          key={`${playerSpeaking}:${line}`}
          className={`pretest-speech ${miaSpeaking ? 'is-mia' : 'is-max'} ${asking ? 'is-asking' : ''} ${leaving ? 'is-leaving' : ''}`}
          aria-label={playerSpeaking ? t('story.you') : friend}
        >
          <div className="pretest-speech-name" data-text={playerSpeaking ? narrative.player : friend} aria-hidden="true">{playerSpeaking ? narrative.player : friend}</div>
          <p className="pretest-line" aria-label={line} aria-live="polite" aria-atomic="true">
            <span aria-hidden="true">
              <span className="pretest-line-visible">{line.slice(0, visibleLetters)}</span>
              <span className="pretest-line-pending">{line.slice(visibleLetters)}</span>
            </span>
          </p>
          {/* Bottom rule doubles as the reading-time line. */}
          <span className="pretest-reading-track" aria-hidden="true">
            <span className="pretest-reading-progress" style={{ width: `${speechReady ? 100 : Math.min(100, elapsed / readingTime * 100)}%` }} />
          </span>
        </div>

        {showOptions && (
          <div className={`pretest-choices is-${narrative.character} ${choosing ? 'is-leaving' : ''}`}>
            <div className="pretest-choices-tab">{t('story.respondPrompt', { friend })}</div>
            <div className="pretest-options">
              {rounds[round].options.map((option) => (
                <button
                  key={`${round}-${option.k}`}
                  type="button"
                  className={`pretest-option ${choosing === option ? 'is-chosen' : ''}`}
                  disabled={Boolean(choosing)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <span>{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showActions && (
          <div className="pretest-choices pretest-actions">
            {actions.map((action) => (
              <button key={action.label} className={`btn btn-${action.tone}`} onMouseDown={(event) => event.preventDefault()} onClick={() => action.onClick({ passed: passedPosttest(answers, rounds.length) })}>
                {action.label}
              </button>
            ))}
          </div>
        )}
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
