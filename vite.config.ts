import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // All lessons ship in one bundle on purpose: the app must work offline after one visit.
  build: { chunkSizeWarningLimit: 1500 },
})
