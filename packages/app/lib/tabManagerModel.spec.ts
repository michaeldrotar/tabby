import {
  createFixtureBuilder,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import { describe, expect, it, vi } from 'vitest'
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
  it('creates windows in the host privacy context and opens their Tab Manager only when applied', async () => {
    for (const incognito of [false, true]) {
      const resources = setup()
      resources.backend.restoreSnapshot({
        ...resources.snapshot,
        windows: resources.snapshot.windows.map((window) => ({
          ...window,
          incognito: window.id === 1 ? incognito : !incognito,
        })),
      })
      resources.view.setState({ viewedWindowId: 2 })
      const openWindowTabManager = vi.fn(async () => {})
      const controller = createTabManagerController({
        ...resources,
        host: { getCurrentWindowId: () => 1, openWindowTabManager },
      })
      await controller.dispatch({ type: 'create-window' })
      const created = resources.backend.getSnapshot().windows.at(-1)!
      expect(created).toMatchObject({ incognito, focused: true })
      expect(resources.view.getState().viewedWindowId).toBe(created.id)
      expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(created.id)
    }
    const resources = setup({ commands: 'ignore' })
    const openWindowTabManager = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { openWindowTabManager },
    })
    await controller.dispatch({ type: 'create-window' })
    expect(resources.backend.getSnapshot()).toEqual(resources.snapshot)
    expect(resources.view.getState().viewedWindowId).toBe(1)
    expect(openWindowTabManager).not.toHaveBeenCalled()
  })

  it('retains requested grouped tabs after moving, grouping, and ungrouping them', async () => {
    for (const operation of [
      'move',
      'partial-move',
      'ungroup',
      'existing-group',
      'new-group',
    ] as const) {
      const resources = setup()
      const fixtures = createFixtureBuilder()
      resources.backend.restoreSnapshot(
        fixtures.generateScene({
          windows: [
            fixtures.generateWindow({
              id: 1,
              groups: [
                fixtures.generateGroup({ id: 5 }),
                fixtures.generateGroup({ id: 6 }),
              ],
              tabs: [
                fixtures.generateTab({ id: 11, groupId: 5 }),
                fixtures.generateTab({ id: 12, groupId: 5 }),
                fixtures.generateTab({ id: 13, groupId: 6 }),
              ],
            }),
            fixtures.generateWindow({ id: 2 }),
          ],
        }),
      )
      const { controller, backend, view } = resources
      if (operation === 'partial-move') {
        const execute = backend.execute
        backend.execute = async (command) => {
          if (command.type !== 'move-tabs') return execute(command)
          await execute({ ...command, tabIds: [11] })
          return {
            status: 'partial',
            requestedIds: [11, 12],
            succeededIds: [11],
            failures: [{ id: 12, message: 'Could not move this tab.' }],
          }
        }
      }
      controller.dispatch({
        type: 'select-item',
        item: { type: 'group', id: 5 },
      })
      await controller.dispatch(
        operation === 'move' || operation === 'partial-move'
          ? {
              type: 'run-action',
              actionId: 'move-selected-tabs',
              optionId: '2',
            }
          : operation === 'ungroup'
            ? { type: 'run-action', actionId: 'ungroup-selected-groups' }
            : {
                type: 'run-action',
                actionId: 'group-selected-tabs',
                optionId: operation === 'existing-group' ? '6' : 'new',
              },
      )

      const selection = view.getState().selection.selection
      expect(selection.tabIds).toEqual(new Set([11, 12]))
      expect(
        selection.groupIds.size +
          selection.windowIds.size +
          selection.expandedWindowIds.size,
      ).toBe(0)
      expect(selection.mode).toBe('multi-select')
      const changed = backend
        .getSnapshot()
        .tabs.filter((tab) => [11, 12].includes(tab.id))
      if (operation === 'move' || operation === 'partial-move') {
        expect(view.getState().viewedWindowId).toBe(2)
        expect(changed.find((tab) => tab.id === 11)?.windowId).toBe(2)
        expect(changed.find((tab) => tab.id === 12)?.windowId).toBe(
          operation === 'move' ? 2 : 1,
        )
      } else {
        expect(view.getState().viewedWindowId).toBe(1)
        expect(
          changed.every((tab) =>
            operation === 'ungroup'
              ? tab.groupId === undefined
              : tab.groupId !== 5,
          ),
        ).toBe(true)
      }
    }
  })

  it('selects only failed closes for retry and retains the relative-close anchor', async () => {
    const { backend, controller, view } = setup()
    const execute = backend.execute
    backend.execute = async (command) => {
      if (command.type !== 'close-tabs' || command.tabIds.length !== 2)
        return execute(command)
      await execute({ ...command, tabIds: [11] })
      return {
        status: 'partial',
        requestedIds: [11, 12],
        succeededIds: [11],
        failures: [{ id: 12, message: 'Could not close this tab.' }],
      }
    }
    controller.dispatch({
      type: 'open-action-menu',
      target: { type: 'window', id: 1 },
    })
    await controller.dispatch({
      type: 'close-item',
      item: { type: 'tab', id: 11 },
    })
    expect(view.getState().selection.selection).toEqual({
      windowIds: new Set(),
      expandedWindowIds: new Set(),
      groupIds: new Set(),
      tabIds: new Set([12]),
      mode: 'default',
    })
    await controller.dispatch({ type: 'create-tab', windowId: 1 })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    controller.dispatch({ type: 'toggle-selection-mode' })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'close-other-tabs',
    })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1)
        .map((tab) => tab.id),
    ).toEqual([12])
    expect(view.getState().selection.selection.tabIds).toEqual(new Set([12]))
    expect(view.getState().selection.selection.mode).toBe('default')
  })

  it('closes the full represented selection from a row and only the unselected target otherwise', async () => {
    for (const selectedTargetType of ['tab', 'group'] as const) {
      const resources = setup()
      const fixtures = createFixtureBuilder()
      resources.backend.restoreSnapshot(
        fixtures.generateScene({
          windows: [
            fixtures.generateWindow({
              id: 1,
              groups: [
                fixtures.generateGroup({ id: 5 }),
                fixtures.generateGroup({ id: 6 }),
              ],
              tabs: [
                fixtures.generateTab({ id: 11, groupId: 5 }),
                fixtures.generateTab({ id: 12 }),
                fixtures.generateTab({ id: 13, groupId: 6 }),
                fixtures.generateTab({ id: 14 }),
              ],
            }),
          ],
        }),
      )
      const { controller, backend, view } = resources
      controller.dispatch({
        type: 'select-item',
        item: { type: 'group', id: 5 },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 12 },
        toggle: true,
      })

      await controller.dispatch({
        type: 'close-item',
        item:
          selectedTargetType === 'tab'
            ? { type: 'group', id: 6 }
            : { type: 'tab', id: 13 },
      })
      expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([
        11, 12, 14,
      ])
      expect(
        projectTabManager(backend.getSnapshot(), view.getState(), 0)
          .selectedTabIds,
      ).toEqual([])
      expect(view.getState().selection.selection.mode).toBe('default')
      controller.dispatch({
        type: 'select-item',
        item: { type: 'group', id: 5 },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 12 },
        toggle: true,
      })

      await controller.dispatch({
        type: 'close-item',
        item:
          selectedTargetType === 'tab'
            ? { type: 'tab', id: 11 }
            : { type: 'group', id: 5 },
      })
      expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([14])
      expect(view.getState().notifications.items[0]?.message).toBe(
        '2 tabs closed',
      )
    }
  })

  it('activates a selected tab and keeps modifier selection independent of browser activation', async () => {
    const { controller, backend, view } = setup()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    await controller.dispatch({ type: 'activate-tab', tabId: 12 })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1 && tab.active)
        .map((tab) => tab.id),
    ).toEqual([12])
    expect(
      backend.getSnapshot().windows.find((window) => window.id === 1)?.focused,
    ).toBe(true)
    expect(view.getState().selection.selection.tabIds).toEqual(new Set([12]))
    expect(view.getState().notifications.items).toEqual([])

    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
      toggle: true,
    })
    expect(view.getState().selection.selection.tabIds).toEqual(
      new Set([12, 11]),
    )
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1 && tab.active)
        .map((tab) => tab.id),
    ).toEqual([12])
  })

  it('keeps a modifier selection when keyboard focus remains on an earlier selected tab', async () => {
    const { controller, backend, view } = setup()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
      toggle: true,
    })
    expect(view.getState().selection.selection.tabIds).toEqual(
      new Set([11, 12]),
    )

    // Modifier clicks prevent native focus, so Backspace originates on tab 11.
    controller.dispatch({ type: 'focus-item', item: { type: 'tab', id: 11 } })
    await controller.dispatch({ type: 'navigate', key: 'Backspace' })

    expect(
      backend.getSnapshot().tabs.some((tab) => [11, 12].includes(tab.id)),
    ).toBe(false)
    expect(view.getState().notifications.items[0]?.message).toBe(
      '2 tabs closed',
    )
  })

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
    ignored.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
    })
    await ignored.controller.dispatch({ type: 'close-tabs', tabIds: [11] })
    expect(
      ignored.backend.getSnapshot().tabs.some((tab) => tab.id === 11),
    ).toBe(true)
    expect(ignored.view.getState().selection.selection.tabIds).toEqual(
      new Set([11]),
    )
    expect(ignored.view.getState().notifications.items[0]?.message).toContain(
      'ignored',
    )
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
    expect(pending.view.getState().notifications.items).toEqual([])
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

describe('complete Tab Manager actions', () => {
  it('updates relative ages at their actual boundaries while reusing unchanged rows', () => {
    const resources = setup()
    const original = resources.backend.getSnapshot()
    resources.backend.restoreSnapshot({
      ...original,
      tabs: original.tabs.map((tab) => ({ ...tab, lastAccessed: 10500 })),
    })
    const snapshot = resources.backend.getSnapshot(),
      state = resources.view.getState()
    const first = projectTabManager(snapshot, state, 69999)
    expect(first.windows[0]?.tabs[0]?.ageLabel).toBe('59s')
    expect(projectTabManager(snapshot, state, 70001).windows).toBe(
      first.windows,
    )
    expect(
      projectTabManager(snapshot, state, 70500).windows[0]?.tabs[0]?.ageLabel,
    ).toBe('1m')
    const reduced = projectTabManager(snapshot, state, 11000, {
      reduceAgePrecision: true,
    })
    expect(reduced.windows[0]?.tabs[0]?.ageLabel).toBe('1m')
  })
  it('restores and shares a rename draft before changing browser data', async () => {
    const resources = setup()
    const fixture = createFixtureBuilder()
    resources.backend.restoreSnapshot(
      fixture.generateScene({
        windows: [
          fixture.generateWindow({
            id: 1,
            groups: [fixture.generateGroup({ id: 5, title: 'Original' })],
            tabs: [fixture.generateTab({ id: 11, groupId: 5 })],
          }),
        ],
      }),
    )
    resources.controller.dispatch({ type: 'start-group-rename', groupId: 5 })
    resources.controller.dispatch({
      type: 'change-group-rename',
      groupId: 5,
      title: 'Review draft',
    })
    const checkpoint = structuredClone(resources.view.getState())
    const second = createTabManagerController(resources)
    second.dispatch({
      type: 'change-group-rename',
      groupId: 5,
      title: 'Shared draft',
    })
    expect(resources.view.getState().renamingGroupTitle).toBe('Shared draft')
    expect(resources.backend.getSnapshot().groups[0]?.title).toBe('Original')
    resources.view.setState(checkpoint, true)
    expect(
      projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
        0,
      ).renamingGroupTitle,
    ).toBe('Review draft')
    await resources.controller.dispatch({
      type: 'rename-group',
      groupId: 5,
      title: 'Review draft',
    })
    expect(resources.backend.getSnapshot().groups[0]?.title).toBe(
      'Review draft',
    )
    expect(resources.view.getState().renamingGroupTitle).toBeNull()
    second.cancel()
    resources.controller.cancel()
  })

  it('resolves saved sidebar layout while retaining independent demo overrides and host persistence', async () => {
    const resources = setup()
    await resources.preferences.set({ tabManagerCompactLayout: 'list' })
    const project = (view = resources.view) =>
      projectTabManager(resources.backend.getSnapshot(), view.getState(), 0, {
        compactLayout:
          resources.preferences.getSnapshot().tabManagerCompactLayout,
      })
    const independent = createTabManagerView()
    expect(project().sidebarExpanded).toBe(true)
    resources.controller.dispatch({ type: 'toggle-sidebar' })
    expect(project().sidebarExpanded).toBe(false)
    expect(project(independent).sidebarExpanded).toBe(true)
    const production = createTabManagerController({
      ...resources,
      view: independent,
      host: {
        onSidebarExpandedChange: (expanded) =>
          resources.preferences.set({
            tabManagerCompactLayout: expanded ? 'list' : 'icon',
          }),
      },
    })
    await production.dispatch({ type: 'toggle-sidebar' })
    expect(resources.preferences.getSnapshot().tabManagerCompactLayout).toBe(
      'icon',
    )
    expect(independent.getState().sidebarExpanded).toBeNull()
    await resources.preferences.set({ tabManagerCompactLayout: 'list' })
    expect(project(independent).sidebarExpanded).toBe(true)
    production.cancel()
    resources.controller.cancel()
  })
  it('projects stable browser rows during local view updates and derives independent action panels', async () => {
    const resources = setup()
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
    })
    const first = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
      1000,
    )
    resources.controller.dispatch({ type: 'scroll', top: 100 })
    const scrolled = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
      2000,
    )
    expect(scrolled.windows).toBe(first.windows)
    resources.controller.dispatch({
      type: 'open-action-panel',
      actionId: 'move-selected-tabs',
    })
    expect(resources.view.getState().actionPanel).toEqual({
      actionId: 'move-selected-tabs',
    })
    await resources.controller.dispatch({
      type: 'run-action',
      actionId: 'move-selected-tabs',
      optionId: '2',
    })
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 12)
        ?.windowId,
    ).toBe(2)
    expect(resources.view.getState().actionPanel).toBeNull()
    await resources.controller.dispatch({ type: 'create-tab', windowId: 2 })
    const createdTab = resources.backend.getSnapshot().tabs.at(-1)!
    expect(createdTab).toMatchObject({ windowId: 2, active: true })
    expect(resources.view.getState().focusedItem).toEqual({
      type: 'tab',
      id: createdTab.id,
    })
    expect([...resources.view.getState().selection.selection.tabIds]).toEqual([
      createdTab.id,
    ])
    expect(resources.view.getState().scrollToItem?.id).toBe(createdTab.id)
    expect(
      resources.backend.getSnapshot().windows.find((window) => window.focused)
        ?.id,
    ).toBe(2)
  })

  it('expands a window context selection and routes clipboard through the host', async () => {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.snapshot,
      groups: [
        {
          id: 5,
          windowId: 1,
          title: 'Project',
          color: 'blue',
          collapsed: false,
        },
      ],
      tabs: resources.snapshot.tabs.map((tab) =>
        tab.id === 11 ? { ...tab, groupId: 5 } : tab,
      ),
    })
    const copied: string[] = []
    const controller = createTabManagerController({
      ...resources,
      host: {
        writeClipboardText: async (text) => {
          copied.push(text)
        },
      },
    })
    controller.dispatch({
      type: 'open-action-menu',
      target: { type: 'window', id: 1 },
    })
    expect(
      projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
        0,
      ).selectedTabIds,
    ).toEqual([11, 12])
    const selectedWindow = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
      0,
    )
    expect(selectedWindow.selectedGroupIds).toEqual([5])
    expect(selectedWindow.selectedGroupCount).toBe(1)
    controller.dispatch({
      type: 'open-action-menu',
      target: { type: 'group', id: 5 },
    })
    expect(resources.view.getState().selection.selection.windowIds).toEqual(
      new Set([1]),
    )
    await controller.dispatch({
      type: 'run-action',
      actionId: 'copy-selected-tabs',
      optionId: 'titles',
    })
    expect(copied).toEqual(['Tabby\nNotes'])
    expect(resources.view.getState().actionMenu).toBeNull()
    await controller.dispatch({
      type: 'run-action',
      actionId: 'pin-selected-tabs',
    })
    expect(
      resources.backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1)
        .every((tab) => tab.pinned),
    ).toBe(true)
  })
})

describe('Tab Manager identity replacement', () => {
  it('keeps selected rows, focus and range anchors when a browser replaces a tab ID', () => {
    const resources = setup()
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
    })
    resources.controller.dispatch({
      type: 'open-action-menu',
      target: { type: 'tab', id: 11 },
    })
    const snapshot = resources.backend.getSnapshot()
    resources.backend.restoreSnapshot({
      ...snapshot,
      tabs: snapshot.tabs.map((tab) =>
        tab.id === 11 ? { ...tab, id: 21, renderKey: 11 } : tab,
      ),
    })
    resources.controller.reconcile()
    const state = resources.view.getState()
    expect(state.selection.selection.tabIds).toEqual(new Set([21]))
    expect(state.selection.interaction.anchorItem).toEqual({
      type: 'tab',
      id: 21,
    })
    expect(state.focusedItem).toEqual({ type: 'tab', id: 21 })
    expect(state.actionMenu?.target).toEqual({ type: 'tab', id: 21 })
  })
})
