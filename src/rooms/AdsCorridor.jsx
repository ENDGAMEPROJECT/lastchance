import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { bgUrl } from '../game/assets.js'
import { playSound } from '../game/sound.js'
import RoomFrame from '../components/RoomFrame.jsx'
import { useStage } from '../components/Stage.jsx'
import './AdsCorridor.css'

/* CORRIDOR (between Puzzle 3 and 4) — Ads Corridor.
   Per the brief: glossy ads hide the truth in the fine print. The player
   equips the "Truth Flashlight" (earned in the Algorithm Room) from the Bag,
   then sweeps its beam across the posters to reveal the hidden truth — a poster
   shows its truth ONLY while the beam is on it. Each truth highlights one code
   letter (set per language in i18n); read left-to-right across the posters in
   display order they spell the exit code. Type it to open the exit. Reward: an
   evidence clue for Max.

   Structural data (poster id, tint, image, and which i18n entry it uses) lives
   here; all display text — including the highlighted code letter — comes from
   i18n (rooms.ads.posters[textIndex].letter), so the letters can be set per
   language. The array order is the on-wall display order; reading each poster's
   letter left-to-right spells the exit code. */
const POSTERS = [
  // Display order 2 · 1 · 4 · 3. `textIndex` points at this poster's i18n text.
  { id: 'prize', textIndex: 1, tint: 'gold', image: '2-get-gift.png' },
  { id: 'trial', textIndex: 0, tint: 'blue', image: '1-get-offer.png' },
  { id: 'virus', textIndex: 3, tint: 'purple', image: '4-get-protection.png' },
  { id: 'rich', textIndex: 2, tint: 'green', image: '3-get-rich.png' },
]

/* Wrap the first occurrence (case-insensitive) of `letter` in `text` with a red
   highlight — the code letter, hidden in plain sight inside the truth. */
function highlightLetter(text, letter) {
  if (!text || !letter) return text
  const idx = text.toLowerCase().indexOf(letter.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="ac-hl">{text[idx]}</span>
      {text.slice(idx + 1)}
    </>
  )
}

export default function AdsCorridor({ node }) {
  const { completeRoom, addEvidence, hasItem } = useGame()
  const t = useT()
  const { scale } = useStage()

  // The flashlight stays off until the player equips it from the Bag.
  const [lightOn, setLightOn] = useState(false)

  // Refs for the cursor-tracked spotlight overlay.
  const wallRef = useRef(null)
  const flashRef = useRef(null)

  // Which poster is under the beam right now (transient — reveals hide again).
  const [activePoster, setActivePoster] = useState(null)

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [solved, setSolved] = useState(false)
  const inputRef = useRef(null)

  // The exit code is the highlighted letters read across the posters in display
  // order — derived from i18n, so it follows whatever letters each language sets.
  const posterTexts = t('rooms.ads.posters')
  const ANSWER = POSTERS.map((p) => posterTexts[p.textIndex]?.letter || '').join('')

  // Equipping the Truth Flashlight from the Bag switches the beam on.
  useEffect(() => {
    const onUseItem = (event) => {
      if (event.detail?.id === 'truthLight' && hasItem('truthLight')) setLightOn(true)
    }
    window.addEventListener('lastchance:use-item', onUseItem)
    return () => window.removeEventListener('lastchance:use-item', onUseItem)
  }, [hasItem])

  // Point the flashlight at a poster to reveal its truth — but ONLY while the
  // beam is on it. Moving the beam away reverts it to the glossy ad, so the
  // player has to actually sweep the light to read each one.
  function pointAt(id) {
    if (lightOn) setActivePoster(id)
  }
  function leavePoster(id) {
    setActivePoster((cur) => (cur === id ? null : cur))
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
            {POSTERS.map((p) => {
              const isRevealed = lightOn && activePoster === p.id
              const poster = posterTexts[p.textIndex]
              // Prefer highlighting the code letter in the big title; only fall
              // back to the smaller truth text if the title doesn't contain it.
              const letterInTitle = !!poster.letter
                && poster.truthTitle?.toLowerCase().includes(poster.letter.toLowerCase())
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
                  // Sweep the beam over a poster to reveal it; it hides again
                  // as soon as the beam (or finger) leaves.
                  onMouseMove={() => pointAt(p.id)}
                  onMouseLeave={() => leavePoster(p.id)}
                  onTouchStart={() => pointAt(p.id)}
                  onTouchMove={() => pointAt(p.id)}
                  onTouchEnd={() => leavePoster(p.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (lightOn) setActivePoster((cur) => (cur === p.id ? null : p.id)) } }}
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
                    <div className={`ac-truth-title`}>
                      {letterInTitle ? highlightLetter(poster.truthTitle, poster.letter) : poster.truthTitle}
                    </div>
                    <p className="ac-truth-text">
                      {letterInTitle ? poster.truth : highlightLetter(poster.truth, poster.letter)}
                    </p>
                  </div>


                </div>
              )
            })}

            {/* The flashlight beam — a dark overlay with a transparent hole
              that follows the cursor. Only present while the light is ON. */}
            {lightOn && <div className="ac-flashlight" ref={flashRef} aria-hidden />}
          </div>

          {/* Right: exit code entry */}
          <div className="ac-side">
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
          </div>
        </div>
      </div>
    </RoomFrame>
  )
}
