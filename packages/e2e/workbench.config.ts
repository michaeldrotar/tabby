import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './workbench',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    viewport: { width: 1280, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm -F @extension/workbench dev',
    cwd: '../..',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: !process.env.CI,
  },
})
