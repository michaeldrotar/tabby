import { expect, test } from '@playwright/test'

test('a clicked wink finishes through further input and dismisses the automatic wink', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('./')
  const cat = page.getByRole('button', { name: 'Make Tabby wink' })
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000)
  await cat.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'center' }),
  )
  await page.clock.runFor(100)
  await cat.evaluate((element) => {
    element.addEventListener('animationstart', () =>
      element
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.pause()),
    )
  })
  await cat.click()
  await page.clock.runFor(400)
  const bounds = (await cat.boundingBox())!
  await page.mouse.move(bounds.x + 10, bounds.y + 10)
  await page.mouse.click(bounds.x + 20, bounds.y + 20)
  await page.keyboard.press('Shift')
  await expect(cat).toHaveAttribute('data-winking', 'true')
  await page.clock.runFor(1100)
  await expect(cat).toHaveAttribute('data-winking', 'false')
  await page.clock.runFor(700)
  await expect(cat).toHaveAttribute('data-winking', 'false')

  const install = page.locator('.closing .install')
  await install.evaluate((element) => {
    element.addEventListener('animationstart', () =>
      element.getAnimations().forEach((animation) => animation.pause()),
    )
  })
  await page.clock.fastForward(4000)
  await expect(install).toHaveAttribute('data-shaking', 'true')
  await install.evaluate((element) =>
    element.getAnimations().forEach((animation) => animation.finish()),
  )
  await expect(install).toHaveAttribute('data-shaking', 'false')
  await page.clock.fastForward(6670)
  await expect(install).toHaveAttribute('data-shaking', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.fastForward(6670)
  await expect(install).toHaveAttribute('data-shaking', 'false')
  await expect(cat).toHaveAttribute('data-winking', 'false')
})

test('scrolling gives the vector cat a squash and landing and bounds alternating paw steps', async ({
  page,
}) => {
  await page.goto('./')
  const cat = page.locator('.banner-cat')
  await expect(cat.locator('svg image')).toHaveCount(0)
  await cat.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'center' }),
  )
  const catPose = async (delta: number) =>
    cat.evaluate(async (element, delta) => {
      window.scrollBy({ top: delta, behavior: 'instant' })
      for (let index = 0; index < 5; index += 1)
        await new Promise(requestAnimationFrame)
      const pose = new DOMMatrix(
        getComputedStyle(element.querySelector('svg')!).transform,
      )
      const result = {
        smallest: 1,
        settled: false,
        height: pose.m22,
        width: pose.m11,
        y: pose.m42,
        surprise: Number(
          getComputedStyle(element.querySelector('.banner-cat-surprise')!)
            .opacity,
        ),
      }
      if (delta < 0) {
        const start = performance.now()
        while (performance.now() - start < 1100) {
          await new Promise(requestAnimationFrame)
          result.smallest = Math.min(
            result.smallest,
            new DOMMatrix(
              getComputedStyle(element.querySelector('svg')!).transform,
            ).m22,
          )
        }
        result.settled = new DOMMatrix(
          getComputedStyle(element.querySelector('svg')!).transform,
        ).isIdentity
      }
      return result
    }, delta)
  const down = await catPose(65)
  expect(down.height).toBeLessThan(0.8)
  expect(down.width).toBeGreaterThan(1.1)
  const up = await catPose(-65)
  expect(up.y).toBeLessThan(-20)
  expect(up.surprise).toBeGreaterThan(0.8)
  expect(up.smallest).toBeLessThan(0.9)
  expect(up.settled).toBe(true)
  const paws = page.locator('.walking-paws')
  await paws.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'center' }),
  )
  await expect
    .poll(() =>
      paws
        .locator('.walking-paw')
        .evaluateAll((pieces) =>
          pieces.every(
            (piece) =>
              new DOMMatrix(getComputedStyle(piece).transform).isIdentity,
          ),
        ),
    )
    .toBe(true)
  for (const direction of [1, -1]) {
    const walk = await paws.evaluate(async (element, direction) => {
      window.scrollBy({ top: direction * 25, behavior: 'instant' })
      for (let index = 0; index < 2; index += 1)
        await new Promise(requestAnimationFrame)
      const feet = [...element.querySelectorAll<SVGGElement>('.walking-paw')]
      const plantedBefore = feet[1]!.getBoundingClientRect().top
      window.scrollBy({ top: direction * 10, behavior: 'instant' })
      for (let index = 0; index < 2; index += 1)
        await new Promise(requestAnimationFrame)
      const drift = Math.abs(
        feet[1]!.getBoundingClientRect().top - plantedBefore,
      )
      window.scrollBy({ top: direction * 150, behavior: 'instant' })
      const sequence: number[] = []
      let withinLines = true
      let simultaneous = false
      let firstLanded = true
      const start = performance.now()
      while (performance.now() - start < 800) {
        const section = element.parentElement!.getBoundingClientRect()
        withinLines &&= feet.every((foot) => {
          const bounds = foot.getBoundingClientRect()
          return (
            bounds.top >= section.top + 0.5 &&
            bounds.bottom <= section.bottom - 0.5
          )
        })
        const stepping = feet.flatMap((foot, index) =>
          foot.dataset.stepping === 'true' ? [index] : [],
        )
        simultaneous ||= stepping.length > 1
        const active = stepping[0]
        if (active !== undefined && sequence.at(-1) !== active) {
          sequence.push(active)
          if (active === 1)
            firstLanded &&= new DOMMatrix(getComputedStyle(feet[0]!).transform)
              .isIdentity
        }
        await new Promise(requestAnimationFrame)
      }
      return {
        drift,
        withinLines,
        sequence,
        simultaneous,
        firstLanded,
        settled: feet.every(
          (foot) => new DOMMatrix(getComputedStyle(foot).transform).isIdentity,
        ),
      }
    }, direction)
    expect(walk.drift).toBeLessThan(1)
    expect(walk.withinLines).toBe(true)
    expect(walk.sequence).toEqual([0, 1])
    expect(walk.simultaneous).toBe(false)
    expect(walk.firstLanded).toBe(true)
    expect(walk.settled).toBe(true)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollBy({ top: 35, behavior: 'instant' }))
  await expect(paws.locator('.walking-paw').first()).toHaveCSS(
    'transform',
    'none',
  )
  await expect(cat.locator('svg')).toHaveCSS('transform', 'none')
  await expect(cat.locator('.banner-cat-surprise')).toHaveCSS('opacity', '0')
})

test('both showcase signs shake after every flip and keep shaking with button focus', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('./')
  await expect(page.locator('.hero .demo-screen')).toBeVisible()
  await page.locator('.site').evaluate((element) => {
    element.addEventListener('animationstart', (event) => {
      const target = event.target as HTMLElement
      if (target.matches('.showcase-sign-label'))
        target.getAnimations().forEach((animation) => animation.pause())
    })
  })
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000)
  await page.setViewportSize({ width: 1279, height: 900 })
  await page.clock.runFor(1100)
  const showcase = page.locator('.hero-showcase')
  const button = showcase.locator('.showcase-toggle')
  for (const name of ['Watch it', 'Try it', 'Watch it']) {
    await button.click()
    await page.clock.runFor(100)
    for (
      let index = 0;
      index < 20 && (await showcase.getAttribute('data-shaking')) !== 'true';
      index += 1
    )
      await page.clock.runFor(100)
    await expect(showcase).toHaveAttribute('data-shaking', 'true')
    await expect(
      showcase.getByRole('heading', { name, exact: true }).locator('span'),
    ).toHaveCSS('animation-name', 'playful-shake')
    await expect(button).toBeFocused()
    await page.clock.fastForward(650)
    await expect(showcase).toHaveAttribute('data-shaking', 'false')
  }
  await showcase.evaluate((element) =>
    element.scrollIntoView({ behavior: 'instant', block: 'start' }),
  )
  await page.clock.runFor(100)
  await button.focus()
  await page.clock.fastForward(7000)
  await expect(showcase).toHaveAttribute('data-shaking', 'true')
  await expect(button).toBeFocused()
})

test('playground throws charge up to one second and carry drag momentum on release', async ({
  page,
}) => {
  await page.clock.install()
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  const throwDistance = async (hold: number, drag = false) => {
    await page.clock.resume()
    await page.goto('./#customize')
    const board = page.locator('.seasonal-playground')
    await expect(board).toBeVisible()
    const piece = board.getByRole('button').first()
    await piece.focus()
    const nudges = await piece.evaluate((element) =>
      Math.round((50 - parseFloat(element.style.left)) / 4),
    )
    for (let index = 0; index < Math.abs(nudges); index += 1)
      await piece.press(nudges > 0 ? 'Shift+ArrowRight' : 'Shift+ArrowLeft')
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000)
    const bounds = (await piece.boundingBox())!
    const x = bounds.x + bounds.width / 2
    const y = bounds.y + bounds.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await expect(piece).toHaveAttribute('data-grabbed', 'true')
    await page.clock.runFor(hold)
    if (drag) {
      const position = () => piece.evaluate((element) => element.style.left)
      const initial = await position()
      await page.mouse.move(x + 10, y)
      await expect.poll(position).not.toBe(initial)
      await page.clock.runFor(16)
      const halfway = await position()
      await page.mouse.move(x + 20, y)
      await expect.poll(position).not.toBe(halfway)
    }
    const before = await piece.evaluate((element) =>
      parseFloat(element.style.left),
    )
    await page.mouse.up()
    await expect(piece).toHaveAttribute('data-moving', 'true')
    await piece.evaluate((element) => {
      requestAnimationFrame(() => {
        element.dataset.releaseSample = element.style.left
      })
    })
    await page.clock.runFor(20)
    const after = await piece.evaluate((element) =>
      parseFloat(element.dataset.releaseSample!),
    )
    return {
      distance: Math.abs(after - before),
      width: (await board.boundingBox())!.width,
    }
  }
  const quick = await throwDistance(0)
  const charged = await throwDistance(1000)
  const capped = await throwDistance(1500)
  expect(quick.distance).toBeCloseTo(2.85, 1)
  expect(charged.distance).toBeCloseTo(quick.distance * 2, 1)
  expect(capped.distance).toBeCloseTo(charged.distance, 1)
  const dragged = await throwDistance(1000, true)
  expect(dragged.distance).toBeCloseTo(
    (((10 / dragged.width) * 100) / 16) * 16.67 * 3,
    1,
  )
})
