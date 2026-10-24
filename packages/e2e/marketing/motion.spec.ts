import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

const pauseClock = async (page: Page) => {
  const clockStart = Date.now()
  await page.clock.install({ time: clockStart })
  await page.clock.pauseAt(clockStart + 60_000)
}

const sampleEntrance = (target: Locator, focus = false) =>
  target.evaluate(async (element, focus) => {
    element.scrollIntoView({ behavior: 'instant', block: 'center' })
    if (focus) element.closest('a')?.focus()
    const frames = new Set<string>()
    const start = performance.now()
    await new Promise<void>((resolve) => {
      const sample = () => {
        const style = getComputedStyle(element)
        frames.add(`${style.opacity}/${style.transform}/${style.filter}`)
        if (performance.now() - start < 1500) requestAnimationFrame(sample)
        else resolve()
      }
      requestAnimationFrame(sample)
    })
    const style = getComputedStyle(element)
    return {
      frames: frames.size,
      opacity: style.opacity,
      settled: new DOMMatrix(style.transform).isIdentity,
    }
  }, focus)

test('the homepage welcomes visitors and the companion winks once after a quiet pause', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const demo = page.locator('.hero .demo-screen')
  await expect(demo).toBeAttached()
  const demoEntrance = await sampleEntrance(demo)
  expect(demoEntrance.frames).toBeGreaterThan(3)
  expect(demoEntrance).toMatchObject({
    opacity: '1',
    settled: true,
  })
  await page.setViewportSize({ width: 1280, height: 900 })

  const brand = page.getByRole('link', { name: 'Tabby home' })
  expect(
    (await sampleEntrance(brand.locator('.brand-word > span').first(), true))
      .frames,
  ).toBeGreaterThan(3)

  await page.locator('#manage .feature-art').evaluate(async (element) => {
    const frame = element.getBoundingClientRect()
    window.scrollTo({
      top: scrollY + frame.top - innerHeight + frame.height * 0.2,
      behavior: 'instant',
    })
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
  })
  await expect(page.locator('#manage .feature-product-surface')).toHaveCSS(
    'opacity',
    '0',
  )
  for (const feature of ['manage', 'find']) {
    const illustration = page.locator(`#${feature} .feature-product-surface`)
    const entrance = await sampleEntrance(illustration)
    expect(entrance.frames).toBeGreaterThan(3)
    expect(entrance).toMatchObject({ opacity: '1', settled: true })
    await page
      .locator('#browser-title')
      .evaluate((element) => element.scrollIntoView({ behavior: 'instant' }))
    await illustration.evaluate((element) =>
      element.scrollIntoView({ behavior: 'instant', block: 'center' }),
    )
    expect(
      await illustration.evaluate(
        (element) =>
          element
            .getAnimations()
            .filter((animation) => animation.playState === 'running').length,
      ),
    ).toBe(0)
  }

  const cat = page.locator('.closing-cat')
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await cat.evaluate((element) => {
    const holdWink = (event: Event) => {
      if (event.target !== element) return
      element
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.pause())
      element.removeEventListener('animationstart', holdWink)
    }
    element.addEventListener('animationstart', holdWink)
  })
  await pauseClock(page)
  await cat.evaluate((element) =>
    window.scrollTo({
      top: scrollY + element.getBoundingClientRect().bottom - innerHeight + 10,
      behavior: 'instant',
    }),
  )
  await page.clock.runFor(100)
  await page.clock.fastForward(6000)
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await page.locator('.closing-companion').evaluate((element) =>
    window.scrollTo({
      top: scrollY + element.getBoundingClientRect().bottom - innerHeight + 40,
      behavior: 'instant',
    }),
  )
  expect(
    await page.evaluate(
      () => scrollY + innerHeight < document.documentElement.scrollHeight,
    ),
  ).toBe(true)
  await page.clock.runFor(100)
  await page.clock.fastForward(1000)
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await page.evaluate(() => window.scrollBy({ top: -10, behavior: 'instant' }))
  await page.clock.runFor(100)
  await page.clock.fastForward(1100)
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await page.clock.fastForward(900)
  await expect(cat).toHaveAttribute('data-winking', 'true')
  await expect(cat).toHaveCSS('animation-duration', '1.44s')
  await cat.evaluate((element) =>
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
    }),
  )
  await expect(cat.locator('.cat-closed-eye')).toHaveCSS('opacity', '1')
  await expect(cat.locator('.cat-smirk')).toHaveCSS('opacity', '1')
  await testInfo.attach('Companion wink', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
  await cat.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.play()),
  )
  await page.clock.runFor(1500)
  await expect
    .poll(() =>
      cat.evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running').length,
      ),
    )
    .toBe(0)
  await expect(cat.locator('.cat-closed-eye')).toHaveCSS('opacity', '0')
  await expect(cat).toHaveCSS('transform', 'none')
  await cat.click()
  await expect(cat).toHaveAttribute('data-winking', 'true')
  await cat.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish()),
  )
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await cat.focus()
  await page.keyboard.press('Enter')
  await expect(cat).toHaveAttribute('data-winking', 'true')
  await cat.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.finish()),
  )
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.fastForward(15000)
  await expect(cat.locator('.cat-closed-eye')).toHaveCSS('opacity', '0')
  await expect(cat).toHaveCSS('transform', 'none')
})

test('reduced motion keeps the demo and illustrations visible and the companion still on mobile', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 812 })
  await page.goto('./')
  await expect(page.locator('.hero .demo-screen')).toBeAttached()
  for (const selector of [
    '.hero .demo-screen',
    '#manage .feature-product-surface',
    '#find .feature-product-surface',
  ]) {
    const element = page.locator(selector)
    await expect(element).toHaveCSS('opacity', '1')
    await expect(element).toHaveCSS('animation-name', 'none')
    await element.evaluate((target) =>
      target.scrollIntoView({ behavior: 'instant', block: 'center' }),
    )
    const bounds = await element.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  }
  const cat = page.locator('.closing-cat')
  await pauseClock(page)
  await page
    .locator('.closing-companion')
    .evaluate((element) =>
      element.scrollIntoView({ behavior: 'instant', block: 'center' }),
    )
  await page.clock.runFor(100)
  await page.clock.fastForward(6000)
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await expect(cat).toHaveCSS('animation-name', 'none')
  await expect(cat.locator('.cat-closed-eye')).toHaveCSS('opacity', '0')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.runFor(100)
  await page.clock.fastForward(2000)
  await expect(cat).toHaveAttribute('data-winking', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.fastForward(6000)
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await expect(cat).toHaveCSS('animation-name', 'none')
})

test('idle cues repeat in view and pause for interaction and reduced motion', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('./')
  await expect(page.locator('.hero .demo-screen')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Watch my quick tour' }),
  ).toHaveCount(0)
  const brand = page.getByRole('link', { name: 'Tabby home' })
  await page.locator('.site').evaluate((element) => {
    element.addEventListener('animationstart', (event) => {
      const target = event.target as HTMLElement
      if (
        target.matches(
          '.brand > svg, .showcase-sign-label, .playground-piece__arrival > span',
        )
      )
        target.getAnimations().forEach((animation) => animation.pause())
    })
  })
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000)
  await page.setViewportSize({ width: 1279, height: 900 })
  await page.clock.runFor(100)
  const finishAnimations = (target: Locator) =>
    target.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.finish()),
    )
  await page.clock.fastForward(4000)
  await expect(brand).toHaveAttribute('data-hopping', 'true')
  await finishAnimations(brand)
  await expect(brand).toHaveAttribute('data-hopping', 'false')
  const sign = page.locator(
    '.showcase-face[aria-hidden="false"] .showcase-sign-label',
  )
  await page.clock.fastForward(3000)
  await expect(page.locator('.hero-showcase')).toHaveAttribute(
    'data-shaking',
    'true',
  )
  await expect(brand).toHaveAttribute('data-hopping', 'false')
  await finishAnimations(sign)
  await expect(page.locator('.hero-showcase')).toHaveAttribute(
    'data-shaking',
    'false',
  )
  await page.clock.fastForward(3000)
  await expect(brand).toHaveAttribute('data-hopping', 'true')

  const board = page.locator('.seasonal-playground')
  await board.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'center' }),
  )
  await page.clock.runFor(100)
  await expect(brand).toHaveAttribute('data-hopping', 'false')
  await expect(board.getByText('Drag or tap pieces to move them')).toBeVisible()
  const layers = await board
    .getByRole('button')
    .evaluateAll((pieces) =>
      pieces.map((piece) => (piece as HTMLElement).style.zIndex),
    )
  await page.evaluate(() => {
    Math.random = () => 0.5
  })
  const bouncing = board.locator('[data-idle-motion]')
  await expect(bouncing).toHaveCount(0)
  await expect(
    board.locator('.playground-piece__arrival.is-entered'),
  ).toHaveCount(await board.getByRole('button').count())
  await finishAnimations(board)
  await page.clock.runFor(100)
  await page.clock.fastForward(850)
  await expect(bouncing).toHaveCount(0)
  await expect
    .poll(
      async () => {
        await page.clock.runFor(25)
        return bouncing.count()
      },
      { timeout: 3000, intervals: [25] },
    )
    .toBe(1)
  const durations: string[] = []
  for (const [index, motion] of [
    'bounce',
    'shake',
    'spin',
    'whirl',
  ].entries()) {
    await expect(bouncing).toHaveCount(1)
    const animated = bouncing.locator('.playground-piece__arrival > span')
    await expect(animated).toHaveCSS(
      'animation-name',
      `playground-idle-${motion}`,
    )
    durations.push(
      await animated.evaluate(
        (element) => getComputedStyle(element).animationDuration,
      ),
    )
    if (motion === 'whirl') {
      await expect(animated).toHaveCSS('animation-timing-function', 'linear')
      const rotation = await animated.evaluate((element) => {
        const frames = (
          element.getAnimations()[0]!.effect as KeyframeEffect
        ).getKeyframes()
        return frames.at(-1)!.transform
      })
      expect(rotation).toBe('rotate(1080deg)')
    }
    await finishAnimations(board)
    await expect(bouncing).toHaveCount(0)
    if (index < 3) {
      await page.evaluate((value) => {
        Math.random = () => value
      }, [0.1, 0.9, 0.5][index]!)
      await page.clock.fastForward([850, 690, 1010][index]!)
    }
  }
  expect(new Set(durations).size).toBe(4)
  expect(
    await board
      .getByRole('button')
      .evaluateAll((pieces) =>
        pieces.map((piece) => (piece as HTMLElement).style.zIndex),
      ),
  ).toEqual(layers)
  await page.clock.fastForward(2500)
  await expect(bouncing).toHaveCount(0)
  await page.clock.fastForward(700)
  await expect(bouncing).toHaveCount(1)
  await board.dispatchEvent('pointermove')
  await expect(bouncing).toHaveCount(0)
  await page.clock.runFor(999)
  await expect(bouncing).toHaveCount(0)
  await page.clock.runFor(1)
  await expect(bouncing).toHaveCount(1)
  await board.getByRole('button').first().focus()
  await page.clock.fastForward(15000)
  await expect(bouncing).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => (document.activeElement as HTMLElement).blur())
  await page.clock.fastForward(15000)
  await expect(bouncing).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.fastForward(1000)
  await expect(bouncing).toHaveCount(1)
})

test('the showcase sign starts while the demo loads, then reveals the demo and video switch', async ({
  page,
}) => {
  for (const width of [320, 900, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    let releaseDemo!: () => void
    const loading = new Promise<void>((resolve) => {
      releaseDemo = resolve
    })
    await page.route('**/*ProductDemo*', async (route) => {
      await loading
      await route.continue()
    })
    await page.goto('./', { waitUntil: 'domcontentloaded' })
    const placeholder = page.locator('.hero .product-placeholder')
    await expect(placeholder).toBeVisible()
    await expect(placeholder).toHaveText('')
    await expect(placeholder).toHaveCSS('border-top-width', '0px')
    const heroBefore = (await page.locator('.hero-copy').boundingBox())!
    const stripBefore = (await page.locator('.promise-strip').boundingBox())!
    await expect(page.locator('.hero [data-demo]')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Try it', exact: true }),
    ).toHaveCSS('opacity', '1')
    await expect(page.locator('.showcase-toggle')).toBeHidden()
    await expect(
      page.locator('.showcase-toggle .showcase-face[aria-hidden="false"]'),
    ).toBeHidden()
    releaseDemo()
    await expect(page.locator('.hero .demo-screen')).toBeVisible()
    expect((await page.locator('.hero-copy').boundingBox())!.y).toBeCloseTo(
      heroBefore.y,
      0,
    )
    expect((await page.locator('.promise-strip').boundingBox())!.y).toBeCloseTo(
      stripBefore.y,
      0,
    )
    await page.unroute('**/*ProductDemo*')
  }
  await page
    .getByRole('button', { name: 'Or watch my video', exact: true })
    .click()
  await expect(page.locator('.hero video')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Watch it', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Or try the demo', exact: true }),
  ).toHaveCSS('opacity', '1')
  await page
    .getByRole('button', { name: 'Or try the demo', exact: true })
    .click()
  await expect(page.locator('.hero .demo-screen')).toBeVisible()
  await expect(page.locator('.hero .demo-caption')).toHaveCSS('opacity', '1')
  const switcher = page.locator('.showcase-toggle')
  for (const label of ['Or watch my video', 'Or try the demo']) {
    await expect(switcher).toHaveAttribute('aria-label', label)
    await switcher.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(switcher).toBeFocused()
    await page.keyboard.press('Tab')
    await switcher.hover()
    await page.mouse.move(0, 0)
    expect(
      await switcher.evaluate((element) => ({
        opacity: getComputedStyle(element).opacity,
        facing: Math.round(
          new DOMMatrix(getComputedStyle(element).transform).m11,
        ),
      })),
    ).toEqual({ opacity: '1', facing: label === 'Or watch my video' ? 1 : -1 })
    if (label === 'Or watch my video') await switcher.click()
  }
})
