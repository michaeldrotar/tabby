import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: { ...browser, preferences: { theme: 'system' } } })

test('chooses each window icon type and keeps image choices after reopening', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const edit = page.getByRole('button', { name: 'Edit window', exact: true })
  const header = page.locator('[data-window-picker-trigger]')
  const done = page.getByRole('button', { name: 'Done', exact: true })
  await edit.click()
  const suggestions = page.getByRole('toolbar', { name: 'Suggested icons' })
  await expect(suggestions.getByRole('button')).toHaveCount(32)
  expect(
    await suggestions
      .getByRole('button')
      .evaluateAll(
        (buttons) =>
          new Set(buttons.map((button) => button.getBoundingClientRect().top))
            .size,
      ),
  ).toBe(4)
  await expect(
    page.getByRole('button', { name: 'Show more icons' }),
  ).toHaveCount(0)
  const search = page.getByRole('searchbox', { name: 'Search icons' })
  await search.fill('a')
  const results = page.getByRole('toolbar', { name: 'Matching icons' })
  expect(await results.getByRole('button').count()).toBeGreaterThan(80)
  expect(
    await results.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)
  expect(
    await results.evaluate(
      (element) =>
        element.getBoundingClientRect().top ===
        element
          .parentElement!.querySelector('[aria-label="Suggested icons"]')!
          .getBoundingClientRect().top,
    ),
  ).toBe(true)
  await search.press('Escape')
  await expect(results).toHaveCount(0)
  await expect(page.getByRole('form', { name: 'Name and icon' })).toBeVisible()
  await search.press('Escape')
  await expect(page.getByRole('form', { name: 'Name and icon' })).toHaveCount(0)
  await edit.click()
  await page.getByRole('tab', { name: 'Emoji', exact: true }).click()
  const firstEmoji = page.getByRole('button', { name: 'Use 😀' })
  await firstEmoji.focus()
  await firstEmoji.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Use 😎' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(header).toContainText('😎')
  const emojiSearch = page.getByRole('searchbox', { name: 'Search emoji' })
  await emojiSearch.fill('software medium skin')
  await expect(
    page.getByRole('button', { name: 'Use 🧑🏽‍💻', exact: true }),
  ).toHaveAttribute('title', 'technologist: medium skin tone')
  await emojiSearch.fill('hedgehog')
  const emojiResults = page.getByRole('toolbar', { name: 'Matching emoji' })
  await expect(
    emojiResults.getByRole('button', { name: 'Use 🦔' }),
  ).toBeVisible()
  await expect(header).toContainText('😎')
  await emojiSearch.press('ArrowDown')
  await expect(
    emojiResults.getByRole('button', { name: 'Use 🦔' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(header).toContainText('🦔')
  await expect(emojiSearch).toHaveValue('')
  await emojiSearch.fill('😀😎abc')
  await expect(page.getByRole('status')).toContainText('No emoji found')
  await expect(header).toContainText('🦔')
  await emojiSearch.press('Escape')
  await expect(emojiResults).toHaveCount(0)
  await done.click()
  await edit.click()
  await expect(
    page.getByRole('tab', { name: 'Emoji', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: 'Monogram', exact: true }).click()
  await page.getByRole('textbox', { name: 'Monogram character 1' }).fill('rx')
  await expect(header).toContainText('RX')
  await page.getByRole('tab', { name: 'Icon', exact: true }).click()
  await page.getByRole('button', { name: 'Window icon', exact: true }).click()
  await expect(header.locator('svg').first()).toHaveClass(/lucide-monitor/)
  await page.getByRole('tab', { name: 'Emoji', exact: true }).click()
  await expect(header).toContainText('🦔')
  await expect(emojiSearch).toHaveValue('')
  await page.getByRole('tab', { name: 'Monogram', exact: true }).click()
  await expect(header).toContainText('RX')

  await done.click()
  await edit.click()
  await expect(
    page.getByRole('textbox', { name: 'Monogram character 1' }),
  ).toHaveValue('R')
  await expect(
    page.getByRole('textbox', { name: 'Monogram character 2' }),
  ).toHaveValue('X')
  await page.getByRole('tab', { name: 'Favicons', exact: true }).click()
  const localButtons = page
    .getByRole('toolbar', { name: 'Favicons', exact: true })
    .getByRole('button')
  await expect(localButtons.first()).toHaveAccessibleName(
    'Use docs.google.com favicon',
  )
  await expect(localButtons.last()).toHaveAccessibleName(
    'Use example.com favicon',
  )
  await expect(page.getByText('This window', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Other windows', { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Follow tab favicon', exact: true }),
  ).toHaveCount(0)
  await localButtons.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(localButtons.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(header.locator('img')).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  )
  const favicon = await header.locator('img').getAttribute('src')
  await done.click()
  await edit.click()
  await expect(
    page.getByRole('tab', { name: 'Favicons', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(header.locator('img')).toHaveAttribute('src', favicon!)
  await page.getByRole('tab', { name: 'Upload', exact: true }).click()
  const file = page.getByLabel('Upload window image', { exact: true })
  await file.setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('broken image'),
  })
  await expect(page.getByRole('alert')).toContainText(
    'Could not open this image',
  )
  await file.setInputFiles({
    name: 'logo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="coral"/></svg>',
    ),
  })
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Choose another image', exact: false }),
  ).toBeVisible()
  await expect(header.locator('img')).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  )
  const image = await header.locator('img').getAttribute('src')
  expect(image).not.toBe(favicon)
  await done.click()
  await edit.click()
  await expect(
    page.getByRole('tab', { name: 'Upload', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(header.locator('img')).toHaveAttribute('src', image!)
  await page.getByRole('tab', { name: 'Favicons', exact: true }).click()
  await expect(header.locator('img')).toHaveAttribute('src', favicon!)
  await page.getByRole('tab', { name: 'Emoji', exact: true }).click()
  await expect(header).toContainText('🦔')
  await page.getByRole('tab', { name: 'Upload', exact: true }).click()
  await expect(header.locator('img')).toHaveAttribute('src', image!)
  await page.setViewportSize({ width: 240, height: 640 })
  expect(
    await page
      .getByRole('tab')
      .evaluateAll((tabs) =>
        tabs
          .slice(1)
          .every(
            (tab, index) =>
              tab.getBoundingClientRect().left >=
              tabs[index]!.getBoundingClientRect().right - 1,
          ),
      ),
  ).toBe(true)

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    240,
  )
})

test('prefills a selected tab name and suggested icon after reset, with colors on one row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const edit = page.getByRole('button', { name: 'Edit window', exact: true })
  const header = page.locator('[data-window-picker-trigger]')
  await edit.click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(header).toContainText('Project notes')
  await edit.click()
  const name = page.getByRole('textbox', { name: 'Name', exact: true })
  await expect(name).toHaveValue('Project notes')
  await expect(name).toBeFocused()
  expect(
    await name.evaluate((input: HTMLInputElement) => [
      input.selectionStart,
      input.selectionEnd,
    ]),
  ).toEqual([0, 'Project notes'.length])
  await expect(name).not.toHaveAttribute('placeholder')
  await expect(
    page.getByRole('tab', { name: 'Icon', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(
    page
      .getByRole('toolbar', { name: 'Suggested icons' })
      .getByRole('button', { pressed: true }),
  ).toHaveCount(1)
  const color = await page
    .locator('[data-editor-row="colors"] [aria-pressed="true"]')
    .getAttribute('aria-label')
  const icon = await page
    .getByRole('toolbar', { name: 'Suggested icons' })
    .getByRole('button', { pressed: true })
    .getAttribute('aria-label')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await edit.click()
  await expect(name).toHaveValue('Project notes')
  await expect(
    page.getByRole('button', { name: color!, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('button', { name: icon!, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.setViewportSize({ width: 240, height: 640 })
  const colors = page.getByRole('group', { name: 'Color' }).getByRole('button')
  await expect(colors).toHaveCount(9)
  expect(
    await colors.evaluateAll(
      (buttons) =>
        new Set(buttons.map((button) => button.getBoundingClientRect().top))
          .size,
    ),
  ).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    240,
  )
})

test('types, pastes, and corrects a three-character monogram without errors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 240, height: 640 })
  await page.goto('/tab-manager/index.html')
  const edit = page.getByRole('button', { name: 'Edit window', exact: true })
  await edit.click()
  await page.getByRole('tab', { name: 'Monogram', exact: true }).click()
  const boxes = page
    .getByRole('group', { name: 'Monogram', exact: true })
    .getByRole('textbox')
  const header = page.locator('[data-window-picker-trigger]')
  await expect(boxes).toHaveCount(3)
  await boxes.nth(0).focus()
  await page.keyboard.type('abc')
  await expect(header).toContainText('ABC')
  await expect(boxes.nth(2)).toBeFocused()
  await page.keyboard.type('!d')
  await expect(header).toContainText('ABD')
  await boxes.nth(2).press('Backspace')
  await boxes.nth(2).press('Backspace')
  await expect(boxes.nth(1)).toBeFocused()
  await expect(boxes.nth(1)).toHaveValue('')
  await boxes.nth(1).press('ArrowLeft')
  await expect(boxes.nth(0)).toBeFocused()
  await boxes.nth(0).evaluate((input) => {
    const data = new DataTransfer()
    data.setData('text', 'x!y🙂3z')
    input.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    )
  })
  await expect(header).toContainText('XY3')
  await expect(boxes.nth(0)).toHaveValue('X')
  await expect(boxes.nth(1)).toHaveValue('Y')
  await expect(boxes.nth(2)).toHaveValue('3')
  await expect(boxes.nth(2)).toBeFocused()
  await boxes.nth(2).press('Shift+Tab')
  await expect(boxes.nth(1)).toBeFocused()
  await boxes.nth(1).press('Tab')
  await expect(boxes.nth(2)).toBeFocused()
  await boxes.nth(2).press('Tab')
  await expect(
    page.getByRole('button', { name: 'Done', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await edit.click()
  await expect(boxes.nth(0)).toHaveValue('X')
  await expect(boxes.nth(2)).toHaveValue('3')
  await boxes.nth(2).focus()
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await expect(boxes.nth(0)).toHaveValue('')
  await expect(boxes.nth(1)).toHaveValue('')
  await expect(boxes.nth(2)).toHaveValue('')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Icon', exact: true }).click()
  await page.getByRole('tab', { name: 'Monogram', exact: true }).click()
  await expect(boxes.nth(0)).toHaveValue('')
})

test.describe('with many favicon choices', () => {
  test.use({
    browserData: {
      ...browser,
      tabs: [
        ...browser.tabs,
        ...Array.from({ length: 50 }, (_, index) => ({
          id: 500 + index,
          windowId: 2,
          title: `Website ${index + 1}`,
          url: `https://website-${index + 1}.test`,
        })),
      ],
      preferences: { theme: 'system' },
    },
  })

  test('keeps editor actions fixed while switching and scrolling icon types', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/tab-manager/index.html')
    await page.getByRole('button', { name: 'Edit window', exact: true }).click()
    const actions = page.locator('[data-editor-row="actions"]')
    const panel = page.getByRole('tabpanel')
    const geometry = async (name: string) =>
      page
        .getByRole('toolbar', { name, exact: true })
        .getByRole('button')
        .evaluateAll((buttons) => {
          const first = buttons[0]!.getBoundingClientRect()
          const second = buttons[1]!.getBoundingClientRect()
          const nextRow = buttons.find(
            (button) => button.getBoundingClientRect().top > first.top,
          )!
          const glyph = buttons[0]!.firstElementChild!.getBoundingClientRect()
          return {
            width: first.width,
            height: first.height,
            columnGap: second.left - first.right,
            rowGap: nextRow.getBoundingClientRect().top - first.bottom,
            glyphWidth: glyph.width,
            glyphHeight: glyph.height,
          }
        })

    for (const width of [480, 240]) {
      await page.setViewportSize({ width, height: 640 })
      await page.getByRole('tab', { name: 'Icon', exact: true }).click()
      await expect(
        page
          .getByRole('toolbar', { name: 'Suggested icons' })
          .getByRole('button'),
      ).toHaveCount(width === 480 ? 32 : 20)
      const bounds = await actions.boundingBox()
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(640)
      expect(
        await page
          .getByRole('searchbox', { name: 'Search icons' })
          .evaluate((input) => {
            const field = input.getBoundingClientRect()
            const icon = input
              .parentElement!.querySelector('svg')!
              .getBoundingClientRect()
            return Math.abs(
              field.top + field.height / 2 - icon.top - icon.height / 2,
            )
          }),
      ).toBeLessThan(0.5)
      const iconGeometry = await geometry('Suggested icons')
      for (const type of ['Emoji', 'Monogram', 'Upload', 'Favicons']) {
        await page.getByRole('tab', { name: type, exact: true }).click()
        await expect.poll(() => actions.boundingBox()).toEqual(bounds)
        if (type === 'Emoji') {
          expect(await geometry('Suggested emoji')).toEqual(iconGeometry)
          await page
            .getByRole('searchbox', { name: 'Search emoji' })
            .fill('happy')
          await expect(
            page.getByRole('toolbar', { name: 'Matching emoji' }),
          ).toBeVisible()
          await expect.poll(() => actions.boundingBox()).toEqual(bounds)
        }
        if (type === 'Upload') {
          expect(
            await page
              .getByRole('button', { name: /^Choose an image/ })
              .boundingBox(),
          ).toEqual(await panel.boundingBox())
        }
        if (type === 'Favicons') {
          const viewport = page
            .getByRole('toolbar', { name: 'Favicons' })
            .locator('..')
          expect(
            await viewport.evaluate(
              (element) => element.scrollHeight > element.clientHeight,
            ),
          ).toBe(true)
          await viewport.evaluate((element) => {
            element.scrollTop = element.scrollHeight
          })
          expect(
            await viewport.evaluate((element) => element.scrollTop),
          ).toBeGreaterThan(0)
          expect(await actions.boundingBox()).toEqual(bounds)
        }
      }
    }
    await page.getByRole('button', { name: 'Done', exact: true }).click()
    await expect(panel).toHaveCount(0)
  })
})

test.describe('when open pages have no favicons', () => {
  test.use({
    browserData: {
      ...browser,
      windows: [browser.windows[0]!],
      groups: [],
      tabs: [{ ...browser.tabs[0]!, url: 'about:blank' }],
      preferences: { theme: 'system' },
    },
  })
  test('keeps keyboard navigation usable without favicon choices', async ({
    page,
  }) => {
    await page.goto('/tab-manager/index.html')
    await page.getByRole('button', { name: 'Edit window', exact: true }).click()
    const favicons = page.getByRole('tab', { name: 'Favicons', exact: true })
    await favicons.click()
    await expect(
      page.getByText('Open a website to choose its favicon.'),
    ).toBeVisible()
    await favicons.press('ArrowDown')
    const done = page.getByRole('button', { name: 'Done', exact: true })
    await expect(done).toBeFocused()
    await done.press('ArrowUp')
    await expect(favicons).toBeFocused()
  })
})
