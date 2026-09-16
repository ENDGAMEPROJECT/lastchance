/* Resolve a public asset path against Vite's base URL so images load both in
   dev (base '/') and in production, where the app is served under
   '/lastchance/'. import.meta.env.BASE_URL always ends with a slash. */
const BASE = import.meta.env.BASE_URL

/* URL for an image in public/bg, or a public subfolder such as challenge-1. */
export const bgUrl = (name) =>
   name.startsWith('challenge-1/') ? `${BASE}${name}` : `${BASE}bg/${name}`
