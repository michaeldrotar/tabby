import { defineConfig } from '@playwright/test'

const port = Number(process.env.TABBY_MARKETING_PORT ?? 5182)
const hostedURL = process.env.TABBY_MARKETING_BASE_URL
const baseURL = hostedURL ?? `http://127.0.0.1:${port}/`

export default defineConfig({
  testDir: './marketing',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: hostedURL
    ? undefined
    : {
        command: `pnpm marketing --port ${port}`,
        cwd: '../..',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
})
