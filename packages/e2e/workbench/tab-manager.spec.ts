import { expect, test } from '@playwright/test'

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
    if (owner === right)
      await expect
        .poll(() =>
          right.getByRole('status').evaluate((element) => {
            const surface = element.closest('[data-surface]')!
            return (
              getComputedStyle(element).color ===
              getComputedStyle(surface).color
            )
          }),
        )
        .toBe(true)
    await page.getByRole('button', { name: 'Reset scene' }).click()
  }
  await left.locator('[data-tab-id="11"]').click()
  await page.keyboard.press('Shift+ArrowDown')
  await expect(left).toContainText('Selected: 1 tabs, 1 groups')
  await expect(right).toContainText('Selected: 0 tabs, 0 groups')
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
    page.getByRole('region', { name: 'Tutorial controls' }),
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
  await expect(left).toContainText('Selected: 1 tabs, 1 groups')
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(
    left.getByRole('menuitem', { name: /Close.*selected/i }),
  ).toBeVisible()
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
  await expect(left).toContainText('Selected: 0 tabs, 0 groups')
  await expect(right).toContainText('viewing 1')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Jump to step 3: Select Tabby', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Pause', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(
    page.getByRole('region', { name: 'Tutorial controls' }),
  ).toContainText('Paused')
  await page.getByRole('button', { name: 'Rewind' }).click()
  await page.getByLabel('Experience', { exact: true }).selectOption('static')
  await left.locator('[data-tab-id="11"]').click({ force: true })
  await expect(left).toContainText('Selected: 0 tabs, 0 groups')
  expect(errors).toEqual([])
})
