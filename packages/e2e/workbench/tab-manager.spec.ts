import { expect, test } from '@playwright/test'

test('a large browser stays responsive through selection, closing and window switching at sidebar width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 })
  await page.goto('/')
  const left = page.getByRole('region', { name: 'Left instance' })
  const right = page.getByRole('region', { name: 'Right instance' })
  await page
    .getByLabel('Sample data', { exact: true })
    .selectOption('single-window')
  await expect(left).toContainText('1 windows · 4 tabs')
  await page
    .getByLabel('Sample data', { exact: true })
    .selectOption('many-windows')
  await expect(left).toContainText('6 windows · 42 tabs')
  await page.getByLabel('Sample data', { exact: true }).selectOption('large')
  await expect(left).toContainText('400 tabs')
  await left
    .getByRole('option', { name: 'Tab: Tabby (pinned)', exact: true })
    .click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
  await expect(left).toContainText('200 tabs')
  await expect(right).toContainText('200 tabs')
  await expect(left.locator('[data-manager-scroll]')).toHaveCount(1)
  await expect(
    left.getByRole('option', { name: 'Tab: Release checklist', exact: true }),
  ).toBeVisible()
  await left
    .getByRole('button', { name: 'Dismiss notification' })
    .first()
    .click()
  await left.getByRole('button', { name: 'New Tab', exact: true }).click()
  await expect(left).toContainText('201 tabs')
  await expect(right).toContainText('201 tabs')
  await expect(
    left.getByRole('option', { name: 'Tab: New Tab', exact: true }),
  ).toBeFocused()
})

test('independent themes, selectable sharing, ignored commands and complete tutorial rewind', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  const left = page.getByRole('region', { name: 'Left instance' })
  const right = page.getByRole('region', { name: 'Right instance' })
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await left
    .locator('[data-nav-type="window"][data-nav-id="2"]')
    .first()
    .click()
  await expect(left).toContainText('viewing 2')
  await expect(right).toContainText('viewing 1')
  await page.getByRole('button', { name: 'Reset scene' }).click()
  for (const key of ['Enter', 'Space']) {
    const owner = key === 'Enter' ? left : right
    await owner
      .getByRole('option', { name: 'Tab: Tabby (pinned)', exact: true })
      .click()
    await owner
      .locator('[data-tab-id="11"]')
      .getByRole('button', { name: 'Close tab' })
      .focus()
    await page.keyboard.press(key)
    await expect(left.locator('[data-tab-id="11"]')).toHaveCount(0)
    await expect(
      owner.getByRole('button', {
        name: 'Collapse group Research',
        exact: true,
      }),
    ).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(
      owner.getByRole('option', {
        name: 'Tab: Architecture notes',
        exact: true,
      }),
    ).toBeFocused()
    await page.getByRole('button', { name: 'Reset scene' }).click()
  }
  await left.locator('[data-tab-id="11"]').click()
  await page.keyboard.press('Shift+ArrowDown')
  await expect(left).toContainText('Explicit selection: 1 tabs, 1 groups')
  await expect(right).toContainText('Explicit selection: 0 tabs, 0 groups')
  await page.keyboard.press('Delete')
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(0)
  await expect(right.locator('[data-tab-id="11"]')).toHaveCount(0)
  await page.getByLabel('Sharing', { exact: true }).selectOption('all')
  await left
    .locator('[data-nav-type="window"][data-nav-id="2"]')
    .first()
    .click()
  await expect(right).toContainText('viewing 2')
  await page.getByLabel('Sharing', { exact: true }).selectOption('none')
  await expect(right).toContainText('Design inspiration')
  await left.locator('[data-tab-id="11"]').click()
  await page.keyboard.press('Delete')
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(0)
  await expect(right.locator('[data-tab-id="11"]')).toHaveCount(1)
  await page.getByLabel('Ignore data commands').check()
  await left.locator('[data-tab-id="11"]').click()
  await page.keyboard.press('Delete')
  await expect(left).toContainText('ignored; data unchanged')
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(1)
  await page.getByLabel('Ignore data commands').uncheck()
  await page.getByLabel('Sharing', { exact: true }).selectOption('data')
  await page.getByLabel('Share preferences').check()
  await left.getByRole('button', { name: 'Change accent' }).click()
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'rose',
  )
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'rose',
  )
  await page.getByLabel('Experience', { exact: true }).selectOption('scripted')
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(
    page.getByRole('group', { name: 'Tutorial playback' }),
  ).toContainText('Hover the first tab')
  const before = await left.innerText()
  await left.locator('[data-tab-id="11"]').hover({ force: true })
  await left.locator('[data-tab-id="11"]').click({ force: true })
  await page.keyboard.press('Delete')
  await expect.poll(() => left.innerText()).toBe(before)
  const viewport = left.locator(
    '[data-manager-scroll] [data-radix-scroll-area-viewport]',
  )
  await left.locator('[data-surface]').hover()
  await page.mouse.wheel(0, 200)
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBe(0)
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(left).toContainText('Explicit selection: 1 tabs, 1 groups')
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(left.getByRole('menuitem', { name: /^Close/ })).toBeVisible()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBe(180)
  await page.getByRole('button', { name: 'Previous step' }).click()
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBe(0)
  await page.getByRole('button', { name: 'Previous step' }).click()
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Rewind' }).click()
  await expect(left).toContainText('Explicit selection: 0 tabs, 0 groups')
  await expect(right).toContainText('viewing 1')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Step 3: Select Tabby', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(
    page.getByRole('group', { name: 'Tutorial playback' }),
  ).toContainText('Paused')
  await page.getByRole('button', { name: 'Rewind' }).click()
  const tutorial = page.getByRole('group', { name: 'Tutorial playback' })
  await tutorial
    .getByRole('button', { name: 'Step 11: Find tabs, bookmarks, and history' })
    .click()
  await expect(left.getByRole('textbox', { hidden: true })).toHaveValue('Tabby')
  await expect(left).toContainText('Tabby documentation')
  await tutorial
    .getByRole('button', {
      name: 'Step 14: Change the shared appearance preferences',
    })
    .click()
  await expect(left.locator('[data-options]')).toBeVisible()
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'rose',
  )
  await tutorial.getByRole('button', { name: 'Rewind' }).click()
  await expect(left.locator('[data-options]')).toHaveCount(0)
  await expect(left).toContainText('18 tabs')
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'amber',
  )
  await page.getByLabel('Experience', { exact: true }).selectOption('static')
  await left.locator('[data-tab-id="11"]').click({ force: true })
  await expect(left).toContainText('Explicit selection: 0 tabs, 0 groups')
  expect(errors).toEqual([])
})

test('individual hover, clean window switching, shared search actions and scoped Options', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  const left = page.getByRole('region', { name: 'Left instance' })
  const right = page.getByRole('region', { name: 'Right instance' })
  const hovered = left.locator('[data-tab-id="12"]')
  const sibling = left.locator('[data-tab-id="13"]')
  await hovered.hover()
  await expect(hovered.getByRole('button', { name: 'Close tab' })).toHaveCSS(
    'opacity',
    '1',
  )
  await expect(sibling.getByRole('button', { name: 'Close tab' })).toHaveCSS(
    'opacity',
    '0',
  )
  for (const windowId of [2, 1, 2, 1]) {
    await left
      .locator(`[data-nav-type="window"][data-nav-id="${windowId}"]`)
      .first()
      .click()
    await expect(left).toContainText(`viewing ${windowId}`)
    await expect(left.locator('[data-manager-scroll]')).toHaveCount(1)
    await expect(
      left.locator(`[data-tab-id="${windowId === 1 ? 31 : 11}"]`),
    ).toHaveCount(0)
  }
  await expect(right).toContainText('viewing 1')
  await left.locator('[data-tab-id="12"]').click()
  await left.getByRole('button', { name: 'More actions' }).click()
  await left.getByRole('menuitem', { name: /^Pin/, exact: false }).click()
  await expect(
    left.getByRole('option', {
      name: 'Tab: Architecture notes (pinned)',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    right.getByRole('option', {
      name: 'Tab: Architecture notes (pinned)',
      exact: true,
    }),
  ).toBeVisible()
  await left
    .getByRole('button', { name: 'Dismiss notification' })
    .first()
    .click()
  await left
    .getByRole('navigation', { name: 'Left product' })
    .getByRole('button', { name: 'Omnibar', exact: true })
    .click()
  const query = left.getByRole('textbox')
  await query.fill('Tabby')
  await expect(
    left.getByRole('button', { name: /^Tabby documentation/ }),
  ).toBeVisible()
  await left
    .getByRole('button', { name: /^Tabby documentation/ })
    .click({ modifiers: ['ControlOrMeta'] })
  await expect(left).toContainText('19 tabs')
  await expect(right).toContainText('19 tabs')
  await left
    .getByRole('navigation', { name: 'Left product' })
    .getByRole('button', { name: 'Options', exact: true })
    .click()
  await right
    .getByRole('navigation', { name: 'Right product' })
    .getByRole('button', { name: 'Options', exact: true })
    .click()
  await left.getByRole('combobox').first().click()
  await right.getByRole('combobox').first().click()
  await expect(left.getByRole('listbox')).toBeVisible()
  await expect(right.getByRole('listbox')).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('pointer-events', 'auto')
  await left.getByRole('option', { name: 'slate', exact: true }).click()
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme-background',
    'slate',
  )
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme-background',
    'neutral',
  )
  await page.getByLabel('Share preferences').check()
  await page
    .getByLabel('Right theme', { exact: true })
    .selectOption('preference')
  await left
    .getByRole('navigation', { name: 'Left product' })
    .getByRole('button', { name: 'Options', exact: true })
    .click()
  await left
    .getByRole('group', { name: 'Theme mode', exact: true })
    .getByText('Dark', { exact: true })
    .click()
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page.getByLabel('Sharing', { exact: true }).selectOption('all')
  await right
    .getByRole('navigation', { name: 'Right product' })
    .getByRole('button', { name: 'Omnibar', exact: true })
    .click()
  await expect(right.getByRole('textbox')).toBeFocused()
  await right.getByRole('textbox').fill('Tabby')
  await expect(left.getByRole('textbox')).toHaveValue('Tabby')
  await right
    .getByRole('navigation', { name: 'Right product' })
    .getByRole('button', { name: 'Options', exact: true })
    .click()
  const ownedSelect = right
    .getByRole('group', { name: 'Accent', exact: true })
    .getByRole('combobox')
  await ownedSelect.click()
  await expect(left.getByRole('listbox')).toBeVisible()
  await expect(right.getByRole('listbox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(left.getByRole('listbox')).toHaveCount(0)
  await expect(right.getByRole('listbox')).toHaveCount(0)
  await expect(ownedSelect).toBeFocused()
  expect(errors).toEqual([])
})
