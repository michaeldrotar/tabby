import { readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { contrastRegressions } from '../../ui/lib/theme-audit/analyze'
import type { ThemeReport } from '../../ui/lib/theme-audit/measure'

test('compares palettes, scans every combination, and opens exact findings', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000)
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
    report.findings.some((finding) => finding.id === 'dark/slate/header-hover'),
  ).toBe(true)
  expect(
    report.findings.some(
      (finding) => finding.id === 'dark/foreground/neutral/stone',
    ),
  ).toBe(true)
  expect(
    report.findings.some(
      (finding) => finding.id === 'light/slate/teal/focus-selection',
    ),
  ).toBe(true)
  expect(
    report.findings
      .filter((finding) => finding.kind === 'contrast')
      .every((finding) => Number.isFinite(finding.value)),
  ).toBe(true)

  await page.getByLabel('Show', { exact: true }).selectOption('contrast')
  await page.locator('[data-theme-result="contrast"]').first().click()
  await expect(left.locator('[data-theme-spotlight="true"]')).toHaveCount(1)
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
  const restingObservation = page
    .locator('[data-theme-result="contrast"]')
    .filter({ hasText: 'Focus ring on resting tabs' })
  for (
    let batch = 0;
    batch < 3 && (await restingObservation.count()) === 0;
    batch++
  ) {
    await page
      .getByRole('button', { name: 'Show more findings', exact: true })
      .click()
  }
  await restingObservation.first().click()
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
  expect(
    await restingFocus
      .locator('[data-tab-item] > div')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe(
    await left
      .locator('[data-theme-state="normal"] [data-tab-item] > div')
      .evaluate((node) => getComputedStyle(node).backgroundColor),
  )

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
        'neutral and stone primary text colors look very similar in dark mode',
    })
    .click()
  await expect(
    page.getByRole('button', { name: 'Compare', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(left.getByLabel('Foreground', { exact: true })).toHaveValue(
    'neutral',
  )
  await expect(right.getByLabel('Foreground', { exact: true })).toHaveValue(
    'stone',
  )
  await expect(
    left.getByRole('button', { name: 'Dark', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    right.getByRole('button', { name: 'Dark', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(right.getByLabel('Foreground', { exact: true })).toHaveValue(
    'stone',
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
  const baselinePath = new URL(
    './theme-contrast-baseline.json',
    import.meta.url,
  )
  if (process.env.TABBY_UPDATE_THEME_BASELINE === '1') {
    const baseline = Object.fromEntries(
      report.findings
        .filter((finding) => finding.kind === 'contrast')
        .map((finding) => [finding.id, Number(finding.value.toFixed(4))]),
    )
    await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`)
  }
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as Record<
    string,
    number
  >
  expect(
    contrastRegressions(report.findings, baseline),
    'New or worsening contrast failures; inspect the attached theme report',
  ).toEqual([])

  // Change the actual stylesheet, without pressing Recalculate audit.
  await page.addStyleTag({
    content: '[data-surface] { --focus-ring: #ffffff !important; }',
  })
  await expect(page.locator('[data-theme-audit-duration]')).toHaveCount(0)
  await expect(page.locator('[data-theme-audit-duration]')).toHaveCount(1, {
    timeout: 60_000,
  })
  await observations.click()
  const updatedDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click()
  const updatedPath = testInfo.outputPath('changed-theme-report.json')
  await (await updatedDownload).saveAs(updatedPath)
  const updated = JSON.parse(await readFile(updatedPath, 'utf8')) as ThemeReport
  expect(updated.combinations).toBe(report.combinations)
  expect(
    updated.findings.find(
      (finding) => finding.id === 'light/slate/teal/focus-selection',
    )!.value,
  ).not.toBe(
    report.findings.find(
      (finding) => finding.id === 'light/slate/teal/focus-selection',
    )!.value,
  )
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
