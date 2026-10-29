// Character roles belong to a run, independently of the player's study alias.
const CHARACTERS = {
  mia: { name: 'Mia', gender: 'F', profileImage: 'algorithm-room/mia-figure-nobg.png' },
  max: { name: 'Max', gender: 'M', profileImage: 'algorithm-room/max-figure-nobg.png' },
}

/* Dialog scenes are layered: a scenery background (1728×998) plus one cut-out
   per character from public/characters, named
   `<character>-<active|inactive>-<scenery>[-<player|friend>]`. The speaker shows
   the active cut-out, the listener the inactive one. Boxes are each cut-out's
   [left, top, width, height] in scenery pixels, so the composite matches the
   original flattened art exactly. */
export const SCENE_SIZE = [1728, 998]
const SCENERY = {
  school: {
    image: 'bg-school.png',
    // School art differs by role: first key character, second key role.
    boxes: {
      mia: { player: [991, 157, 420, 841], friend: [991, 175, 420, 823] },
      max: { player: [271, 146, 507, 893], friend: [271, 130, 479, 909] },
    },
    // Emotion poses (`<character>-<state>-school-<role>-<pose>.png`), each
    // drawn for one role: same scale as the neutral art, cropped at the
    // frame's bottom edge and centred on the neutral legs.
    poses: {
      ashamed: { role: 'friend', boxes: { max: [254, 171, 513, 827], mia: [998, 175, 443, 823] } },
      frustrated: { role: 'player', boxes: { max: [302, 175, 449, 823], mia: [993, 175, 420, 823] } },
      explaining: { role: 'player', boxes: { max: [237, 146, 555, 852], mia: [957, 173, 452, 825] } },
    },
  },
  internet: {
    image: 'bg-ph-internet.png',
    boxes: { mia: [1080, 205, 391, 798], max: [257, 176, 441, 847] },
  },
}

function dialogScene(scenery, playerId) {
  const { image, boxes, poses = {} } = SCENERY[scenery]
  return {
    image,
    characters: ['max', 'mia'].map((id) => {
      const role = id === playerId ? 'player' : 'friend'
      const file = (state) => (scenery === 'school'
        ? `characters/${id}-${state}-school-${role}.png`
        : `characters/${id}-${state}-internet.png`)
      return {
        id,
        role,
        box: scenery === 'school' ? boxes[id][role] : boxes[id],
        active: file('active'),
        inactive: file('inactive'),
        poses: Object.fromEntries(Object.entries(poses)
          .filter(([, pose]) => pose.role === role)
          .map(([pose, { boxes: poseBoxes }]) => [pose, {
            box: poseBoxes[id],
            active: `characters/${id}-active-school-${role}-${pose}.png`,
            inactive: `characters/${id}-inactive-school-${role}-${pose}.png`,
          }])),
      }
    }),
  }
}

/* Every file a dialog scene can show, for preloading. */
export const sceneFiles = ({ image, characters }) => [image, ...characters.flatMap((character) =>
  [character, ...Object.values(character.poses)].flatMap(({ active, inactive }) => [active, inactive]))]

export function getNarrative(character = 'mia') {
  const playerId = character === 'max' ? 'max' : 'mia'
  const friendId = playerId === 'max' ? 'mia' : 'max'
  return {
    character: playerId,
    player: CHARACTERS[playerId].name,
    friend: CHARACTERS[friendId].name,
    friendId,
    friendGender: CHARACTERS[friendId].gender,
    friendProfileImage: CHARACTERS[friendId].profileImage,
    reportImage: `objects/${friendId}-report.png`, // max-report.png / mia-report.png
    schoolScene: dialogScene('school', playerId),
    internetScene: dialogScene('internet', playerId),
    product: 'the "NovaPad X" tablet',
  }
}
