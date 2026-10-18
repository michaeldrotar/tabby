import { expect, test } from './extension-fixtures'
import type { Locator, Page } from '@playwright/test'

const dragToWindows = async (page: Page, source: Locator) => {
  await source.scrollIntoViewIfNeeded()
  const origin = (await source.boundingBox())!
  await page.mouse.move(origin.x + 30, origin.y + 20)
  await page.mouse.down()
  await page.mouse.move(origin.x + 45, origin.y + 20, { steps: 3 })
  await expect(page.locator('[data-drag-preview]')).toBeVisible()
  const header = (await page
    .locator('[data-window-picker-trigger]')
    .boundingBox())!
  await page.mouse.move(header.x + 20, header.y + 20, { steps: 6 })
  await expect(page.locator('[data-window-picker]')).toBeVisible()
}

const expectDestination = async (
  page: Page,
  windowId: number,
  tabIds: number[],
) => {
  await expect
    .poll(() =>
      page.evaluate(
        async ({ windowId, tabIds }) => {
          const [active] = await chrome.tabs.query({ windowId, active: true })
          const view = chrome.extension
            .getViews()
            .find(
              (view) =>
                view !== window &&
                view.document.querySelector(
                  `[data-tab-id="${tabIds[0]}"] [data-tab-option]`,
                ),
            )
          const row = view?.document.querySelector(
            `[data-tab-id="${tabIds[0]}"] [data-tab-option]`,
          )
          const bounds = row?.getBoundingClientRect()
          return {
            windowId: (await chrome.windows.getLastFocused()).id,
            active: active?.id,
            focused: !!row && row === view?.document.activeElement,
            visible:
              !!bounds &&
              bounds.height > 0 &&
              bounds.top >= 0 &&
              bounds.bottom <= view!.innerHeight,
            selected:
              !!view &&
              tabIds.every((id) =>
                view.document.querySelector(
                  `[data-tab-id="${id}"] [aria-selected="true"]`,
                ),
              ),
          }
        },
        { windowId, tabIds },
      ),
    )
    .toEqual({
      windowId,
      active: tabIds[0],
      focused: true,
      visible: true,
      selected: true,
    })
}

test('drops a selection on another Chrome window and follows its first tab after a long drag', async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  const data = await page.evaluate(async () => {
    const current = await chrome.windows.getCurrent()
    const source = await chrome.tabs.create({
      windowId: current.id,
      url: 'https://example.com/source',
      active: false,
    })
    const second = await chrome.tabs.create({
      windowId: current.id,
      url: 'https://example.com/second',
      active: false,
    })
    const target = await chrome.windows.create({
      url: 'https://example.com/destination',
      focused: false,
    })
    return {
      sourceId: source.id!,
      secondId: second.id!,
      managerTabId: (await chrome.tabs.getCurrent())!.id!,
      sourceWindowId: current.id!,
      targetId: target.id!,
      targetTabId: target.tabs![0]!.id!,
    }
  })
  const source = page.locator(
    `[data-tab-id="${data.sourceId}"] [data-tab-option]`,
  )
  await expect(source).toBeVisible()
  for (const id of [data.sourceId, data.secondId, data.managerTabId])
    await page
      .locator(`[data-tab-id="${id}"] [data-tab-option]`)
      .click({ modifiers: ['ControlOrMeta'] })
  await dragToWindows(page, source)
  const destination = page.locator(`[data-window-choice="${data.targetId}"]`)
  await expect(destination).toBeVisible()
  const body = (await destination.boundingBox())!
  await page.mouse.move(body.x + 30, body.y + body.height / 2, { steps: 6 })
  await expect(page.locator('[data-drop-indicator]')).toBeHidden()
  // Exercise release after the initial pointer-down activation has expired.
  await page.waitForTimeout(6000)
  await expect(page.locator('[data-window-picker]')).toBeVisible()
  await expect(page.locator('[data-tab-pane]')).toHaveCount(0)
  await page.mouse.up()
  await expect
    .poll(() =>
      page.evaluate(
        async (id) => (await chrome.tabs.get(id)).windowId,
        data.sourceId,
      ),
    )
    .toBe(data.targetId)
  expect(
    await page.evaluate(
      async (windowId) =>
        (await chrome.tabs.query({ windowId })).map((tab) => tab.id),
      data.targetId,
    ),
  ).toEqual([data.targetTabId, data.sourceId, data.secondId])
  await expectDestination(page, data.targetId, [data.sourceId, data.secondId])
  await expect(source).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate(
        async (windowId) =>
          (await chrome.storage.session.get(`tabby-moved-tabs-${windowId}`))[
            `tabby-moved-tabs-${windowId}`
          ],
        data.targetId,
      ),
    )
    .toBeUndefined()
  expect(
    await page.evaluate(async () => (await chrome.windows.getCurrent()).id),
  ).toBe(data.sourceWindowId)
})

test('follows a final-tab move after Chrome closes the originating window', async ({
  page,
  context,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  for (const other of context.pages()) if (other !== page) await other.close()
  const targetId = await page.evaluate(
    async () =>
      (
        await chrome.windows.create({
          url: 'https://example.com/destination',
          focused: false,
        })
      ).id!,
  )
  const sourceId = await page.evaluate(
    async () => (await chrome.tabs.getCurrent())!.id!,
  )
  const source = page.locator(`[data-tab-id="${sourceId}"] [data-tab-option]`)
  await expect(source).toBeVisible()
  await source.click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Move 1 tab to window', exact: true })
    .click()
  await page
    .getByRole('menu', { name: 'Move 1 tab to window' })
    .locator(`[data-action-id="${targetId}"]`)
    .click()
  const worker = context.serviceWorkers()[0]!
  await expect
    .poll(() =>
      worker.evaluate(
        async (id) => (await chrome.tabs.get(id)).windowId,
        sourceId,
      ),
    )
    .toBe(targetId)
  await expect
    .poll(() =>
      worker.evaluate(async () => (await chrome.windows.getLastFocused()).id),
    )
    .toBe(targetId)
  expect(
    (
      await worker.evaluate(async () =>
        chrome.windows.getAll({ windowTypes: ['normal'] }),
      )
    ).map((window) => window.id),
  ).toEqual([targetId])
  await expect(source).toHaveAttribute('aria-selected', 'true')
  await expect(source).toBeInViewport()
})

test('opens the manager after a long drag creates a new Chrome window', async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  const { id, sourceWindow } = await page.evaluate(async () => {
    const current = await chrome.windows.getCurrent()
    const tab = await chrome.tabs.create({
      windowId: current.id,
      url: 'https://example.com/new-destination',
      active: false,
    })
    return { id: tab.id!, sourceWindow: current.id! }
  })
  const source = page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  await expect(source).toBeVisible()
  await dragToWindows(page, source)
  const target = (await page.locator('[data-new-window]').boundingBox())!
  await page.mouse.move(target.x + 30, target.y + target.height / 2, {
    steps: 6,
  })
  await page.waitForTimeout(6000)
  await page.mouse.up()
  await expect
    .poll(() =>
      page.evaluate(async (id) => (await chrome.tabs.get(id)).windowId, id),
    )
    .not.toBe(sourceWindow)
  const windowId = await page.evaluate(
    async (id) => (await chrome.tabs.get(id)).windowId,
    id,
  )
  await expectDestination(page, windowId, [id])
  const next = await page.evaluate(
    async (windowId) =>
      (
        await chrome.tabs.create({
          windowId,
          url: 'https://example.com/next',
          active: true,
        })
      ).id!,
    windowId,
  )
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          chrome.extension
            .getViews()
            .some(
              (view) =>
                view !== window &&
                view.document.visibilityState === 'visible' &&
                view.document.querySelector(`[data-tab-id="${id}"]`),
            ),
        next,
      ),
    )
    .toBe(true)
})

test('menu moves a selection to the destination and focuses its first tab', async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  const data = await page.evaluate(async () => {
    const current = await chrome.windows.getCurrent()
    const first = await chrome.tabs.create({
      windowId: current.id,
      url: 'https://example.com/first',
      active: false,
    })
    const second = await chrome.tabs.create({
      windowId: current.id,
      url: 'https://example.com/second',
      active: false,
    })
    const target = await chrome.windows.create({
      url: 'https://example.com/destination',
      focused: false,
    })
    for (let i = 0; i < 18; i++)
      await chrome.tabs.create({
        windowId: target.id,
        url: `https://example.com/reference-${i}`,
        active: false,
      })
    return {
      first: first.id!,
      second: second.id!,
      target: target.id!,
      manager: (await chrome.tabs.getCurrent())!.id!,
    }
  })
  for (const id of [data.second, data.first, data.manager])
    await page
      .locator(`[data-tab-id="${id}"] [data-tab-option]`)
      .click({ modifiers: ['ControlOrMeta'] })
  await page
    .locator(`[data-tab-id="${data.first}"] [data-tab-option]`)
    .click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Move 2 tabs to window', exact: true })
    .click()
  await page
    .getByRole('menu', { name: 'Move 2 tabs to window' })
    .locator(`[data-action-id="${data.target}"]`)
    .click()
  await expectDestination(page, data.target, [data.first, data.second])
})
