/* Gendered wording. Languages that inflect adjectives/participles by gender
   (es "paranoico/paranoica", sr "spreman/spremna") write both forms in the
   Sheet cell and say WHO the word agrees with:

     {player:masculine|feminine}  -> the character the player plays
     {friend:masculine|feminine}  -> the friend being convinced

   e.g. "Estás siendo {player:paranoico|paranoica}." (the friend is talking
   about the player) or "Creo que estoy {friend:dispuesto|dispuesta}" (the
   friend talking about themselves). Masculine always comes first. The
   genders come from characters.js via characterVars (player_gender /
   friend_gender). Without them (no narrative) both forms show as "m/f". */
const GENDERED = /\{(player|friend):([^{}|]*)\|([^{}|]*)\}/g

// Text comes from the translation sheet; character roles supply variables only.
export function interpolate(value, vars = {}) {
  if (typeof value !== 'string') return value
  return value
    .replace(GENDERED, (match, who, masculine, feminine) => {
      const gender = vars[`${who}_gender`]
      return gender === 'F' ? feminine : gender === 'M' ? masculine : `${masculine}/${feminine}`
    })
    .replace(/\{(\w+)\}/g, (match, name) => name in vars ? String(vars[name]) : match)
}

// Map recursively because conversations and reports return entire arrays/objects.
export function mapText(value, transform, path = '') {
  if (typeof value === 'string') return transform(value, path)
  if (Array.isArray(value)) return value.map((item, index) => mapText(item, transform, `${path}.${index}`))
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, mapText(item, transform, path ? `${path}.${key}` : key)]),
  )
  return value
}

export function characterVars(narrative, dict) {
  const vars = {
    friend: narrative.friend,
    player: narrative.player,
    product: narrative.product,
    player_gender: narrative.playerGender,
    friend_gender: narrative.friendGender,
  }

  /* Languages that inflect the name itself — Finnish cases, Serbian cases —
     need more than {friend}, which only works as a subject: "Mia ostaa", but
     "Mian tabletti", "Mijina ponuda". The declined forms are content, not
     logic, so they live in the translation Sheet under names.<character>.<form>
     and each becomes {friend_<form>}: a names.mia.genitive row makes
     {friend_genitive} substitute "Mian" in Finnish and "Mije" in Serbian.

     Variable names stay English in every language — only the values differ.
     A translator writes {friend_genitive}, never a translated variable name,
     because interpolate() substitutes by exact name and an unknown one is
     left in the text for the player to see.

     Form names must be ASCII: interpolate() matches \w, which is ASCII-only,
     so {friend_yksikön} would never substitute. */
  const forms = dict?.names?.[narrative.friendId]
  if (forms && typeof forms === 'object') {
    for (const [form, value] of Object.entries(forms)) {
      if (typeof value === 'string') vars[`friend_${form}`] = value
    }
  }

  return vars
}
