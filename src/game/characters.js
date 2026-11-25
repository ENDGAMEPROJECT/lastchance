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
    // frame's bottom edge and centred on the neutral legs. (Max's excited /
    // stressed / thinking / accepting art is drawn ~5.5% larger than his
    // neutral art; their boxes scale it back down.)
    // `phone`: for a friend pose that holds the phone somewhere else, the
    // outline of the exposed handset in scenery pixels (the pre-test's
    // clickable phone follows it). A friend pose without one hides the phone.
    poses: {
      ashamed: { role: 'friend', boxes: { max: [254, 171, 513, 827], mia: [998, 175, 443, 823] } },
      frustrated: { role: 'player', boxes: { max: [302, 175, 449, 823], mia: [993, 175, 420, 823] } },
      explaining: { role: 'player', boxes: { max: [237, 146, 555, 852], mia: [957, 173, 452, 825] } },
      excited: {
        role: 'friend',
        boxes: { max: [233, 149, 520, 849], mia: [990, 175, 420, 823] },
        phone: {
          max: [[700.5, 497], [744.5, 497], [745, 498], [746.5, 498], [749.5, 502], [748.5, 507.5], [740.5, 520.5], [732, 537], [728.5, 535], [721.5, 534], [721, 533], [715.5, 531], [707.5, 529.5], [700.5, 530], [698, 533], [698, 538.5], [699.5, 540.5], [707.5, 544.5], [712, 545], [719.5, 548.5], [720.5, 553], [722, 555], [719, 558.5], [717.5, 558.5], [717, 557.5], [715.5, 557.5], [704, 551], [696.5, 550], [687.5, 546], [674, 542], [674.5, 538.5], [687.5, 518], [697, 500.5]],
          mia: [[1056.5, 430], [1059.5, 430], [1063.5, 431.5], [1069, 440.5], [1090, 485.5], [1092.5, 496.5], [1092, 499], [1088, 499], [1086.5, 500], [1065.5, 499.5], [1066, 498.5], [1068, 498.5], [1069, 497.5], [1075, 497.5], [1086, 494.5], [1086.5, 492.5], [1087.5, 492], [1087.5, 487.5], [1084.5, 485], [1070.5, 485], [1064, 487], [1054, 488], [1053, 489], [1049.5, 489], [1043.5, 491], [1036.5, 497], [1034, 496], [1036, 492.5], [1035.5, 488.5], [1043.5, 482.5], [1047, 482], [1056.5, 476.5], [1058.5, 472], [1058, 469.5], [1056, 467.5], [1049.5, 468], [1048.5, 469], [1042, 470], [1037.5, 473], [1027.5, 477], [1024, 469], [1022.5, 468], [1023, 466.5], [1019.5, 459.5], [1013, 438.5], [1014, 436], [1016, 434.5]],
        },
      },
      stressed: {
        role: 'friend',
        boxes: { max: [290, 149, 519, 859], mia: [990, 175, 420, 823] },
        phone: {
          max: [[719, 491], [720, 492.5], [722, 491], [760, 491.5], [763, 493], [766, 497], [766, 501.5], [765, 502], [757, 517.5], [752, 524.5], [751.5, 527], [747, 534.5], [739.5, 532.5], [735.5, 530], [726, 527.5], [719, 527.5], [715.5, 531.5], [715.5, 536.5], [717.5, 539], [724.5, 542.5], [730, 543.5], [735.5, 547], [738, 554], [733.5, 556.5], [730.5, 556], [722.5, 550.5], [711, 547.5], [703.5, 543.5], [698.5, 542.5], [692, 539.5], [692, 537.5], [693, 537], [693.5, 535], [706, 516.5], [717, 493.5]],
          mia: [[1050, 436], [1052.5, 436], [1058, 438], [1064, 447.5], [1063.5, 449], [1065, 450.5], [1064.5, 451.5], [1066.5, 452.5], [1066.5, 456], [1067.5, 456.5], [1068, 458.5], [1069.5, 458.5], [1083, 488], [1088.5, 504], [1088, 506], [1075, 505.5], [1075.5, 504.5], [1078, 504.5], [1082.5, 502.5], [1083, 501.5], [1083.5, 496.5], [1079.5, 493], [1069, 493], [1049.5, 498], [1041.5, 499], [1038.5, 501], [1037, 501], [1031.5, 505.5], [1029.5, 504], [1029.5, 503], [1027.5, 503], [1029, 501], [1028.5, 494.5], [1034.5, 490], [1035, 488.5], [1040, 487], [1046.5, 483], [1048.5, 480.5], [1048.5, 475], [1047, 473], [1040, 473], [1033.5, 476], [1031.5, 476], [1026.5, 480], [1020, 482.5], [1018, 479.5], [1018, 478], [1016.5, 478], [1015.5, 476.5], [1011, 461.5], [1004, 446.5], [1004.5, 443], [1007, 441.5]],
        },
      },
      thinking: { role: 'player', boxes: { max: [254, 149, 520, 849], mia: [987, 175, 420, 823] } },
      accepting: { role: 'player', boxes: { max: [289, 149, 520, 849], mia: [985, 175, 420, 823] } },
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
          .map(([pose, { boxes: poseBoxes, phone }]) => [pose, {
            box: poseBoxes[id],
            phone: phone?.[id] || null,
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

/* `names` is the current language's names.<id> block from the translation
   Sheet (see characterText.js). A language may call these two characters
   something else: Serbian already declines them as Mila and Marko in every
   case except the nominative, which used to come from CHARACTERS below — so a
   Serbian player read "Mia" as the subject and "Milu" as the object of the
   same sentence. The nominative now comes from the Sheet too, and the two
   agree.

   Nothing outside the fiction uses these names: art is keyed by ID, the
   per-friend copy in the Sheet is keyed .Mia/.Max off the ID, and xAPI names
   the pairing by GENDER so an activity means the same thing in every
   language. A rename therefore touches the dialogue and nothing else. */
export function getNarrative(character = 'mia', names = null) {
  const playerId = character === 'max' ? 'max' : 'mia'
  const friendId = playerId === 'max' ? 'mia' : 'max'
  const localised = (id) => names?.[id]?.nominative || CHARACTERS[id].name
  return {
    character: playerId,
    player: localised(playerId),
    playerGender: CHARACTERS[playerId].gender,
    friend: localised(friendId),
    friendId,
    friendGender: CHARACTERS[friendId].gender,
    friendProfileImage: CHARACTERS[friendId].profileImage,
    reportImage: `objects/${friendId}-report.png`, // max-report.png / mia-report.png
    schoolScene: dialogScene('school', playerId),
    internetScene: dialogScene('internet', playerId),
    product: '"NovaPad X" tablet',
  }
}
