import { expect, test } from './fixtures'

test('Tab Manager page should be accessible', async ({ page, extensionId }) => {
  const tabManagerUrl = `chrome-extension://${extensionId}/tab-manager/index.html`

  await page.goto(tabManagerUrl)

  await expect(page).toHaveTitle('Tab Manager')
})
