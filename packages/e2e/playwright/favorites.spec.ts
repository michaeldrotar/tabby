import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({
  browserData: {
    ...browser,
    preferences: { theme: 'light', favoritesFolderId: null },
  },
})

test('sets up native favorites, adds once, opens with keyboard and modifiers, and follows bookmark changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const favorites = page.getByRole('region', { name: 'Favorites', exact: true })
  await favorites.getByRole('button', { name: 'Set up favorites' }).click()
  await expect(
    favorites.getByText('Choose a Chrome bookmark folder for your favorites.'),
  ).toBeVisible()
  expect(
    await page.evaluate(
      async () =>
        (await chrome.bookmarks.search({ title: 'Tabby Favorites' })).length,
    ),
  ).toBe(1)
  await favorites
    .getByRole('combobox', { name: 'Bookmark folder' })
    .selectOption('10')
  await favorites.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(
    favorites.getByRole('button', { name: 'Tabby on GitHub', exact: true }),
  ).toBeVisible()
  await expect(favorites.getByRole('combobox')).toHaveCount(0)

  await favorites
    .getByRole('button', { name: 'Add current tab to favorites' })
    .click()
  await expect(favorites.getByRole('status')).toContainText(
    'Added to favorites.',
  )
  await favorites
    .getByRole('button', { name: 'Add current tab to favorites' })
    .click()
  await expect(favorites.getByRole('status')).toContainText(
    'already in this folder',
  )
  expect(
    await page.evaluate(
      async () =>
        (await chrome.bookmarks.getChildren('10')).filter(
          (node) => node.url === 'https://docs.google.com/document/project',
        ).length,
    ),
  ).toBe(1)

  const tabCount = await page.evaluate(
    async () => (await chrome.tabs.query({})).length,
  )
  const notes = favorites.getByRole('button', {
    name: 'Project notes',
    exact: true,
  })
  await notes.focus()
  await page.keyboard.press('Enter')
  expect(
    await page.evaluate(async () => (await chrome.tabs.query({})).length),
  ).toBe(tabCount)
  await page.keyboard.press('Control+Enter')
  await expect
    .poll(() => page.evaluate(async () => (await chrome.tabs.query({})).length))
    .toBe(tabCount + 1)
  await notes.click({ button: 'middle' })
  await expect
    .poll(() => page.evaluate(async () => (await chrome.tabs.query({})).length))
    .toBe(tabCount + 2)
  const windowCount = await page.evaluate(
    async () => (await chrome.windows.getAll()).length,
  )
  await notes.click({ modifiers: ['Shift'] })
  await expect
    .poll(() =>
      page.evaluate(async () => (await chrome.windows.getAll()).length),
    )
    .toBe(windowCount + 1)

  await favorites.getByRole('button', { name: 'Reading', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(
    favorites.getByRole('button', { name: 'MDN Web Docs', exact: true }),
  ).toBeFocused()
  await favorites
    .getByRole('button', { name: 'Back to Tabby Favorites' })
    .click()
  await expect(
    favorites.getByRole('button', { name: 'Tabby on GitHub', exact: true }),
  ).toBeFocused()
  await favorites
    .getByRole('button', { name: 'Tabby on GitHub', exact: true })
    .focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    favorites.getByRole('button', { name: 'Chrome extensions', exact: true }),
  ).toBeFocused()

  await page.evaluate(async () => {
    await chrome.bookmarks.update('10', { title: 'Daily links' })
    await chrome.bookmarks.move('10', { parentId: '2' })
    await chrome.bookmarks.update('11', { title: 'Tabby source' })
    await chrome.bookmarks.move('12', { parentId: '10', index: 0 })
  })
  await expect(favorites.getByRole('heading')).toHaveText(
    'Favorites · Daily links',
  )
  await expect(
    favorites.getByRole('list').getByRole('button').first(),
  ).toHaveText('Chrome extensions')
  await expect(
    favorites.getByRole('button', { name: 'Tabby source', exact: true }),
  ).toBeVisible()
  await favorites.getByRole('button', { name: 'Favorite settings' }).click()
  await favorites
    .getByRole('button', { name: 'Remove Tabby source from bookmarks' })
    .click()
  await expect(
    favorites.getByRole('button', { name: 'Tabby source', exact: true }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(async () =>
      (await chrome.bookmarks.getChildren('10')).some(
        (node) => node.id === '11',
      ),
    ),
  ).toBe(false)

  await page.setViewportSize({ width: 320, height: 640 })
  await expect(
    favorites.getByRole('combobox', { name: 'Bookmark folder' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await favorites.getByRole('button', { name: 'Done', exact: true }).click()
  await page.evaluate(async () => {
    await chrome.bookmarks.create({ parentId: '1', title: 'Daily links' })
    await chrome.bookmarks.removeTree('10')
  })
  await expect(
    favorites.getByText(/Your favorites folder is no longer available/),
  ).toBeVisible()
  await expect(favorites.getByRole('combobox')).toHaveValue('')
  await favorites
    .getByRole('button', { name: 'Create Tabby Favorites' })
    .click()
  await expect(
    favorites.getByText('No favorites yet. Use + to add the current tab.'),
  ).toBeVisible()
  const id = await page.evaluate(
    async () =>
      (await chrome.storage.local.get('preference-storage-key'))[
        'preference-storage-key'
      ].favoritesFolderId,
  )
  expect(id).not.toBe('10')
  expect(
    await page.evaluate(
      async (folderId) => (await chrome.bookmarks.get(folderId))[0].title,
      id,
    ),
  ).toBe('Tabby Favorites')
})
