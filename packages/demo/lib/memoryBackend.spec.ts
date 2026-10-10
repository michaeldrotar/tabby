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
