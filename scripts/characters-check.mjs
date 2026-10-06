import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import dictionaries from '../src/i18n/dictionaries.js'
import { getNarrative } from '../src/game/characters.js'
import { characterTemplates, characterVars, interpolate, mapText } from '../src/i18n/characterText.js'

const lookup = (dict, path) => path.split('.').reduce((value, key) => value?.[key], dict)
const max = getNarrative('max')
assert.equal(max.friend, 'Mia')
assert.equal(max.player, 'Max')
assert.equal(max.friendTalkingImage, 'mia-talking-max.png')
assert.equal(max.playerTalkingImage, 'max-talking-max.png')
assert.equal(getNarrative('mia').friendTalkingImage, 'max-talking-mia.png')
assert.equal(getNarrative('mia').playerTalkingImage, 'mia-talking-mia.png')
assert.equal(max.friendProfileImage, 'algorithm-room/mia-figure-nobg.png')
assert.equal(max.friendInternetImage, 'player-talking-ph-internet.png')
assert.equal(getNarrative('mia').friendProfileImage, 'algorithm-room/max-figure-nobg.png')
assert.equal(getNarrative('mia').friendGender, 'M')
assert.equal(max.friendGender, 'F')
for (const character of ['mia', 'max']) {
  const narrative = getNarrative(character)
  assert(existsSync(`public/bg/${narrative.friendTalkingImage}`), `${character}: the friend's conversation image exists`)
  assert(existsSync(`public/bg/${narrative.playerTalkingImage}`), `${character}: the player's conversation image exists`)
  assert(existsSync(`public/${narrative.friendProfileImage}`), `${character}: the final profile figure exists`)
  assert(existsSync(`public/bg/${narrative.friendInternetImage}`), `${character}: the portal speaker image exists`)
}
assert.equal(getNarrative().friend, 'Max')
assert.equal(getNarrative('invalid').character, 'mia')

for (const [locale, dictionary] of Object.entries(dictionaries)) {
  // Preserve the current story verbatim when the player chooses Mia.
  assert.equal(characterTemplates(dictionary, getNarrative('mia'), locale), dictionary)
  const templates = characterTemplates(dictionary, max, locale)
  const bound = mapText(templates, (text) => interpolate(text, characterVars(max)))
  for (const key of ['hints.objectives.pretest.text', 'hints.objectives.posttest.text', 'rooms.algorithm.report.modalTitle', 'rooms.algorithm.report.title', 'rooms.algorithm.report.subject']) {
    assert(!/Max|MAX|Maks/.test(lookup(bound, key)), `${locale}: ${key} still names Max`)
    assert(/Mia|MIA|Mij/.test(lookup(bound, key)), `${locale}: ${key} must name Mia`)
  }
  assert.match(bound.items.dataReport.name, /Mia|Mij/)
  assert.match(bound.end.win.titleLead, /Mia/)
  assert.match(bound.end.lose.titleLead, /Mia/)
  assert.deepEqual(bound.story.rounds.map((round) => round.options.map((option) => option.correct)), dictionary.story.rounds.map((round) => round.options.map((option) => option.correct)))
  // Mentions of the female influencer remain unchanged when the roles swap.
  assert.equal(bound.story.pretest.responses[0], dictionary.story.pretest.responses[0])
  assert.equal(dictionary.rooms.algorithm.report.title.includes('MAX'), true, 'Source dictionaries must not be mutated')
}
console.log('Character checks passed: both roles, all locales, story references, nested translations and unchanged assessment answers.')
