import { readFileSync } from 'node:fs'
import { test as base } from '@playwright/test'
import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import messages from '../../i18n/locales/en/messages.json' with { type: 'json' }

const mock = readFileSync(
  new URL('../../../scripts/preview/mock-chrome.js', import.meta.url),
  'utf8',
)

type BrowserFixture = Omit<typeof browser, 'preferences'> & {
  preferences: Partial<typeof browser.preferences>
}

export const test = base.extend<{ browserData: BrowserFixture }>({
  browserData: [
    {
      ...browser,
      windows: browser.windows.slice(0, 1),
      groups: [],
      tabs: browser.tabs.slice(0, 4).map((tab) => ({ ...tab, groupId: -1 })),
      preferences: { theme: 'system' },
    },
    { option: true },
  ],
  page: async ({ page, browserData }, use) => {
    await page.route('**/__preview/mock-chrome.js', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: `globalThis.__TABBY_PREVIEW__ = ${JSON.stringify({
          browser: browserData,
          messages,
          platform: process.platform === 'darwin' ? 'mac' : 'linux',
        })};\n${mock}`,
      }),
    )
    await use(page)
  },
})

export const expect = test.expect
