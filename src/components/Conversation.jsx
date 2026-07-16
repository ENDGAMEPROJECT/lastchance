import { useEffect, useRef, useState } from 'react'
import './Conversation.css'

/* Types a string out character-by-character, then calls onDone. Animates
   once per `text` (stable message keys mean old bubbles don't re-type). */
function TypeOut({ text, speed = 12, onDone }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!text) { onDone?.(); return }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) { clearInterval(id); onDone?.() }
    }, speed)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="cv-caret">▍</span>}
    </>
  )
}

/* A branching chat between the player and their friend.
   - mode 'diagnostic': any option advances (no right/wrong feedback).
   - mode 'mastery': wrong options are nudged and retried; only the correct
     one advances.
   Friend lines type out; the player's reply options only appear once the
   friend has finished "typing". */
export default function Conversation({
  opening,
  rounds,
  responses = [],
  mode = 'diagnostic',
  replyLabel = 'Respond',
  friend = 'Max',
  ending = null,
  onRoundsDone,
}) {
  const idRef = useRef(1)
  const answersRef = useRef([])
  const nextStepRef = useRef(null)
  const [entries, setEntries] = useState(() => [{ id: 0, who: 'friend', text: opening }])
  const [round, setRound] = useState(0)
  const [awaiting, setAwaiting] = useState(true)
  const [typing, setTyping] = useState(true) // opening types on mount
  const [showActions, setShowActions] = useState(false)
  const logRef = useRef(null)

  // Keep the newest message in view — and follow along while typing.
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries, awaiting, showActions])
  useEffect(() => {
    if (!typing) return
    const id = setInterval(() => {
      const el = logRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 60)
    return () => clearInterval(id)
  }, [typing])

  const push = (items) => {
    setEntries((prev) => {
      let id = idRef.current
      const mapped = items.map((it) => ({ id: id++, ...it }))
      idRef.current = id
      return [...prev, ...mapped]
    })
  }

  // A friend line: type it out, then run `next` when finished.
  const sayFriend = (text, tone, next) => {
    push([{ who: 'friend', text, tone }])
    setTyping(true)
    nextStepRef.current = next || null
  }

  // Called by the friend bubble's TypeOut when it finishes.
  const onFriendTyped = () => {
    setTyping(false)
    const n = nextStepRef.current
    nextStepRef.current = null
    if (n) n()
  }

  const choose = (opt) => {
    if (!awaiting || typing) return
    push([{ who: 'you', text: opt.text }])

    const capturedRound = round
    const showEnding = () => {
      sayFriend(ending.friend, null, () => {
        if (ending.you) push([{ who: 'you', text: ending.you }])
        setAwaiting(false)
        setShowActions(true)
      })
    }
    const advanceOrEnd = () => {
      if (capturedRound >= rounds.length - 1) {
        onRoundsDone?.(answersRef.current)
        if (ending) showEnding()
        else setAwaiting(false)
      } else {
        setRound((r) => r + 1)
      }
    }

    if (mode === 'mastery') {
      if (opt.correct) sayFriend(rounds[capturedRound].why, 'good', advanceOrEnd)
      else sayFriend(rounds[capturedRound].nudge, 'bad', null) // stay; options return after typing
      return
    }

    // diagnostic
    answersRef.current.push(opt.k)
    if (capturedRound >= rounds.length - 1) {
      advanceOrEnd()
    } else {
      const resp = responses[capturedRound]
      if (resp) sayFriend(resp, null, () => setRound((r) => r + 1))
      else setRound((r) => r + 1)
    }
  }

  const current = rounds[round]

  return (
    <div className="cv-wrap">
      {/* messaging-app header */}
      <div className="cv-appbar">
        <span className="cv-appbar-avatar" aria-hidden>🙂</span>
        <div className="cv-appbar-who">
          <span className="cv-appbar-name">{friend}</span>
          <span className="cv-appbar-status"><i className="cv-online-dot" />{typing ? 'typing…' : 'online'}</span>
        </div>
        <span className="cv-appbar-actions" aria-hidden>📞 🎥 ⋯</span>
      </div>

      <div className="cv-log" ref={logRef}>
        {entries.map((e, i) => (
          <div key={e.id} className={`cv-msg ${e.who} ${e.tone || ''} fade-in`}>
            {e.who === 'friend' && <div className="cv-avatar" aria-hidden>🙂</div>}
            <div className="cv-bubble">
              {e.who === 'friend' ? <TypeOut text={e.text} onDone={onFriendTyped} /> : e.text}
            </div>
          </div>
        ))}
      </div>

      <div className="cv-tray">
        {awaiting && !typing && current && (
          <div className="cv-options fade-in">
            <div className="cv-round-label">{replyLabel}</div>
            <div className="cv-option-grid">
              {current.options.map((o) => (
                <button key={o.k} className="cv-option" onClick={() => choose(o)}>
                  <span className="cv-option-key">{o.k}</span>
                  <span className="cv-option-text">{o.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showActions && ending && (
          <div className="cv-actions fade-in">
            {ending.actions.map((a, i) => (
              <button key={i} className={`btn btn-lg btn-${a.tone || 'cyan'}`} onClick={a.onClick}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
