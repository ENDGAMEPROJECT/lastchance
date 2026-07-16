/* Resolve a public asset path against Vite's base URL so images load both in
   dev (base '/') and in production, where the app is served under
   '/lastchance/'. import.meta.env.BASE_URL always ends with a slash. */
const BASE = import.meta.env.BASE_URL

/* URL for a background image in public/bg (pass just the file name). */
export const bgUrl = (name) => `${BASE}bg/${name}`
