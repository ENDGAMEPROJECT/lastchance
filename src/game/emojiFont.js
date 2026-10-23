/* Self-hosted Noto Color Emoji (SIL OFL 1.1 — licence next to the file in
   public/fonts/emoji). System emoji fonts vary a lot: Windows 10 lacks newer
   emoji (🫣 shows as a box) and some Linux setups have none at all, so every
   emoji the game uses is served from one small subset instead.

   The file is the COLRv1 build (Chrome, Edge, Firefox). Safari can't paint
   COLRv1, so the font is only kept when a test glyph actually comes out in
   colour; otherwise it is dropped and the system emoji (Apple's, on Safari)
   stay in place. The family is listed first in every font stack in CSS — its
   unicode-range keeps it to emoji, so ordinary text is untouched.

   Adding a NEW emoji to the game: re-download the subset with it included
   (Google Fonts css2?family=Noto+Color+Emoji&text=…, Chrome user agent) and
   update UNICODE_RANGE, or that one emoji falls back to the system font. */

import { assetUrl } from './assets.js'

export const EMOJI_FAMILY = 'Game Emoji'
const FILE = 'fonts/emoji/noto-color-emoji.woff2'
const UNICODE_RANGE = 'U+200d, U+23f0, U+2615, U+2640, U+2696, U+26a1, U+26d4, U+2708-2709, U+2728, U+2764, U+2b50, U+fe0f, U+1f1e7, U+1f1ea-1f1ec, U+1f1ee, U+1f1f7-1f1f8, U+1f310, U+1f31f, U+1f373, U+1f381, U+1f389, U+1f392, U+1f3a1, U+1f3a5, U+1f3ac, U+1f3ae-1f3b0, U+1f3c6, U+1f3cb, U+1f3fb-1f3ff, U+1f41e, U+1f436, U+1f44e, U+1f45f, U+1f465-1f467, U+1f469, U+1f475, U+1f484, U+1f48a, U+1f49c, U+1f4a1, U+1f4ac, U+1f4b0, U+1f4b8, U+1f4bb, U+1f4c4, U+1f4c8-1f4c9, U+1f4cf, U+1f4de, U+1f4e2, U+1f4e6, U+1f4f1, U+1f507, U+1f50a-1f50b, U+1f50d-1f50e, U+1f511-1f513, U+1f517, U+1f525-1f526, U+1f5a5, U+1f5bc, U+1f5fa, U+1f60e, U+1f614, U+1f61f, U+1f622, U+1f629, U+1f62c, U+1f631, U+1f642, U+1f64b, U+1f680, U+1f6a8, U+1f6aa, U+1f6cd, U+1f6d1, U+1f6e1, U+1f911, U+1f91d, U+1f957, U+1f964, U+1f9b2, U+1f9b4, U+1f9c1, U+1f9d1-1f9d4, U+1f9e0, U+1f9f4, U+1fae3'

/* Draw an emoji in the font and look for any coloured pixel: a black fill
   only turns colourful if the browser used the font's own colour layers. */
function paintsInColour() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return false
  ctx.font = `24px "${EMOJI_FAMILY}"`
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#000'
  ctx.fillText('\u{1F525}', 2, 2) // 🔥
  const px = ctx.getImageData(0, 0, 32, 32).data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] > 0 && (Math.abs(px[i] - px[i + 1]) > 40 || Math.abs(px[i + 1] - px[i + 2]) > 40)) return true
  }
  return false
}

export async function loadEmojiFont() {
  if (typeof FontFace === 'undefined' || !document.fonts) return
  try {
    const face = new FontFace(EMOJI_FAMILY, `url(${assetUrl(FILE)}) format('woff2')`, { unicodeRange: UNICODE_RANGE, display: 'swap' })
    await face.load()
    document.fonts.add(face)
    // Same task as the add, so a browser that can't colour it never paints it.
    if (!paintsInColour()) document.fonts.delete(face)
  } catch {
    // Missing file / old browser: keep the system emoji.
  }
}
