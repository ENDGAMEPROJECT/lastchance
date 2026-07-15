import { useT } from '../i18n/index.jsx'
import { NARRATIVE } from '../game/gameData.js'
import './RoomFrame.css'

/* Consistent chrome for every district/corridor.
   Props:
   - node: the current node object (title/subtitle/accent)
   - intro: short line under the title (optional; defaults to node.blurb)
   - bgImage: optional url for a provided background image slot
   - solved: when true, shows the "cleared" bar with a Continue button
   - solvedTitle / solvedText: message in the cleared bar
   - onContinue: called from the Continue button (usually completeRoom)
   - children: the interactive puzzle UI
*/
export default function RoomFrame({
  node,
  intro,
  bgImage,
  solved = false,
  solvedTitle,
  solvedText,
  onContinue,
  children,
}) {
  const t = useT()
  const accent = node?.accent || 'cyan'
  const vars = { friend: NARRATIVE.friend }
  return (
    <div className="scene room-scene">
      {bgImage && <div className="bg-slot" style={{ backgroundImage: `url(${bgImage})` }} />}

      <div className="room-header fade-in">
        <div className={`eyebrow accent-${accent}`}>{node ? t(`nodes.${node.id}.subtitle`, vars) : ''}</div>
        <h2>{node ? t(`nodes.${node.id}.title`, vars) : ''}</h2>
        <p className="muted">{intro || (node ? t(`nodes.${node.id}.blurb`, vars) : '')}</p>
      </div>

      <div className="room-body">{children}</div>

      {solved && (
        <div className="room-cleared-overlay fade-in">
          <div className="room-cleared panel clip panel-glow-green">
            <div className="cleared-left">
              <span className="cleared-badge">✓</span>
              <div>
                <div className="cleared-title">{solvedTitle || t('roomframe.clearedDefaultTitle')}</div>
                <div className="cleared-text muted t-sm">{solvedText || t('roomframe.clearedDefaultText')}</div>
              </div>
            </div>
            <button className="btn btn-green" onClick={onContinue}>{t('common.continue')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
