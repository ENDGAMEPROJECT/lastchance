import { useMemo, useState } from 'react'
import { useGame } from '../game/GameContext.jsx'
import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import RoomFrame from '../components/RoomFrame.jsx'
import './FinalDecision.css'

/* FINAL NODE — Final Decision.
   The whole run has been Max's finger hovering over "Buy Now" on the
   NovaPad X. Here the player cashes in the evidence collected across the
   districts and argues Max out of the purchase. Completing this node makes
   the reducer notice every node is done and flips the game to the WIN
   screen (via RoomFrame's Continue → completeRoom). So the mechanic is:
   pick your strongest arguments, present them, watch Max's doubt meter
   fill, then close the run.

   Structural data (evidence weights, ids) lives here; all display text
   comes from i18n (rooms.final.*). */

/* Per-evidence weight for the doubt meter, keyed by the evidence id the
   other rooms emit. Max's spoken reaction line comes from
   rooms.final.replies.<id> (falling back to .generic). */
const EVIDENCE_WEIGHT = {
  'ev-links': 20,
  'ev-roulette': 16,
  'ev-influencer': 16,
  'ev-algo': 16,
  'ev-ads': 20,
  'ev-persuasion': 16,
}

const GENERIC_WEIGHT = 16

/* Graceful fallback if the player somehow reached the finale with an
   empty evidence array — the room must still be completable. The labels
   come from rooms.final.fallbackArguments (parallel to these ids). */
const FALLBACK_IDS = ['fb-url', 'fb-price', 'fb-hidden', 'fb-pressure']

export default function FinalDecision({ node }) {
  const { completeRoom, evidence } = useGame()
  const t = useT()

  const vars = { friend: NARRATIVE.friend, product: NARRATIVE.product }

  /* Build the deck of argument cards from real evidence, or fall back to a
     generic set so the room is never a dead end. Fallback labels come from
     i18n; real evidence labels are rendered as-is. */
  const { cards, usingFallback } = useMemo(() => {
    if (evidence && evidence.length > 0) {
      return { cards: evidence, usingFallback: false }
    }
    const fallbackLabels = t('rooms.final.fallbackArguments')
    const fallbackCards = FALLBACK_IDS.map((id, i) => ({ id, label: fallbackLabels[i] }))
    return { cards: fallbackCards, usingFallback: true }
  }, [evidence, t])

  /* Need at least 3 arguments — but if the player has fewer than 3 pieces
     of evidence total, require all of them instead. */
  const required = Math.min(3, cards.length)

  const [selected, setSelected] = useState({}) // id -> true
  const [presented, setPresented] = useState(false) // clicked "Convince Max"
  const [solved, setSolved] = useState(false)

  const chosenIds = Object.keys(selected).filter((k) => selected[k])
  const chosenCount = chosenIds.length
  const canPresent = chosenCount >= required

  function weightFor(id) {
    return EVIDENCE_WEIGHT[id] || GENERIC_WEIGHT
  }

  function replyFor(id) {
    const key = `rooms.final.replies.${id}`
    const reply = t(key)
    return reply === key ? t('rooms.final.replies.generic') : reply
  }

  /* Live doubt meter: each selected card contributes its weight, capped at
     99% until the player actually commits with "Convince Max". */
  const liveDoubt = useMemo(() => {
    const raw = chosenIds.reduce((sum, id) => sum + weightFor(id), 0)
    return Math.min(99, raw)
  }, [chosenIds])

  const doubt = solved ? 100 : liveDoubt

  function toggle(id) {
    if (presented) return // deck locks once the case is made
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  function convince() {
    if (!canPresent) return
    setPresented(true)
    setSolved(true) // fills the meter to 100% and reveals Max conceding
  }

  /* Max's current spoken line: the reply to the last argument the player
     toggled on while arguing, escalating pushback otherwise, or the
     concession once convinced. */
  const pushback = t('rooms.final.pushback')
  const maxLine = useMemo(() => {
    if (solved) return t('rooms.final.convincedLine')
    if (chosenCount === 0) return pushback[0]
    // Voice the reaction to the most recently added argument.
    const lastId = chosenIds[chosenIds.length - 1]
    if (chosenCount < required) return replyFor(lastId)
    // Enough gathered but not yet committed — Max is wavering.
    const idx = Math.min(pushback.length - 1, chosenCount - required + 1)
    return pushback[idx]
  }, [solved, chosenCount, chosenIds, required, pushback, t])

  return (
    <RoomFrame
      node={node}
      intro={t('rooms.final.intro', vars)}
      solved={solved}
      solvedTitle={t('rooms.final.solvedTitle', vars)}
      solvedText={t('rooms.final.solvedText', vars)}
      onContinue={() => completeRoom(node.id)}
    >
      <div className="fd-wrap fade-in">
       <div className="fd-columns">
        {/* ---- The conversation scene ---- */}
        <div className="fd-scene">
          {/* Stylized CSS avatar for Max */}
          <div className={`fd-avatar ${solved ? 'calm' : 'excited'}`}>
            <div className="fd-face">
              <span className="fd-eye left" />
              <span className="fd-eye right" />
              <span className="fd-mouth" />
            </div>
            <div className="fd-avatar-name">{NARRATIVE.friend}</div>
            <div className={`fd-mood ${solved ? 'ok' : 'hype'}`}>
              {solved ? t('rooms.final.moodConvinced') : t('rooms.final.moodHyped')}
            </div>
          </div>

          <div className="fd-dialogue">
            {/* Max's live chat bubble */}
            <div className={`fd-bubble max ${solved ? 'concede' : ''}`}>
              <span className="fd-bubble-who">{NARRATIVE.friend}</span>
              <p>{maxLine}</p>
            </div>

            {/* The doubt / "convinced" meter */}
            <div className="fd-meter" role="progressbar" aria-valuenow={doubt} aria-valuemin={0} aria-valuemax={100}>
              <div className="fd-meter-head">
                <span>{t('rooms.final.doubtLabel', vars)}</span>
                <span className="mono">{doubt}%{solved ? t('rooms.final.doubtConvinced') : ''}</span>
              </div>
              <div className="fd-meter-track">
                <div className="fd-meter-fill" style={{ width: `${doubt}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ---- Argument deck ---- */}
        <div className="fd-deck-col">
        {!solved && (
          <>
            <div className="fd-deck-head">
              <h3 className="fd-deck-title">{t('rooms.final.deckTitle')}</h3>
              <p className="dim t-sm">
                {usingFallback
                  ? t('rooms.final.deckFallback')
                  : t('rooms.final.deckEvidence')}
                {' '}{t('rooms.final.deckSelect', { chosen: chosenCount, required })}
              </p>
            </div>

            <div className="fd-deck">
              {cards.map((c) => {
                const on = !!selected[c.id]
                return (
                  <label key={c.id} className={`fd-card ${on ? 'on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(c.id)} />
                    <span className="fd-card-check" />
                    <span className="fd-card-label">{c.label}</span>
                  </label>
                )
              })}
            </div>

            <div className="fd-actions">
              <span className="dim t-sm">
                {canPresent
                  ? t('rooms.final.actionsReady')
                  : t('rooms.final.actionsNeed', { required, ...vars })}
              </span>
              <button className="btn btn-green" onClick={convince} disabled={!canPresent}>
                {t('rooms.final.convinceButton', vars)}
              </button>
            </div>
          </>
        )}
        </div>
       </div>

        {/* ---- The learning objective ---- */}
        <div className="learn fd-learn">
          <b>{t('rooms.final.learnLabel')}</b> {t('rooms.final.learnPre')}
          <i>{t('rooms.final.learnUrl')}</i>{t('rooms.final.learnMid1')}
          <i>{t('rooms.final.learnDisclosure')}</i>{t('rooms.final.learnMid2')}
          <i>{t('rooms.final.learnPrice')}</i>{t('rooms.final.learnMid3')}
          <i>{t('rooms.final.learnPressure')}</i>{t('rooms.final.learnPost')}
        </div>
      </div>
    </RoomFrame>
  )
}
