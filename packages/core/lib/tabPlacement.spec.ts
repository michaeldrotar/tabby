import { describe, expect, it } from 'vitest'
import { getTabPlacementReason, planTabPlacement } from './tabPlacement'
import type { BrowserSnapshot } from './browser'

const snapshot: BrowserSnapshot = {
  state: 'loaded',
  revision: 0,
  windows: [{ id: 1 }, { id: 2 }, { id: 3, incognito: true }],
  groups: [{ id: 10, windowId: 1, color: 'blue' }],
  tabs: [
    { id: 1, windowId: 1, index: 0, title: 'Pinned', pinned: true },
    { id: 2, windowId: 1, index: 1, title: 'A', groupId: 10 },
    { id: 3, windowId: 1, index: 2, title: 'B', groupId: 10 },
    { id: 4, windowId: 1, index: 3, title: 'C' },
    { id: 5, windowId: 1, index: 4, title: 'D' },
    { id: 6, windowId: 2, index: 0, title: 'Target' },
  ],
}

describe('tab placement', () => {
  it('preserves source order and resolves insertion after removing noncontiguous selected tabs', () => {
    const destination = { windowId: 1, beforeTabId: 3, groupId: 10 }
    const plan = planTabPlacement(snapshot, [5, 2], destination)
    expect(getTabPlacementReason(snapshot, [5, 2], destination)).toBeUndefined()
    expect(plan.tabs.map((tab) => tab.id)).toEqual([2, 5])
    expect(plan.index).toBe(1)
    expect(plan.beforeTabId).toBe(3)
  })
  it('moves complete groups as units and permits precise insertion in another window', () => {
    const destination = { windowId: 2, beforeTabId: 6 }
    expect(getTabPlacementReason(snapshot, [3, 2], destination)).toBeUndefined()
    expect(planTabPlacement(snapshot, [3, 2], destination).units).toEqual([
      { groupId: 10, tabIds: [2, 3] },
    ])
  })
  it('rejects unavailable positions, privacy crossings, pin changes and splitting groups', () => {
    for (const [ids, destination] of [
      [[4], { windowId: 1, beforeTabId: 999 }],
      [[4], { windowId: 3 }],
      [[4], { windowId: 1, beforeTabId: 1 }],
      [[1], { windowId: 1, beforeTabId: 5 }],
      [[4], { windowId: 1, beforeTabId: 3 }],
      [[1, 4], { windowId: 2 }],
    ] as const)
      expect(getTabPlacementReason(snapshot, ids, destination)).toBeTruthy()
    expect(
      getTabPlacementReason(snapshot, [1], { windowId: 1, beforeTabId: 2 }),
    ).toBeUndefined()
  })
})
