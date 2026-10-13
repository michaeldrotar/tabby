import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

const ids = {
  window: 1,
  loaded: 11,
  secondary: 12,
  groupFirst: 13,
  groupLast: 14,
  otherWindow: 2,
  other: 21,
}
const sampleTab = (
  id: number,
  title: string,
  options: Partial<(typeof browser.tabs)[number]> = {},
) => ({
  ...browser.tabs[4]!,
  id,
  title,
  ...options,
})
test.use({
  browserData: {
    ...browser,
    preferences: { theme: 'system' },
    groups: [
      { ...browser.groups[0]!, title: 'Selection group', collapsed: true },
    ],
    tabs: [
      sampleTab(1, 'Initial tab', { active: true }),
      sampleTab(ids.loaded, 'Selection loaded'),
      sampleTab(ids.secondary, 'Selection secondary', { discarded: true }),
      sampleTab(ids.groupFirst, 'Selection grouped', { groupId: 10 }),
      sampleTab(ids.groupLast, 'Selection group last', { groupId: 10 }),
      sampleTab(ids.other, 'Selection other', { windowId: 2, active: true }),
    ],
  },
})

test('selects across windows without activation and switches only on explicit actions', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const rail = (id: number) =>
    page.locator(`[data-nav-type="window"][data-nav-id="${id}"]`)
  const summary = page.locator('[data-selection-summary]')
  await expect(row(ids.secondary)).toBeVisible()
  const state = () =>
    page.evaluate(
      async (ids) => ({
        secondaryActive: (await chrome.tabs.get(ids.secondary)).active,
        secondaryDiscarded: (await chrome.tabs.get(ids.secondary)).discarded,
        loadedActive: (await chrome.tabs.get(ids.loaded)).active,
        otherActive: (await chrome.tabs.get(ids.other)).active,
        focused: (await chrome.windows.getLastFocused()).id,
      }),
      ids,
    )

  await row(ids.secondary).click()
  await expect(row(ids.secondary)).toBeFocused()
  expect(await state()).toMatchObject({
    secondaryActive: false,
    secondaryDiscarded: true,
    loadedActive: false,
    focused: ids.window,
  })
  await page.keyboard.press('ArrowUp')
  await expect(row(ids.loaded)).toBeFocused()
  await expect(row(ids.loaded)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Space')
  await expect(summary).toHaveAttribute('data-selected-tabs', '2')
  await rail(ids.otherWindow).click()
  await expect(summary).toHaveAttribute('data-selected-tabs', '2')
  await row(ids.other).click({
    modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'],
  })
  await expect(summary).toHaveAttribute('data-selected-tabs', '3')
  await expect(summary).toHaveAttribute(
    'aria-label',
    '0 windows, 0 tab groups, 3 tabs',
  )
  expect(await state()).toMatchObject({
    secondaryActive: false,
    secondaryDiscarded: true,
    loadedActive: false,
    focused: ids.window,
  })
  await expect(rail(ids.window)).toHaveAttribute(
    'data-has-selected-items',
    'true',
  )
  await expect(rail(ids.otherWindow)).toHaveAttribute(
    'data-has-selected-items',
    'true',
  )

  await rail(ids.window).click()
  await page
    .getByRole('button', { name: 'Go to tab: Selection secondary' })
    .click()
  await expect
    .poll(state)
    .toMatchObject({ secondaryActive: true, secondaryDiscarded: false })
  await expect(summary).toHaveAttribute('data-selected-tabs', '3')
  await page.keyboard.press('Escape')
  await expect(summary).toHaveAttribute('data-selected-tabs', '0')
  await expect(page.locator('[data-has-selected-items="true"]')).toHaveCount(0)

  await row(ids.loaded).dblclick()
  await expect.poll(async () => (await state()).loadedActive).toBe(true)
  await row(ids.secondary).click()
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await state()).secondaryActive).toBe(true)
  await row(ids.loaded).click()
  await page.keyboard.press('Escape')
  await expect(summary).toHaveAttribute('data-selected-tabs', '0')
  await expect(row(ids.loaded)).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(row(ids.secondary)).toHaveAttribute('aria-selected', 'true')
  await expect.poll(async () => (await state()).loadedActive).toBe(false)

  await page
    .getByRole('button', { name: 'Expand group Selection group' })
    .click()
  for (const id of [ids.groupFirst, ids.groupLast]) {
    await row(id).click()
    await page.keyboard.press('Space')
    await expect
      .poll(() =>
        row(id).evaluate((option) => {
          const element = option.closest<HTMLElement>('[data-tab-id]')!
          const style = getComputedStyle(element)
          const width = parseFloat(style.outlineWidth)
          const outset = Math.max(0, width + parseFloat(style.outlineOffset))
          const bounds = element.getBoundingClientRect()
          if (!width) return false
          for (
            let parent = element.parentElement;
            parent;
            parent = parent.parentElement
          ) {
            const clip = parent.getBoundingClientRect()
            const parentStyle = getComputedStyle(parent)
            const clips = (overflow: string) =>
              ['hidden', 'clip', 'auto', 'scroll'].includes(overflow)
            if (
              clips(parentStyle.overflowX) &&
              (bounds.left - outset < clip.left - 0.5 ||
                bounds.right + outset > clip.right + 0.5)
            )
              return false
            if (
              clips(parentStyle.overflowY) &&
              (bounds.top - outset < clip.top - 0.5 ||
                bounds.bottom + outset > clip.bottom + 0.5)
            )
              return false
          }
          return true
        }),
      )
      .toBe(true)
  }

  const toggleModifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  await page.keyboard.press('Escape')
  await rail(ids.window).click({ modifiers: [toggleModifier] })
  const total = await page.evaluate(
    (windowId) => chrome.tabs.query({ windowId }).then((tabs) => tabs.length),
    ids.window,
  )
  await expect(summary).toHaveAttribute('data-selected-tabs', String(total))
  await row(ids.groupFirst).click({ modifiers: [toggleModifier] })
  await expect(summary).toHaveAttribute('data-selected-windows', '0')
  await expect(summary).toHaveAttribute('data-selected-groups', '0')
  await expect(summary).toHaveAttribute('data-selected-tabs', String(total - 1))
  await expect(row(ids.groupFirst)).toHaveAttribute('aria-selected', 'false')
  await expect(row(ids.groupLast)).toHaveAttribute('aria-selected', 'true')

  await page
    .getByRole('button', { name: 'Selection group', exact: true })
    .click()
  await expect(summary).toHaveAttribute('data-selected-tabs', '2')
  await row(ids.groupFirst).click({ modifiers: [toggleModifier] })
  await expect(summary).toHaveAttribute('data-selected-groups', '0')
  await expect(summary).toHaveAttribute('data-selected-tabs', '1')
  await expect(row(ids.groupLast)).toHaveAttribute('aria-selected', 'true')

  await row(ids.groupLast).click()
  await page.keyboard.press('ArrowDown')
  const newTab = page.getByRole('button', {
    name: 'New tab in Selection group',
  })
  await expect(newTab).toBeFocused()
  await expect(summary).toHaveAttribute('data-selected-tabs', '0')
  expect(
    await newTab.evaluate((element) => getComputedStyle(element).boxShadow),
  ).toContain('inset')
  await page.keyboard.press('ArrowUp')
  await expect(row(ids.groupLast)).toHaveAttribute('aria-selected', 'true')

  await rail(ids.otherWindow).click()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('button', { name: 'New window', exact: true }),
  ).toBeFocused()
  await expect(summary).toHaveAttribute('data-selected-tabs', '0')
  await page.keyboard.press('ArrowRight')
  await expect(row(ids.other)).toBeFocused()
  await expect(summary).toHaveAttribute('data-selected-tabs', '1')
  await page.setViewportSize({ width: 480, height: 640 })
  const expand = page.getByRole('button', {
    name: 'Expand sidebar',
    exact: true,
  })
  if (await expand.count()) await expand.click()
  await rail(ids.window).click()
  await page.keyboard.press('ArrowRight')
  await expect(expand).toBeVisible()
  await expect(page.locator('[data-tab-option]:focus')).toHaveCount(1)
})
