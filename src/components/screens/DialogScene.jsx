import { bgUrl } from '../../game/assets.js'
import { SCENE_SIZE } from '../../game/characters.js'

const [W, H] = SCENE_SIZE
// How much the speaking character grows, and the anchor of that zoom as a
// fraction of the cut-out's height: at the chest, so they gain little height
// and grow mostly sideways and down (past the bottom of the frame).
const SPEAKING_ZOOM = 1.07
const ZOOM_ORIGIN_Y = 0.35
const zoomOrigin = ([left, top, w, h]) => [left + w / 2, top + h * ZOOM_ORIGIN_Y]
const pct = (value, total) => `${(value / total) * 100}%`

/* A dialog backdrop: the scenery plus each character's cut-out. `speaker` is
   the role talking ('player' | 'friend' | null); that character shows its
   active cut-out and zooms in slightly, the other its inactive one. */
export default function DialogScene({ scene, speaker, visible = true, className = '' }) {
  return (
    <div
      className={`pretest-backdrop dialog-scene ${className} ${visible ? 'is-visible' : ''}`}
      style={{ '--speaking-zoom': SPEAKING_ZOOM }}
    >
      <img src={bgUrl(scene.image)} alt="" />
      {scene.characters.map(({ id, role, box, active, inactive }) => (
        <div
          key={id}
          className={`dialog-char ${speaker === role ? 'is-speaking' : ''}`}
          style={{
            left: pct(box[0], W), top: pct(box[1], H), width: pct(box[2], W), height: pct(box[3], H),
            transformOrigin: `50% ${ZOOM_ORIGIN_Y * 100}%`,
          }}
        >
          <img src={bgUrl(inactive)} alt="" />
          <img className="is-active" src={bgUrl(active)} alt="" />
        </div>
      ))}
    </div>
  )
}

/* Moves its children with a character's zoom (e.g. the phone in their hand):
   a full-scene layer scaled around the same point as that cut-out. */
export function FollowCharacter({ scene, role, speaker, children }) {
  const [x, y] = zoomOrigin(scene.characters.find((c) => c.role === role).box)
  return (
    <div
      className={`dialog-follow ${speaker === role ? 'is-speaking' : ''}`}
      style={{ '--speaking-zoom': SPEAKING_ZOOM, transformOrigin: `${pct(x, W)} ${pct(y, H)}` }}
    >
      {children}
    </div>
  )
}

/* The same scene, as it looks with `speaker` talking, painted as CSS multiple
   backgrounds (topmost first) for effects that need a background-image. */
export function sceneBackground(scene, speaker) {
  const layers = [
    ...scene.characters.map(({ role, box: original, active, inactive }) => {
      const zoom = speaker === role ? SPEAKING_ZOOM : 1
      // Scaled around the zoom origin, like .dialog-char.
      const [x, y] = zoomOrigin(original)
      const [left, top, w, h] = original
      const box = [x - (x - left) * zoom, y - (y - top) * zoom, w * zoom, h * zoom]
      return { file: speaker === role ? active : inactive, box }
    }).reverse(),
    { file: scene.image },
  ]
  return {
    backgroundImage: layers.map(({ file }) => `url(${bgUrl(file)})`).join(', '),
    backgroundSize: layers.map(({ box }) => (box ? `${pct(box[2], W)} ${pct(box[3], H)}` : '100% 100%')).join(', '),
    // Percent positions align the image's p% point with the box's p% point.
    backgroundPosition: layers.map(({ box }) => (box
      ? `${pct(box[0], W - box[2])} ${pct(box[1], H - box[3])}`
      : '0 0')).join(', '),
    backgroundRepeat: 'no-repeat',
  }
}
