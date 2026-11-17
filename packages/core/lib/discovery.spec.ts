import { describe, expect, it, vi } from 'vitest'
import { createAsyncQueue } from './asyncQueue.js'
import { createDiscoveryResource } from './discovery.js'
import type { DiscoveryPersistence } from './discovery.js'

const storage = (initial: Record<string, unknown> = {}) => {
  let values = initial
  const listeners = new Set<(patch: Record<string, unknown>) => void>()
  const lock = createAsyncQueue()
  const persistence: DiscoveryPersistence = {
    withLock: lock.run,
    load: async () =>
      JSON.parse(JSON.stringify(values)) as Record<string, unknown>,
    save: vi.fn(async (patch) => {
      values = { ...values, ...patch }
      listeners.forEach((listener) => listener(patch))
    }),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return persistence
}

describe('paced discovery', () => {
  it('shares a single daily tip allowance across concurrent panels', async () => {
    const time = new Date(2026, 10, 5, 12).getTime()
    const persistence = storage({
      usage: {
        firstAt: time - 4 * 86400000,
        days: ['2026-11-1', '2026-11-2', '2026-11-3'],
      },
      'tour-1.9.0-omnibar': true,
      'tour-1.9.0-tab-manager': true,
      'quiet-day': { day: '2026-11-4', reason: 'tip' },
      'tip-follow-windows': { uses: 2, days: ['2026-11-1', '2026-11-2'] },
      'tip-search-scopes': { uses: 2, days: ['2026-11-1', '2026-11-2'] },
    })
    const first = createDiscoveryResource(persistence, () => time)
    const second = createDiscoveryResource(persistence, () => time)
    await Promise.all([first.start(), second.start()])
    await Promise.all([
      first.offerTip('follow-windows', 2),
      second.offerTip('search-scopes'),
    ])
    expect(first.getSnapshot().pendingTips).toHaveLength(1)
    expect(second.getSnapshot().pendingTips).toEqual(
      first.getSnapshot().pendingTips,
    )
  })
  it('paces tips over active days even while a panel stays open', async () => {
    let time = new Date(2026, 10, 1, 12).getTime()
    const persistence = storage()
    const discovery = createDiscoveryResource(persistence, () => time)
    await discovery.start()
    await discovery.completeTour('tab-manager')
    for (let index = 0; index < 5; index++)
      await discovery.offerTip('follow-windows', 2)
    expect(discovery.getSnapshot().pendingTips).toEqual([])

    time += 86400000
    await discovery.offerTip('follow-windows', 2)
    await discovery.offerTip('batch-selection')
    expect(discovery.getSnapshot().pendingTips).toEqual([])

    time += 86400000
    await discovery.offerTip('follow-windows', 2)
    expect(discovery.getSnapshot().pendingTips).toEqual([
      { id: 'follow-windows', windowId: 2 },
    ])
    for (let index = 0; index < 3; index++)
      await discovery.offerTip('batch-selection')
    expect(discovery.getSnapshot().pendingTips).toHaveLength(1)
    await discovery.dismissTip('follow-windows')
    await discovery.offerTip('batch-selection')
    expect(discovery.getSnapshot().pendingTips).toEqual([])

    time += 86400000
    discovery.dispose()
    await discovery.start()
    await discovery.offerTip('follow-windows', 3)
    await discovery.offerTip('batch-selection')
    expect(discovery.getSnapshot().pendingTips).toEqual([
      { id: 'batch-selection' },
    ])
    expect(discovery.getSnapshot().seenTips).toEqual(['follow-windows'])
  })

  it('keeps guidance quiet after tours, synchronizes completions, and replays just the selected tour', async () => {
    const time = new Date(2026, 10, 5, 12).getTime()
    const persistence = storage({
      usage: {
        firstAt: time - 4 * 86400000,
        days: ['2026-11-1', '2026-11-2', '2026-11-3'],
      },
      'tip-follow-windows': { uses: 3, days: ['2026-11-1', '2026-11-2'] },
    })
    const first = createDiscoveryResource(persistence, () => time)
    const second = createDiscoveryResource(persistence, () => time)
    await Promise.all([first.start(), second.start()])
    await Promise.all([
      first.completeTour('omnibar'),
      second.completeTour('tab-manager'),
    ])
    expect(first.getSnapshot().completedTours).toEqual([
      'omnibar',
      'tab-manager',
    ])
    await second.offerTip('follow-windows', 2)
    expect(first.getSnapshot().pendingTips).toEqual([])
    await first.setTipsEnabled(false)
    await second.restartTour('omnibar')
    expect(first.getSnapshot()).toMatchObject({
      tipsEnabled: false,
      completedTours: ['tab-manager'],
    })
    first.dispose()
    const reopened = createDiscoveryResource(persistence, () => time)
    await reopened.start()
    expect(reopened.getSnapshot()).toEqual(second.getSnapshot())
  })

  it('keeps updates received during a slow load and lets a failed save be retried', async () => {
    let finishLoad!: (values: Record<string, unknown>) => void
    let changed!: (values: Record<string, unknown>) => void
    const persistence = storage()
    persistence.load = vi.fn(persistence.load).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishLoad = resolve
        }),
    )
    persistence.subscribe = (listener) => {
      changed = listener
      return () => {}
    }
    const discovery = createDiscoveryResource(persistence)
    const loading = discovery.start()
    changed({ 'tour-1.9.0-omnibar': true })
    expect(discovery.getSnapshot().loaded).toBe(false)
    finishLoad({ 'tour-1.9.0-omnibar': false })
    await loading
    expect(discovery.getSnapshot().completedTours).toEqual(['omnibar'])
    vi.mocked(persistence.save).mockRejectedValueOnce(
      new Error('Storage unavailable'),
    )
    await expect(discovery.completeTour('tab-manager')).rejects.toThrow(
      'Storage unavailable',
    )
    expect(discovery.getSnapshot().completedTours).toEqual(['omnibar'])
    await discovery.completeTour('tab-manager')
    expect(discovery.getSnapshot().completedTours).toEqual([
      'omnibar',
      'tab-manager',
    ])
  })
})
