import { useGame } from '../game/GameContext.jsx'
import { DEBUG } from '../game/settings.js'
import { useT } from '../i18n/index.jsx'
import { getAllEvidence } from '../game/evidence.js'

/* Debug-only shortcut: gather every room's evidence without playing — all
   districts marked solved, all evidence logged, all tools in the bag. */
export default function DebugEvidenceButton() {
  const { gatherAllEvidence, narrative } = useGame()
  const t = useT()
  if (!DEBUG) return null
  const evidence = getAllEvidence(t, narrative)
  return (
    <button className="btn btn-sm btn-ghost" title="Mark every district solved and log all evidence (debug)"
      onMouseDown={(event) => event.preventDefault()} onClick={() => gatherAllEvidence(evidence)}>
      All evidence
    </button>
  )
}
