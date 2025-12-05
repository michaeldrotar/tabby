import { canSwitchTheme } from '../helpers/theme.js'

describe('Webextension Tab Manager', () => {
  it('should make tab manager accessible', async () => {
    const extensionPath = await browser.getExtensionPath()
    const tabManagerUrl = `${extensionPath}/tab-manager/index.html`

    await browser.url(tabManagerUrl)

    await expect(browser).toHaveTitle('Tab Manager')
    await canSwitchTheme()
  })
})
