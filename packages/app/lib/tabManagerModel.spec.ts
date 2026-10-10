import {
  createFixtureBuilder,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import { describe, expect, it } from 'vitest'
import {
  createTabManagerController,
  projectTabManager,
  reconcileTabManagerView,
} from './tabManagerModel'
import { createTabManagerView } from './view'

const setup = (
  options: ConstructorParameters<typeof MemoryBackend>[1] = {},
) => {
  const fixtures = createFixtureBuilder()
  const snapshot = fixtures.generateScene({
    windows: [
      fixtures.generateWindow({
        id: 1,
        focused: true,
        tabs: [
          fixtures.generateTab({ id: 11, title: 'Tabby', active: true }),
          fixtures.generateTab({ id: 12, title: 'Notes' }),
        ],
      }),
      fixtures.generateWindow({ id: 2 }),
    ],
  })
  const backend = new MemoryBackend(snapshot, options)
  const view = createTabManagerView({ viewedWindowId: 1 })
  const resources = {
    backend,
    view,
    preferences: createMemoryPreferences(),
    environment: { now: () => 1700000000000, systemTheme: 'light' as const },
  }
  return {
    ...resources,
    snapshot,
    controller: createTabManagerController(resources),
  }
}

describe('Tab Manager controller', () => {
  it('shares browser data while retaining independent selection and viewed windows', async () => {
    const left = setup()
    const rightView = createTabManagerView({ viewedWindowId: 2 })
    const right = createTabManagerController({ ...left, view: rightView })
    left.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
    })
    left.controller.dispatch({
      type: 'navigate',
      key: 'ArrowDown',
      shift: true,
    })
    expect(
      projectTabManager(left.backend.getSnapshot(), left.view.getState(), 0)
        .selectedTabIds,
    ).toEqual([11, 12])
    await left.controller.dispatch({ type: 'close-selection' })
    right.reconcile()
    expect(
      left.backend.getSnapshot().windows.map((window) => window.id),
    ).toEqual([2])
    expect(left.view.getState().viewedWindowId).toBe(2)
    expect(rightView.getState().viewedWindowId).toBe(2)
    expect(rightView.getState().selection.selection.tabIds.size).toBe(0)
    expect(left.view.getState().selection.interaction.anchorItem).toBeNull()
    expect(left.view.getState().selection.selection.tabIds.size).toBe(0)
  })

  it('reports ignored commands honestly and cancels late notices when rewinding', async () => {
    const ignored = setup({ commands: 'ignore' })
    await ignored.controller.dispatch({ type: 'close-tabs', tabIds: [11] })
    expect(
      ignored.backend.getSnapshot().tabs.some((tab) => tab.id === 11),
    ).toBe(true)
    expect(ignored.view.getState().notice?.message).toContain('ignored')
    let release!: () => void
    const pending = setup({
      beforeExecute: () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    })
    const checkpoint = pending.backend.capture()
    const action = pending.controller.dispatch({
      type: 'close-tabs',
      tabIds: [11],
    })
    pending.controller.cancel()
    pending.backend.restore(checkpoint)
    release()
    await action
    expect(pending.view.getState().notice).toBeNull()
    expect(
      pending.backend.getSnapshot().tabs.some((tab) => tab.id === 11),
    ).toBe(true)
  })

  it('keeps a valid view stable and uses the supplied clock for age labels', () => {
    const { snapshot, view } = setup()
    const state = view.getState()
    expect(reconcileTabManagerView(snapshot, state)).toBe(state)
    const timed = {
      ...snapshot,
      tabs: snapshot.tabs.map((tab) => ({ ...tab, lastAccessed: 1000 })),
    }
    expect(
      projectTabManager(timed, state, 121000).windows[0]?.tabs[0]?.ageLabel,
    ).toBe('2m')
  })

  it('keeps keyboard focus on visible items when the active tab group is collapsed', () => {
    const resources = setup()
    const fixtures = createFixtureBuilder()
    const snapshot = fixtures.generateScene({
      windows: [
        fixtures.generateWindow({
          id: 1,
          groups: [fixtures.generateGroup({ id: 101, collapsed: true })],
          tabs: [fixtures.generateTab({ id: 11, active: true, groupId: 101 })],
        }),
      ],
    })
    resources.backend.restoreSnapshot(snapshot)
    resources.view.setState({ focusedItem: { type: 'window', id: 1 } })
    resources.controller.dispatch({ type: 'navigate', key: 'ArrowRight' })
    expect(resources.view.getState().focusedItem).toEqual({
      type: 'group',
      id: 101,
    })
    resources.view.setState({ focusedItem: { type: 'tab', id: 11 } })
    resources.controller.reconcile()
    expect(resources.view.getState().focusedItem).toEqual({
      type: 'group',
      id: 101,
    })
  })
})
