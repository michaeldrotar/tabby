import { expect, test } from '@playwright/test'

test('published release notes stay on the site from the hero and footer', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const { width, height } of [
    { width: 1280, height: 480 },
    { width: 320, height: 812 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto('./')
    await expect(page.locator('main #release-notes')).toHaveCount(0)
    await expect(page.locator('.site-header nav')).toHaveCount(0)
    const cta = page
      .locator('.hero-actions')
      .getByRole('link', { name: 'What’s New', exact: true })
    await expect(cta).toHaveAttribute('href', '/whats-new')
    await cta.click()
    await expect(page).toHaveURL(/\/whats-new$/)
    await expect(page).toHaveTitle('What’s new in Tabby — Release notes')
    await expect(
      page.getByRole('heading', { level: 1, name: 'What’s new in Tabby' }),
    ).toBeVisible()
    const versions = page.getByRole('navigation', { name: 'Release versions' })
    const chooser = versions.getByRole('button', { name: 'Choose a version' })
    if (width <= 760) {
      await expect(chooser).toHaveAttribute('aria-expanded', 'false')
      await expect(
        page.getByRole('heading', {
          level: 2,
          name: 'Named windows and a simpler Tab Manager',
        }),
      ).toBeInViewport()
      await chooser.click()
      await expect(chooser).toHaveAttribute('aria-expanded', 'true')
      expect(
        (await versions.locator('ol').boundingBox())!.y +
          (await versions.locator('ol').boundingBox())!.height,
      ).toBeLessThanOrEqual(height - 8)
    } else {
      const bounds = (await versions.boundingBox())!
      const notes = (await page.locator('.release-history').boundingBox())!
      expect(notes.width).toBeLessThanOrEqual(660)
      expect(bounds.x).toBeCloseTo(width - notes.x - notes.width, 0)
      await page.mouse.move(bounds.x + 20, bounds.y + 10)
      await page.mouse.wheel(0, 120)
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
      expect(await versions.evaluate((element) => element.scrollTop)).toBe(0)
      await page.mouse.wheel(0, 400)
      await expect(versions).toHaveAttribute('data-stuck', 'true')
      const documentScroll = await page.evaluate(() => scrollY)
      await versions.hover()
      await page.mouse.wheel(0, 100)
      await expect
        .poll(() => versions.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
      expect(await page.evaluate(() => scrollY)).toBe(documentScroll)
      expect(
        await versions.evaluate(
          (element) => element.getBoundingClientRect().bottom,
        ),
      ).toBeLessThanOrEqual(481)
      await page.mouse.wheel(0, 1000)
      await expect
        .poll(() =>
          versions.evaluate(
            (element) =>
              element.scrollHeight - element.clientHeight - element.scrollTop,
          ),
        )
        .toBeLessThan(1)
      await page.mouse.wheel(0, 100)
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(documentScroll)
      const lowerScroll = await page.evaluate(() => scrollY)
      await page.mouse.wheel(0, -1000)
      await expect
        .poll(() => versions.evaluate((element) => element.scrollTop))
        .toBe(0)
      await page.mouse.wheel(0, -100)
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeLessThan(lowerScroll)
      await page.mouse.wheel(0, 100)
      await expect
        .poll(() => versions.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
      await page.mouse.move(1000, 200)
      await page.mouse.wheel(0, -2000)
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
      expect(await versions.evaluate((element) => element.scrollTop)).toBe(0)
    }
    expect(await versions.getByRole('link').count()).toBeGreaterThanOrEqual(7)
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Named windows and a simpler Tab Manager',
      }),
    ).toBeVisible()
    await expect(
      page.getByText('Give each window a custom name, icon, and color', {
        exact: false,
      }),
    ).toBeVisible()
    expect(await page.locator('article').count()).toBeGreaterThanOrEqual(7)
    await expect(page.locator('article').last()).toHaveCSS(
      'border-bottom-width',
      '0px',
    )
    await expect(page.locator('main a[href*="github.com"]')).toHaveCount(0)
    expect(await page.locator('main').innerText()).not.toMatch(
      /\p{Extended_Pictographic}/u,
    )
    await expect(page.locator('.site-header nav')).toHaveCount(0)
    await expect(page.locator('a[href$="#top"]')).toHaveCount(0)
    const firstRelease = versions.getByRole('link', {
      name: 'v1.0.0 The Launch',
    })
    await firstRelease.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#v1\.0\.0$/)
    const launch = page.locator('[id="v1.0.0"]')
    await expect(launch).toBeInViewport()
    await expect(launch).not.toContainText('Enjoying Tabby?')
    if (width <= 760)
      await expect(chooser).toHaveAttribute('aria-expanded', 'false')
    await expect(launch.getByRole('list').first()).toBeVisible()
    await page.reload()
    await expect(launch).toBeInViewport()
    if (width <= 760) {
      await expect(chooser).toBeInViewport()
      expect((await launch.boundingBox())!.y).toBeGreaterThanOrEqual(
        (await versions.boundingBox())!.y +
          (await versions.boundingBox())!.height,
      )
      const height = await page.evaluate(
        () => document.documentElement.scrollHeight,
      )
      const scroll = await page.evaluate(() => scrollY)
      await chooser.click()
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
      ).toBe(height)
      expect(await page.evaluate(() => scrollY)).toBe(scroll)
      await page.keyboard.press('Escape')
      await expect(chooser).toHaveAttribute('aria-expanded', 'false')
      await expect(chooser).toBeFocused()
      await chooser.click()
      await versions
        .getByRole('link', {
          name: 'v1.6.0 Named windows and a simpler Tab Manager',
        })
        .click()
      await expect(page).toHaveURL(/#v1\.6\.0$/)
      await expect(chooser).toBeInViewport()
      await expect(chooser).toHaveAttribute('aria-expanded', 'false')
      expect(
        (await page.locator('[id="v1.6.0"]').boundingBox())!.y,
      ).toBeGreaterThanOrEqual(
        (await versions.boundingBox())!.y +
          (await versions.boundingBox())!.height,
      )
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.getByRole('link', { name: 'Tabby home' }).click()
    await page
      .locator('.site-footer')
      .getByRole('link', { name: 'Release notes', exact: true })
      .click()
    await expect(page).toHaveURL(/\/whats-new$/)
  }
})

test('the Chrome demo keeps product controls usable without tour controls', async ({
  page,
}) => {
  await page.goto('./')
  const demo = page.locator('[data-browser-demo]')
  await expect(demo).toBeVisible()
  await expect(
    demo.getByRole('button', {
      name: /^(Overview|Zoom to tabs|Zoom to search|Play tour|Reset)$/,
    }),
  ).toHaveCount(0)
  await demo.getByRole('button', { name: 'Search with Tabby' }).click()
  const manager = demo.locator('[data-tab-manager]')
  const settings = manager.getByRole('button', {
    name: 'Settings',
    exact: true,
  })
  await settings.click()
  await expect(demo.locator('.browser-camera')).toHaveAttribute(
    'data-zoom',
    'overview',
  )
  await expect(demo.locator('.browser-page--options')).toBeVisible()
  await demo
    .locator('.browser-page--options')
    .getByText('Dark', { exact: true })
    .click()
  await expect(demo.locator('.browser-manager-surface')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await manager.getByRole('button', { name: 'Search everything' }).click()
  const search = demo.locator('[data-omnibar]')
  await search.getByRole('combobox').fill('Design studio')
  await expect(
    search.getByRole('option', { name: /Design studio.*Window/ }),
  ).toBeVisible()
  await page.reload()
  await expect(demo.locator('.browser-camera')).toHaveAttribute(
    'data-zoom',
    'overview',
  )
  await expect(search.getByRole('combobox')).toHaveValue('design')
  await expect(demo.locator('.browser-manager-surface')).toHaveAttribute(
    'data-theme',
    'light',
  )
})

for (const { fragment, target, width } of [
  { fragment: 'features', target: 'features', width: 1280 },
  { fragment: 'c%75stomize', target: 'customize', width: 375 },
]) {
  test(`homepage opens at #${fragment} on a ${width}px screen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto(`./#${fragment}`)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('#manage [data-tab-manager]')).toBeVisible()
    await expect(page.locator('.browser-illustration')).toBeVisible()
    const expectAtTarget = async () => {
      await expect
        .poll(() =>
          page
            .locator(`#${target}`)
            .evaluate((element) =>
              Math.abs(
                element.getBoundingClientRect().top -
                  parseFloat(
                    getComputedStyle(document.documentElement).scrollPaddingTop,
                  ),
              ),
            ),
        )
        .toBeLessThan(1)
    }
    await expectAtTarget()
    await page.reload()
    await page.evaluate(() => document.fonts.ready)
    await expectAtTarget()
  })
}

test('homepage ignores unknown and malformed URL fragments', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const fragment of ['missing-section', '%', '']) {
    await page.goto(`./#${fragment}`)
    await expect(page.locator('.hero [data-demo]')).toBeVisible()
    expect(await page.evaluate(() => scrollY)).toBe(0)
  }
  expect(errors).toEqual([])
})

test('homepage separates the live demo and switches to a video without losing demo changes', async ({
  page,
}) => {
  await page.goto('./')
  await expect(page.locator('.site')).toHaveClass(/site--home/)
  const showcase = page.locator('.hero-showcase')
  const demo = showcase.locator('[data-demo]')
  expect(
    await demo.evaluate(
      (element) => element.clientWidth / element.parentElement!.clientWidth,
    ),
  ).toBeCloseTo(0.8, 2)
  await expect(
    showcase.getByRole('heading', { name: 'Try it', exact: true }),
  ).toBeVisible()
  await expect(page.locator('[data-demo]')).toHaveCount(1)
  await expect(page.locator('video')).toHaveCount(1)
  await expect(page.locator('.hero-copy')).toContainText(
    'I made Tabby to help you keep every Chrome window in view',
  )
  await expect(page.locator('.privacy-note')).toContainText(
    'Tabby doesn’t send any of your data to anyone, not even me.',
  )
  const featureSections = page.locator('#features > section')
  await expect(featureSections.getByRole('heading', { level: 2 })).toHaveText([
    'Manage tabs',
    'Find anything',
    'Make it yours',
  ])
  await expect(featureSections.getByRole('img')).toHaveCount(2)
  const seasonalBoard = featureSections.getByRole('group', {
    name: 'Tabby’s seasonal looks, neutral tones, and accent colors',
  })
  await expect(seasonalBoard).toBeVisible()
  await expect(
    seasonalBoard.getByRole('button', { name: /sticker$/ }).first(),
  ).toBeVisible()
  await expect(
    seasonalBoard.getByRole('button', { name: /accent paint swatch$/ }).first(),
  ).toBeVisible()
  await expect(
    seasonalBoard.getByRole('button', {
      name: /background and foreground tone stone$/,
    }),
  ).toHaveCount(9)
  await seasonalBoard.scrollIntoViewIfNeeded()
  await expect(
    seasonalBoard.locator('.playground-piece__arrival.is-entered').first(),
  ).toBeAttached()
  for (const selector of ['.playground-paint-swatch', '.playground-pebble']) {
    await expect
      .poll(() =>
        seasonalBoard
          .locator(selector)
          .first()
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBeGreaterThan(40)
  }
  await expect(featureSections.locator('img[src$=".jpg"]')).toHaveCount(0)
  await expect(featureSections.locator('.feature-copy a')).toHaveCount(0)
  await expect(
    page.getByRole('navigation', { name: 'Design previews' }),
  ).toHaveCount(0)
  await expect(page.locator('.site-footer a[href="#top"]')).toHaveCount(0)
  await expect(page.locator('#find .feature-copy')).toContainText(
    'A page shouldn’t be hard to find just because it’s in another window.',
  )
  await expect(page.locator('#manage [data-tab-manager]')).toContainText(
    'Design system',
  )
  await expect(
    page.locator('#manage [data-tab-option][aria-selected="true"]'),
  ).toHaveCount(3)
  await expect(page.locator('#find [data-omnibar] input')).toHaveValue('design')
  await expect(page.locator('.site-footer')).toContainText(
    'Made for tab-aholics like me.',
  )
  await expect(page.locator('.privacy-section')).toContainText(
    'If you choose Search Google, that query goes to Google.',
  )
  const browser = page.getByRole('group', {
    name: 'Explore Tabby in Chrome',
  })
  await expect(browser).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect
    .poll(() =>
      browser.evaluate((element) => {
        const frame = element.getBoundingClientRect()
        const heading = document
          .querySelector('#browser-title')!
          .getBoundingClientRect()
        return Math.abs(
          (frame.left + frame.right) / 2 - (heading.left + heading.right) / 2,
        )
      }),
    )
    .toBeLessThan(1)
  await expect
    .poll(() =>
      browser.evaluate((element) => {
        const frame = element.getBoundingClientRect()
        const sidebar = element
          .querySelector('.browser-side-panel')!
          .getBoundingClientRect()
        const webpage = element
          .querySelector('.browser-page')!
          .getBoundingClientRect()
        const popup = element
          .querySelector('.browser-search-popup')!
          .getBoundingClientRect()
        return (
          Math.abs(frame.width - 900) < 1 &&
          Math.abs(frame.height - 600) < 1 &&
          sidebar.right <= webpage.left + 1 &&
          sidebar.right < popup.left
        )
      }),
    )
    .toBe(true)
  await expect
    .poll(() =>
      browser.evaluate((element) => {
        const icon = element
          .querySelector('.browser-extension-icon')!
          .getBoundingClientRect()
        const popup = element
          .querySelector('.browser-search-popup')!
          .getBoundingClientRect()
        const frame = element.getBoundingClientRect()
        const pointer = element
          .querySelector('.browser-search-pointer')!
          .getBoundingClientRect()
        return (
          popup.top >= icon.bottom &&
          popup.left >= frame.left &&
          popup.right <= frame.right &&
          Math.abs(
            (pointer.left + pointer.right) / 2 - (icon.left + icon.right) / 2,
          ) < 1
        )
      }),
    )
    .toBe(true)
  await showcase.scrollIntoViewIfNeeded()
  await expect(page.locator('.hero .tab-sticker')).toHaveCount(0)
  await demo
    .getByRole('group', { name: 'Demo experience' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
  await demo.getByRole('button', { name: 'Tabs', exact: true }).click()
  await demo.getByRole('switch', { name: 'Dark mode', exact: true }).click()
  await expect(
    demo.getByRole('button', { name: 'Play tour', exact: true }),
  ).toHaveCount(0)
  await demo.getByRole('button', { name: 'Search', exact: true }).click()
  await demo.getByRole('combobox').fill('Copenhagen')
  const switchToVideo = showcase.getByRole('button', {
    name: 'Or watch my video',
    exact: true,
  })
  const switchWidth = (await switchToVideo.boundingBox())!.width
  const [rotationFrames] = await Promise.all([
    showcase.locator('#hero-showcase-content').evaluate(async (element) => {
      const frames: string[] = []
      const buttonFrames: string[] = []
      const button = element.parentElement!.querySelector('.showcase-toggle')!
      const start = performance.now()
      await new Promise<void>((resolve) => {
        const sample = () => {
          frames.push(getComputedStyle(element).transform)
          buttonFrames.push(getComputedStyle(button).transform)
          if (performance.now() - start < 1000) requestAnimationFrame(sample)
          else resolve()
        }
        requestAnimationFrame(sample)
      })
      return {
        content: new Set(frames).size,
        button: new Set(buttonFrames).size,
      }
    }),
    switchToVideo.click(),
  ])
  expect(rotationFrames.content).toBeGreaterThan(2)
  expect(rotationFrames.button).toBeGreaterThan(2)
  await expect(
    showcase.getByRole('button', { name: 'Or try the demo', exact: true }),
  ).toBeFocused()
  await expect(
    showcase.getByRole('heading', { name: 'Watch it', exact: true }),
  ).toBeVisible()
  await expect(demo).toBeHidden()
  const video = showcase.locator('video')
  await expect(video).toBeVisible()
  expect(
    (await showcase.locator('.showcase-toggle').boundingBox())!.width,
  ).toBeLessThan(switchWidth)
  await expect(video).toHaveJSProperty('muted', true)
  await expect(video).toHaveJSProperty('controls', true)
  await expect(video.locator('track')).toHaveAttribute('kind', 'captions')
  await video.evaluate(async (element: HTMLVideoElement) => {
    await element.play()
  })
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0)
  await expect
    .poll(() =>
      video.evaluate((element) => {
        const media = element as HTMLVideoElement & {
          captureStream(): MediaStream
        }
        return media.captureStream().getAudioTracks().length
      }),
    )
    .toBe(1)
  await video.evaluate((element: HTMLVideoElement) => {
    element.muted = false
  })
  await expect(video).toHaveJSProperty('muted', false)
  await showcase
    .getByRole('button', { name: 'Or try the demo', exact: true })
    .click()
  await expect(video).toBeHidden()
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true)
  await expect(demo.getByRole('combobox')).toHaveValue('Copenhagen')
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await browser.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      browser.evaluate((element) => {
        const { left, right } = element.getBoundingClientRect()
        return (
          left >= 0 &&
          right <= innerWidth &&
          Math.abs(
            element.getBoundingClientRect().width /
              element.getBoundingClientRect().height -
              1.5,
          ) < 0.01
        )
      }),
    )
    .toBe(true)
  await expect
    .poll(() =>
      browser.locator('.browser-search-popup').evaluate((element) => {
        const { left, right } = element.getBoundingClientRect()
        return left >= 0 && right <= innerWidth
      }),
    )
    .toBe(true)
  for (const width of [375, 761, 320]) {
    await page.setViewportSize({ width, height: 812 })
    await expect
      .poll(() =>
        featureSections.evaluateAll((sections) =>
          sections.every((section) => {
            const frame = section
              .querySelector('.feature-art')!
              .getBoundingClientRect()
            const rows = section.querySelectorAll('.feature-product-surface')
            return [...rows].every((row) => {
              const bounds = row.getBoundingClientRect()
              return (
                bounds.left >= frame.left &&
                bounds.right <= frame.right &&
                bounds.top >= frame.top &&
                bounds.bottom <= frame.bottom
              )
            })
          }),
        ),
      )
      .toBe(true)
  }
  await page.setViewportSize({ width: 375, height: 812 })
  await showcase.scrollIntoViewIfNeeded()
  await expect(
    demo.getByRole('button', { name: 'Tabs', exact: true }),
  ).toBeVisible()
  const app = demo.locator('.demo-screen')
  await expect
    .poll(() =>
      app.evaluate((element) => {
        const { left, right } = element.getBoundingClientRect()
        return left >= 0 && right <= innerWidth
      }),
    )
    .toBe(true)
  await showcase
    .getByRole('button', { name: 'Or watch my video', exact: true })
    .click()
  await expect(
    showcase.getByRole('heading', { name: 'Watch it', exact: true }),
  ).toBeVisible()
  await expect(showcase.locator('video')).toBeVisible()
  await expect(video).toHaveJSProperty('muted', false)
  await page.setViewportSize({ width: 1280, height: 900 })
  await showcase
    .getByRole('button', { name: 'Or try the demo', exact: true })
    .click()
  await expect(
    showcase.getByRole('heading', { name: 'Try it', exact: true }),
  ).toBeVisible()
  await showcase
    .getByRole('button', { name: 'Or watch my video', exact: true })
    .click()
  await expect(
    showcase.getByRole('heading', { name: 'Watch it', exact: true }),
  ).toBeVisible()
})

test('sample tabs support batch work, local search, appearance, and reset', async ({
  page,
}) => {
  await page.goto('./')
  const demo = page.locator('.hero [data-demo]')
  await demo.scrollIntoViewIfNeeded()
  const firstTab = demo.locator('[data-tab-item]').first()
  await expect(firstTab.getByRole('option')).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(
    demo.locator('[data-tab-item][data-selected="true"]'),
  ).toHaveCount(1)
  const selectedColor = () =>
    firstTab
      .locator(':scope > div')
      .evaluate((element) => getComputedStyle(element).backgroundColor)
  const initialColor = await selectedColor()
  await demo.getByRole('button', { name: 'violet accent', exact: true }).click()
  await expect.poll(selectedColor).not.toBe(initialColor)
  await expect(firstTab.getByRole('option')).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const themeToggle = demo.getByRole('switch', {
    name: 'Dark mode',
    exact: true,
  })
  await expect(themeToggle).not.toBeChecked()
  await themeToggle.focus()
  await page.keyboard.press('Space')
  await expect(themeToggle).toBeChecked()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page.keyboard.press('Enter')
  await expect(themeToggle).not.toBeChecked()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )

  await demo
    .getByRole('option', { name: 'Tab: Team inbox', exact: true })
    .click()
  await demo
    .getByRole('option', { name: 'Tab: Launch checklist', exact: true })
    .click({ modifiers: ['ControlOrMeta'] })
  await expect(
    demo.getByRole('button', { name: 'More actions', exact: true }),
  ).toBeVisible()
  await demo.getByRole('button', { name: 'More actions', exact: true }).click()
  await demo.getByRole('menuitem', { name: 'Pin 2 tabs', exact: true }).click()
  await expect(
    demo.getByRole('option', { name: 'Tab: Team inbox (pinned)', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('#manage [role="option"][aria-label="Tab: Team inbox"]'),
  ).toBeVisible()
  await demo.getByRole('button', { name: 'Search', exact: true }).click()
  const input = demo.getByRole('combobox')
  await input.fill('design')
  await expect(
    demo.getByText('Design references', { exact: true }),
  ).toBeVisible()
  await expect(
    demo.getByText('Design review notes', { exact: true }),
  ).toBeVisible()
  await input.fill('nothing matches this sample')
  await expect(
    demo.getByText('Design references', { exact: true }),
  ).toHaveCount(0)
  await demo.getByRole('switch', { name: 'Dark mode', exact: true }).click()
  await demo.getByRole('button', { name: 'violet accent', exact: true }).click()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'violet',
  )
  await expect(page.locator('#manage [data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await demo.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(firstTab.getByRole('option')).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(themeToggle).not.toBeChecked()

  await expect(
    demo.getByRole('option', { name: 'Tab: Team inbox', exact: true }),
  ).toBeVisible()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await expect(demo.getByLabel('Tour progress')).toHaveCount(0)
  await demo
    .getByRole('group', { name: 'Demo experience' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
  await demo
    .getByRole('button', { name: 'Open appearance settings', exact: true })
    .click()
  await expect(
    demo.getByText(
      'Choose your side panel position in Chrome after installing Tabby.',
      { exact: true },
    ),
  ).toBeVisible()
  const video = page.locator('video')
  await page
    .locator('.hero-showcase')
    .getByRole('button', { name: 'Or watch my video', exact: true })
    .click()
  await video.scrollIntoViewIfNeeded()
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true
    await element.play()
  })
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.readyState),
    )
    .toBeGreaterThanOrEqual(2)
  await expect(page.locator('.site-header .install')).toHaveAttribute(
    'href',
    'https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob',
  )
})

test('the homepage stays readable on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  await expect(
    page.getByRole('heading', {
      name: 'Big tab energy. Little tab chaos.',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.locator('.intro-note')).toHaveText(
    'A little order for all your tabs',
  )
  await expect(page.locator('.intro-note span')).toHaveCount(0)
  await expect(page.locator('.site-header .install')).toBeVisible()
  await page.locator('.closing').scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true)
  await expect
    .poll(() =>
      page
        .locator('img')
        .evaluateAll((images: HTMLImageElement[]) =>
          images.every((image) => !image.complete || image.naturalWidth > 0),
        ),
    )
    .toBe(true)
})
