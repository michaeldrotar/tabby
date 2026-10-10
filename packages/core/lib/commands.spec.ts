import { describe, expect, it } from 'vitest'
import { getCommandTargetIds, planGroupMove, planTabMove } from './commands'
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
    expect(planTabMove(snapshot, 1, 'forward')).toEqual({
      type: 'group',
      groupId: 10,
    })
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
})
