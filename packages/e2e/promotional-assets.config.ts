import { defineConfig } from '@playwright/test'

const baseURL = process.env.TABBY_PROMO_BASE_URL ?? 'http://127.0.0.1:5181/'

export default defineConfig({
  testDir: './promotional-assets',
  workers: 1,
  reporter: 'list',
  use: { baseURL, viewport: { width: 1400, height: 800 }, headless: true },
  webServer: process.env.TABBY_PROMO_BASE_URL
    ? undefined
    : {
        command: 'pnpm -F @extension/promotional-assets gallery',
        cwd: '../..',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
})
