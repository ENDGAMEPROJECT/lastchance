// Only story references change roles. Product/influencer text keeps its meaning.
const namedReferences = new Set([
  'enter.playerLine',
  'hints.brief.posttest',
  'hints.objectives.pretest.text',
  'hints.objectives.posttest.text',
  'rooms.algorithm.report.modalTitle',
  'rooms.algorithm.report.title',
  'rooms.algorithm.report.subject',
])

const englishMiaProfile = {
  'enter.playerLine': "We made it. This is the Physical Internet. Let's show Mia how this deal was built to fool her",
  'rooms.algorithm.equations.profileP2': ' (a teen girl),',
  'rooms.algorithm.equations.profileB2': 'her interests',
  'rooms.algorithm.equations.profileP3': ' (gaming, new tech, the NovaPad X she keeps searching) and ',
  'rooms.algorithm.equations.profileB3': 'her insecurities',
}

const serbianMiaProfile = {
  'enter.playerLine': 'Uspeli smo. Ovo je Fizički internet. Hajde da pokažemo Miji kako je ova ponuda osmišljena da je prevari',
  'hints.brief.posttest': 'Iskoristi dokaze da zaštitiš Miju',
  'hints.objectives.pretest.text': 'Pročitaj Mijinu poruku, izaberi odgovor koji najbolje opisuje tvoj prvi utisak i pritisni završno dugme da uđeš u Fizički internet.',
  'hints.objectives.posttest.text': 'Iskoristi prikupljene dokaze da objasniš znakove upozorenja i odlučiš da li Mia treba da zatvori karticu.',
  'rooms.algorithm.report.modalTitle': 'Izveštaj podataka · Mijin profil',
  'rooms.algorithm.report.subject': 'Subjekat: Mijine aktivnosti na internetu',
  'rooms.algorithm.equations.profileP2': '(tinejdžerka),',
  'rooms.algorithm.equations.profileB2': 'njena interesovanja',
  'rooms.algorithm.equations.profileB3': 'njene nesigurnosti',
  'rooms.algorithm.equations.profileP4': '(uklapanje, strah da će propustiti ponudu). Rezultat je bio jedan savršeno ciljani oglas — upravo ona ponuda za NovaPad X „90% popusta“. Nije slučajno što je Mia videla taj oglas.',
  'end.lose.body': 'Pre nego što si uspeo da prikupiš sve dokaze, lažno odbrojavanje „samo danas“ je odradilo svoje i Mia je kupila {product}. Cela fora bila je u stvaranju osećaja hitnosti.',
  'rooms.algorithm.report.entries.0.text': 'Mia je kliknula na oglas.',
  'rooms.algorithm.report.entries.1.text': 'Ostala je na stranici proizvoda 2 minuta.',
  'rooms.algorithm.report.entries.2.text': 'Videla je 7 novih recenzija.',
  'rooms.algorithm.report.entries.3.text': 'Mia je zatvorila prozor.',
  'rooms.algorithm.report.entries.4.text': 'Mia je kliknula na drugi oglas istog brenda.',
  'rooms.algorithm.report.entries.5.text': 'Mia skroluje 4 minuta.',
  'rooms.algorithm.report.entries.6.text': 'Dodala je 1 artikl u korpu.',
  'rooms.algorithm.report.entries.7.text': 'Provela je 8 minuta na istoj stranici.',
  'rooms.algorithm.report.entries.9.text': 'Kupila je 1 artikl.',
  'rooms.algorithm.report.entries.0.result': 'ZAINTERESOVANA',
  'rooms.algorithm.report.entries.1.result': 'ZAINTERESOVANA',
  'rooms.algorithm.report.entries.2.result': 'ZAINTERESOVANA',
  'rooms.algorithm.report.entries.3.result': 'IZGUBILA INTERESOVANJE',
}

const spanishMiaReport = {
  'rooms.algorithm.report.entries.0.text': 'Mia hizo clic en el anuncio.',
  'rooms.algorithm.report.entries.3.text': 'Mia cerró la ventana.',
  'rooms.algorithm.report.entries.4.text': 'Mia hizo clic en otro anuncio de la misma marca.',
  'rooms.algorithm.report.entries.5.text': 'Mia navega durante 4 minutos.',
  'rooms.algorithm.report.entries.0.result': 'INTERESADA',
  'rooms.algorithm.report.entries.1.result': 'INTERESADA',
  'rooms.algorithm.report.entries.2.result': 'INTERESADA',
}

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

export function characterTemplates(dictionary, narrative, locale) {
  if (narrative.character !== 'max') return dictionary
  const overrides = locale === 'sr' ? serbianMiaProfile
    : { ...englishMiaProfile, ...(locale === 'es' ? spanishMiaReport : {}) }
  return mapText(dictionary, (text, path) => {
    if (Object.hasOwn(overrides, path)) return overrides[path]
    return namedReferences.has(path) ? text.replace(/MAX/g, 'MIA').replace(/Max/g, 'Mia') : text
  })
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
