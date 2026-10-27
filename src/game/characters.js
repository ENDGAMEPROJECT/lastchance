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
  },
  internet: {
    image: 'bg-ph-internet.png',
    boxes: { mia: [1080, 205, 391, 798], max: [257, 176, 441, 847] },
  },
}

function dialogScene(scenery, playerId) {
  const { image, boxes } = SCENERY[scenery]
  return {
    image,
    characters: ['max', 'mia'].map((id) => {
      const role = id === playerId ? 'player' : 'friend'
      const file = (state) => (scenery === 'school'
        ? `characters/${id}-${state}-school-${role}.png`
        : `characters/${id}-${state}-internet.png`)
      return { id, role, box: scenery === 'school' ? boxes[id][role] : boxes[id], active: file('active'), inactive: file('inactive') }
    }),
  }
}

/* Every file a dialog scene can show, for preloading. */
export const sceneFiles = ({ image, characters }) => [image, ...characters.flatMap(({ active, inactive }) => [active, inactive])]

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
