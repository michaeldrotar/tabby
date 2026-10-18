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
  it('clears ordinary row selection at creation controls and preserves explicit multiple selection', () => {
    const { backend, view, controller } = setup()
    const selected = () =>
      projectTabManager(backend.getSnapshot(), view.getState(), 0)
        .selectedTabIds
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    controller.dispatch({ type: 'focus-creation', pane: 'tab' })
    controller.reconcile()
    expect(selected()).toEqual([])
    expect(view.getState().focusedItem).toBeNull()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
      toggle: true,
    })
    controller.dispatch({ type: 'focus-creation', pane: 'tab' })
    expect(selected()).toEqual([11, 12])
  })

  it('keeps the appearance drawer open through other interactions and reports preference failures', async () => {
    const resources = setup()
    resources.controller.dispatch({ type: 'toggle-appearance' })
    await resources.controller.dispatch({
      type: 'change-appearance',
      value: { themeDarkAccent: 'rose' },
    })
    resources.controller.dispatch({ type: 'open-window-picker' })
    resources.controller.dispatch({ type: 'edit-window' })
    expect(resources.preferences.getSnapshot().themeDarkAccent).toBe('rose')
    expect(resources.view.getState().appearanceOpen).toBe(true)
    const controller = createTabManagerController({
      ...resources,
      preferences: {
        ...resources.preferences,
        set: async () => {
          throw new Error('Appearance unavailable')
        },
      },
    })
    await controller.dispatch({
      type: 'change-appearance',
      value: { theme: 'dark' },
    })
    expect(resources.view.getState().notifications.items.at(-1)?.message).toBe(
      'Appearance unavailable',
    )
    controller.dispatch({ type: 'toggle-appearance' })
    expect(resources.view.getState().appearanceOpen).toBe(false)
  })
  it('preserves selection when the picker is canceled or the same window is chosen, and starts with the active tab on a real switch', async () => {
    const { backend, view, controller } = setup()
    const selected = () =>
      projectTabManager(backend.getSnapshot(), view.getState(), 0)
        .selectedTabIds
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    controller.dispatch({ type: 'open-window-picker' })
    controller.dispatch({ type: 'navigate', key: 'Escape' })
    expect(selected()).toEqual([12])
    controller.dispatch({ type: 'open-window-picker' })
    controller.dispatch({ type: 'view-window', windowId: 1 })
    expect(selected()).toEqual([12])
    controller.dispatch({ type: 'view-window', windowId: 2 })
    expect(selected()).toEqual([13])
    expect(
      backend.getSnapshot().windows.find((window) => window.focused)?.id,
    ).toBe(1)
    controller.dispatch({ type: 'view-window', windowId: 1 })
    expect(selected()).toEqual([11])
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({ type: 'open-action-menu' })
    controller.dispatch({ type: 'navigate', key: 'Escape' })
    expect(selected()).toEqual([11])
    controller.dispatch({ type: 'navigate', key: 'Escape' })
    expect(selected()).toEqual([11])
  })

  it('scopes select all and group/child selection to the displayed window and reconciles external moves', () => {
    const { backend, view, controller } = setup()
    backend.restoreSnapshot({
      ...backend.getSnapshot(),
      groups: [{ id: 5, windowId: 1, title: 'Reading', color: 'blue' }],
      tabs: backend
        .getSnapshot()
        .tabs.map((tab) => (tab.windowId === 1 ? { ...tab, groupId: 5 } : tab)),
    })
    controller.dispatch({ type: 'select-item', item: { type: 'group', id: 5 } })
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
      toggle: true,
    })
    expect(
      projectTabManager(backend.getSnapshot(), view.getState(), 0)
        .selectedTabIds,
    ).toEqual([12])
    expect(view.getState().selection.selection.groupIds.size).toBe(0)
    controller.dispatch({ type: 'navigate', key: 'a', toggle: true })
    expect(
      projectTabManager(backend.getSnapshot(), view.getState(), 0)
        .selectedTabIds,
    ).toEqual([11, 12])
    backend.restoreSnapshot({
      ...backend.getSnapshot(),
      tabs: backend
        .getSnapshot()
        .tabs.map((tab) =>
          tab.id === 12 ? { ...tab, windowId: 2, groupId: undefined } : tab,
        ),
    })
    controller.reconcile()
    expect(
      projectTabManager(backend.getSnapshot(), view.getState(), 0)
        .selectedTabIds,
    ).toEqual([11])
  })

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
      expect(resources.view.getState().viewedWindowId).toBe(2)
      expect(resources.view.getState().focusedItem).toBeNull()
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

  it('keeps later navigation and selection when an action finishes', async () => {
    for (const actionType of ['move', 'create'] as const) {
      let release!: () => void
      const { backend, controller, view } = setup({
        beforeExecute: () =>
          new Promise<void>((resolve) => {
            release = resolve
          }),
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 11 },
      })
      const action = controller.dispatch(
        actionType === 'move'
          ? {
              type: 'run-action',
              actionId: 'move-selected-tabs',
              optionId: '2',
            }
          : { type: 'create-tab', windowId: 1 },
      )
      controller.dispatch({ type: 'view-window', windowId: 2 })
      release()
      await action
      expect(view.getState().viewedWindowId).toBe(2)
      expect(view.getState().selection.selection.tabIds.size).toBe(1)
      expect(
        backend.getSnapshot().tabs.find((tab) => tab.id === 11)?.windowId,
      ).toBe(actionType === 'move' ? 2 : 1)
    }
    const { controller, view } = setup()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    await controller.dispatch({ type: 'close-tabs', tabIds: [12] })
    expect(view.getState().selection.selection.tabIds).toEqual(new Set([11]))
  })

  it('keeps navigation while a new window host is opening', async () => {
    const resources = setup()
    let release!: () => void
    const controller = createTabManagerController({
      ...resources,
      host: {
        openWindowTabManager: () =>
          new Promise<void>((resolve) => {
            release = resolve
          }),
      },
    })
    const action = controller.dispatch({ type: 'create-window' })
    await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    controller.dispatch({ type: 'view-window', windowId: 1 })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    release()
    await action
    expect(resources.view.getState().viewedWindowId).toBe(1)
    expect(resources.view.getState().selection.selection.tabIds).toEqual(
      new Set([12]),
    )
  })

  it('retains only surviving source tabs after moves and retains grouped tabs after local actions', async () => {
    for (const operation of ['move', 'partial-move', 'ungroup'] as const) {
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
                ...(operation === 'partial-move'
                  ? [fixtures.generateTab({ id: 14, groupId: 5 })]
                  : []),
                fixtures.generateTab({ id: 13, groupId: 6 }),
              ],
            }),
            fixtures.generateWindow({ id: 2 }),
          ],
        }),
      )
      const { backend, view } = resources
      const controller = createTabManagerController({
        ...resources,
        host: { getCurrentWindowId: () => 1 },
      })
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
      if (operation === 'partial-move') {
        controller.dispatch({
          type: 'select-item',
          item: { type: 'tab', id: 11 },
        })
        controller.dispatch({
          type: 'select-item',
          item: { type: 'tab', id: 12 },
          toggle: true,
        })
      } else
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
          : { type: 'run-action', actionId: 'ungroup-selected-groups' },
      )

      const selection = view.getState().selection.selection
      expect(selection.tabIds).toEqual(
        new Set(
          operation === 'move'
            ? [13]
            : operation === 'partial-move'
              ? [12]
              : [11, 12],
        ),
      )
      expect(selection.groupIds).toEqual(new Set())
      const changed = backend
        .getSnapshot()
        .tabs.filter((tab) => [11, 12].includes(tab.id))
      if (operation === 'move' || operation === 'partial-move') {
        expect(view.getState().viewedWindowId).toBe(1)
        if (operation === 'move')
          expect(
            backend.getSnapshot().groups.find((group) => group.id === 5)
              ?.windowId,
          ).toBe(2)
        expect(changed.find((tab) => tab.id === 11)?.windowId).toBe(2)
        expect(changed.find((tab) => tab.id === 12)?.windowId).toBe(
          operation === 'move' ? 2 : 1,
        )
      } else {
        expect(view.getState().viewedWindowId).toBe(1)
        expect(changed.every((tab) => tab.groupId === undefined)).toBe(true)
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
    controller.dispatch({ type: 'navigate', key: 'a', toggle: true })
    await controller.dispatch({
      type: 'close-item',
      item: { type: 'tab', id: 11 },
    })
    expect(view.getState().selection.selection).toEqual({
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
    expect(view.getState().selection.selection.mode).toBe('multi-select')
  })

  it('offers grouping for part of a group and preserves a fully selected group', async () => {
    const resources = setup()
    const fixtures = createFixtureBuilder()
    resources.backend.restoreSnapshot(
      fixtures.generateScene({
        windows: [
          fixtures.generateWindow({
            id: 1,
            groups: [
              fixtures.generateGroup({
                id: 5,
                title: 'Research',
                color: 'red',
              }),
            ],
            tabs: [
              fixtures.generateTab({ id: 11, groupId: 5 }),
              fixtures.generateTab({ id: 12, groupId: 5 }),
              fixtures.generateTab({ id: 13 }),
            ],
          }),
        ],
      }),
    )
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'group', id: 5 },
    })
    const project = () =>
      projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
        0,
      )
    expect(
      project().actions?.some((action) => action.id === 'group-selected-tabs'),
    ).toBe(false)
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
      toggle: true,
    })
    expect(
      project().actions?.some((action) => action.id === 'group-selected-tabs'),
    ).toBe(true)
    const destinations = project().actions?.find(
      (action) => action.id === 'group-selected-tabs',
    )?.options
    expect(destinations?.map((option) => option.id)).toEqual(['5', 'new'])
    expect(destinations?.at(-1)).toMatchObject({
      icon: 'Plus',
      dividerBefore: true,
    })
    await resources.controller.dispatch({
      type: 'run-action',
      actionId: 'group-selected-tabs',
      optionId: 'new',
    })
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 12)
        ?.groupId,
    ).toBe(5)
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 11)
        ?.groupId,
    ).not.toBe(5)
  })

  it('closes exact duplicates across windows while keeping the chosen tab', async () => {
    const resources = setup()
    const fixtures = createFixtureBuilder()
    const duplicateUrl =
      'https://localhost:3000/workspace?project=alpha#overview'
    resources.backend.restoreSnapshot(
      fixtures.generateScene({
        windows: [
          fixtures.generateWindow({
            id: 1,
            focused: true,
            tabs: [
              fixtures.generateTab({
                id: 11,
                title: 'Workspace',
                url: duplicateUrl,
                active: true,
              }),
              fixtures.generateTab({
                id: 12,
                title: 'Other view',
                url: duplicateUrl.replace('#overview', '#settings'),
                active: false,
              }),
            ],
          }),
          fixtures.generateWindow({
            id: 2,
            tabs: [
              fixtures.generateTab({
                id: 21,
                title: 'Workspace',
                url: duplicateUrl,
                active: true,
                pinned: true,
              }),
              fixtures.generateTab({
                id: 22,
                title: 'Workspace',
                url: duplicateUrl,
                active: false,
              }),
            ],
          }),
        ],
      }),
    )
    const { backend, controller, view } = resources
    controller.dispatch({
      type: 'open-action-menu',
      target: { type: 'tab', id: 11 },
    })

    const model = projectTabManager(
      backend.getSnapshot(),
      view.getState(),
      1700000000000,
    )
    expect(model.duplicateTabIds).toEqual([11, 21, 22])
    expect(
      model.actions?.find((action) => action.id === 'close-duplicate-tabs')
        ?.label,
    ).toBe('Close 2 duplicates')

    await controller.dispatch({
      type: 'run-action',
      actionId: 'close-duplicate-tabs',
    })

    expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([11, 12])
    const updatedModel = projectTabManager(
      backend.getSnapshot(),
      view.getState(),
      1700000000000,
    )
    expect(
      updatedModel.actions?.some(
        (action) => action.id === 'close-duplicate-tabs',
      ),
    ).toBe(false)
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
      ).toEqual([11, 12])
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
      expect(view.getState().notifications.items).toEqual([])
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
    expect(view.getState().notifications.items).toEqual([])
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
    expect(rightView.getState().selection.selection.tabIds.size).toBe(1)
    expect(left.view.getState().selection.interaction.anchorItem).toEqual({
      type: 'tab',
      id: 13,
    })
    expect(left.view.getState().selection.selection.tabIds.size).toBe(1)
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
    const state = reconcileTabManagerView(snapshot, view.getState())
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
    resources.view.setState({ focusedItem: null })
    resources.controller.dispatch({ type: 'navigate', key: 'Home' })
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
    expect(
      first.actions
        ?.find((action) => action.id === 'move-selected-tabs')
        ?.options?.at(-1),
    ).toMatchObject({ id: 'new', label: 'New window', icon: 'Plus' })
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

  it('selects collapsed groups with Ctrl+A and preserves multiple groups when moving the selection', async () => {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.snapshot,
      groups: [
        {
          id: 5,
          windowId: 1,
          title: 'Research',
          color: 'red',
          collapsed: true,
        },
        { id: 6, windowId: 1, title: 'Build', color: 'blue' },
      ],
      tabs: [
        ...resources.snapshot.tabs.filter((tab) => tab.windowId !== 1),
        {
          id: 11,
          windowId: 1,
          index: 0,
          title: 'One',
          groupId: 5,
          active: true,
        },
        { id: 12, windowId: 1, index: 1, title: 'Two', groupId: 5 },
        { id: 113, windowId: 1, index: 2, title: 'Three', groupId: 6 },
        { id: 114, windowId: 1, index: 3, title: 'Loose' },
      ],
    })
    resources.controller.dispatch({ type: 'navigate', key: 'a', toggle: true })
    const model = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
      0,
    )
    expect(model.selectedTabIds).toEqual([11, 12, 113, 114])
    expect(model.selectedGroupIds).toEqual([5, 6])
    expect(
      model.actions?.some((action) =>
        ['group-selected-tabs', 'pin-selected-tabs'].includes(action.id),
      ),
    ).toBe(false)
    await resources.controller.dispatch({
      type: 'run-action',
      actionId: 'move-selected-tabs',
      optionId: '2',
    })
    expect(resources.backend.getSnapshot().groups).toEqual([
      { id: 5, windowId: 2, title: 'Research', color: 'red', collapsed: false },
      { id: 6, windowId: 2, title: 'Build', color: 'blue' },
    ])
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 12)
        ?.groupId,
    ).toBe(5)
  })

  it('omits a new-window group move when that group fills the window', () => {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.snapshot,
      groups: [{ id: 5, windowId: 1, color: 'blue' }],
      tabs: resources.snapshot.tabs.map((tab) =>
        tab.windowId === 1 ? { ...tab, groupId: 5 } : tab,
      ),
    })
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'group', id: 5 },
    })
    const model = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
      0,
    )
    expect(
      model.actions
        ?.find((action) => action.id === 'move-selected-tabs')
        ?.options?.map((option) => option.id),
    ).not.toContain('new')
  })

  it('applies identity changes in order, retains the editor on window focus, and switches between custom and tab defaults', async () => {
    const resources = setup()
    await resources.preferences.set({ tabManagerCompactIconMode: 'first' })
    const controller = createTabManagerController({
      ...resources,
      environment: { ...resources.environment, random: () => 0.5 },
    })
    await controller.dispatch({ type: 'edit-window' })
    expect(resources.view.getState().editingWindow).toMatchObject({
      name: 'Tabby',
      icon: 'palette',
      iconColor: 'green',
      useCustom: true,
    })
    const first = controller.dispatch({
      type: 'change-window-draft',
      value: { name: 'Atlas' },
    })
    const next = controller.dispatch({
      type: 'change-window-draft',
      value: { name: 'Research', icon: 'book', iconColor: 'red' },
    })
    await Promise.all([first, next])
    expect(resources.backend.getSnapshot().windows[0]).toMatchObject({
      name: 'Research',
      icon: 'book',
      iconColor: 'red',
    })
    controller.dispatch({ type: 'view-window', windowId: 1 })
    expect(resources.view.getState().editingWindow?.name).toBe('Research')
    await controller.dispatch({ type: 'edit-window' })
    expect(resources.view.getState().editingWindow).toBeNull()
    expect(resources.backend.getSnapshot().windows[0]?.name).toBe('Research')
    await controller.dispatch({ type: 'edit-window' })
    expect(resources.view.getState().editingWindow).toMatchObject({
      name: 'Research',
      icon: 'book',
      iconColor: 'red',
    })
    await controller.dispatch({ type: 'reset-window' })
    expect(resources.backend.getSnapshot().windows[0]?.name).toBe('')
    expect(resources.preferences.getSnapshot().tabManagerCompactIconMode).toBe(
      'first',
    )
    expect(resources.view.getState().editingWindow).toBeNull()
  })

  it('selects the active tab by default and after Escape, and permits an explicitly empty selection', async () => {
    const resources = setup()
    resources.controller.reconcile()
    const selected = () =>
      projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
        0,
      ).selectedTabIds
    expect(selected()).toEqual([11])
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
      toggle: true,
    })
    expect(selected()).toEqual([])
    resources.controller.reconcile()
    expect(selected()).toEqual([])
    resources.controller.dispatch({ type: 'navigate', key: 'Escape' })
    expect(selected()).toEqual([11])
    await resources.controller.dispatch({ type: 'activate-tab', tabId: 12 })
    expect(selected()).toEqual([12])
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 12)?.active,
    ).toBe(true)
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
      toggle: true,
    })
    expect(selected()).toEqual([11, 12])
    resources.controller.dispatch({ type: 'navigate', key: 'Escape' })
    expect(selected()).toEqual([12])
    await resources.controller.dispatch({ type: 'close-selection' })
    expect(selected()).toEqual([11])
  })

  it('focuses a picked window and opens its manager without replacing the originating window view', async () => {
    const resources = setup()
    const open = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { getCurrentWindowId: () => 1, openWindowTabManager: open },
    })
    await controller.dispatch({ type: 'activate-window', windowId: 2 })
    expect(
      resources.backend.getSnapshot().windows.find((window) => window.focused)
        ?.id,
    ).toBe(2)
    expect(open).toHaveBeenCalledWith(2)
    expect(resources.view.getState().viewedWindowId).toBe(1)
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

describe('moving follows the destination', () => {
  it('opens the destination with the moved selection while the source sidebar keeps its own window', async () => {
    for (const optionId of ['2', 'new']) {
      const resources = setup()
      const openWindowTabManager = vi.fn(async () => {
        if (optionId === '2')
          expect(
            resources.backend
              .getSnapshot()
              .windows.find((window) => window.focused)?.id,
          ).toBe(1)
      })
      const controller = createTabManagerController({
        ...resources,
        host: { getCurrentWindowId: () => 1, openWindowTabManager },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 12 },
      })
      await controller.dispatch({
        type: 'run-action',
        actionId: 'move-selected-tabs',
        optionId,
      })
      const tab = resources.backend
        .getSnapshot()
        .tabs.find((tab) => tab.id === 12)!
      expect(tab).toMatchObject({ active: true })
      expect(
        resources.backend.getSnapshot().windows.find((window) => window.focused)
          ?.id,
      ).toBe(tab.windowId)
      expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(
        tab.windowId,
        [12],
      )
      expect(resources.view.getState().viewedWindowId).toBe(1)
      await controller.dispatch({
        type: 'receive-moved-tabs',
        windowId: tab.windowId,
        tabIds: [12],
      })
      expect(resources.view.getState().selection.selection.tabIds).toEqual(
        new Set([12]),
      )
      expect(resources.view.getState().focusedItem).toEqual({
        type: 'tab',
        id: 12,
      })
    }
  })
  it('keeps the source context after a failed move', async () => {
    const resources = setup({ commands: 'ignore' })
    const openWindowTabManager = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { getCurrentWindowId: () => 1, openWindowTabManager },
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'move-selected-tabs',
      optionId: '2',
    })
    expect(openWindowTabManager).not.toHaveBeenCalled()
    expect(resources.view.getState().selection.selection.tabIds).toEqual(
      new Set([12]),
    )
  })
})

it('keeps the drop viewport and does not request another reveal for a local drag', async () => {
  const resources = setup()
  await resources.controller.dispatch({
    type: 'place-tabs',
    tabIds: [12],
    destination: { windowId: 1, beforeTabId: 11 },
    scrollTop: 120,
  })
  expect(
    resources.backend
      .getSnapshot()
      .tabs.filter((tab) => tab.windowId === 1)
      .map((tab) => tab.id),
  ).toEqual([12, 11])
  expect(resources.view.getState()).toMatchObject({
    scrollTop: 120,
    scrollToItem: null,
    focusedItem: { type: 'tab', id: 12 },
  })
})

it('reveals all collapsed groups moved through the menu', async () => {
  const resources = setup()
  resources.backend.restoreSnapshot({
    ...resources.backend.getSnapshot(),
    groups: [5, 6].map((id) => ({
      id,
      windowId: 1,
      color: 'blue',
      collapsed: true,
    })),
    tabs: [
      ...resources.backend
        .getSnapshot()
        .tabs.map((tab) =>
          tab.windowId === 1 ? { ...tab, groupId: tab.id === 11 ? 5 : 6 } : tab,
        ),
      { id: 14, windowId: 1, index: 2, title: 'Stay here' },
    ],
  })
  const controller = createTabManagerController({
    ...resources,
    host: { getCurrentWindowId: () => 1 },
  })
  controller.dispatch({ type: 'select-item', item: { type: 'group', id: 5 } })
  controller.dispatch({
    type: 'select-item',
    item: { type: 'group', id: 6 },
    toggle: true,
  })
  await controller.dispatch({
    type: 'run-action',
    actionId: 'move-selected-tabs',
    optionId: '2',
  })
  expect(resources.backend.getSnapshot().groups).toEqual([
    { id: 5, windowId: 2, color: 'blue', collapsed: false },
    { id: 6, windowId: 2, color: 'blue', collapsed: false },
  ])
})

it('activates and focuses the first selected tab in source order for drag and menu transfers', async () => {
  for (const method of ['drop', 'menu']) {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.backend.getSnapshot(),
      tabs: [
        ...resources.backend.getSnapshot().tabs,
        { id: 14, windowId: 1, index: 2, title: 'Stay here' },
      ],
    })
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
    })
    resources.controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 11 },
      toggle: true,
    })
    await resources.controller.dispatch(
      method === 'drop'
        ? { type: 'place-tabs', tabIds: [12, 11], windowId: 2 }
        : { type: 'run-action', actionId: 'move-selected-tabs', optionId: '2' },
    )
    expect(
      resources.backend
        .getSnapshot()
        .tabs.find((tab) => tab.windowId === 2 && tab.active)?.id,
    ).toBe(11)
    expect(resources.view.getState().focusedItem).toEqual({
      type: 'tab',
      id: 11,
    })
    expect(resources.view.getState().scrollToItem).toMatchObject({
      id: 11,
      focus: true,
    })
  }
})
