// Text comes from the translation sheet; character roles supply variables only.
export function interpolate(value, vars = {}) {
  return typeof value === 'string'
    ? value.replace(/\{(\w+)\}/g, (match, name) => name in vars ? String(vars[name]) : match)
    : value
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

export function characterVars(narrative) {
  const mia = narrative.friendId === 'mia'
  return {
    friend: narrative.friend,
    player: narrative.player,
    product: narrative.product,
    // Some sheet translations use Serbian variable names and declined forms.
    Prijatelj: narrative.friend,
    prijatelj: narrative.friend,
    prijatelja: mia ? 'Miju' : 'Maksa',
    prijatelju: mia ? 'Miji' : 'Maksu',
    prijateljem: mia ? 'Mijom' : 'Maksom',
    proizvod: narrative.product,
  }
}
