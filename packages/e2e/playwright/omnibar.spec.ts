import { expect, test } from './fixtures'

test('Omnibar restores its query, opens groups, and routes modifier navigation to the originating window', async ({
  page,
  context,
  extensionId,
}) => {
  const worker = context.serviceWorkers()[0]!
  const target = await worker.evaluate(async () => {
    const window = await chrome.windows.create({
      url: 'about:blank',
      focused: true,
    })
    if (window?.id === undefined)
      throw new Error('A normal window is required.')
    const tab = await chrome.tabs.create({
      windowId: window.id,
      url: 'http://localhost:48765/omnibar-target',
      active: false,
    })
    if (tab.id === undefined) throw new Error('A search target is required.')
    const groupId = await chrome.tabs.group({ tabIds: [tab.id] })
    await chrome.tabGroups.update(groupId, {
      title: 'Workflow research',
      color: 'blue',
      collapsed: true,
    })
    await chrome.storage.local.set({ lastQuery: '' })
    await chrome.bookmarks.create({
      title: 'Workflow external documentation',
      url: 'http://localhost:48765/workflow-guide',
    })
    return {
      tabId: tab.id,
      windowId: window.id,
      groupId,
      url: 'http://localhost:48765/omnibar-target',
    }
  })
  const popupPath = await worker.evaluate(
    () => chrome.runtime.getManifest().action?.default_popup,
  )
  expect(popupPath).toBe('omnibar/index.html')
  const url = `chrome-extension://${extensionId}/${popupPath}?originalWindowId=${target.windowId}`
  await page.bringToFront()
  await page.goto(url)
  const input = page.getByRole('textbox')
  await input.fill('workflow research')
  const group = page
    .getByRole('list')
    .getByRole('button', { name: /Workflow research/ })
  await expect(group).toContainText('Collapsed')
  await group.click()
  await expect
    .poll(() =>
      worker.evaluate(
        async (groupId) => (await chrome.tabGroups.get(groupId)).collapsed,
        target.groupId,
      ),
    )
    .toBe(false)
  await expect
    .poll(() =>
      worker.evaluate(
        async (tabId) => (await chrome.tabs.get(tabId)).active,
        target.tabId,
      ),
    )
    .toBe(true)

  const second = await context.newPage()
  await second.bringToFront()
  await second.goto(url)
  const secondInput = second.getByRole('textbox')
  await expect(secondInput).toHaveValue('')
  await secondInput.fill('omnibar-target')
  await expect(
    second.locator(`[data-omnibar-result="${target.tabId}"]`),
  ).toBeVisible()
  const targetIndex = await second
    .locator('[data-omnibar-result]')
    .evaluateAll(
      (elements, tabId) =>
        elements.findIndex(
          (element) =>
            element.getAttribute('data-omnibar-result') === String(tabId),
        ),
      target.tabId,
    )
  for (let index = 0; index < targetIndex; index++)
    await secondInput.press('ArrowDown')
  // Navigation focuses the originating window and can close the popup on keydown.
  await second.keyboard.down('Control')
  await second.keyboard.down('Enter')
  await expect
    .poll(() =>
      worker.evaluate(
        async ({ windowId, url }) =>
          (await chrome.tabs.query({ windowId, url })).length,
        target,
      ),
    )
    .toBe(2)
  await expect
    .poll(() =>
      worker.evaluate(
        async ({ windowId, url }) =>
          (await chrome.tabs.query({ windowId, active: true }))[0]?.url === url,
        target,
      ),
    )
    .toBe(true)

  const third = await context.newPage()
  await third.bringToFront()
  await third.goto(url)
  await expect(third.getByRole('textbox')).toHaveValue('')
  await third.getByRole('textbox').fill('saved unfinished search')
  await expect
    .poll(() =>
      worker.evaluate(
        async () => (await chrome.storage.local.get('lastQuery')).lastQuery,
      ),
    )
    .toBe('saved unfinished search')
  await third.keyboard.down('Escape')
  await expect.poll(() => third.isClosed()).toBe(true)
  expect(
    await worker.evaluate(
      async ({ windowId, url }) =>
        (await chrome.tabs.query({ windowId, url })).length,
      target,
    ),
  ).toBe(2)
  const fourth = await context.newPage()
  await fourth.bringToFront()
  await fourth.goto(url)
  await expect(fourth.getByRole('textbox')).toHaveValue(
    'saved unfinished search',
  )
  await fourth.getByRole('textbox').fill('workflow external')
  await fourth
    .getByRole('list')
    .getByRole('button', { name: /Workflow external documentation/ })
    .click({ modifiers: ['Shift'] })
  await expect
    .poll(() =>
      worker.evaluate(
        async (originalWindowId) =>
          (
            await chrome.tabs.query({
              url: 'http://localhost:48765/workflow-guide',
            })
          ).some((tab) => tab.windowId !== originalWindowId),
        target.windowId,
      ),
    )
    .toBe(true)
  await expect
    .poll(() =>
      worker.evaluate(
        async () => (await chrome.storage.local.get('lastQuery')).lastQuery,
      ),
    )
    .toBeUndefined()
})
