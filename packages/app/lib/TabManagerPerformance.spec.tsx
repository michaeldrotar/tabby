// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { createFixtureBuilder, MemoryBackend } from '@extension/demo'
import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { Surface } from '@extension/ui/Surface'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TabbyProvider } from './TabbyProvider'
import { TabManagerExperience } from './TabManagerExperience'
import { createTestResources } from './testResources'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('limits row renders to changed tabs in a 200-tab data fixture', async () => {
  let now = 10_000_000
  const pending: Array<() => void> = []
  const fixture = createFixtureBuilder({ now })
  const group = fixture.generateGroup({ title: 'Performance group' })
  const tabs = Array.from({ length: 200 }, (_, index) =>
    fixture.generateTab({
      title: `Performance tab ${index + 1}`,
      lastAccessed: now - 3_600_000,
      groupId: index > 0 && index <= 100 ? group.id : undefined,
    }),
  )
  const backend = new MemoryBackend(
    fixture.generateScene({
      windows: [
        fixture.generateWindow({ tabs: tabs.slice(0, 180), groups: [group] }),
        fixture.generateWindow({ tabs: tabs.slice(180) }),
      ],
    }),
  )
  const resources = createTestResources({
    backend,
    environment: {
      now: () => now,
      systemTheme: 'light',
      schedule: (callback) => {
        pending.push(callback)
        return () => {
          const index = pending.indexOf(callback)
          if (index >= 0) pending.splice(index, 1)
        }
      },
    },
  })
  resources.views.tabManager.setState({ viewedWindowId: 1 })
  // Count executions of the real row component, preserving its React memo boundary.
  const row = vi.spyOn(
    (
      BrowserTabItem as unknown as {
        type: { render: (...args: unknown[]) => unknown }
      }
    ).type,
    'render',
  )
  const renderedTabIds = () =>
    row.mock.calls.map(([props]) => (props as { tabId: number }).tabId)
  const { container } = render(
    <TabbyProvider {...resources}>
      <Surface motion="full">
        <TabManagerExperience />
      </Surface>
    </TabbyProvider>,
  )
  expect(container.querySelectorAll('[data-tab-id]')).toHaveLength(180)
  await act(async () => {})
  const measurements: Record<string, number> = {}
  const measure = async (
    name: string,
    update: () => void | Promise<unknown>,
  ) => {
    row.mockClear()
    await act(async () => {
      await update()
    })
    measurements[name] = row.mock.calls.length
  }
  await measure('scroll', () => {
    resources.views.tabManager.setState({ scrollTop: 100 })
  })
  await measure('hover', () => {
    resources.views.tabManager.setState({
      hoveredItem: { type: 'tab', id: tabs[0]!.id },
    })
  })
  await measure('focus', () => {
    resources.views.tabManager.setState({
      focusedItem: { type: 'tab', id: tabs[0]!.id },
    })
  })
  await measure('collapse', () =>
    backend.execute({
      type: 'set-group-collapsed',
      groupId: group.id,
      collapsed: true,
    }),
  )
  expect(container.querySelectorAll('[data-tab-id]')).toHaveLength(80)
  await measure('expand', () =>
    backend.execute({
      type: 'set-group-collapsed',
      groupId: group.id,
      collapsed: false,
    }),
  )
  expect(container.querySelectorAll('[data-tab-id]')).toHaveLength(180)
  await measure('renameTab', () => {
    const snapshot = backend.exportSnapshot()
    backend.restoreSnapshot({
      ...snapshot,
      tabs: snapshot.tabs.map((tab) =>
        tab.id === tabs[0]!.id ? { ...tab, title: 'Renamed tab' } : tab,
      ),
    })
  })
  expect(
    container.querySelector(`[data-tab-id="${tabs[0]!.id}"]`)?.textContent,
  ).toContain('Renamed tab')
  await measure('idleClock', () => {
    now += 1000
    pending.shift()!()
  })
  await measure('recentAge', () => {
    const snapshot = backend.exportSnapshot()
    backend.restoreSnapshot({
      ...snapshot,
      tabs: snapshot.tabs.map((tab) =>
        tab.id === tabs[0]!.id ? { ...tab, lastAccessed: now - 1000 } : tab,
      ),
    })
  })
  await measure('changingAge', () => {
    now += 1000
    pending.shift()!()
  })
  expect(
    container.querySelector(`[data-tab-id="${tabs[0]!.id}"]`)?.textContent,
  ).toContain('• 2s')
  await measure('selectFirst', () => {
    fireEvent.click(
      container.querySelector(
        `[data-tab-id="${tabs[1]!.id}"] [data-tab-option]`,
      )!,
    )
  })
  await measure('selectSecond', () => {
    fireEvent.click(
      container.querySelector(
        `[data-tab-id="${tabs[2]!.id}"] [data-tab-option]`,
      )!,
    )
  })
  expect(
    container
      .querySelector(`[data-tab-id="${tabs[1]!.id}"]`)
      ?.getAttribute('data-selected'),
  ).toBe('false')
  expect(
    container
      .querySelector(`[data-tab-id="${tabs[2]!.id}"]`)
      ?.getAttribute('data-selected'),
  ).toBe('true')
  const added = fixture.generateTab({
    title: 'Opened tab',
    url: 'https://performance.test/opened',
    windowId: 1,
    index: 180,
    active: false,
    lastAccessed: now - 3_600_000,
  })
  await measure('openBackgroundTab', () => {
    const snapshot = backend.exportSnapshot()
    backend.restoreSnapshot({ ...snapshot, tabs: [...snapshot.tabs, added] })
  })
  expect(container.querySelectorAll('[data-tab-id]')).toHaveLength(181)
  expect(renderedTabIds()).toEqual([added.id])
  const previousActiveId = backend
    .getSnapshot()
    .tabs.find((tab) => tab.windowId === 1 && tab.active)!.id
  await measure('activateOpenedTab', () =>
    backend.execute({ type: 'activate-tab', tabId: added.id }),
  )
  expect(
    container.querySelector(`[data-tab-id="${added.id}"]`),
  ).toHaveAttribute('data-active', 'true')
  expect(renderedTabIds()).toEqual([previousActiveId, added.id])
  expect(measurements).toEqual({
    scroll: 0,
    hover: 1,
    focus: 1,
    collapse: 0,
    expand: 100,
    renameTab: 1,
    idleClock: 0,
    recentAge: 1,
    changingAge: 1,
    selectFirst: 2,
    selectSecond: 2,
    openBackgroundTab: 1,
    activateOpenedTab: 2,
  })
}, 20_000)
