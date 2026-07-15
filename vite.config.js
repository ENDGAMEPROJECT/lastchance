import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// On `vite build` (GitHub Pages) the app is served from
// https://<user>.github.io/lastchance/, so assets must be based there.
// Dev keeps the root base so http://localhost:5173/ works as before.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/lastchance/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
}))
