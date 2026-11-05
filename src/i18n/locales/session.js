// Local interface additions, preserved when the translation sheet is imported.
// The resume-or-restart dialog shown when a run is found after a refresh.
// Move these to the Sheet (keys session.*) if translators should own the
// wording — a sheet value takes priority over the copy here.
export default {
  en: {
    title: 'Welcome back',
    message: 'You have a run in progress. Pick up where you left off, or start again from the beginning?',
    progress: 'Districts cleared: {done}/{total} · {time} left',
    resume: 'Resume run',
    restart: 'Start over',
  },
  es: {
    title: 'Bienvenido de nuevo',
    message: 'Tienes una partida en curso. ¿Continúas donde lo dejaste o empiezas desde el principio?',
    progress: 'Distritos completados: {done}/{total} · quedan {time}',
    resume: 'Continuar partida',
    restart: 'Empezar de nuevo',
  },
  fi: {
    title: 'Tervetuloa takaisin',
    message: 'Sinulla on kesken oleva kierros. Jatketaanko siitä mihin jäit, vai aloitetaanko alusta?',
    progress: 'Kaupunginosia selvitetty: {done}/{total} · aikaa jäljellä {time}',
    resume: 'Jatka kierrosta',
    restart: 'Aloita alusta',
  },
  sr: {
    title: 'Dobrodošao/la nazad',
    message: 'Imaš započetu igru. Da nastaviš odakle si stao/la ili da počneš iz početka?',
    progress: 'Završeni okruzi: {done}/{total} · preostalo {time}',
    resume: 'Nastavi igru',
    restart: 'Počni iz početka',
  },
}
