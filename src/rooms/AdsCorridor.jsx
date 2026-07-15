import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { ITEMS, CODES } from '../game/gameData.js'
import RoomFrame from '../components/RoomFrame.jsx'
import { useStage } from '../components/Stage.jsx'
import './AdsCorridor.css'

/* CORRIDOR (between Puzzle 3 and 4) — Ads Corridor.
   Per the brief: glossy ads hide the truth in the fine print. The player
   picks up a "Truth Flashlight" on entry, charges it (a deliberate beat —
   a nod to how bait ads waste your time), toggles it ON, and shines it on
   four posters to reveal the hidden truth. Each revealed truth hides one
   letter; in order they spell the exit code (CODES.adsCorridor === 'SAVE').
   Type the code to open the exit. Reward: an evidence clue for Max.

   Structural data (poster id, tint, hidden letter) lives here; all display
   text comes from i18n (rooms.ads.*). Poster text is keyed by array index
   into rooms.ads.posters — order matters (letters spell the code). */
const POSTERS = [
  { id: 'trial', tint: 'blue', letters: 'S' },
  { id: 'prize', tint: 'gold', letters: 'A' },
  { id: 'rich', tint: 'green', letters: 'V' },
  { id: 'virus', tint: 'purple', letters: 'E' },
]

export default function AdsCorridor({ node }) {
  const { completeRoom, addItem, addEvidence, hasItem } = useGame()
  const t = useT()
  const { scale } = useStage()

  // Flashlight lifecycle: 'charging' → 'ready' (off) → toggle on/off.
  const [charging, setCharging] = useState(true)
  const [lightOn, setLightOn] = useState(false)
  const [pickedUp, setPickedUp] = useState(false)

  // Refs for the cursor-tracked spotlight overlay.
  const wallRef = useRef(null)
  const flashRef = useRef(null)

  // Which posters have been illuminated at least once.
  const [revealed, setRevealed] = useState({}) // id -> true

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const inputRef = useRef(null)

  const ANSWER = CODES.adsCorridor // 'SAVE'
  const allRevealed = POSTERS.every((p) => revealed[p.id])

  // On entry: grant the Truth Flashlight if the player doesn't have it,
  // then let it "charge" for a beat before it can be switched on.
  useEffect(() => {
    if (!hasItem('truthLight')) {
      addItem(ITEMS.truthLight)
      setPickedUp(true)
    }
    const t = setTimeout(() => setCharging(false), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleLight() {
    if (charging) return
    setLightOn((on) => !on)
  }

  // Shining the light on a poster (only works while it is ON) reveals
  // that poster's hidden fine print and remembers it for the code hint.
  function shine(id) {
    if (!lightOn) return
    setRevealed((r) => (r[id] ? r : { ...r, [id]: true }))
  }

  // Move the spotlight to the cursor. We write the position straight to the
  // overlay's CSS vars (no re-render). Coords are converted from screen space
  // into the wall's own design-pixel space by dividing out the stage scale.
  function moveBeam(clientX, clientY) {
    const rect = wallRef.current?.getBoundingClientRect()
    const el = flashRef.current
    if (!rect || !el) return
    el.style.setProperty('--Xpos', `${(clientX - rect.left) / scale}px`)
    el.style.setProperty('--Ypos', `${(clientY - rect.top) / scale}px`)
  }
  const onMouseMove = (e) => { if (lightOn) moveBeam(e.clientX, e.clientY) }
  const onTouchMove = (e) => {
    if (lightOn && e.touches[0]) moveBeam(e.touches[0].clientX, e.touches[0].clientY)
  }

  function submit(e) {
    e.preventDefault()
    if (solved) return
    if (code.trim().toUpperCase() === ANSWER.toUpperCase()) {
      addEvidence({
        id: 'ev-ads',
        label: t('rooms.ads.evidence'),
      })
      setSolved(true)
      setError('')
    } else {
      setError(t('rooms.ads.errCode'))
      inputRef.current?.classList.remove('shake')
      // force reflow so the shake animation can retrigger
      void inputRef.current?.offsetWidth
      inputRef.current?.classList.add('shake')
    }
  }

  return (
    <RoomFrame
      node={node}
      intro={t('rooms.ads.intro')}
      solved={solved}
      solvedTitle={t('rooms.ads.solvedTitle')}
      solvedText={t('rooms.ads.solvedText')}
      onContinue={() => completeRoom(node.id)}
    >
      <div className={`ac-wrap fade-in ${lightOn ? 'light-on' : ''}`}>
       <div className="ac-layout">
        {/* Left: corridor wall with its posters + cursor-tracked flashlight */}
        <div
          className="ac-wall"
          ref={wallRef}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
        >
          {POSTERS.map((p, i) => {
            const isRevealed = !!revealed[p.id]
            const poster = t('rooms.ads.posters')[i]
            return (
              <div
                key={p.id}
                className={`ac-poster tint-${p.tint} ${isRevealed ? 'revealed' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={poster.glossyTitle}
                // Sweeping the beam over a poster (or tapping it) reveals it.
                onMouseMove={() => shine(p.id)}
                onClick={() => shine(p.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shine(p.id) } }}
              >
                {/* Glossy front — the advertisement's shiny promise */}
                <div className="ac-glossy">
                  <div className="ac-badge">{poster.glossyBadge}</div>
                  <div className="ac-glossy-title">{poster.glossyTitle}</div>
                  <div className="ac-glossy-body">{poster.glossyBody}</div>
                  <div className="ac-glossy-cta">{t('rooms.ads.glossyCta')}</div>
                  <div className="ac-fineprint">{t('rooms.ads.fineprint')}</div>
                </div>

                {/* Truth layer — revealed once the beam has hit this poster */}
                <div className="ac-truth" aria-hidden={!isRevealed}>
                  <div className="ac-truth-tag">{t('rooms.ads.truthTag')}</div>
                  <p className="ac-truth-text">{poster.truth}</p>
                  <div className="ac-code-frag mono">
                    {t('rooms.ads.codeFragment')}<b>{p.letters}</b>
                  </div>
                </div>
              </div>
            )
          })}

          {/* The flashlight beam — a dark overlay with a transparent hole
              that follows the cursor. Only present while the light is ON. */}
          {lightOn && <div className="ac-flashlight" ref={flashRef} aria-hidden />}
        </div>

        {/* Right: flashlight controls, code assembly and exit entry */}
        <div className="ac-side">
          {/* Flashlight pickup note */}
          {pickedUp && (
            <div className="banner info ac-pickup">{t('rooms.ads.pickup')}</div>
          )}

          {/* Flashlight control + status */}
          <div className="ac-toolbar">
            <button
              className={`btn ${lightOn ? 'btn-cyan' : 'btn-ghost'} ac-torch ${charging ? 'charging' : ''}`}
              onClick={toggleLight}
              disabled={charging}
            >
              {charging ? t('rooms.ads.torchCharging') : lightOn ? t('rooms.ads.torchOn') : t('rooms.ads.torchOff')}
            </button>
            <span className="ac-hint dim t-sm">
              {charging
                ? t('rooms.ads.hintCharging')
                : lightOn
                  ? t('rooms.ads.hintOn')
                  : t('rooms.ads.hintOff')}
            </span>
          </div>

          {/* Assembled code hint, once all posters are lit */}
          {allRevealed && (
            <div className="banner correct ac-code-line fade-in">
              {t('rooms.ads.codeAssembled')}<b className="ac-code-letters">{t('rooms.ads.codeLetters')}</b>
            </div>
          )}

          {/* Exit code entry */}
          <form className="ac-exit" onSubmit={submit}>
            <label className="ac-exit-label upper t-sm dim" htmlFor="ac-code">
              {t('rooms.ads.exitLabel')}
            </label>
            <div className="ac-exit-row">
              <input
                id="ac-code"
                ref={inputRef}
                className="field ac-field"
                value={code}
                maxLength={8}
                placeholder={t('rooms.ads.exitPlaceholder')}
                autoComplete="off"
                onChange={(e) => {
                  setError('')
                  setCode(e.target.value)
                }}
              />
              <button type="submit" className="btn btn-cyan">{t('rooms.ads.exitButton')}</button>
            </div>
            {error && <div className="banner wrong">{error}</div>}
          </form>

          {/* Learning objective */}
          <div className="learn ac-learn">
            <b>{t('rooms.ads.learnLabel')}</b> {t('rooms.ads.learn')}
          </div>
        </div>
       </div>
      </div>
    </RoomFrame>
  )
}
