/* Resolve a public asset path against Vite's base URL so images load both in
   dev (base '/') and in production, where the app is served under
   '/lastchance/'. import.meta.env.BASE_URL always ends with a slash. */
const BASE = import.meta.env.BASE_URL

/* URL for an image in public/bg, or a public subfolder such as link-district. */
export const bgUrl = (name) => {
  /* A missing name used to throw, and because these are called during render
     one absent image took the whole game down to a white screen — which is a
     wildly disproportionate failure for a picture that did not load. An
     empty src shows a broken image in one place instead. */
  if (typeof name !== 'string' || !name) return ''
  return (name.startsWith('link-district/') || name.startsWith('objects/') || name.startsWith('influencers/') || name.startsWith('algorithm-room/') || name.startsWith('characters/'))
    ? `${BASE}${name}` : `${BASE}bg/${name}`
}

/* URL for any file in public/ by its full sub-path (e.g. 'ads-corridor/x.png',
   'persuasion-lab/fomo.png') — no implied 'bg/' prefix. */
export const assetUrl = (path) => (typeof path === 'string' && path ? `${BASE}${path}` : '')
