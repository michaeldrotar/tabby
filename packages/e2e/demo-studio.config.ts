import { defineConfig } from '@playwright/test'

const port = Number(process.env.TABBY_DEMO_STUDIO_PORT ?? 5180)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './demo-studio',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    viewport: { width: 1280, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm -F @extension/demo-studio dev --port ${port}`,
    cwd: '../..',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
