import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { ThemeReport } from '../../ui/lib/theme-audit/measure'

test('compares palettes, scans every combination, and opens exact findings', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000)
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
  await left.getByLabel('Accent', { exact: true }).selectOption('teal')
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
  await expect(right.getByLabel('Accent', { exact: true })).toHaveValue('blue')

  await page.getByRole('button', { name: 'Recalculate audit' }).click()
  await page.getByRole('button', { name: 'Cancel scan' }).click()
  await expect(
    page.getByRole('button', { name: 'Recalculate audit' }),
  ).toBeEnabled()
  await expect(left.getByLabel('Accent', { exact: true })).toHaveValue('teal')

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
  await expect(left.getByLabel('Background', { exact: true })).toHaveValue(
    'stone',
  )
  await expect(right.getByLabel('Background', { exact: true })).toHaveValue(
    'taupe',
  )
  await expect(
    left.getByRole('button', { name: 'Dark', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await override.evaluate((node) => node.remove())
  await page.reload()
  await expect(right.getByLabel('Background', { exact: true })).toHaveValue(
    'taupe',
  )
  await page.setViewportSize({ width: 375, height: 800 })
  await expect(left.getByLabel('Background', { exact: true })).toBeVisible()
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
