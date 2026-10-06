// Character roles belong to a run, independently of the player's study alias.
const CHARACTERS = {
  mia: { name: 'Mia', internetImage: 'player-talking-ph-internet.png', gender: 'F', profileImage: 'algorithm-room/mia-figure-nobg.png' },
  max: { name: 'Max', internetImage: 'max-talking-ph-internet.png', gender: 'M', profileImage: 'algorithm-room/max-figure-nobg.png' },
}

// First key: chosen avatar; second key: character currently speaking.
const CONVERSATION_IMAGES = {
  mia: { max: 'max-talking-mia.png', mia: 'mia-talking-mia.png' },
  max: { max: 'max-talking-max.png', mia: 'mia-talking-max.png' },
}

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
    playerTalkingImage: CONVERSATION_IMAGES[playerId][playerId],
    friendTalkingImage: CONVERSATION_IMAGES[playerId][friendId],
    playerInternetImage: CHARACTERS[playerId].internetImage,
    friendInternetImage: CHARACTERS[friendId].internetImage,
    product: 'the "NovaPad X" tablet',
  }
}
