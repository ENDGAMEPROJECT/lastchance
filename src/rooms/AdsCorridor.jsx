import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { CODES } from '../game/gameData.js'
import { bgUrl } from '../game/assets.js'
import { playSound } from '../game/sound.js'
import RoomFrame from '../components/RoomFrame.jsx'
import { useStage } from '../components/Stage.jsx'
import './AdsCorridor.css'

/* CORRIDOR (between Puzzle 3 and 4) — Ads Corridor.
   Per the brief: glossy ads hide the truth in the fine print. The player
   equips the "Truth Flashlight" earned in Algorithm Room from the bag,
   then shines it on
   four posters to reveal the hidden truth. Each revealed truth hides one
   letter; in order they spell the exit code (CODES.adsCorridor === 'SAVE').
   Type the code to open the exit. Reward: an evidence clue for Max.

   Structural data (poster id, tint, hidden letter) lives here; all display
   text comes from i18n (rooms.ads.*). Poster text is keyed by array index
   into rooms.ads.posters — order matters (letters spell the code). */
const POSTERS = [
  { id: 'trial', tint: 'blue', letters: 'S', image: '1-get-offer.png' },
  { id: 'prize', tint: 'gold', letters: 'A', image: '2-get-gift.png' },
  { id: 'rich', tint: 'green', letters: 'V', image: '3-get-rich.png' },
  { id: 'virus', tint: 'purple', letters: 'E', image: '4-get-protection.png' },
]

export default function AdsCorridor({ node }) {
  const { completeRoom, addEvidence, hasItem } = useGame()
  const t = useT()
  const { scale } = useStage()

  // The flashlight stays off until the player equips it from the bag.
  const [lightOn, setLightOn] = useState(false)

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

  useEffect(() => {
    const onUseItem = (event) => {
      if (event.detail?.id === 'truthLight' && hasItem('truthLight')) setLightOn(true)
    }
    window.addEventListener('lastchance:use-item', onUseItem)
    return () => window.removeEventListener('lastchance:use-item', onUseItem)
  }, [hasItem])

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
    const el = flashRef.current
    if (!el) return
    // Measure against the beam element's OWN box (it extends past the wall),
    // so the light hole tracks the cursor no matter how far it overflows.
    const rect = el.getBoundingClientRect()
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
      playSound('wrong.mp3')
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
      bgImage={bgUrl('ads.png')}
      // Lights-out: darken the whole scene (incl. the background image) while
      // the flashlight is on, so only the beam reveals the posters.
      dimBackground={lightOn}
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
              const adImage = isRevealed ? p.image.replace(/\.png$/, '-truth.png') : p.image
              const adBackground = `linear-gradient(160deg, rgba(9, 12, 25, 0.16), rgba(9, 12, 25, 0.18)), url(${import.meta.env.BASE_URL}ads-corridor/${adImage})`
              return (
                <div
                  key={p.id}
                  className={`ac-poster tint-${p.tint} ${isRevealed ? 'revealed' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={poster.glossyTitle}
                  // Don't take focus on click: focusing a child inside the scaled,
                  // overflow:hidden stage makes the browser scroll it "into view",
                  // jumping the whole screen up. Keyboard (Tab+Enter) still works.
                  onMouseDown={(e) => e.preventDefault()}
                  // Sweeping the beam over a poster (or tapping it) reveals it.
                  onMouseMove={() => shine(p.id)}
                  onClick={() => shine(p.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shine(p.id) } }}
                >
                  {/* Glossy front — the advertisement's shiny promise */}
                  <div className={`ac-glossy ac-${p.id}`}
                    style={{
                      backgroundImage: adBackground,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {!isRevealed ?
                      <>
                        <div className="ac-badge">{poster.glossyBadge}</div>
                        <div className="ac-glossy-title">{poster.glossyTitle}</div>
                        <div className="ac-glossy-body">{poster.glossyBody}</div>
                        <div className="ac-glossy-cta">{t('rooms.ads.glossyCta')}</div>
                        <div className="ac-fineprint">{t('rooms.ads.fineprint')}</div>
                      </> : <></>
                    }
                  </div>
                  <div className={`ac-truth ac-${p.id}`}  aria-hidden={!isRevealed}>
                    <div className={`ac-truth-title`}>{poster.truthTitle}</div>
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

          {/* Exit entry and learning objective */}
          <div className="ac-side">
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
