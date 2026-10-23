import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { ThemeReport } from '../../ui/lib/theme-audit/measure'

test('compares palettes, scans every combination, and opens exact findings', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await page.getByRole('link', { name: 'Theme lab', exact: true }).click()
  const left = page.getByRole('region', { name: 'Palette A', exact: true })
  const right = page.getByRole('region', { name: 'Palette B', exact: true })
  const observations = page.getByRole('button', { name: /^Observations/ })
  await expect(observations).toHaveAttribute('aria-pressed', 'true', {
    timeout: 60_000,
  })
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await left.getByRole('button', { name: 'Light', exact: true }).click()
  await left.getByRole('button', { name: 'Dark', exact: true }).click()
  await observations.click()
  await expect(
    page.getByRole('heading', { name: '2,754 combinations checked' }),
  ).toBeVisible({ timeout: 60_000 })
  const initialDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click()
  const initialPath = testInfo.outputPath('initial-theme-report.json')
  await (await initialDownload).saveAs(initialPath)
  const initialReport = JSON.parse(
    await readFile(initialPath, 'utf8'),
  ) as ThemeReport
  await page.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(
    left.getByRole('button', { name: 'Dark', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    left.getByRole('button', { name: 'stone foreground', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Compare', exact: true }).click()
  await expect(
    right.getByRole('button', { name: 'Light', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await left
    .getByRole('radiogroup', { name: 'Accent', exact: true })
    .getByRole('radio', { name: 'teal', exact: true })
    .click()
  await left.getByRole('button', { name: 'Light', exact: true }).click()
  await expect(
    left.locator('[data-theme-preview] [data-surface]'),
  ).toHaveAttribute('data-theme', 'light')
  await expect(
    right.locator('[data-theme-preview] [data-surface]'),
  ).toHaveAttribute('data-theme-accent', 'blue')
  await observations.click()
  const unchangedDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click()
  const unchangedPath = testInfo.outputPath('unchanged-theme-report.json')
  await (await unchangedDownload).saveAs(unchangedPath)
  expect(JSON.parse(await readFile(unchangedPath, 'utf8'))).toEqual(
    initialReport,
  )
  await page.getByRole('button', { name: 'Compare', exact: true }).click()
  await expect(
    right
      .getByRole('radiogroup', { name: 'Accent', exact: true })
      .getByRole('radio', { name: 'blue', exact: true }),
  ).toBeChecked()

  await page.getByRole('button', { name: 'Recalculate audit' }).click()
  await page.getByRole('button', { name: 'Cancel scan' }).click()
  await expect(
    page.getByRole('button', { name: 'Recalculate audit' }),
  ).toBeEnabled()
  await expect(
    left
      .getByRole('radiogroup', { name: 'Accent', exact: true })
      .getByRole('radio', { name: 'teal', exact: true }),
  ).toBeChecked()

  await page.getByRole('button', { name: 'Recalculate audit' }).click()
  await expect(
    page.getByRole('button', { name: 'Recalculate audit' }),
  ).toBeEnabled({ timeout: 60_000 })
  await observations.click()
  await expect(
    page.getByRole('heading', { name: '2,754 combinations checked' }),
  ).toBeVisible({ timeout: 60_000 })
  const reportDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click()
  const reportPath = testInfo.outputPath('theme-report.json')
  await (await reportDownload).saveAs(reportPath)
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as ThemeReport
  const htmlDownload = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Download HTML report', exact: true })
    .click()
  const htmlPath = testInfo.outputPath('theme-report.html')
  await (await htmlDownload).saveAs(htmlPath)
  await testInfo.attach('Theme report', {
    path: htmlPath,
    contentType: 'text/html',
  })
  expect(report.combinations).toBe(2754)
  const auditDuration = await page
    .locator('[data-theme-audit-duration]')
    .getAttribute('data-theme-audit-duration')
  await testInfo.attach('Audit runtime', {
    body: JSON.stringify({ durationMs: Number(auditDuration) }),
    contentType: 'application/json',
  })

  expect(
    report.findings.filter((finding) => finding.kind === 'contrast'),
  ).toEqual([])
  expect(
    report.findings.filter(
      (finding) =>
        finding.kind === 'similarity' &&
        (finding.severity === 'warning' || finding.id.includes('/accent/')),
    ),
  ).toEqual([])
  expect(
    report.findings.some(
      (finding) => finding.id === 'dark/foreground/neutral/stone',
    ),
  ).toBe(false)

  // Create a real contrast failure so Inspect and stylesheet recalculation are exercised.
  const override = await page.addStyleTag({
    content:
      '[data-surface][data-theme="light"][data-theme-background="slate"][data-theme-accent="teal"] { --focus-ring: #ffffff !important; }',
  })
  await expect(page.locator('[data-theme-audit-duration]')).toHaveCount(0)
  await expect(page.locator('[data-theme-audit-duration]')).toHaveCount(1, {
    timeout: 60_000,
  })
  const changedDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click()
  const changedPath = testInfo.outputPath('changed-theme-report.json')
  await (await changedDownload).saveAs(changedPath)
  const changed = JSON.parse(await readFile(changedPath, 'utf8')) as ThemeReport
  expect(changed.combinations).toBe(report.combinations)
  const failures = changed.findings.filter(
    (finding) => finding.kind === 'contrast',
  )
  expect(failures.length).toBeGreaterThan(0)
  expect(
    failures.every(
      ({ selection }) =>
        selection.mode === 'light' &&
        selection.background === 'slate' &&
        selection.accent === 'teal',
    ),
  ).toBe(true)
  expect(
    changed.findings.find((f) => f.id === 'light/slate/teal/focus-selection')!
      .value,
  ).toBeLessThan(3)
  await page.getByLabel('Show', { exact: true }).selectOption('contrast')
  await page
    .locator('[data-theme-result="contrast"]')
    .filter({ hasText: 'Focus ring on header controls' })
    .first()
    .click()
  await expect(
    left.locator('[data-theme-header-focus][data-theme-spotlight="true"]'),
  ).toHaveCount(1)
  expect(
    await left
      .locator('[data-theme-header-focus]')
      .evaluate((node) => getComputedStyle(node).boxShadow),
  ).not.toBe('none')
  await observations.click()
  await page.getByLabel('Show', { exact: true }).selectOption('contrast')
  await page
    .locator('[data-theme-result="contrast"]')
    .filter({ hasText: 'Focus ring on resting tabs' })
    .first()
    .click()
  const restingFocus = left.locator('[data-theme-state="focus-resting"]')
  await expect(restingFocus).toHaveAttribute('data-theme-spotlight', 'true')
  await expect(restingFocus.locator('[data-tab-item]')).toHaveAttribute(
    'data-selected',
    'false',
  )
  expect(
    await restingFocus
      .locator('[data-tab-item]')
      .evaluate((node) => getComputedStyle(node, '::after').boxShadow),
  ).not.toBe('none')

  await expect(
    left.getByRole('button', { name: 'Light', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('complementary', { name: 'Observation to review' }),
  ).toContainText('Focus ring')
  await observations.click()
  await page.getByLabel('Show', { exact: true }).selectOption('similarity')
  await page
    .locator('[data-theme-result="similarity"]')
    .filter({
      hasText:
        'stone and taupe background roles look very similar in dark mode',
    })
    .click()
  await expect(
    page.getByRole('button', { name: 'Compare', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    left
      .getByRole('radiogroup', { name: 'Background', exact: true })
      .getByRole('radio', { name: 'stone', exact: true }),
  ).toBeChecked()
  await expect(
    right
      .getByRole('radiogroup', { name: 'Background', exact: true })
      .getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeChecked()
  await expect(
    left.getByRole('button', { name: 'Dark', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await override.evaluate((node) => node.remove())
  await page.reload()
  await expect(
    right
      .getByRole('radiogroup', { name: 'Background', exact: true })
      .getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeChecked()
  await page.setViewportSize({ width: 375, height: 800 })
  await expect(
    left.getByRole('radiogroup', { name: 'Background', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('theme-lab-narrow.png'),
    fullPage: true,
  })

  const normalize = (value: ThemeReport) =>
    JSON.parse(
      JSON.stringify(value, (_key, item) =>
        typeof item === 'number' ? Number(item.toFixed(6)) : item,
      ),
    )
  expect(normalize(report)).toEqual(normalize(initialReport))
})

test('swatch palettes show every name and wrap keyboard selection between groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/?theme-lab&mode=light')
  const palette = page.getByRole('region', { name: 'Palette A', exact: true })
  const controls = palette.locator('.theme-lab-controls')
  const background = controls.getByRole('radiogroup', {
    name: 'Background',
    exact: true,
  })
  const foreground = controls.getByRole('radiogroup', {
    name: 'Foreground',
    exact: true,
  })
  const accent = controls.getByRole('radiogroup', {
    name: 'Accent',
    exact: true,
  })
  for (const [group, count] of [
    [background, 9],
    [foreground, 9],
    [accent, 17],
  ] as const) {
    await expect(group.getByRole('radio')).toHaveCount(count)
    for (const swatch of await group.getByRole('radio').all()) {
      await expect(swatch).toBeVisible()
      await expect(swatch.locator('[data-palette-name]')).toBeVisible()
    }
  }
  await expect(accent.locator('[data-palette-value]')).toHaveText('blue')
  await background.getByRole('radio', { name: 'slate', exact: true }).click()
  await page.keyboard.press('ArrowLeft')
  await expect(
    background.getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeFocused()
  await expect(
    background.getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('ArrowDown')
  await expect(
    background.getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeFocused()
  await expect(
    background.getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('ArrowRight')
  await expect(
    background.getByRole('radio', { name: 'slate', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('Tab')
  await expect(
    foreground.getByRole('radio', { name: 'neutral', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('End')
  await expect(
    foreground.getByRole('radio', { name: 'taupe', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('Home')
  await expect(
    foreground.getByRole('radio', { name: 'slate', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('Tab')
  await expect(
    accent.getByRole('radio', { name: 'blue', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowUp')
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(
    accent.getByRole('radio', { name: 'rose', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('ArrowRight')
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeFocused()
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeChecked()
  await expect(accent.locator('[data-palette-value]')).toHaveText('red')
  const purple = accent.getByRole('radio', { name: 'purple', exact: true })
  await page.keyboard.press('ArrowDown')
  await expect(purple).toBeFocused()
  await expect(purple).toBeChecked()
  await page.keyboard.press('ArrowDown')
  await expect(purple).toBeFocused()
  await expect(purple).toBeChecked()
  await page.keyboard.press('ArrowUp')
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeFocused()
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('Shift+Tab')
  await expect(
    foreground.getByRole('radio', { name: 'slate', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeFocused()
  await page.reload()
  await expect(
    accent.getByRole('radio', { name: 'red', exact: true }),
  ).toBeChecked()
  await page.getByLabel('Preview', { exact: true }).selectOption('options')
  const settings = palette.locator('.theme-lab-product')
  const settingsAccent = settings.getByRole('radiogroup', {
    name: 'Accent',
    exact: true,
  })
  await settingsAccent.getByRole('radio', { name: 'lime', exact: true }).click()
  await expect(
    accent.getByRole('radio', { name: 'lime', exact: true }),
  ).toBeChecked()
  await page.keyboard.press('ArrowRight')
  await expect(
    settingsAccent.getByRole('radio', { name: 'green', exact: true }),
  ).toBeFocused()
  const focusedSwatch = settingsAccent.getByRole('radio', {
    name: 'green',
    exact: true,
  })
  await expect(focusedSwatch).toHaveCSS('outline-style', 'solid')
  await expect(focusedSwatch).toHaveCSS('outline-width', '2px')
  await expect(focusedSwatch).toHaveCSS('outline-offset', '2px')
  await expect(
    accent.getByRole('radio', { name: 'green', exact: true }),
  ).toBeChecked()
  await page.setViewportSize({ width: 320, height: 800 })
  const namesFit = await settingsAccent
    .locator('[data-palette-name]')
    .evaluateAll((names) =>
      names.every((name) => {
        const label = name.getBoundingClientRect()
        const button = name.closest('button')!.getBoundingClientRect()
        return label.left >= button.left && label.right <= button.right
      }),
    )
  expect(namesFit).toBe(true)
  await settingsAccent.getByRole('radio', { name: 'pink', exact: true }).click()
  await page.keyboard.press('ArrowDown')
  await expect(
    settingsAccent.getByRole('radio', { name: 'rose', exact: true }),
  ).toBeFocused()
  await expect(
    settingsAccent.getByRole('radio', { name: 'rose', exact: true }),
  ).toBeChecked()
  expect(
    await settings.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
})

test('scrolling over theme samples and live apps continues into the lab page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 600 })
  await page.goto('/?theme-lab&mode=light')
  const palette = page.getByRole('region', { name: 'Palette A', exact: true })
  const pointAt = async (selector: string) => {
    const target = palette.locator(selector)
    await target.evaluate((element) =>
      window.scrollTo({
        top: scrollY + element.getBoundingClientRect().top - 100,
        behavior: 'instant',
      }),
    )
    const bounds = await target.boundingBox()
    await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + 150)
  }
  await pointAt('[data-theme-preview]')
  let before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 120)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)

  await page.getByLabel('Preview', { exact: true }).selectOption('manager')
  await pointAt('.theme-lab-product')
  await palette
    .locator('[data-radix-scroll-area-viewport]')
    .evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
  before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 120)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)

  await page.getByLabel('Preview', { exact: true }).selectOption('options')
  await pointAt('.theme-lab-product')
  const settings = palette.locator('[data-options]')
  before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 120)
  await expect
    .poll(() => settings.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  expect(await page.evaluate(() => scrollY)).toBe(before)

  await settings.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await page.mouse.wheel(0, 120)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
  await settings.evaluate((element) => {
    element.scrollTop = 0
  })
  before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -120)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before)
})

test('state samples match real pointer and keyboard styling', async ({
  page,
}) => {
  await page.goto('/?theme-lab&mode=dark')
  const palette = page.getByRole('region', { name: 'Palette A', exact: true })
  await page.getByLabel('Preview', { exact: true }).selectOption('manager')
  const live = palette.locator('.theme-lab-product')
  const header = live.locator('[data-window-picker-trigger]')
  await header.hover()
  expect(
    await header.evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe(
    await palette
      .locator('[data-theme-header-hover]')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  )
  await header.click()
  await page.keyboard.press('Escape')
  expect(
    await header.evaluate((node) => getComputedStyle(node).boxShadow),
  ).toBe(
    await palette
      .locator('[data-theme-header-focus]')
      .evaluate((node) => getComputedStyle(node).boxShadow),
  )
  await page.keyboard.press('ArrowDown')
  const focused = live.locator(
    '[data-tab-item]:has([data-tab-option]:focus-visible)',
  )
  await expect(focused).toHaveCount(1)
  expect(
    await focused.evaluate(
      (node) => getComputedStyle(node, '::after').boxShadow,
    ),
  ).toBe(
    await palette
      .locator('[data-theme-state="focus"] [data-tab-item]')
      .evaluate((node) => getComputedStyle(node, '::after').boxShadow),
  )
  await page.getByLabel('Preview', { exact: true }).selectOption('options')
  await expect(
    live.getByRole('heading', { name: 'Appearance', exact: true }),
  ).toBeVisible()
  await expect(live.locator('[data-theme-preview]')).toHaveCount(0)
  await expect(live.getByText(/contrast|observations|similarity/i)).toHaveCount(
    0,
  )
})
