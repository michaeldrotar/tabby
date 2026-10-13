import { defineConfig } from '@playwright/test'

const port = Number(process.env.TABBY_E2E_PORT ?? 5179)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `node scripts/preview/server.mjs --port ${port}`,
    cwd: '../..',
    url: `${baseURL}/tab-manager/index.html`,
    reuseExistingServer: false,
  },
})
