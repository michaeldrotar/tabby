import { describe, expect, it, vi } from 'vitest'
import {
  formatBatchTabCopyText,
  getGroupActionBlockReason,
  getMoveBlockReason,
  getSingleGroupRenameState,
  getTabDiscardSelectionCounts,
  isSelectionItemRepresented,
  resolveSelectedTabIds,
  resolveSelectionItemTabIds,
  runBatchAddToGroup,
  runBatchClipboardAction,
  runBatchClose,
  runBatchCreateGroup,
  runBatchDiscardAction,
  runBatchGroupAction,
  runBatchMoveToNewWindow,
  runBatchMoveToWindow,
  runBatchTabAction,
  runBatchWindowAction,
} from './batchTabActions'
import type { SelectionSnapshot } from '../selection/SelectionModel'
import type { BatchTabActionPorts, BatchTabSnapshot } from './batchTabActions'

const snapshot: BatchTabSnapshot = {
  windows: [
    { id: 10, type: 'normal', incognito: false },
    { id: 20, type: 'normal', incognito: false },
    { id: 30, type: 'normal', incognito: true },
  ],
  groups: [
    { id: 100, windowId: 10 },
    { id: 200, windowId: 20 },
  ],
  tabs: [
    { id: 1, windowId: 10, index: 2, groupId: 100 },
    { id: 2, windowId: 10, index: 0, active: true },
    { id: 3, windowId: 20, index: 1 },
    { id: 4, windowId: 20, index: 0, groupId: 200, active: true },
    { id: 5, windowId: 30, index: 0, active: true },
  ],
}

const selection = (
  windowIds: number[] = [],
  groupIds: number[] = [],
  tabIds: number[] = [],
  expandedWindowIds: number[] = [],
): SelectionSnapshot => ({
  windowIds: new Set(windowIds),
  expandedWindowIds: new Set(expandedWindowIds),
  groupIds: new Set(groupIds),
  tabIds: new Set(tabIds),
})

const createPorts = (
  overrides: Partial<BatchTabActionPorts> = {},
): BatchTabActionPorts => ({
  closeTab: async () => {},
  moveTab: async () => {},
  moveFirstTabToNewWindow: async () => 99,
  addTabToGroup: async () => {},
  createGroupWithTab: async () => 700,
  performTabAction: async () => {},
  performWindowAction: async () => {},
  performGroupAction: async () => {},
  writeClipboardText: async () => {},
  ...overrides,
})

describe('batchTabActions', () => {
  it('resolves selected tabs from windows, groups, and tabs once in stable order', () => {
    expect(
      resolveSelectedTabIds(selection([10], [100], [3, 1]), snapshot),
    ).toEqual([2, 1, 3])
  })

  it('resolves focused rows and detects rows represented by selected parents', () => {
    expect(
      resolveSelectionItemTabIds({ type: 'window', id: 20 }, snapshot),
    ).toEqual([4])
    expect(
      resolveSelectedTabIds(selection([20], [], [], [20]), snapshot),
    ).toEqual([4, 3])
    expect(
      resolveSelectionItemTabIds({ type: 'group', id: 100 }, snapshot),
    ).toEqual([1])
    expect(
      resolveSelectionItemTabIds({ type: 'tab', id: 2 }, snapshot),
    ).toEqual([2])
    expect(
      isSelectionItemRepresented(
        { type: 'tab', id: 2 },
        selection([10]),
        snapshot,
      ),
    ).toBe(true)
    expect(
      isSelectionItemRepresented(
        { type: 'group', id: 100 },
        selection([10]),
        snapshot,
      ),
    ).toBe(true)
    expect(
      isSelectionItemRepresented(
        { type: 'window', id: 10 },
        selection([], [], [1]),
        snapshot,
      ),
    ).toBe(false)
  })

  it('blocks grouping across windows and moving between privacy modes', () => {
    expect(getGroupActionBlockReason([1, 3], snapshot)).toBe(
      'Selected tabs must be in the same window.',
    )
    expect(getMoveBlockReason([1], snapshot, 30)).toBe(
      'Tabs cannot be moved between regular and incognito windows.',
    )
  })

  it('counts discardable, active, and already-discarded selected tabs separately', () => {
    expect(
      getTabDiscardSelectionCounts([
        { active: false, discarded: false },
        { active: true, discarded: false },
        { active: false, discarded: true },
      ]),
    ).toEqual({
      discardableCount: 1,
      activeCount: 1,
      alreadyDiscardedCount: 1,
    })
  })

  it('derives group rename visibility and enabled state from selection type and count', () => {
    expect(getSingleGroupRenameState(selection([], [], [1]))).toEqual({
      visible: false,
      enabled: false,
    })
    expect(getSingleGroupRenameState(selection([], [100]))).toEqual({
      visible: true,
      enabled: true,
    })

    const multipleGroups = getSingleGroupRenameState(selection([], [100, 200]))
    expect(multipleGroups.visible).toBe(true)
    expect(multipleGroups.enabled).toBe(false)
    expect(multipleGroups.reason).toContain('exactly one')

    const mixed = getSingleGroupRenameState(selection([], [100], [1]))
    expect(mixed.visible).toBe(true)
    expect(mixed.enabled).toBe(false)
  })

  it('reports close results per tab when some API calls fail', async () => {
    const closeTab = vi.fn(async (tabId: number) => {
      if (tabId === 2) throw new Error('tab disappeared')
    })

    await expect(
      runBatchClose([1, 2, 3], createPorts({ closeTab })),
    ).resolves.toEqual({
      requestedIds: [1, 2, 3],
      succeededIds: [1, 3],
      failures: [{ tabId: 2, message: 'tab disappeared' }],
    })
    expect(closeTab).toHaveBeenCalledTimes(3)
  })

  it('discards eligible tabs and reports skipped tabs and individual failures', async () => {
    const discardSnapshot: BatchTabSnapshot = {
      ...snapshot,
      tabs: [
        { id: 1, windowId: 10, index: 0, pinned: true },
        { id: 2, windowId: 10, index: 1, active: true },
        { id: 3, windowId: 10, index: 2, discarded: true },
        { id: 6, windowId: 20, index: 0 },
      ],
    }
    const calls: number[] = []
    const result = await runBatchDiscardAction(
      [1, 2, 3, 6, 999],
      discardSnapshot,
      createPorts({
        performTabAction: async (action, tabId) => {
          expect(action).toBe('discard')
          calls.push(tabId)
          if (tabId === 6) throw new Error('tab became active')
        },
      }),
    )

    expect(calls).toEqual([1, 6])
    expect(result).toEqual({
      requestedIds: [1, 2, 3, 6, 999],
      succeededIds: [1],
      failures: [
        { tabId: 999, message: 'The tab is no longer available.' },
        { tabId: 6, message: 'tab became active' },
      ],
      skippedActiveIds: [2],
      skippedAlreadyDiscardedIds: [3],
    })
  })

  it('skips tabs already in a move target and preserves the selected order', async () => {
    const calls: number[] = []
    const result = await runBatchMoveToWindow(
      [1, 3, 4],
      10,
      new Map(snapshot.tabs.map((tab) => [tab.id, tab.windowId])),
      createPorts({
        moveTab: async (tabId) => {
          calls.push(tabId)
          if (tabId === 3) throw new Error('move failed')
        },
      }),
    )

    expect(calls).toEqual([3, 4])
    expect(result).toEqual({
      requestedIds: [1, 3, 4],
      succeededIds: [1, 4],
      failures: [{ tabId: 3, message: 'move failed' }],
    })
  })

  it('creates one new window and continues after an individual move failure', async () => {
    const calls: string[] = []
    const result = await runBatchMoveToNewWindow(
      [1, 2, 3],
      createPorts({
        moveFirstTabToNewWindow: async (tabId) => {
          calls.push(`create:${tabId}`)
          return 99
        },
        moveTab: async (tabId, windowId) => {
          calls.push(`move:${tabId}:${windowId}`)
          if (tabId === 2) throw new Error('tab is gone')
        },
      }),
    )

    expect(calls).toEqual(['create:1', 'move:2:99', 'move:3:99'])
    expect(result).toEqual({
      requestedIds: [1, 2, 3],
      succeededIds: [1, 3],
      failures: [{ tabId: 2, message: 'tab is gone' }],
      createdTargetId: 99,
    })
  })

  it('reports every requested tab when destination creation fails', async () => {
    const moveTab = vi.fn(async () => {})
    const result = await runBatchMoveToNewWindow(
      [1, 2],
      createPorts({
        moveFirstTabToNewWindow: async () => {
          throw new Error('cannot create window')
        },
        moveTab,
      }),
    )

    expect(moveTab).not.toHaveBeenCalled()
    expect(result.succeededIds).toEqual([])
    expect(result.failures).toEqual([
      { tabId: 1, message: 'cannot create window' },
      { tabId: 2, message: 'cannot create window' },
    ])
  })

  it('creates one group and reports partial add failures', async () => {
    const calls: string[] = []
    const result = await runBatchCreateGroup(
      [1, 2, 3],
      10,
      createPorts({
        createGroupWithTab: async (tabId, windowId) => {
          calls.push(`create:${tabId}:${windowId}`)
          return 700
        },
        addTabToGroup: async (tabId, groupId) => {
          calls.push(`add:${tabId}:${groupId}`)
          if (tabId === 2) throw new Error('tab moved meanwhile')
        },
      }),
    )

    expect(calls).toEqual(['create:1:10', 'add:2:700', 'add:3:700'])
    expect(result).toEqual({
      requestedIds: [1, 2, 3],
      succeededIds: [1, 3],
      failures: [{ tabId: 2, message: 'tab moved meanwhile' }],
      createdTargetId: 700,
    })
  })

  it('adds existing group members sequentially and retains individual errors', async () => {
    const calls: number[] = []
    const result = await runBatchAddToGroup(
      [1, 2],
      200,
      createPorts({
        addTabToGroup: async (tabId) => {
          calls.push(tabId)
          if (tabId === 1) throw new Error('invalid group target')
        },
      }),
    )

    expect(calls).toEqual([1, 2])
    expect(result.succeededIds).toEqual([2])
    expect(result.failures).toEqual([
      { tabId: 1, message: 'invalid group target' },
    ])
  })

  it('runs additional tab actions through injected ports and reports partial failure', async () => {
    const calls: Array<[string, number]> = []
    const result = await runBatchTabAction(
      [2, 3],
      'pin',
      createPorts({
        performTabAction: async (action, tabId) => {
          calls.push([action, tabId])
          if (tabId === 3) throw new Error('tab is unavailable')
        },
      }),
    )

    expect(calls).toEqual([
      ['pin', 2],
      ['pin', 3],
    ])
    expect(result).toEqual({
      requestedIds: [2, 3],
      succeededIds: [2],
      failures: [{ tabId: 3, message: 'tab is unavailable' }],
    })
  })

  it('formats selected tab data and writes one clipboard payload through a port', async () => {
    const tabs = [
      {
        id: 1,
        windowId: 10,
        index: 0,
        title: 'First',
        url: 'https://one.test',
      },
      {
        id: 2,
        windowId: 10,
        index: 1,
        title: 'Second',
        url: 'https://two.test',
      },
    ]
    expect(formatBatchTabCopyText(tabs, 'urls')).toBe(
      'https://one.test\nhttps://two.test',
    )
    expect(formatBatchTabCopyText(tabs, 'titles-and-urls')).toBe(
      'First\thttps://one.test\nSecond\thttps://two.test',
    )

    const writeClipboardText = vi.fn(async () => {})
    const result = await runBatchClipboardAction(
      [1, 2],
      'https://one.test\nhttps://two.test',
      createPorts({ writeClipboardText }),
    )

    expect(writeClipboardText).toHaveBeenCalledOnce()
    expect(writeClipboardText).toHaveBeenCalledWith(
      'https://one.test\nhttps://two.test',
    )
    expect(result.succeededIds).toEqual([1, 2])
  })

  it('routes window actions through the same injectable operation seam', async () => {
    const performWindowAction = vi.fn(async () => {})
    const result = await runBatchWindowAction(
      [10, 20],
      'close',
      createPorts({ performWindowAction }),
    )

    expect(performWindowAction).toHaveBeenNthCalledWith(1, 'close', 10)
    expect(performWindowAction).toHaveBeenNthCalledWith(2, 'close', 20)
    expect(result.succeededIds).toEqual([10, 20])
  })

  it('reports independent failures for selected window and group actions', async () => {
    const performWindowAction = vi.fn(async (_action: string, id: number) => {
      if (id === 20) throw new Error('window is unavailable')
    })
    const windowResult = await runBatchWindowAction(
      [10, 20],
      'close',
      createPorts({ performWindowAction }),
    )
    expect(windowResult.succeededIds).toEqual([10])
    expect(windowResult.failures).toEqual([
      { tabId: 20, message: 'window is unavailable' },
    ])

    const performGroupAction = vi.fn(async (_action: unknown, id: number) => {
      if (id === 200) throw new Error('group disappeared')
    })
    const groupResult = await runBatchGroupAction(
      [100, 200],
      { type: 'set-collapse', collapsed: true },
      createPorts({ performGroupAction }),
    )
    expect(performGroupAction).toHaveBeenNthCalledWith(
      1,
      { type: 'set-collapse', collapsed: true },
      100,
    )
    expect(groupResult.succeededIds).toEqual([100])
    expect(groupResult.failures).toEqual([
      { tabId: 200, message: 'group disappeared' },
    ])
  })
})
