import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works under any GitHub Pages subpath
  // (https://<user>.github.io/<repo>/). Combined with HashRouter, deep links
  // work without server-side rewrites.
  base: './',
  plugins: [react()],
})
