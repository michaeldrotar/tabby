import { findTabIdReplacements } from '@extension/core/selection/TabIdentity'
import { describe, expect, it } from 'vitest'
import { createFixtureBuilder } from './fixtures'
import { MemoryBackend } from './memoryBackend'

const scene = () => {
  const fixture = createFixtureBuilder()
  return fixture.generateScene({
    windows: [
      fixture.generateWindow({
        focused: true,
        tabs: [
          fixture.generateTab({ id: 1, active: true, groupId: 1 }),
          fixture.generateTab({ id: 2, groupId: 1 }),
          fixture.generateTab({ id: 3 }),
        ],
        groups: [fixture.generateGroup({ id: 1 })],
      }),
      fixture.generateWindow({ tabs: [fixture.generateTab({ id: 4 })] }),
    ],
  })
}

describe('memory backend', () => {
  it('applies a realistic workflow and reports partial failures honestly', async () => {
    const backend = new MemoryBackend(scene())
    await backend.execute({ type: 'activate-tab', tabId: 2 })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.active)
        .map((tab) => tab.id),
    ).toEqual([2, 4])
    await backend.execute({
      type: 'set-group-collapsed',
      groupId: 1,
      collapsed: true,
    })
    expect(backend.getSnapshot().groups[0]?.collapsed).toBe(true)
    const outcome = await backend.execute({
      type: 'close-tabs',
      tabIds: [2, 1, 999, 2],
    })
    expect(outcome).toMatchObject({
      status: 'partial',
      requestedIds: [2, 1, 999],
      succeededIds: [2, 1],
      failures: [{ id: 999 }],
    })
    expect(backend.getSnapshot().groups).toEqual([])
    expect(backend.getSnapshot().tabs[0]).toMatchObject({
      id: 3,
      index: 0,
      active: true,
    })
    await backend.execute({ type: 'close-tabs', tabIds: [3] })
    expect(backend.getSnapshot().windows).toEqual([
      expect.objectContaining({ id: 2, focused: true }),
    ])
    await backend.execute({ type: 'create-window' })
    expect(
      backend.getSnapshot().windows.map((window) => window.focused),
    ).toEqual([false, true])
    expect(backend.getSnapshot().tabs.at(-1)).toMatchObject({
      active: true,
      index: 0,
    })
  })

  it('restores identifier allocation as well as data when rewinding', async () => {
    const backend = new MemoryBackend(scene())
    const checkpoint = backend.capture()
    const first = await backend.execute({ type: 'create-window' })
    await backend.execute({
      type: 'close-window',
      windowId: first.createdWindowIds![0]!,
    })
    backend.restore(checkpoint)
    expect(backend.getSnapshot()).toEqual(checkpoint.snapshot)
    expect(await backend.execute({ type: 'create-window' })).toEqual(first)
  })

  it('keeps ignored and failed commands from changing data or notifying listeners', async () => {
    const initial = scene()
    const backend = new MemoryBackend(initial, { commands: 'ignore' })
    let notifications = 0
    backend.subscribe(() => notifications++)
    expect(
      await backend.execute({ type: 'close-tabs', tabIds: [1] }),
    ).toMatchObject({ status: 'ignored', succeededIds: [] })
    expect(backend.getSnapshot()).toEqual(initial)
    expect(notifications).toBe(0)
    const apply = new MemoryBackend(initial)
    expect(
      await apply.execute({ type: 'activate-window', windowId: 999 }),
    ).toMatchObject({ status: 'failed', succeededIds: [] })
    expect(apply.getSnapshot()).toEqual(initial)
  })

  it('prevents delayed commands from overwriting a restored checkpoint', async () => {
    let release!: () => void
    const backend = new MemoryBackend(scene(), {
      beforeExecute: () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    })
    const checkpoint = backend.capture()
    const pending = backend.execute({ type: 'close-tabs', tabIds: [1] })
    backend.restore(checkpoint)
    release()
    expect(await pending).toMatchObject({ status: 'ignored' })
    expect(backend.getSnapshot()).toEqual(checkpoint.snapshot)
  })
})

describe('memory backend action parity', () => {
  it('gives a duplicate its own render identity when seeded with browser identities', async () => {
    const initial = scene()
    initial.tabs = initial.tabs.map((tab) => ({ ...tab, renderKey: tab.id }))
    const backend = new MemoryBackend(initial)
    const outcome = await backend.execute({
      type: 'tab-action',
      action: 'duplicate',
      tabIds: [1],
    })
    const duplicated = backend.getSnapshot()
    const clone = duplicated.tabs.find(
      (tab) => tab.id === outcome.createdTabIds?.[0],
    )!
    expect(clone.renderKey).not.toBe(initial.tabs[0]!.renderKey)
    expect(
      new Set(duplicated.tabs.map((tab) => tab.renderKey ?? tab.id)).size,
    ).toBe(duplicated.tabs.length)
    await backend.execute({ type: 'close-tabs', tabIds: [1] })
    expect(
      findTabIdReplacements(duplicated.tabs, backend.getSnapshot().tabs).size,
    ).toBe(0)
  })

  it('preserves group metadata and source order through regrouping, moving, pinning, and discarding', async () => {
    const backend = new MemoryBackend(scene())
    await backend.execute({ type: 'move-tab', tabId: 3, direction: 'backward' })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 3)?.groupId,
    ).toBe(1)
    await backend.execute({
      type: 'tab-action',
      action: 'ungroup',
      tabIds: [2],
    })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1)
        .map((tab) => [tab.id, tab.groupId]),
    ).toEqual([
      [1, 1],
      [3, 1],
      [2, undefined],
    ])
    await backend.execute({
      type: 'group-action',
      groupIds: [1],
      action: { type: 'rename', title: 'Research' },
    })
    await backend.execute({
      type: 'group-action',
      groupIds: [1],
      action: { type: 'change-color', color: 'purple' },
    })
    const moved = await backend.execute({ type: 'move-group', groupId: 1 })
    expect(backend.getSnapshot().groups[0]).toMatchObject({
      id: 1,
      title: 'Research',
      color: 'purple',
      windowId: moved.createdWindowIds![0],
    })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === moved.createdWindowIds![0])
        .map((tab) => tab.id),
    ).toEqual([1, 3])
    await backend.execute({ type: 'tab-action', action: 'pin', tabIds: [3] })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 3),
    ).toMatchObject({ index: 0, pinned: true, groupId: undefined })
    const discarded = await backend.execute({
      type: 'tab-action',
      action: 'discard',
      tabIds: [1, 3, 999],
    })
    expect(discarded).toMatchObject({
      status: 'partial',
      succeededIds: [3],
      skippedActiveIds: [1],
      failures: [{ id: 999 }],
    })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 3)?.discarded,
    ).toBe(true)
  })

  it('shares eligibility rules and creates navigable tabs without breaking group continuity', async () => {
    const backend = new MemoryBackend(scene())
    const created = await backend.execute({
      type: 'create-tab',
      windowId: 1,
      groupId: 1,
      url: 'https://example.com',
    })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1)
        .map((tab) => tab.groupId),
    ).toEqual([1, 1, 1, undefined])
    const tabId = created.createdTabIds![0]!
    await backend.execute({
      type: 'navigate-tab',
      tabId,
      url: 'https://tabby.test',
    })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === tabId),
    ).toMatchObject({ url: 'https://tabby.test', active: true })
    const before = backend.getSnapshot()
    expect(
      await backend.execute({ type: 'group-tabs', tabIds: [1, 4] }),
    ).toMatchObject({ status: 'failed', succeededIds: [] })
    expect(backend.getSnapshot()).toBe(before)
    await backend.execute({ type: 'tab-action', action: 'pin', tabIds: [1] })
    await backend.execute({
      type: 'close-relative-tabs',
      tabId: tabId,
      direction: 'other',
    })
    expect(
      backend
        .getSnapshot()
        .tabs.filter((tab) => tab.windowId === 1)
        .map((tab) => tab.id),
    ).toEqual([1, tabId])
  })
})
