import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

// In this repo's cloud dev container Chromium is pre-installed at a fixed path.
const localChromium = '/opt/pw-browsers/chromium'
const executablePath = !process.env.CI && existsSync(localChromium) ? localChromium : undefined

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'iphone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
