import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import scoped from '../../../scripts/preview/search-scope-browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({
  reducedMotion: 'reduce',
  browserData: { ...browser, ...scoped, preferences: { theme: 'dark' } },
})

test('browses and narrows sources through the full chooser while preserving native editing', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 640, height: 500 })
  await page.goto('/omnibar/index.html?originalWindowId=1')
  await page.evaluate(() => {
    window.close = () => {
      document.documentElement.dataset.dismissed = 'true'
    }
  })
  const input = page.getByRole('combobox')
  const trigger = page.getByRole('button', { name: /^Search scope:/ })
  const choices = page.getByRole('listbox', {
    name: 'Search scope',
    exact: true,
  })
  const results = page
    .getByRole('listbox', { name: 'Search results', exact: true })
    .getByRole('option')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute(
    'placeholder',
    'Search tabs, bookmarks, history, and more...',
  )
  await expect(trigger).toHaveText('')
  await expect(
    page.getByRole('button', { name: 'Close search', exact: true }),
  ).toHaveText('')
  const tips = page
    .getByRole('heading', { name: 'Tips', exact: true })
    .locator('..')
    .getByRole('listitem')
  await expect(tips.nth((await tips.count()) - 2)).toContainText(
    'Tab to change search scope',
  )
  await expect(tips.last()).toContainText('Esc to close search')
  await page.screenshot({
    path: '../../test-results/search-all.png',
    animations: 'disabled',
  })
  await input.press('Tab')
  await expect(choices.getByRole('option')).toContainText([
    'All',
    'Windows',
    'Current window',
    'Tab groups',
    'Tabs',
    'Bookmarks',
    'Recently closed',
    'History',
    'Commands',
  ])
  await expect(input).toBeFocused()
  await page.screenshot({
    path: '../../test-results/search-scope-chooser.png',
    animations: 'disabled',
  })
  await input.press('Tab')
  await expect(choices.getByRole('option').nth(1)).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(trigger).toHaveAccessibleName('Search scope: All')
  await expect(input).toBeFocused()
  await input.press('Shift+Tab')
  await expect(choices.getByRole('option').first()).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await input.press('Shift+Tab')
  await expect(choices.getByRole('option').last()).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await input.press('Tab')
  await expect(choices.getByRole('option').first()).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await input.press('Tab')
  await input.press('Escape')
  await expect(choices).toHaveCount(0)
  await expect(trigger).toHaveAccessibleName('Search scope: All')
  await expect(input).toBeFocused()
  await trigger.click()
  await input.press('Tab')
  await expect(choices.getByRole('option').nth(1)).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await input.press('Enter')
  await expect(results).toHaveCount(2)
  const choose = async (letter: string) => {
    await input.press('Tab')
    await input.press(letter)
    await expect(input).toBeFocused()
    await expect(
      page.getByRole('heading', { name: 'Tips', exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Quick actions', exact: true }),
    ).toHaveCount(0)
  }
  await choose('d')
  await expect(results).toHaveCount(8)
  await expect(input).toHaveAttribute(
    'placeholder',
    'Search tabs in the current window…',
  )
  await choose('t')
  await expect(results).toHaveCount(12)
  await input.fill('Project')
  await expect(results).toHaveCount(3)
  const editWithShortcuts = async () => {
    await input.press('ControlOrMeta+a')
    expect(
      await input.evaluate((element: HTMLInputElement) =>
        element.value.slice(element.selectionStart!, element.selectionEnd!),
      ),
    ).toBe('Project')
    await input.press('ControlOrMeta+c')
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('Project')
    await input.press('ControlOrMeta+x')
    await expect(input).toHaveValue('')
    await input.press('ControlOrMeta+v')
    await expect(input).toHaveValue('Project')
  }
  await editWithShortcuts()
  await input.press('Tab')
  await editWithShortcuts()
  await expect(choices).toBeVisible()
  await page.setViewportSize({ width: 640, height: 240 })
  await input.press('ArrowDown')
  for (let index = 0; index < 5; index++) await input.press('ArrowDown')
  await expect(
    choices.getByRole('option', { name: /^Windows/ }),
  ).toBeInViewport({ ratio: 1 })
  await input.press('Escape')
  await expect(choices).toHaveCount(0)
  await expect(trigger).toHaveAccessibleName('Search scope: Tabs')
  await expect(input).toHaveValue('Project')
  await expect(input).toBeFocused()
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-dismissed',
    'true',
  )
  await page.setViewportSize({ width: 640, height: 500 })
  await input.fill('')
  await choose('h')
  await expect(results).toHaveCount(12)
  await expect(results.first()).toContainText('Project archive')
  await choose('r')
  await expect(results).toHaveCount(10)
  await expect(results.first()).toContainText('Project meeting')
  await choose('g')
  await expect(results).toHaveCount(3)
  await choose('c')
  await expect(results.first()).toBeVisible()
  await choose('b')
  await expect(results).toHaveCount(12)
  await expect(results.first()).toContainText('Reading list')
  await page.screenshot({
    path: '../../test-results/search-bookmarks.png',
    animations: 'disabled',
  })
  await input.fill('Project')
  await expect(results).toHaveCount(1)
  await input.press('ControlOrMeta+a')
  await input.press('Backspace')
  await expect(results).toHaveCount(12)
  await input.press('ArrowDown')
  await expect(results.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(input).toBeFocused()
  await input.press('ControlOrMeta+Enter')
  await expect(page.locator('html')).toHaveAttribute('data-dismissed', 'true')
  expect(
    await page.evaluate(() =>
      chrome.tabs.query({ url: 'https://handbook.example.test' }),
    ),
  ).toHaveLength(1)
})

test('broadens empty scopes from Tab Manager without changing the query or losing typing focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 500 })
  await page.goto('/tab-manager/index.html')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  const input = page.getByRole('combobox')
  await expect(
    page.getByRole('button', {
      name: 'Search scope: Current window',
      exact: true,
    }),
  ).toBeVisible()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('')
  await expect(page.getByRole('option')).toHaveCount(8)
  await expect(
    page.getByRole('heading', { name: 'Tips', exact: true }),
  ).toHaveCount(0)
  await input.fill('research')
  await expect(
    page.getByText('No matching tabs in the current window.', { exact: true }),
  ).toBeVisible()
  const suggestions = page.getByRole('listbox', {
    name: 'Search suggestions',
    exact: true,
  })
  await expect(
    suggestions.getByRole('option', { name: /Search all tabs/ }),
  ).toHaveAttribute('aria-selected', 'true')
  await page.screenshot({
    path: '../../test-results/search-empty-current-window.png',
    animations: 'disabled',
  })
  await input.press('Enter')
  await expect(input).toHaveValue('research')
  await expect(input).toBeFocused()
  await expect(
    page.getByRole('listbox', { name: 'Search results', exact: true }),
  ).toContainText('Project research')
  await expect(suggestions).toHaveCount(0)
  await input.press('Tab')
  await input.press('b')
  const searchEverything = suggestions.getByRole('option', {
    name: /Search everything/,
  })
  await expect(
    page.getByText('No matching bookmarks.', { exact: true }),
  ).toBeVisible()
  await expect(searchEverything).toHaveAttribute('aria-selected', 'true')
  await expect(input).toHaveAttribute(
    'aria-activedescendant',
    (await searchEverything.getAttribute('id'))!,
  )
  await expect(input).toBeFocused()
  await page.screenshot({
    path: '../../test-results/search-empty-bookmarks.png',
    animations: 'disabled',
  })
  await searchEverything.click()
  await expect(
    page.getByRole('button', { name: 'Search scope: All', exact: true }),
  ).toBeVisible()
  await expect(input).toHaveValue('research')
  await expect(input).toBeFocused()
  await expect(
    page.getByRole('listbox', { name: 'Search results', exact: true }),
  ).toContainText('Project research')
})
