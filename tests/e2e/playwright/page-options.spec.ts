import { expect, test } from './fixtures'

test('Options page should be accessible', async ({ page, extensionId }) => {
  const optionsUrl = `chrome-extension://${extensionId}/options/index.html`

  await page.goto(optionsUrl)

  await expect(page).toHaveTitle('Options')
})
