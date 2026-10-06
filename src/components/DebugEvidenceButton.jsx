import { useGame } from '../game/GameContext.jsx'
import { DEBUG } from '../game/settings.js'
import { NARRATIVE } from '../game/gameData.js'
import { useT } from '../i18n/index.jsx'

/* Debug-only shortcut: gather every room's evidence without playing — all
   districts marked solved, all evidence logged, all tools in the bag.
   Ids/labels mirror each room's own addEvidence() call; keep them in sync. */
export default function DebugEvidenceButton() {
  const { gatherAllEvidence } = useGame()
  const t = useT()
  if (!DEBUG) return null
  const evidence = [
    { id: 'ev-links', label: 'The “deal” link was a look-alike domain, not the real store.' }, // LinkDistrict
    { id: 'ev-roulette', label: t('rooms.roulette.investigation.evidence') },
    { id: 'ev-influencer', label: t('rooms.influencer.evidenceLabel') },
    { id: 'ev-algo', label: t('rooms.algorithm.evidence', { friend: NARRATIVE.friend }) },
    { id: 'ev-ads', label: t('rooms.ads.evidence') },
    { id: 'ev-persuasion', label: t('rooms.persuasion.evidence') },
  ]
  return (
    <button className="btn btn-sm btn-ghost" title="Mark every district solved and log all evidence (debug)"
      onMouseDown={(event) => event.preventDefault()} onClick={() => gatherAllEvidence(evidence)}>
      All evidence
    </button>
  )
}
