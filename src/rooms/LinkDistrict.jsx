import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { ITEMS } from '../game/gameData.js'
import { settings } from '../game/settings.js'
import RoomFrame from '../components/RoomFrame.jsx'
import './LinkDistrict.css'

/* PUZZLE 1 — Fraudulent Links (scene version).
   The player BLOCKS the fraudulent doors and keeps the one real store
   open. Door order is shuffled every round and, in `ambiguous` mode,
   every door wears identical neutral browser chrome so the URL itself
   is the only clue — see src/game/settings.js to configure. */

/* Each round teaches one trick. Doors carry the full URL (protocol
   included, so the HTTP-vs-HTTPS round is legible) and a stable id used
   to look up the explanation note in i18n. The phishing round's third
   URL is written with an explicit Unicode escape for the Cyrillic
   и (U+0438) — an obvious-enough look-alike that a careful eye can spot. */
const ROUNDS = [
  {
    // Common suffixes — the real domain is hidden after a familiar name.
    doors: [
      { id: 'a', url: 'https://www.lunawear.com', safe: true, preview: 'store' },
      { id: 'b', url: 'https://www.lunawear.com-official.shop/', safe: false, preview: 'shop' },
      { id: 'c', url: 'https://www.lunawear-dealz.com', safe: false, preview: 'sale' },
    ],
  },
  {
    // HTTP vs HTTPS — the insecure ones use http:// (and an odd TLD).
    doors: [
      { id: 'a', url: 'https://theshoefactory.com', safe: true, preview: 'store' },
      { id: 'b', url: 'http://shoefactory.com', safe: false, preview: 'store' },
      { id: 'c', url: 'http://shoefactory.free', safe: false, preview: 'shop' },
    ],
  },
  {
    // Phishing — look-alike characters (rn→m, and a Cyrillic и).
    doors: [
      { id: 'a', url: 'https://magnumshop.com', safe: true, preview: 'store' },
      { id: 'b', url: 'https://rnagnumshop.com', safe: false, preview: 'store' },
      { id: 'c', url: 'https://magиumshop.com', safe: false, preview: 'store' },
    ],
  },
]

const FLAG_IDS = ['suffix', 'httpNoS', 'weirdTld', 'homoglyph', 'typo', 'httpsGood', 'lock', 'looksReal']
const CORRECT_FLAGS = ['suffix', 'httpNoS', 'weirdTld', 'homoglyph', 'typo']

/* Render a URL with any non-ASCII (look-alike / homoglyph) characters
   highlighted — used inside the doorway to reveal what the eye can't. */
function highlightAddr(url) {
  return [...url].map((ch, i) =>
    ch.charCodeAt(0) > 127
      ? <mark key={i} className="ld-homoglyph" title="look-alike character">{ch}</mark>
      : <span key={i}>{ch}</span>,
  )
}
const hasLookalike = (url) => [...url].some((ch) => ch.charCodeAt(0) > 127)

/* A single door. Rendered both for the interactive (incoming) crossroad and
   for the static (outgoing) one shown during the advance transition. */
function Door({ d, cfg, roundText, isBlocked, isOpen, interactive, onPeek, onBlock, t }) {
  const note = roundText.notes[d.id]
  const secure = d.url.startsWith('https://')
  const lookalike = hasLookalike(d.url)
  return (
    <div className={`ld-door ${isBlocked ? 'blocked' : ''} ${isOpen ? 'open' : ''} ${cfg.ambiguous ? 'ambiguous' : d.safe ? 'safe' : 'fake'}`}>
      <div className="ld-sign" title={t('rooms.link.linkTip')}>
        <span className="ld-linkicon">🔗</span>
        <span className="ld-url">{d.url}</span>
      </div>

      <div
        className="ld-door3d"
        role="button"
        tabIndex={interactive ? 0 : -1}
        aria-label={`${d.url} — ${t(isOpen ? 'rooms.link.closeDoor' : 'rooms.link.peek')}`}
        onClick={() => interactive && !isBlocked && onPeek(d.url)}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ') && !isBlocked) { e.preventDefault(); onPeek(d.url) }
        }}
      >
        <div className="ld-doorway">
          <div
            className={`ld-browserbar ${secure ? '' : 'insecure'}`}
            title={secure ? t('rooms.link.secureConn') : t('rooms.link.insecureConn')}
          >
            <span className={`ld-lock ${secure ? '' : 'warn'}`}>{secure ? '🔒' : '⚠'}</span>
            {!secure && <span className="ld-bar-flag">{t('rooms.link.barNotSecure')}</span>}
            {lookalike && <span className="ld-bar-flag red">{t('rooms.link.barLookalike')}</span>}
            <span className="ld-baraddr">{highlightAddr(d.url)}</span>
          </div>
          <DoorPage type={d.preview} ambiguous={cfg.ambiguous} t={t} />
        </div>

        <div className="ld-slab">
          <div className="ld-hinges"><span /><span /><span /></div>
          <div className="ld-panel top" />
          <div className="ld-panel bottom" />
          <div className="ld-kick" />
          <div className="ld-knob"><i /></div>
          <div className="ld-peek">{t(isOpen ? 'rooms.link.closeDoor' : 'rooms.link.peek')}</div>
        </div>

        {isBlocked && (
          <div className="ld-chains">
            <span>🔒</span>
            <b>{t('rooms.link.blocked')}</b>
          </div>
        )}
      </div>

      <div className="ld-door-foot">
        <button
          className={`btn btn-sm ${isBlocked ? 'btn-green' : 'btn-magenta'}`}
          onClick={() => onBlock(d.url)}
          disabled={!interactive}
        >
          {isBlocked ? t('rooms.link.unblock') : t('rooms.link.blockThis')}
        </button>
        {/* Always rendered so the layout never jumps; filled once blocked. */}
        <div className="ld-note t-xs">{isBlocked && cfg.showNotesAfterBlock ? note : ''}</div>
      </div>
    </div>
  )
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* The mini website shown "through" each door. In ambiguous mode all
   doors render the same neutral page so only the address bar differs. */
function DoorPage({ type, ambiguous, t }) {
  if (ambiguous) {
    return (
      <div className="door-page neutral">
        <div className="dp-hero" />
        <div className="dp-lines"><span /><span /><span /></div>
        <div className="dp-tiles"><span /><span /><span /></div>
      </div>
    )
  }
  if (type === 'store') {
    return (
      <div className="door-page store">
        <div className="dp-bar">{t('rooms.link.preview.newArrivals')}</div>
        <div className="dp-tiles"><span /><span /><span /></div>
        <div className="dp-cap">{t('rooms.link.preview.storeCaption')}</div>
      </div>
    )
  }
  if (type === 'sale') {
    return (
      <div className="door-page sale">
        <div className="dp-warn">{t('rooms.link.preview.megaSale')}</div>
        <div className="dp-off">90% OFF</div>
        <div className="dp-shop">{t('rooms.link.preview.shopNow')}</div>
      </div>
    )
  }
  return (
    <div className="door-page shop">
      <div className="dp-shopbar">{t('rooms.link.preview.shopBar')}</div>
      <div className="dp-prod">👟</div>
      <div className="dp-price">$9.99</div>
      <div className="dp-limited">{t('rooms.link.preview.limited')}</div>
    </div>
  )
}

export default function LinkDistrict({ node }) {
  const { completeRoom, addItem, addEvidence } = useGame()
  const t = useT()
  const cfg = settings.linkDistrict
  const [round, setRound] = useState(0)
  const [blocked, setBlocked] = useState({})
  const [opened, setOpened] = useState({}) // which doors are peeked open
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('block') // 'block' | 'justify' | 'done'
  const [flags, setFlags] = useState({})
  const [justifyErr, setJustifyErr] = useState('')

  // Background swaps to a transition clip for 5s when advancing crossroads,
  // and the incoming doors glide in from the right over the same 5s.
  const [bg, setBg] = useState('/bg/link.gif')
  const [advancing, setAdvancing] = useState(false)
  // A snapshot of the crossroad we're leaving, kept on-screen while the new
  // one slides in over it during the transition.
  const [outgoing, setOutgoing] = useState(null)
  const bgTimer = useRef(null)
  const playTransition = useCallback(() => {
    clearTimeout(bgTimer.current)
    setBg(`/bg/link_transition.gif?t=${Date.now()}`) // nonce forces the gif to replay
    setAdvancing(true)
    bgTimer.current = setTimeout(() => {
      setBg('/bg/link.gif')
      setAdvancing(false)
      setOutgoing(null)
    }, 1000)
  }, [])
  useEffect(() => () => clearTimeout(bgTimer.current), [])

  const data = ROUNDS[round]
  const roundText = t('rooms.link.rounds')[round]

  // Shuffle the on-screen order once per round (unless disabled).
  const displayDoors = useMemo(
    () => (cfg.randomizePositions ? shuffle(data.doors) : data.doors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  )
  const fakes = useMemo(() => data.doors.filter((d) => !d.safe), [data])

  const togglePeek = useCallback((url) => {
    setOpened((o) => ({ ...o, [url]: !o[url] }))
  }, [])

  const toggleBlock = useCallback((url) => {
    setError('')
    setBlocked((b) => ({ ...b, [url]: !b[url] }))
    setOpened((o) => ({ ...o, [url]: false })) // blocking shuts the door
  }, [])

  function confirmRound() {
    const badOk = fakes.every((d) => blocked[d.url])
    const safeOk = data.doors.filter((d) => d.safe).every((d) => !blocked[d.url])
    if (!badOk) return setError(t('rooms.link.errStillOpen'))
    if (!safeOk) return setError(t('rooms.link.errBlockedSafe'))
    if (round < ROUNDS.length - 1) {
      // Snapshot the doors we're leaving so they stay put during the slide.
      setOutgoing({ doors: displayDoors, blocked: { ...blocked }, roundText })
      setRound((r) => r + 1)
      setBlocked({})
      setOpened({})
      playTransition()
    } else {
      setPhase('justify')
    }
  }

  function toggleFlag(id) {
    setJustifyErr('')
    setFlags((f) => ({ ...f, [id]: !f[id] }))
  }

  function submitJustify() {
    const chosen = Object.keys(flags).filter((k) => flags[k])
    const missing = CORRECT_FLAGS.filter((id) => !chosen.includes(id))
    const wrong = chosen.filter((id) => !CORRECT_FLAGS.includes(id))
    if (missing.length || wrong.length) {
      return setJustifyErr(wrong.length ? t('rooms.link.justifyErrWrong') : t('rooms.link.justifyErrMissing'))
    }
    addItem(ITEMS.emojiCard)
    addEvidence({ id: 'ev-links', label: 'The “deal” link was a look-alike domain, not the real store.' })
    setPhase('done')
  }

  const touched = Object.values(blocked).some(Boolean)

  return (
    <RoomFrame
      node={node}
      bgImage={bg}
      intro={t('rooms.link.intro')}
      solved={phase === 'done'}
      solvedTitle={t('rooms.link.solvedTitle')}
      solvedText={t('rooms.link.solvedText')}
      onContinue={() => completeRoom(node.id)}
    >
      {phase === 'block' && (
        <div className="ld-room fade-in">
          <div className="ld-crossroad">
            <div className="ld-router-head">
              <span className="chip">{t('rooms.link.routerBadge', { current: round + 1, total: ROUNDS.length })}</span>
            </div>

            <div className="ld-stage">
              {/* Outgoing crossroad — stays put while the new one slides over it. */}
              {outgoing && (
                <div className="ld-doors-slot ld-outgoing" aria-hidden>
                  <div className="ld-doors">
                    {outgoing.doors.map((d) => (
                      <Door
                        key={d.url}
                        d={d}
                        cfg={cfg}
                        roundText={outgoing.roundText}
                        isBlocked={!!outgoing.blocked[d.url]}
                        isOpen={false}
                        interactive={false}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming crossroad — slides in from the right over the 5s. */}
              <div className="ld-doors-slot">
                <div className={`ld-doors ld-incoming ${advancing ? 'advancing' : ''}`} key={round}>
                  {displayDoors.map((d) => (
                    <Door
                      key={d.url}
                      d={d}
                      cfg={cfg}
                      roundText={roundText}
                      isBlocked={!!blocked[d.url]}
                      isOpen={!!opened[d.url] && !blocked[d.url]}
                      interactive={!advancing}
                      onPeek={togglePeek}
                      onBlock={toggleBlock}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="ld-actions">
            {error
              ? <div className="banner wrong shake ld-banner">{error}</div>
              : <span className="dim t-sm">{t('rooms.link.doorHelp')}</span>}
            <button className="btn btn-cyan" onClick={confirmRound} disabled={advancing || !touched}>
              {round < ROUNDS.length - 1 ? t('rooms.link.nextRouter') : t('rooms.link.finalRouter')}
            </button>
          </div>
        </div>
      )}

      {phase === 'justify' && (
        <div className="ld-justify fade-in">
          <div className="learn">
            <b>{t('rooms.link.justifyLeadLabel')}</b> {t('rooms.link.justifyLead')}
          </div>
          <div className="ld-flags">
            {FLAG_IDS.map((id) => (
              <label key={id} className={`ld-flag ${flags[id] ? 'on' : ''}`}>
                <input type="checkbox" checked={!!flags[id]} onChange={() => toggleFlag(id)} />
                <span className="ld-check" />
                <span>{t(`rooms.link.flags.${id}`)}</span>
              </label>
            ))}
          </div>
          <div className="ld-justify-foot">
            {justifyErr && <div className="banner wrong shake ld-banner">{justifyErr}</div>}
            <button className="btn btn-cyan" onClick={submitJustify}>{t('rooms.link.submitReasoning')}</button>
          </div>
        </div>
      )}
    </RoomFrame>
  )
}
