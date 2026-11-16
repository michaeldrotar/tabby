import {
  createFixtureBuilder,
  createMemoryPreferences,
  MemoryBackend,
} from '@extension/demo'
import * as windowIconImages from '@extension/ui/tab-manager/ui/windowIconImage'
import { describe, expect, it, vi } from 'vitest'
import { initializeTabManagerView } from './initializeTabManagerView'
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
  it('initializes the owning window after an early focus event and preserves later window choices', () => {
    const { backend, snapshot, preferences, environment } = setup()
    backend.restoreSnapshot({
      state: 'loading',
      revision: 0,
      windows: [],
      tabs: [],
      groups: [],
    })
    const view = createTabManagerView()
    const controller = createTabManagerController({
      backend,
      view,
      preferences,
      environment,
    })
    controller.dispatch({ type: 'view-window', windowId: 2 })
    backend.restoreSnapshot(snapshot)
    controller.reconcile()
    initializeTabManagerView(view, backend.getSnapshot(), 2)
    expect(
      projectTabManager(backend.getSnapshot(), view.getState()),
    ).toMatchObject({
      viewedWindowId: 2,
      selectedTabIds: [13],
    })
    controller.dispatch({ type: 'view-window', windowId: 1 })
    initializeTabManagerView(view, backend.getSnapshot(), 2)
    expect(
      projectTabManager(backend.getSnapshot(), view.getState()),
    ).toMatchObject({
      viewedWindowId: 1,
      selectedTabIds: [11],
    })
  })

  it('expands, collapses, and recolors selected groups with advertised shortcuts', async () => {
    const { controller, backend, view } = setup()
    for (const tabId of [11, 12])
      await backend.execute({ type: 'group-tabs', tabIds: [tabId] })
    const groups = backend.getSnapshot().groups
    groups.forEach((group, index) =>
      controller.dispatch({
        type: 'select-item',
        item: { type: 'group', id: group.id },
        toggle: index > 0,
      }),
    )
    const model = () =>
      projectTabManager(backend.getSnapshot(), view.getState())
    expect(model().actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'toggle-selected-groups',
          shortcut: 'E',
        }),
        expect.objectContaining({
          id: 'change-selected-group-color',
          shortcut: 'L',
        }),
      ]),
    )
    for (const collapsed of [true, false]) {
      await controller.dispatch({ type: 'navigate', key: 'e' })
      expect(
        backend.getSnapshot().groups.map((group) => !!group.collapsed),
      ).toEqual([collapsed, collapsed])
    }
    await controller.dispatch({ type: 'navigate', key: 'l' })
    expect(view.getState().actionPanel).toEqual({
      actionId: 'change-selected-group-color',
    })
    const colors = model().actions?.find(
      (action) => action.id === 'change-selected-group-color',
    )?.options
    expect(colors?.map(({ id, shortcut }) => [id, shortcut])).toEqual([
      ['grey', '1'],
      ['blue', '2'],
      ['red', '3'],
      ['yellow', '4'],
      ['green', '5'],
      ['pink', '6'],
      ['purple', '7'],
      ['cyan', '8'],
      ['orange', '9'],
    ])
    await controller.dispatch({
      type: 'run-action',
      actionId: 'change-selected-group-color',
      optionId: 'green',
    })
    expect(backend.getSnapshot().groups.map((group) => group.color)).toEqual([
      'green',
      'green',
    ])
  })

  it.each([
    ['x', 'close-duplicate-tabs', [10, 12, 14]],
    ['o', 'close-other-tabs', [10, 12, 13]],
    ['b', 'close-tabs-below', [10, 11, 12, 13]],
  ] as const)(
    'uses %s to close the matching tabs',
    async (key, actionId, remaining) => {
      const { controller, backend, view } = setup()
      const snapshot = backend.getSnapshot()
      const source = snapshot.tabs.find((tab) => tab.id === 11)!
      const remote = snapshot.tabs.find((tab) => tab.id === 13)!
      backend.restoreSnapshot({
        ...snapshot,
        tabs: [
          {
            ...source,
            id: 10,
            index: 0,
            active: false,
            pinned: true,
            url: 'https://pinned.test',
          },
          { ...source, index: 1, url: 'https://duplicate.test' },
          {
            ...source,
            id: 12,
            index: 2,
            active: false,
            url: 'https://duplicate.test',
          },
          {
            ...source,
            id: 14,
            index: 3,
            active: false,
            url: 'https://below.test',
          },
          { ...remote, url: 'https://duplicate.test' },
        ],
      })
      controller.dispatch({ type: 'focus-item', item: { type: 'tab', id: 12 } })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 12 },
      })
      expect(
        projectTabManager(backend.getSnapshot(), view.getState()).actions,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: actionId,
            shortcut: key.toUpperCase(),
          }),
        ]),
      )
      await controller.dispatch({ type: 'navigate', key })
      expect(
        backend
          .getSnapshot()
          .tabs.map((tab) => tab.id)
          .sort((a, b) => a - b),
      ).toEqual(remaining)
    },
  )

  it('dismisses selection menus and choosers when their window closes', async () => {
    const { backend, view, controller } = setup()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({ type: 'open-action-menu' })
    controller.dispatch({
      type: 'open-action-panel',
      actionId: 'move-selected-tabs',
    })
    await backend.execute({ type: 'close-window', windowId: 1 })
    controller.reconcile()
    expect(view.getState()).toMatchObject({
      viewedWindowId: 2,
      actionMenu: null,
      actionPanel: null,
      focusedItem: { type: 'tab', id: 13 },
    })
  })

  it('opens move and copy choosers for the focused selection and copies the chosen content', async () => {
    const resources = setup()
    const writeClipboardText = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { writeClipboardText },
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    for (const [key, actionId] of [
      ['w', 'move-selected-tabs'],
      ['c', 'copy-selected-tabs'],
    ] as const) {
      await controller.dispatch({ type: 'navigate', key })
      expect(resources.view.getState().actionPanel).toEqual({ actionId })
      if (key === 'c')
        await controller.dispatch({
          type: 'run-action',
          actionId,
          optionId: 'urls',
        })
      else await controller.dispatch({ type: 'navigate', key: 'Escape' })
    }
    expect(writeClipboardText).toHaveBeenCalledWith(
      resources.snapshot.tabs.find((tab) => tab.id === 12)!.url,
    )
  })

  it('discards eligible tabs and creates a tab below only a single selected tab', async () => {
    const { controller, backend } = setup()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    await controller.dispatch({ type: 'navigate', key: 'z' })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 11)?.discarded,
    ).toBeFalsy()
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
      toggle: true,
    })
    await controller.dispatch({ type: 'navigate', key: 'n' })
    expect(backend.getSnapshot().tabs).toHaveLength(3)
    await controller.dispatch({ type: 'navigate', key: 'z' })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 12)?.discarded,
    ).toBe(true)
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 11)?.discarded,
    ).toBeFalsy()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    await controller.dispatch({ type: 'navigate', key: 'n' })
    const tabs = backend
      .getSnapshot()
      .tabs.filter((tab) => tab.windowId === 1)
      .sort((a, b) => a.index - b.index)
    expect(tabs).toHaveLength(3)
    expect(tabs.map((tab) => tab.id).slice(0, 2)).toEqual([11, 12])
    expect(tabs[2]!.active).toBe(true)
  })

  it('reloads selected tabs without intercepting modified action keys', async () => {
    const { controller, backend } = setup()
    const execute = vi.spyOn(backend, 'execute')
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    await controller.dispatch({ type: 'navigate', key: 'r', toggle: true })
    expect(execute).not.toHaveBeenCalled()
    await controller.dispatch({ type: 'navigate', key: 'r' })
    expect(execute).toHaveBeenCalledWith({
      type: 'tab-action',
      action: 'reload',
      tabIds: [12],
    })
  })

  it('toggles pin and audio for the selection and falls back to an unselected focused tab', async () => {
    const { controller, backend, view } = setup()
    backend.restoreSnapshot({
      ...backend.getSnapshot(),
      tabs: backend
        .getSnapshot()
        .tabs.map((tab) => ({ ...tab, audible: true })),
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
      toggle: true,
    })
    controller.dispatch({ type: 'focus-item', item: { type: 'tab', id: 11 } })
    const selectedTabs = () =>
      backend.getSnapshot().tabs.filter((tab) => [11, 12].includes(tab.id))
    for (const [key, property] of [
      ['p', 'pinned'],
      ['m', 'muted'],
    ] as const) {
      await controller.dispatch({ type: 'navigate', key })
      expect(selectedTabs().map((tab) => tab[property])).toEqual([true, true])
      await controller.dispatch({ type: 'navigate', key })
      expect(selectedTabs().map((tab) => !!tab[property])).toEqual([
        false,
        false,
      ])
    }
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({ type: 'focus-item', item: { type: 'tab', id: 12 } })
    await controller.dispatch({ type: 'navigate', key: 'p' })
    expect(selectedTabs().map((tab) => !!tab.pinned)).toEqual([true, false])
    expect(view.getState().selection.selection.tabIds).toEqual(new Set([12]))
  })

  it('uses the existing group chooser and ungroup actions and respects unavailable actions', async () => {
    const { controller, backend, view } = setup()
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    await controller.dispatch({ type: 'navigate', key: 'g' })
    expect(view.getState().actionPanel).toEqual({
      actionId: 'group-selected-tabs',
    })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'group-selected-tabs',
      optionId: 'new',
    })
    controller.reconcile()
    const groupId = backend
      .getSnapshot()
      .tabs.find((tab) => tab.id === 11)!.groupId!
    controller.dispatch({
      type: 'select-item',
      item: { type: 'group', id: groupId },
    })
    await controller.dispatch({ type: 'navigate', key: 'p' })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 11)?.pinned,
    ).toBeFalsy()
    await controller.dispatch({ type: 'navigate', key: 'u' })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 11)?.groupId,
    ).toBeUndefined()
  })

  it('unpins only the requested tab and preserves selection and activation', async () => {
    const { backend, view, controller } = setup()
    await backend.execute({
      type: 'tab-action',
      action: 'pin',
      tabIds: [11, 12],
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    const selection = view.getState().selection
    await controller.dispatch({ type: 'unpin-tab', tabId: 12 })
    const tabs = backend.getSnapshot().tabs
    expect(tabs.find((tab) => tab.id === 12)?.pinned).toBe(false)
    expect(tabs.find((tab) => tab.id === 11)).toMatchObject({
      pinned: true,
      active: true,
    })
    expect(view.getState().selection).toEqual(selection)
  })

  it.each([
    ['urls', 1, 'Copied 1 URL to clipboard'],
    ['urls', 2, 'Copied 2 URLs to clipboard'],
    ['titles', 1, 'Copied 1 title to clipboard'],
    ['titles', 2, 'Copied 2 titles to clipboard'],
    ['titles-and-urls', 1, 'Copied 1 title and URL to clipboard'],
    ['titles-and-urls', 2, 'Copied 2 titles and URLs to clipboard'],
  ] as const)(
    'copies %s for %i tabs and confirms the clipboard contents',
    async (kind, count, message) => {
      const resources = setup()
      const writeClipboardText = vi.fn(async () => {})
      const controller = createTabManagerController({
        ...resources,
        host: { writeClipboardText },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 11 },
      })
      if (count === 2)
        controller.dispatch({
          type: 'select-item',
          item: { type: 'tab', id: 12 },
          toggle: true,
        })
      const model = projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
      )
      expect(
        model.actions?.find((action) => action.id === 'copy-selected-tabs'),
      ).toMatchObject({
        label:
          count === 1 ? 'Copy 1 title or URL' : `Copy ${count} titles or URLs`,
        options: [
          {
            id: 'urls',
            label: `Copy ${count} ${count === 1 ? 'URL' : 'URLs'}`,
          },
          {
            id: 'titles-and-urls',
            label: `Copy ${count} ${count === 1 ? 'title and URL' : 'titles and URLs'}`,
          },
          {
            id: 'titles',
            label: `Copy ${count} ${count === 1 ? 'title' : 'titles'}`,
          },
        ],
        icon: 'ClipboardCopy',
      })
      expect(
        model.actions?.find(
          (action) => action.id === 'duplicate-selected-tabs',
        ),
      ).toMatchObject({
        label: `Duplicate ${count} ${count === 1 ? 'tab' : 'tabs'}`,
      })
      const tabs = resources.snapshot.tabs
        .filter((tab) => tab.windowId === 1)
        .slice(0, count)
      await controller.dispatch({
        type: 'run-action',
        actionId: 'copy-selected-tabs',
        optionId: kind,
      })
      expect(writeClipboardText).toHaveBeenCalledExactlyOnceWith(
        tabs
          .map((tab) =>
            kind === 'urls'
              ? tab.url
              : kind === 'titles'
                ? tab.title
                : `${tab.title}\t${tab.url}`,
          )
          .join('\n'),
      )
      expect(resources.view.getState().notifications.items[0]?.message).toBe(
        message,
      )
      expect(resources.backend.getSnapshot().tabs).toEqual(
        resources.snapshot.tabs,
      )
    },
  )

  it('counts only links that are available to copy', async () => {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.snapshot,
      tabs: resources.snapshot.tabs.map((tab) =>
        tab.id === 12 ? { ...tab, url: '' } : tab,
      ),
    })
    const writeClipboardText = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { writeClipboardText },
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
      toggle: true,
    })
    const model = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
    )
    expect(
      model.actions?.find((action) => action.id === 'copy-selected-tabs'),
    ).toMatchObject({
      label: 'Copy 2 titles or URLs',
      options: [
        { id: 'urls', label: 'Copy 1 URL' },
        { id: 'titles-and-urls', label: 'Copy 2 titles and 1 URL' },
        { id: 'titles', label: 'Copy 2 titles' },
      ],
    })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'copy-selected-tabs',
      optionId: 'urls',
    })
    expect(writeClipboardText).toHaveBeenCalledExactlyOnceWith(
      resources.snapshot.tabs[0]!.url,
    )
    expect(resources.view.getState().notifications.items[0]?.message).toBe(
      'Copied 1 URL to clipboard',
    )
    await controller.dispatch({
      type: 'run-action',
      actionId: 'copy-selected-tabs',
      optionId: 'titles-and-urls',
    })
    expect(writeClipboardText).toHaveBeenLastCalledWith(
      `Tabby\t${resources.snapshot.tabs[0]!.url}\nNotes`,
    )
    expect(resources.view.getState().notifications.items[0]?.message).toBe(
      'Copied 2 titles and 1 URL to clipboard',
    )
  })

  it.each([
    ['url', 'Tabby', 'Copied 1 title to clipboard'],
    ['title', 'https://example.com/tab/11', 'Copied 1 URL to clipboard'],
  ] as const)(
    'confirms the available text when a combined copy has no %s',
    async (missing, text, message) => {
      const resources = setup()
      resources.backend.restoreSnapshot({
        ...resources.snapshot,
        tabs: resources.snapshot.tabs.map((tab) =>
          tab.id === 11 ? { ...tab, [missing]: '' } : tab,
        ),
      })
      const writeClipboardText = vi.fn(async () => {})
      const controller = createTabManagerController({
        ...resources,
        host: { writeClipboardText },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 11 },
      })
      const model = projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
      )
      expect(
        model.actions
          ?.find((action) => action.id === 'copy-selected-tabs')
          ?.options?.find((option) => option.id === 'titles-and-urls')?.label,
      ).toBe(
        missing === 'url'
          ? 'Copy 1 title and 0 URLs'
          : 'Copy 0 titles and 1 URL',
      )
      await controller.dispatch({
        type: 'run-action',
        actionId: 'copy-selected-tabs',
        optionId: 'titles-and-urls',
      })
      expect(writeClipboardText).toHaveBeenCalledExactlyOnceWith(text)
      expect(resources.view.getState().notifications.items[0]?.message).toBe(
        message,
      )
    },
  )

  it('disables an empty clipboard choice without overwriting the clipboard', async () => {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.snapshot,
      tabs: resources.snapshot.tabs.map((tab) => ({ ...tab, url: '' })),
    })
    const writeClipboardText = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { writeClipboardText },
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    const model = projectTabManager(
      resources.backend.getSnapshot(),
      resources.view.getState(),
    )
    expect(
      model.actions
        ?.find((action) => action.id === 'copy-selected-tabs')
        ?.options?.find((option) => option.id === 'urls'),
    ).toMatchObject({
      disabled: true,
      disabledReason: 'No text is available to copy.',
    })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'copy-selected-tabs',
      optionId: 'urls',
    })
    expect(writeClipboardText).not.toHaveBeenCalled()
    expect(resources.view.getState().notifications.items).toEqual([])
  })

  it('reports a clipboard failure without confirming a copy', async () => {
    const resources = setup()
    const controller = createTabManagerController({
      ...resources,
      host: {
        writeClipboardText: async () => {
          throw new Error('Clipboard blocked.')
        },
      },
    })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 11 } })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'copy-selected-tabs',
      optionId: 'urls',
    })
    expect(resources.view.getState().notifications.items).toMatchObject([
      { message: 'Clipboard blocked.', kind: 'error' },
    ])
  })

  it.each([
    { behavior: 'view', alternate: false, focused: 1, viewed: 2 },
    { behavior: 'view', alternate: true, focused: 2, viewed: 1 },
    { behavior: 'switch', alternate: false, focused: 2, viewed: 1 },
    { behavior: 'switch', alternate: true, focused: 1, viewed: 2 },
  ] as const)(
    'chooses a window with default $behavior and alternate $alternate',
    async ({ behavior, alternate, focused, viewed }) => {
      const resources = setup()
      await resources.preferences.set({
        tabManagerWindowClickBehavior: behavior,
      })
      const controller = createTabManagerController({
        ...resources,
        host: {
          getCurrentWindowId: () => 1,
          openWindowTabManager: async () => {},
        },
      })
      controller.dispatch({ type: 'open-window-picker' })
      await controller.dispatch({
        type: 'choose-window',
        windowId: 2,
        alternate,
      })
      expect(
        resources.backend.getSnapshot().windows.find((window) => window.focused)
          ?.id,
      ).toBe(focused)
      expect(resources.view.getState().viewedWindowId).toBe(viewed)
      expect(resources.view.getState().windowPicker).toBe(false)
    },
  )

  it('clears ordinary row selection at creation controls and preserves explicit multiple selection', () => {
    const { backend, view, controller } = setup()
    const selected = () =>
      projectTabManager(backend.getSnapshot(), view.getState()).selectedTabIds
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

  it('preserves selection when the picker is canceled or the same window is chosen, and starts with the active tab on a real switch', async () => {
    const { backend, view, controller } = setup()
    const selected = () =>
      projectTabManager(backend.getSnapshot(), view.getState()).selectedTabIds
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    controller.dispatch({ type: 'open-window-picker' })
    controller.dispatch({ type: 'navigate', key: 'Escape' })
    expect(selected()).toEqual([12])
    controller.dispatch({ type: 'open-window-picker' })
    controller.dispatch({ type: 'view-window', windowId: 1 })
    expect(view.getState().windowPicker).toBe(false)
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
      projectTabManager(backend.getSnapshot(), view.getState()).selectedTabIds,
    ).toEqual([12])
    expect(view.getState().selection.selection.groupIds.size).toBe(0)
    controller.dispatch({ type: 'navigate', key: 'a', toggle: true })
    expect(
      projectTabManager(backend.getSnapshot(), view.getState()).selectedTabIds,
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
      projectTabManager(backend.getSnapshot(), view.getState()).selectedTabIds,
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

  it('selects a remaining tab after moves and retains failed moves for retry', async () => {
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

    const model = projectTabManager(backend.getSnapshot(), view.getState())
    expect(model.duplicateTabIds).toEqual([11, 21, 22])
    expect(
      model.actions?.find((action) => action.id === 'close-duplicate-tabs')
        ?.label,
    ).toBe('Remove 2 duplicates')

    await controller.dispatch({
      type: 'run-action',
      actionId: 'close-duplicate-tabs',
    })

    expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([11, 12])
    const updatedModel = projectTabManager(
      backend.getSnapshot(),
      view.getState(),
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
        projectTabManager(backend.getSnapshot(), view.getState())
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
      projectTabManager(left.backend.getSnapshot(), left.view.getState())
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

  it('keeps a valid view stable', () => {
    const { snapshot, view } = setup()
    const state = reconcileTabManagerView(snapshot, view.getState())
    expect(reconcileTabManagerView(snapshot, state)).toBe(state)
  })

  it.each([false, true])(
    'moves removed tab focus to the active tab in the viewed window (collapsed group: %s)',
    (collapsed) => {
      const { snapshot, view } = setup()
      const state = {
        ...view.getState(),
        focusedItem: { type: 'tab' as const, id: 14 },
      }
      const next = {
        ...snapshot,
        groups: [{ id: 101, windowId: 1, color: 'blue' as const, collapsed }],
        tabs: snapshot.tabs.map((tab) => ({
          ...tab,
          active: tab.id !== 11,
          ...(tab.id === 12 ? { groupId: 101 } : {}),
        })),
      }
      expect(reconcileTabManagerView(next, state).focusedItem).toEqual(
        collapsed ? { type: 'group', id: 101 } : { type: 'tab', id: 12 },
      )
      expect(
        reconcileTabManagerView(next, {
          ...state,
          focusedItem: { type: 'tab', id: 11 },
        }).focusedItem,
      ).toEqual({ type: 'tab', id: 11 })
    },
  )

  it.each([
    { closing: 12, expected: 14 },
    { closing: 14, expected: 12 },
    { closing: 15, expected: 16 },
    { closing: 16, expected: 15 },
    { closing: 12, expected: 14, singleton: true },
    { closing: 12, expected: 16, active: true },
  ])(
    'recovers closed tab $closing to tab $expected using its browser history',
    ({ closing, expected, singleton, active }) => {
      const { backend, view, controller, snapshot } = setup()
      const previous = {
        ...snapshot,
        groups: [{ id: 101, windowId: 1, color: 'blue' as const }],
        tabs: [11, 12, 14, 15, 16].map((id, index) => ({
          id,
          index,
          windowId: 1,
          title: `Tab ${id}`,
          active: id === (active ? closing : 11),
          groupId: (singleton ? [12] : [12, 14]).includes(id) ? 101 : undefined,
        })),
      }
      backend.restoreSnapshot(previous)
      controller.reconcile()
      view.setState({ focusedItem: { type: 'tab', id: closing } })
      const next = {
        ...previous,
        tabs: previous.tabs
          .filter((tab) => tab.id !== closing)
          .map((tab, index) => ({
            ...tab,
            index,
            active: active ? tab.id === expected : tab.active,
          })),
      }
      backend.restoreSnapshot(next)
      const target = { type: 'tab', id: expected }
      expect(
        projectTabManager(
          next,
          view.getState(),
          {},
          controller.getPreviousSnapshot(),
        ).focusedItem,
      ).toEqual(target)
      controller.reconcile()
      expect(view.getState().focusedItem).toEqual(target)
      expect(backend.getSnapshot().tabs.find((tab) => tab.active)?.id).toBe(
        active ? expected : 11,
      )
    },
  )

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
    await resources.controller.dispatch({ type: 'create-tab', windowId: 1 })
    const createdTab = resources.backend
      .getSnapshot()
      .tabs.find(
        (tab) =>
          !resources.snapshot.tabs.some((initial) => initial.id === tab.id),
      )!
    expect(createdTab).toMatchObject({ windowId: 1, active: true })
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
    ).toBe(1)
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
    )
    expect(
      model.actions
        ?.find((action) => action.id === 'move-selected-tabs')
        ?.options?.map((option) => option.id),
    ).not.toContain('new')
  })

  it('opens immediately and saves the first favicon through pending Reset and later tab changes', async () => {
    const image = Promise.withResolvers<string>()
    const prepare = vi
      .spyOn(windowIconImages, 'windowIconImage')
      .mockImplementation(() => image.promise)
    try {
      const { backend, snapshot, view, controller } = setup()
      backend.restoreSnapshot({
        ...snapshot,
        tabs: snapshot.tabs.map((tab) => ({
          ...tab,
          faviconUrl: tab.id === 11 ? '/original.png' : '/later.png',
        })),
      })
      const editing = controller.dispatch({ type: 'edit-window' })
      expect(view.getState().editingWindow).toMatchObject({
        name: 'Tabby',
        iconChoices: { monogram: 'monogram:T' },
      })
      const emoji = view.getState().editingWindow?.iconChoices?.emoji
      expect(emoji).toMatch(/^emoji:/)
      const resetting = controller.dispatch({ type: 'reset-window' })
      await backend.execute({ type: 'activate-tab', tabId: 12 })
      controller.dispatch({ type: 'cancel-window-edit' })
      const reopening = controller.dispatch({ type: 'edit-window' })
      expect(prepare).toHaveBeenCalledExactlyOnceWith('/original.png')
      const png = 'data:image/png;base64,YQ=='
      image.resolve(png)
      await Promise.all([editing, resetting, reopening])
      expect(backend.getSnapshot().windows[0]).toMatchObject({
        useCustom: true,
        iconChoices: {
          emoji,
          monogram: 'monogram:T',
          favicon: `favicon:${png}`,
        },
      })
      await controller.dispatch({ type: 'reset-window' })
      await controller.dispatch({ type: 'edit-window' })
      expect(view.getState().editingWindow?.iconChoices).toMatchObject({
        emoji,
        monogram: 'monogram:T',
        favicon: `favicon:${png}`,
      })
      expect(prepare).toHaveBeenCalledTimes(1)
    } finally {
      prepare.mockRestore()
    }
  })

  it('restores remembered settings when reopened while Reset is still saving', async () => {
    const blocked = Promise.withResolvers<void>()
    const started = Promise.withResolvers<void>()
    const { backend, view, controller } = setup({
      beforeExecute: async (command) => {
        if (command.type === 'name-window' && command.useCustom === false) {
          started.resolve()
          await blocked.promise
        }
      },
    })
    await controller.dispatch({ type: 'edit-window' })
    await controller.dispatch({
      type: 'change-window-draft',
      value: { name: 'Research', icon: 'book', iconColor: 'green' },
    })
    const reset = controller.dispatch({ type: 'reset-window' })
    await started.promise
    controller.dispatch({ type: 'cancel-window-edit' })
    const reopening = controller.dispatch({ type: 'edit-window' })
    expect(view.getState().editingWindow).toMatchObject({
      name: 'Research',
      icon: 'book',
      iconColor: 'green',
      useCustom: true,
    })
    blocked.resolve()
    await Promise.all([reset, reopening])
    expect(backend.getSnapshot().windows[0]).toMatchObject({
      name: 'Research',
      icon: 'book',
      iconColor: 'green',
      useCustom: true,
    })
    expect(view.getState().editingWindow).not.toBeNull()
  })

  it('keeps the saved custom settings and editor when Reset fails', async () => {
    const { backend, view, controller } = setup({
      beforeExecute: (command) => {
        if (command.type === 'name-window' && command.useCustom === false)
          throw new Error('Storage unavailable')
      },
    })
    await controller.dispatch({ type: 'edit-window' })
    await controller.dispatch({
      type: 'change-window-draft',
      value: { name: 'Research', icon: 'book', iconColor: 'green' },
    })
    await controller.dispatch({ type: 'reset-window' })
    expect(view.getState().editingWindow).toMatchObject({
      name: 'Research',
      useCustom: true,
    })
    expect(backend.getSnapshot().windows[0]).toMatchObject({
      name: 'Research',
      useCustom: true,
    })
    expect(view.getState().notifications.items[0]).toMatchObject({
      kind: 'error',
      message: 'Storage unavailable',
    })
  })

  it('applies identity changes in order, retains the editor on window focus, and switches between custom and tab defaults', async () => {
    const resources = setup()
    await resources.preferences.set({ tabManagerCompactIconMode: 'first' })
    const random = vi.fn().mockReturnValue(0.5)
    const controller = createTabManagerController({
      ...resources,
      environment: { ...resources.environment, random },
    })
    await controller.dispatch({ type: 'edit-window' })
    expect(resources.view.getState().editingWindow).toMatchObject({
      name: 'Tabby',
      icon: 'music',
      iconColor: 'green',
      useCustom: true,
    })
    expect(resources.backend.getSnapshot().windows[0]).toMatchObject({
      name: 'Tabby',
      icon: 'music',
      iconColor: 'green',
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
    expect(resources.backend.getSnapshot().windows[0]).toMatchObject({
      name: 'Research',
      icon: 'book',
      iconColor: 'red',
      useCustom: false,
    })
    expect(
      projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
      ).windows[0],
    ).toMatchObject({
      title: 'Tabby',
      name: undefined,
      icon: undefined,
      iconColor: undefined,
    })
    expect(resources.preferences.getSnapshot().tabManagerCompactIconMode).toBe(
      'first',
    )
    expect(resources.view.getState().editingWindow).toBeNull()
    random.mockReturnValue(0)
    await controller.dispatch({ type: 'edit-window' })
    expect(resources.view.getState().editingWindow).toMatchObject({
      name: 'Research',
      icon: 'book',
      iconColor: 'red',
      useCustom: true,
    })
    expect(random).toHaveBeenCalledTimes(3)
    await controller.dispatch({
      type: 'change-window-draft',
      value: { name: '' },
    })
    await controller.dispatch({ type: 'reset-window' })
    await controller.dispatch({ type: 'edit-window' })
    expect(resources.view.getState().editingWindow).toMatchObject({
      name: '',
      icon: 'book',
      iconColor: 'red',
      useCustom: true,
    })
  })

  it('selects the active tab by default and after Escape, and permits an explicitly empty selection', async () => {
    const resources = setup()
    resources.controller.reconcile()
    const selected = () =>
      projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
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

  it('activates a remote tab with Enter and opens its manager, while local activation keeps its manager', async () => {
    const resources = setup()
    const openWindowTabManager = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { getCurrentWindowId: () => 2, openWindowTabManager },
    })
    controller.dispatch({ type: 'view-window', windowId: 1 })
    controller.dispatch({ type: 'select-item', item: { type: 'tab', id: 12 } })
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 12)?.active,
    ).toBe(false)
    expect(openWindowTabManager).not.toHaveBeenCalled()
    await controller.dispatch({ type: 'navigate', key: 'Enter' })
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 12)?.active,
    ).toBe(true)
    expect(
      resources.backend.getSnapshot().windows.find((window) => window.focused)
        ?.id,
    ).toBe(1)
    expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(1)
    openWindowTabManager.mockClear()
    controller.dispatch({ type: 'view-window', windowId: 2 })
    controller.dispatch({ type: 'focus-item', item: { type: 'tab', id: 13 } })
    await controller.dispatch({ type: 'navigate', key: 'Enter' })
    expect(
      resources.backend.getSnapshot().tabs.find((tab) => tab.id === 13)?.active,
    ).toBe(true)
    expect(
      resources.backend.getSnapshot().windows.find((window) => window.focused)
        ?.id,
    ).toBe(2)
    expect(openWindowTabManager).not.toHaveBeenCalled()
  })

  it('keeps the destination manager closed when tab activation fails', async () => {
    const resources = setup({
      beforeExecute: () => {
        throw new Error('Could not activate this tab.')
      },
    })
    const openWindowTabManager = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { getCurrentWindowId: () => 2, openWindowTabManager },
    })
    await controller.dispatch({ type: 'activate-tab', tabId: 12 })
    expect(openWindowTabManager).not.toHaveBeenCalled()
    expect(resources.view.getState().notifications.items.at(-1)?.message).toBe(
      'Could not activate this tab.',
    )
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

describe('moving preserves the displayed window', () => {
  it.each([
    { group: false, follow: false, defaultFollow: false },
    { group: false, follow: true, defaultFollow: false },
    { group: true, follow: false, defaultFollow: false },
    { group: true, follow: true, defaultFollow: false },
    { group: false, follow: false, defaultFollow: true },
    { group: false, follow: true, defaultFollow: true },
    { group: true, follow: false, defaultFollow: true },
    { group: true, follow: true, defaultFollow: true },
  ])(
    'moves with group=$group, modifier=$follow, defaultFollow=$defaultFollow',
    async ({ group, follow, defaultFollow }) => {
      const resources = setup()
      await resources.preferences.set({
        tabManagerWindowClickBehavior: defaultFollow ? 'switch' : 'view',
      })
      const follows = defaultFollow !== follow
      if (group)
        resources.backend.restoreSnapshot({
          ...resources.backend.getSnapshot(),
          groups: [{ id: 5, windowId: 1, title: 'Notes', color: 'blue' }],
          tabs: resources.backend
            .getSnapshot()
            .tabs.map((tab) => (tab.id === 12 ? { ...tab, groupId: 5 } : tab)),
        })
      const openWindowTabManager = vi.fn(async () => {})
      const controller = createTabManagerController({
        ...resources,
        host: { getCurrentWindowId: () => 1, openWindowTabManager },
      })
      await controller.dispatch({
        type: 'select-item',
        item: group ? { type: 'group', id: 5 } : { type: 'tab', id: 12 },
      })
      await controller.dispatch(
        group
          ? {
              type: 'run-action',
              actionId: 'move-selected-tabs',
              optionId: 'new',
              follow,
            }
          : { type: 'place-tabs', tabIds: [12], windowId: 2, follow },
      )
      const snapshot = resources.backend.getSnapshot()
      const moved = snapshot.tabs.find((tab) => tab.id === 12)!
      expect(moved.windowId).not.toBe(1)
      expect(resources.view.getState().viewedWindowId).toBe(1)
      expect(resources.view.getState().selection.selection.tabIds).toEqual(
        new Set([11]),
      )
      expect(snapshot.windows.find((window) => window.focused)?.id).toBe(
        follows ? moved.windowId : 1,
      )
      if (follows)
        expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(
          moved.windowId,
          [12],
        )
      else expect(openWindowTabManager).not.toHaveBeenCalled()
      if (group)
        expect(snapshot.groups.find((group) => group.id === 5)?.windowId).toBe(
          moved.windowId,
        )
    },
  )

  it('keeps the source view and selects moved tabs only in a panel showing the destination', async () => {
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
        follow: true,
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
      expect(resources.view.getState().viewedWindowId).toBe(1)
      expect(resources.view.getState().selection.selection.tabIds).toEqual(
        new Set([11]),
      )
      controller.dispatch({ type: 'view-window', windowId: tab.windowId })
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
    follow: true,
  })
  expect(resources.backend.getSnapshot().groups).toEqual([
    { id: 5, windowId: 2, color: 'blue', collapsed: false },
    { id: 6, windowId: 2, color: 'blue', collapsed: false },
  ])
})

it('activates the first transferred tab while keeping focus in the source panel', async () => {
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
        ? { type: 'place-tabs', tabIds: [12, 11], windowId: 2, follow: true }
        : {
            type: 'run-action',
            actionId: 'move-selected-tabs',
            optionId: '2',
            follow: true,
          },
    )
    expect(
      resources.backend
        .getSnapshot()
        .tabs.find((tab) => tab.windowId === 2 && tab.active)?.id,
    ).toBe(11)
    expect(resources.view.getState().focusedItem).toEqual({
      type: 'tab',
      id: 14,
    })
    expect(resources.view.getState().viewedWindowId).toBe(1)
  }
})

describe('adjacent tab creation', () => {
  it('keeps the displayed window when a tab is created in another window', async () => {
    const { backend, view, controller } = setup()
    controller.reconcile()
    await controller.dispatch({ type: 'create-tab', windowId: 2 })
    expect(
      backend.getSnapshot().tabs.filter((tab) => tab.windowId === 2),
    ).toHaveLength(2)
    expect(view.getState().viewedWindowId).toBe(1)
    expect(view.getState().selection.selection.tabIds).toEqual(new Set([11]))
  })

  it('creates and selects a tab below the chosen row', async () => {
    const { backend, view, controller } = setup()
    const select = (id: number, toggle = false) =>
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id },
        toggle,
      })
    const model = () =>
      projectTabManager(backend.getSnapshot(), view.getState())
    await select(11)
    await controller.dispatch({ type: 'run-action', actionId: 'new-tab-below' })
    const created = backend
      .getSnapshot()
      .tabs.find((tab) => tab.windowId === 1 && tab.id !== 11 && tab.id !== 12)!
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1)
        .map((tab) => tab.id),
    ).toEqual([11, created.id, 12])
    expect(created.active).toBe(true)
    expect(model().selectedTabIds).toEqual([created.id])
  })
})

describe('group destinations and window focus', () => {
  it.each([
    { defaultFollow: false, shift: false },
    { defaultFollow: false, shift: true },
    { defaultFollow: true, shift: false },
    { defaultFollow: true, shift: true },
  ])(
    'groups across windows with defaultFollow=$defaultFollow and Shift=$shift',
    async ({ defaultFollow, shift }) => {
      const resources = setup()
      const initial = resources.backend.getSnapshot()
      resources.backend.restoreSnapshot({
        ...initial,
        windows: initial.windows.map((window) =>
          window.id === 2 ? { ...window, name: 'Reading' } : window,
        ),
        groups: [
          {
            id: 6,
            windowId: 2,
            title: 'Remote group',
            color: 'red',
            collapsed: true,
          },
          { id: 7, windowId: 1, title: 'Local group', color: 'blue' },
        ],
        tabs: initial.tabs.map((tab) =>
          tab.id === 11 ? { ...tab, groupId: 7 } : tab,
        ),
      })
      await resources.preferences.set({
        tabManagerWindowClickBehavior: defaultFollow ? 'switch' : 'view',
      })
      const openWindowTabManager = vi.fn(async () => {})
      const controller = createTabManagerController({
        ...resources,
        host: { getCurrentWindowId: () => 1, openWindowTabManager },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 12 },
      })
      const model = projectTabManager(
        resources.backend.getSnapshot(),
        resources.view.getState(),
      )
      const options = model.actions?.find(
        (action) => action.id === 'group-selected-tabs',
      )?.options
      expect(options?.map((option) => option.id)).toEqual(['7', '6', 'new'])
      expect(options?.[0]?.windowLabel).toBeUndefined()
      expect(options?.[1]).toMatchObject({
        windowLabel: 'Reading',
        destinationWindowId: 2,
      })
      await controller.dispatch({
        type: 'run-action',
        actionId: 'group-selected-tabs',
        optionId: '6',
        follow: shift,
      })
      const snapshot = resources.backend.getSnapshot()
      expect(snapshot.tabs.find((tab) => tab.id === 12)).toMatchObject({
        windowId: 2,
        groupId: 6,
      })
      const follows = defaultFollow !== shift
      expect(resources.view.getState().viewedWindowId).toBe(1)
      expect(snapshot.windows.find((window) => window.focused)?.id).toBe(
        follows ? 2 : 1,
      )
      if (follows) {
        expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(2, [12])
        expect(snapshot.groups.find((group) => group.id === 6)?.collapsed).toBe(
          false,
        )
      } else expect(openWindowTabManager).not.toHaveBeenCalled()
    },
  )

  it.each([
    { defaultFollow: false, shift: false, group: false },
    { defaultFollow: true, shift: true, group: false },
    { defaultFollow: false, shift: false, group: true },
  ])(
    'always follows when the hosting window closes: $defaultFollow / $shift / $group',
    async ({ defaultFollow, shift, group }) => {
      const resources = setup()
      if (group)
        resources.backend.restoreSnapshot({
          ...resources.snapshot,
          groups: [{ id: 6, windowId: 2, color: 'red' }],
        })
      await resources.preferences.set({
        tabManagerWindowClickBehavior: defaultFollow ? 'switch' : 'view',
      })
      const openWindowTabManager = vi.fn(async () => {})
      const controller = createTabManagerController({
        ...resources,
        host: { getCurrentWindowId: () => 1, openWindowTabManager },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 11 },
      })
      controller.dispatch({
        type: 'select-item',
        item: { type: 'tab', id: 12 },
        toggle: true,
      })
      await controller.dispatch({
        type: 'run-action',
        actionId: group ? 'group-selected-tabs' : 'move-selected-tabs',
        optionId: group ? '6' : 'new',
        follow: shift,
      })
      const snapshot = resources.backend.getSnapshot()
      const destination = snapshot.tabs.find((tab) => tab.id === 11)!.windowId
      expect(destination).not.toBe(1)
      expect(snapshot.windows.find((window) => window.focused)?.id).toBe(
        destination,
      )
      expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(
        destination,
        [11, 12],
      )
    },
  )

  it('follows a group destination when a remote source window is emptied', async () => {
    const resources = setup()
    resources.backend.restoreSnapshot({
      ...resources.snapshot,
      windows: [
        ...resources.snapshot.windows,
        { id: 3, type: 'normal', incognito: false },
      ],
      groups: [{ id: 30, windowId: 3, color: 'green' }],
    })
    resources.view.setState({ viewedWindowId: 2 })
    const tabs = resources.snapshot.tabs
      .filter((tab) => tab.windowId === 2)
      .map((tab) => tab.id)
    const openWindowTabManager = vi.fn(async () => {})
    const controller = createTabManagerController({
      ...resources,
      host: { getCurrentWindowId: () => 1, openWindowTabManager },
    })
    controller.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: tabs[0]! },
    })
    await controller.dispatch({
      type: 'run-action',
      actionId: 'group-selected-tabs',
      optionId: '30',
    })
    expect(
      resources.backend.getSnapshot().windows.find((window) => window.focused)
        ?.id,
    ).toBe(3)
    expect(resources.view.getState().viewedWindowId).toBe(1)
    expect(resources.view.getState().selection.selection.tabIds).toEqual(
      new Set([11]),
    )
    expect(openWindowTabManager).toHaveBeenCalledExactlyOnceWith(3, tabs)
  })
})
