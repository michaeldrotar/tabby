import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('compares designs with distinct surfaces while keeping tab state and tools usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.goto('/tab-manager/index.html')
  const manager = page.locator('[data-tab-manager]')
  await expect(manager).toHaveAttribute('data-manager-design', 'refined')
  const picker = page.getByRole('button', { name: 'Try Tab Manager designs:' })
  const activeTab = page.getByRole('option', {
    name: 'Tab: Project notes (pinned)',
  })
  await expect(activeTab).toHaveAttribute('aria-selected', 'true')
  const header = page.locator('[data-keyboard-section="header"]')
  const backgrounds = new Set<string>()
  let layeredTools: string | undefined
  const flyout = page.getByRole('menu', { name: 'Tab Manager designs' })
  await picker.click()
  for (const name of [
    'Layered',
    'Accent frame',
    'Ledger',
    'Soft canvas',
    'Islands',
    'Refined',
  ]) {
    const option = page.getByRole('menuitemradio', {
      name,
      exact: true,
    })
    await option.click()
    await expect(flyout).toBeVisible()
    await expect(option).toHaveAttribute('aria-checked', 'true')
    await expect(activeTab).toHaveAttribute('aria-selected', 'true')
    const colors = await header.evaluate((element) => ({
      header: getComputedStyle(element).backgroundColor,
      canvas: getComputedStyle(element.parentElement!).backgroundColor,
    }))
    const toolsColor = await page
      .locator('[data-keyboard-section="tools"]')
      .evaluate((element) => getComputedStyle(element).backgroundColor)
    if (name === 'Layered') layeredTools = toolsColor
    if (name === 'Refined') {
      expect(colors.header).toBe(layeredTools)
      await expect(page.locator('[data-group-item]').first()).toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
      )
    }
    expect(colors.header).not.toBe(colors.canvas)
    backgrounds.add(colors.header)
    await expect(page.locator('[data-group-rail]').first()).toBeVisible()
    for (const label of [
      'Search everything',
      'Settings',
      'Try Tab Manager designs:',
      'More actions',
    ]) {
      await expect(
        page.getByRole('button', {
          name: label,
          exact: label !== 'Try Tab Manager designs:',
        }),
      ).toBeInViewport()
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320)
  }
  expect(backgrounds.size).toBeGreaterThanOrEqual(3)
  const tools = page.locator('[data-keyboard-section="tools"]')
  expect(
    await header.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe(
    await tools.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  )
  expect(
    await page
      .locator('[data-tab-item][data-active="true"] > div')
      .evaluate((element) => getComputedStyle(element).boxShadow),
  ).not.toContain('inset')

  const dialog = page.getByRole('dialog', { name: 'Tab Manager designs' })
  const background = dialog.getByRole('radiogroup', { name: 'Background' })
  const foreground = dialog.getByRole('radiogroup', { name: 'Foreground' })
  await page
    .getByRole('menuitemradio', { name: 'Refined', exact: true })
    .focus()
  await page.keyboard.press('Tab')
  const lightMode = dialog.getByRole('button', { name: 'Light', exact: true })
  const darkMode = dialog.getByRole('button', { name: 'Dark', exact: true })
  const surface = page.locator('[data-surface]')
  await expect(lightMode).toBeFocused()
  await expect(dialog.getByRole('button', { name: 'System' })).toHaveCount(0)
  await lightMode.click()
  await expect(surface).toHaveAttribute('data-theme', 'light')
  await expect(lightMode).toHaveAttribute('aria-pressed', 'true')
  await expect(foreground.getByRole('radio', { name: 'Neutral' })).toBeChecked()
  await foreground.getByRole('radio', { name: 'Gray' }).click()
  await darkMode.click()
  await expect(surface).toHaveAttribute('data-theme', 'dark')
  await expect(foreground.getByRole('radio', { name: 'Stone' })).toBeChecked()
  await lightMode.click()
  await expect(surface).toHaveAttribute('data-theme', 'light')
  await expect(foreground.getByRole('radio', { name: 'Gray' })).toBeChecked()
  await darkMode.click()
  await expect(surface).toHaveAttribute('data-theme', 'dark')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(background.getByRole('radio', { name: 'Neutral' })).toBeFocused()
  await background.getByRole('radio', { name: 'Slate' }).click()
  await page.keyboard.press('Tab')
  await expect(foreground.getByRole('radio', { name: 'Stone' })).toBeFocused()
  const tabTitle = page.locator('[data-tab-item] .text-foreground').first()
  const beforeForeground = {
    text: await tabTitle.evaluate((element) => getComputedStyle(element).color),
    header: await header.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  }
  await page.keyboard.press('ArrowLeft')
  await expect(foreground.getByRole('radio', { name: 'Neutral' })).toBeChecked()
  await foreground.getByRole('radio', { name: 'Slate' }).click()
  await expect
    .poll(() => tabTitle.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(beforeForeground.text)
  await expect
    .poll(() =>
      header.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe(beforeForeground.header)
  await dialog
    .getByRole('radiogroup', { name: 'Accent', exact: true })
    .getByRole('radio', { name: 'Teal' })
    .click()
  const strength = dialog.getByRole('slider', { name: 'Accent strength' })
  await strength.focus()
  await page.keyboard.press('ArrowRight')
  await expect(surface).toHaveAttribute('data-theme-background', 'slate')
  await expect(surface).toHaveAttribute('data-theme-foreground', 'slate')
  await expect(surface).toHaveAttribute('data-theme-accent', 'teal')
  await expect(strength).toHaveValue('15')
  await expect(dialog).toBeVisible()
  const columnBounds = await background.boundingBox()
  const choiceBounds = await page
    .getByRole('menuitemradio', { name: 'Layered', exact: true })
    .boundingBox()
  expect(columnBounds!.x).toBeGreaterThan(choiceBounds!.x + choiceBounds!.width)
  for (const group of [background, foreground]) {
    const rows = await group
      .getByRole('radio')
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().y),
      )
    expect(new Set(rows).size).toBe(1)
  }
  const lightBounds = await lightMode.boundingBox()
  const darkBounds = await darkMode.boundingBox()
  expect(lightBounds!.y).toBe(darkBounds!.y)
  await expect(dialog.getByRole('radio', { name: 'Rose' })).toBeInViewport()

  await page.getByRole('menuitemradio', { name: 'Crisp', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(manager).toHaveAttribute('data-manager-contrast', 'crisp')
  await expect(flyout).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(flyout).toHaveCount(0)
  await expect(picker).toBeFocused()

  await page.getByRole('option', { name: 'Tab: Release checklist' }).click()
  await expect(page.locator('[data-group-rail]').first()).toBeVisible()
  await expect(page.locator('[data-group-active-rail]')).toBeHidden()

  await page.setViewportSize({ width: 480, height: 640 })
  await picker.click()
  await page.getByRole('button', { name: 'Switch window: Tabby' }).click()
  await expect(flyout).toHaveCount(0)
  await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
  const windowPickerBackgrounds = []
  for (const name of ['Soft canvas', 'Refined']) {
    await picker.click()
    await page.getByRole('menuitemradio', { name, exact: true }).click()
    await picker.click()
    windowPickerBackgrounds.push(
      await page
        .locator('[data-window-picker]')
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    )
  }
  expect(windowPickerBackgrounds[1]).toBe(windowPickerBackgrounds[0])
  await page.locator('[data-window-choice="1"]').click()

  await page.getByRole('button', { name: 'Collapse group Tabby' }).click()
  await expect(
    page.getByRole('option', { name: 'Tab: Release checklist' }),
  ).toHaveCount(0)
  await picker.click()
  await page
    .getByRole('menuitemradio', { name: 'Current design', exact: true })
    .click()
  await expect(manager).not.toHaveAttribute('data-manager-design')
  await expect(page.locator('[data-group-rail]').first()).toBeVisible()
  await expect(flyout).toBeVisible()
  await picker.click()
  await expect(flyout).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Expand group Tabby' }),
  ).toBeVisible()

  await page.reload()
  await expect(manager).toHaveAttribute('data-manager-design', 'refined')
  await expect(manager).toHaveAttribute('data-manager-contrast', 'balanced')
})

test('keeps tonal palettes distinct and text readable in light and dark modes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/tab-manager/index.html')
  await expect(page.locator('[data-manager-design]')).toBeVisible()
  await page.addStyleTag({
    content:
      '[data-surface] * { transition: none !important; animation: none !important; }',
  })
  const result = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>('[data-surface]')!
    const manager = document.querySelector<HTMLElement>(
      '[data-manager-design]',
    )!
    const header = document.querySelector<HTMLElement>('header')!
    const canvas = document.querySelector<HTMLElement>('[data-selection-mode]')!
    const title = document.querySelector<HTMLElement>(
      '[data-tab-item] .text-foreground',
    )!
    const metadata = document.querySelector<HTMLElement>(
      '[data-tab-item] .text-muted',
    )!
    const context = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true })!
    const rgb = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return Array.from(context.getImageData(0, 0, 1, 1).data).map(
        (channel) => channel / 255,
      )
    }
    const luminance = (color: number[]) =>
      color
        .slice(0, 3)
        .reduce(
          (sum, channel, index) =>
            sum +
            (channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4) *
              [0.2126, 0.7152, 0.0722][index]!,
          0,
        )
    const behind = (element: HTMLElement) => {
      const layers: number[][] = []
      for (
        let node: HTMLElement | null = element;
        node;
        node = node.parentElement
      )
        layers.unshift(rgb(getComputedStyle(node).backgroundColor))
      return layers.reduce(
        (under, over) =>
          over
            .slice(0, 3)
            .map(
              (channel, index) =>
                channel * over[3]! + under[index]! * (1 - over[3]!),
            ),
        [1, 1, 1],
      )
    }
    const distance = (a: number[], b: number[]) =>
      Math.hypot(
        ...a.slice(0, 3).map((channel, index) => (channel - b[index]!) * 255),
      )
    const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']
    const accents = [
      'red',
      'orange',
      'amber',
      'yellow',
      'lime',
      'green',
      'emerald',
      'teal',
      'cyan',
      'sky',
      'blue',
      'indigo',
      'violet',
      'purple',
      'fuchsia',
      'pink',
      'rose',
    ]
    const texts = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-tab-item]:not([data-discarded]) :is(.text-foreground,.text-muted), header :is(.text-foreground,.text-muted)',
      ),
    )
    const samples: {
      mode: string
      background: string
      foreground: string
      canvas: number[]
      title: number[]
      metadata: number[]
      header: number[]
    }[] = []
    const accentSamples: {
      mode: string
      accent: string
      strength: number
      canvas: number[]
      header: number[]
      title: number[]
      selection: number[]
    }[] = []
    let minimum = { ratio: Infinity, combination: '' }
    const check = (combination: string) => {
      for (const element of texts) {
        const ink = luminance(rgb(getComputedStyle(element).color))
        const paper = luminance(behind(element))
        const ratio =
          (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05)
        if (ratio < minimum.ratio)
          minimum = {
            ratio,
            combination: `${combination}: ${element.textContent}`,
          }
      }
    }
    for (const mode of ['light', 'dark']) {
      surface.dataset.theme = mode
      for (const background of neutrals)
        for (const foreground of neutrals) {
          surface.dataset.themeBackground = background
          surface.dataset.themeForeground = foreground
          surface.dataset.themeAccent = 'rose'
          surface.style.setProperty('--accent-strength', '10')
          manager.dataset.managerContrast = 'balanced'
          check(`${mode}/${background}/${foreground}/rose/10/balanced`)
          samples.push({
            mode,
            background,
            foreground,
            canvas: behind(canvas),
            title: rgb(getComputedStyle(title).color),
            metadata: rgb(getComputedStyle(metadata).color),
            header: behind(header),
          })
        }
      surface.dataset.themeBackground = 'neutral'
      surface.dataset.themeForeground = 'neutral'
      for (const [accent, strength] of [
        ['rose', 10],
        ['blue', 10],
        ['blue', 50],
      ] as const) {
        surface.dataset.themeAccent = accent
        surface.style.setProperty('--accent-strength', String(strength))
        accentSamples.push({
          mode,
          accent,
          strength,
          canvas: behind(canvas),
          header: behind(header),
          title: rgb(getComputedStyle(title).color),
          selection: behind(title),
        })
      }
      manager.dataset.managerDesign = 'layered'
      for (const background of ['slate', 'stone'])
        for (const accent of accents)
          for (const contrast of ['soft', 'crisp']) {
            surface.dataset.themeBackground = background
            surface.dataset.themeForeground =
              background === 'slate' ? 'stone' : 'slate'
            surface.dataset.themeAccent = accent
            surface.style.setProperty('--accent-strength', '50')
            manager.dataset.managerContrast = contrast
            check(
              `${mode}/${background}/${surface.dataset.themeForeground}/${accent}/50/${contrast}`,
            )
          }
      for (const design of [
        'layered',
        'accent-frame',
        'ledger',
        'soft-canvas',
        'islands',
      ])
        for (const accent of ['lime', 'violet']) {
          manager.dataset.managerDesign = design
          surface.dataset.themeAccent = accent
          check(`${mode}/${design}/${accent}/50/crisp`)
        }
      manager.dataset.managerDesign = 'refined'
    }
    const changes = ['light', 'dark'].map((mode) => {
      const sample = (background: string, foreground: string) =>
        samples.find(
          (s) =>
            s.mode === mode &&
            s.background === background &&
            s.foreground === foreground,
        )!
      const cool = sample('slate', 'neutral')
      const warm = sample('stone', 'neutral')
      const coolInk = sample('neutral', 'slate')
      const warmInk = sample('neutral', 'stone')
      const rose = accentSamples.find(
        (s) => s.mode === mode && s.accent === 'rose',
      )!
      const blue = accentSamples.find(
        (s) => s.mode === mode && s.accent === 'blue' && s.strength === 10,
      )!
      const strongBlue = accentSamples.find(
        (s) => s.mode === mode && s.strength === 50,
      )!
      return {
        mode,
        background: distance(cool.canvas, warm.canvas),
        title: distance(coolInk.title, warmInk.title),
        metadata: distance(coolInk.metadata, warmInk.metadata),
        foregroundSurfaceChange: Math.max(
          distance(coolInk.header, warmInk.header),
          distance(coolInk.canvas, warmInk.canvas),
        ),
        hierarchy: distance(coolInk.title, coolInk.metadata),
        raised: luminance(coolInk.header) > luminance(coolInk.canvas),
        accentCanvas: distance(rose.canvas, blue.canvas),
        accentHeader: distance(rose.header, blue.header),
        accentStrength: distance(blue.header, strongBlue.header),
        accentTextChange: distance(rose.title, blue.title),
        accentSelection: distance(rose.selection, blue.selection),
      }
    })
    return { minimum, changes }
  })
  expect(
    result.minimum.ratio,
    result.minimum.combination,
  ).toBeGreaterThanOrEqual(4.5)
  for (const change of result.changes) {
    expect(change.background, `${change.mode} background`).toBeGreaterThan(12)
    expect(change.title, `${change.mode} primary text`).toBeGreaterThan(20)
    expect(change.metadata, `${change.mode} secondary text`).toBeGreaterThan(20)
    expect(
      change.foregroundSurfaceChange,
      `${change.mode} foreground leaves surfaces unchanged`,
    ).toBe(0)
    expect(
      change.hierarchy,
      `${change.mode} title / URL hierarchy`,
    ).toBeGreaterThan(20)
    expect(change.raised, `${change.mode} lighter window bars`).toBe(true)
    expect(
      change.accentCanvas,
      `${change.mode} accent leaves canvas unchanged`,
    ).toBe(0)
    expect(
      change.accentHeader,
      `${change.mode} accent leaves window bars unchanged`,
    ).toBe(0)
    expect(
      change.accentStrength,
      `${change.mode} accent strength leaves window bars unchanged`,
    ).toBe(0)
    expect(
      change.accentTextChange,
      `${change.mode} accent leaves primary text unchanged`,
    ).toBe(0)
    expect(
      change.accentSelection,
      `${change.mode} accent on selection`,
    ).toBeGreaterThan(3)
  }
})

test('uses Current tab, group, hover and focus styling in Refined', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/tab-manager/index.html')
  await page.addStyleTag({
    content:
      '[data-surface] * { transition: none !important; animation: none !important; }',
  })
  await page.locator('[data-surface]').evaluate((element) => {
    for (const [name, value] of Object.entries({
      background: '#181818',
      foreground: '#eeeeee',
      muted: '#aaaaaa',
      card: '#262626',
      border: '#444444',
      accent: '#93c5fd',
    }))
      (element as HTMLElement).style.setProperty(`--${name}`, value)
  })
  const picker = page.getByRole('button', { name: 'Try Tab Manager designs:' })
  const hoverTab = page.getByRole('option', { name: 'Tab: MDN Web Docs' })
  const readStyles = () =>
    page.evaluate(() => {
      const read = (selector: string, pseudo?: string) => {
        const element = document.querySelector(selector)!
        const style = getComputedStyle(element, pseudo)
        return Object.fromEntries(
          [
            'background-color',
            'border-color',
            'border-width',
            'border-radius',
            'padding',
            'min-height',
            'box-shadow',
            'filter',
            'outline',
          ].map((key) => [key, style.getPropertyValue(key)]),
        )
      }
      return {
        selected: read('[data-tab-item][data-selected="true"] > div'),
        hover: read('[data-tab-item][data-tab-id="5"] > div'),
        focus: read('[data-tab-item][data-tab-id="5"]', '::after'),
        group: read('[data-group-item]'),
        pane: read('[data-tab-pane]'),
      }
    })
  const snapshots = []
  for (const name of ['Current design', 'Refined']) {
    await picker.click()
    await page.getByRole('menuitemradio', { name, exact: true }).click()
    await picker.click()
    await hoverTab.hover()
    await page.keyboard.press('Tab')
    await hoverTab.focus()
    snapshots.push(await readStyles())
  }
  expect(snapshots[1]).toEqual(snapshots[0])
})
