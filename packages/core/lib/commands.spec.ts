import { describe, expect, it } from 'vitest'
import {
  getCommandBlockReason,
  getCommandTargetIds,
  getDuplicateTabIds,
  getMovedTabIds,
  planGroupMove,
  planTabCreation,
  planTabMove,
} from './commands'
import type { BrowserSnapshot } from './browser'

const snapshot: BrowserSnapshot = {
  state: 'loaded',
  revision: 0,
  windows: [{ id: 1, type: 'normal' }],
  groups: [
    { id: 10, windowId: 1, color: 'blue' },
    { id: 20, windowId: 1, color: 'red' },
  ],
  tabs: [
    { id: 1, windowId: 1, index: 0, title: 'Pinned', pinned: true },
    { id: 2, windowId: 1, index: 1, title: 'First', groupId: 10 },
    { id: 3, windowId: 1, index: 2, title: 'Second', groupId: 10 },
    { id: 4, windowId: 1, index: 3, title: 'Third', groupId: 20 },
    { id: 5, windowId: 1, index: 4, title: 'Fourth', groupId: 20 },
    { id: 6, windowId: 1, index: 5, title: 'Last' },
  ],
}

describe('shared browser command planning', () => {
  it('moves across complete groups while retaining pin boundaries', () => {
    expect(planGroupMove(snapshot, 10, 'backward')).toBeUndefined()
    expect(planGroupMove(snapshot, 10, 'forward')).toBe(3)
    expect(planGroupMove(snapshot, 20, 'backward')).toBe(1)
    expect(planGroupMove(snapshot, 20, 'forward')).toBe(4)
    expect(planTabMove(snapshot, 2, 'backward')).toEqual({ type: 'ungroup' })
    expect(planTabMove(snapshot, 2, 'forward')).toEqual({
      type: 'move',
      index: 2,
    })
    expect(planTabMove(snapshot, 6, 'backward')).toEqual({
      type: 'group',
      groupId: 20,
    })
    expect(planTabMove(snapshot, 1, 'forward')).toEqual({ type: 'none' })
  })
  it('resolves relative closes once, omits pinned siblings, and deduplicates explicit targets', () => {
    expect(
      getCommandTargetIds(
        { type: 'close-relative-tabs', tabId: 3, direction: 'other' },
        snapshot,
      ),
    ).toEqual([2, 4, 5, 6])
    expect(
      getCommandTargetIds(
        { type: 'close-relative-tabs', tabId: 3, direction: 'below' },
        snapshot,
      ),
    ).toEqual([4, 5, 6])
    expect(
      getCommandTargetIds(
        { type: 'tab-action', tabIds: [3, 2, 3], action: 'mute' },
        snapshot,
      ),
    ).toEqual([3, 2])
  })

  it('resolves exact URL duplicates across windows regardless of tab status', () => {
    const url = 'https://example.com/project?name=alpha#overview'
    const duplicateSnapshot: BrowserSnapshot = {
      ...snapshot,
      windows: [{ id: 1 }, { id: 2 }],
      groups: [],
      tabs: [
        {
          id: 11,
          windowId: 1,
          index: 0,
          title: 'Project',
          url,
          active: true,
        },
        {
          id: 12,
          windowId: 1,
          index: 1,
          title: 'Pinned project',
          url,
          pinned: true,
        },
        {
          id: 21,
          windowId: 2,
          index: 0,
          title: 'Active project',
          url,
          active: true,
        },
        {
          id: 22,
          windowId: 2,
          index: 1,
          title: 'Other query',
          url: 'https://example.com/project?name=beta#overview',
        },
        {
          id: 23,
          windowId: 2,
          index: 2,
          title: 'Other fragment',
          url: 'https://example.com/project?name=alpha#settings',
        },
        { id: 24, windowId: 2, index: 3, title: 'No URL' },
      ],
    }

    expect(getDuplicateTabIds(duplicateSnapshot.tabs)).toEqual([11, 12, 21])
    expect(
      getCommandTargetIds(
        { type: 'close-relative-tabs', tabId: 11, direction: 'duplicates' },
        duplicateSnapshot,
      ),
    ).toEqual([12, 21])
  })
})

it('resolves the first moved tab by source order for selections and groups', () => {
  const reversed = { ...snapshot, tabs: snapshot.tabs.toReversed() }
  expect(
    getMovedTabIds(
      { type: 'move-tabs', tabIds: [3, 2], windowId: 2 },
      reversed,
      {
        status: 'success',
        requestedIds: [3, 2],
        succeededIds: [3, 2],
        failures: [],
      },
    ),
  ).toEqual([2, 3])
  expect(
    getMovedTabIds({ type: 'move-group', groupId: 10, windowId: 2 }, reversed, {
      status: 'success',
      requestedIds: [10],
      succeededIds: [10],
      failures: [],
    }),
  ).toEqual([2, 3])
})

describe('tab creation and split view planning', () => {
  it('places new tabs after their source and respects groups, pins, and existing pairs', () => {
    expect(
      planTabCreation(snapshot, { type: 'create-tab', afterTabId: 2 }),
    ).toMatchObject({ windowId: 1, groupId: 10, index: 2, pinned: false })
    const paired: BrowserSnapshot = {
      ...snapshot,
      tabs: snapshot.tabs.map((tab) =>
        [2, 3].includes(tab.id) ? { ...tab, splitViewId: 0 } : tab,
      ),
    }
    expect(
      planTabCreation(paired, { type: 'create-tab', afterTabId: 2 }).index,
    ).toBe(3)
    const pinned = {
      ...snapshot,
      tabs: snapshot.tabs.map((tab) =>
        tab.id === 2 ? { ...tab, pinned: true, groupId: undefined } : tab,
      ),
    }
    expect(
      planTabCreation(pinned, { type: 'create-tab', afterTabId: 1 }),
    ).toMatchObject({ index: 2, pinned: false, groupId: undefined })
    expect(
      planTabCreation(pinned, { type: 'create-tab', splitWithTabId: 1 }),
    ).toMatchObject({ index: 1, pinned: true })
    expect(
      getCommandBlockReason({ type: 'create-tab', afterTabId: 99 }, snapshot),
    ).toContain('no longer available')
  })

  it('validates split pairs and browser support before changing any tabs', () => {
    const supported = { ...snapshot, splitViewSupported: true }
    const pair = (tabIds: number[]) => ({
      type: 'create-split' as const,
      tabIds,
    })
    expect(getCommandBlockReason(pair([2, 3]), supported)).toBeUndefined()
    expect(getCommandBlockReason(pair([2, 3]), snapshot)).toContain(
      'unavailable',
    )
    expect(getCommandBlockReason(pair([2, 2]), supported)).toContain('two tabs')
    expect(getCommandBlockReason(pair([2, 4]), supported)).toContain(
      'same group',
    )
    expect(getCommandBlockReason(pair([1, 6]), supported)).toContain(
      'pinned state',
    )
    expect(getCommandBlockReason(pair([2, 99]), supported)).toContain(
      'no longer available',
    )
    expect(
      getCommandBlockReason(pair([2, 3]), {
        ...supported,
        tabs: supported.tabs.map((tab) =>
          tab.id === 3 ? { ...tab, windowId: 2 } : tab,
        ),
      }),
    ).toContain('same window')
    const paired = {
      ...supported,
      tabs: supported.tabs.map((tab) =>
        [2, 3].includes(tab.id) ? { ...tab, splitViewId: 0 } : tab,
      ),
    }
    expect(getCommandBlockReason(pair([2, 3]), paired)).toContain(
      'existing split views',
    )
    expect(
      getCommandBlockReason({ type: 'separate-split', splitViewId: 0 }, paired),
    ).toBeUndefined()
    expect(
      getCommandTargetIds({ type: 'separate-split', splitViewId: 0 }, paired),
    ).toEqual([2, 3])
    expect(
      getCommandBlockReason(
        {
          type: 'separate-split',
          splitViewId: 99,
        },
        paired,
      ),
    ).toContain('no longer available')
  })
})
