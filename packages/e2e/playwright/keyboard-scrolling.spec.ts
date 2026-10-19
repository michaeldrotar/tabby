import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({
  browserData: {
    ...browser,
    windows: browser.windows.slice(0, 1),
    tabs: Array.from({ length: 24 }, (_, index) => ({
      ...browser.tabs[0]!,
      id: index + 1,
      title: `Scroll tab ${index + 1}`,
      active: index === 0,
      pinned: false,
      groupId: index >= 1 && index <= 20 ? 10 : -1,
    })),
    groups: [
      {
        id: 10,
        windowId: 1,
        title: 'Long group',
        color: 'blue',
        collapsed: false,
      },
    ],
  },
})

test('scrolls grouped rows, their header, and creation controls together during keyboard navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 400 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tab-manager/index.html')
  const first = page.locator('[data-tab-id="1"] [data-tab-option]')
  await first.focus()
  const sampler = await page.evaluateHandle(async () => {
    const row = document.querySelector('[data-tab-id="2"]')!
    const header = document.querySelector('[data-group-header]')!
    const create = document.querySelector(
      '[data-group-id="10"] [data-create-item="tab"]',
    )!
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished),
    )
    const initial =
      row.getBoundingClientRect().top - header.getBoundingClientRect().top
    const initialCreate =
      create.getBoundingClientRect().top - header.getBoundingClientRect().top
    const state = { stopped: false, maxDrift: 0, samples: 0 }
    const sample = () => {
      if (state.stopped) return
      state.samples++
      state.maxDrift = Math.max(
        state.maxDrift,
        Math.abs(
          row.getBoundingClientRect().top -
            header.getBoundingClientRect().top -
            initial,
        ),
        Math.abs(
          create.getBoundingClientRect().top -
            header.getBoundingClientRect().top -
            initialCreate,
        ),
      )
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    return state
  })
  for (let index = 0; index < 22; index++)
    await page.keyboard.press('ArrowDown')
  const viewport = page.locator(
    '[data-manager-scroll] [data-radix-scroll-area-viewport]',
  )
  expect(await viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  for (let index = 0; index < 22; index++) await page.keyboard.press('ArrowUp')
  await expect(first).toBeFocused()
  const result = await sampler.evaluate((state) => {
    state.stopped = true
    return state
  })
  expect(result.samples).toBeGreaterThan(5)
  expect(result.maxDrift).toBeLessThan(1)
})
