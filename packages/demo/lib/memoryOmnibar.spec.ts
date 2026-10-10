import { describe, expect, it, vi } from 'vitest'
import { createFixtureBuilder } from './fixtures'
import { MemoryBackend } from './memoryBackend'
import { createMemoryOmnibarResource } from './memoryOmnibar'
import type { MemoryBackendOptions } from './memoryBackend'

const setup = (options: MemoryBackendOptions = {}) => {
  const fixtures = createFixtureBuilder({ seed: 'omnibar' })
  const group = fixtures.generateGroup({ id: 20, collapsed: true })
  const scene = fixtures.generateScene({
    windows: [
      fixtures.generateWindow({
        id: 1,
        groups: [group],
        tabs: [
          fixtures.generateTab({
            id: 11,
            title: 'Tabby',
            url: 'https://tabby.test',
            groupId: 20,
          }),
        ],
      }),
    ],
  })
  return new MemoryBackend(scene, options)
}

describe('memory Omnibar', () => {
  it('navigates and duplicates without touching browser APIs, opens groups and restores supplied sessions', async () => {
    const backend = setup()
    const options = vi.fn()
    const resource = createMemoryOmnibarResource(backend, {
      originalWindowId: 1,
      initialQuery: 'saved',
      onOptions: options,
      results: [
        {
          id: 'closed',
          type: 'recently-closed',
          title: 'Tabby Closed',
          url: 'https://closed.test',
          sessionId: 'session',
          action: { kind: 'restore', sessionId: 'session' },
        },
      ],
    })
    await resource.execute({ kind: 'url', url: 'https://new.test' })
    expect(resource.getSavedQuery()).toBe('')
    expect(backend.getSnapshot().tabs[0]?.url).toBe('https://new.test')
    await resource.execute(
      { kind: 'tab', tabId: 11, windowId: 1, url: 'https://tabby.test' },
      'new-tab',
    )
    expect(backend.getSnapshot().tabs.map((tab) => tab.url)).toEqual([
      'https://new.test',
      'https://tabby.test',
    ])
    await resource.execute({ kind: 'group', groupId: 20 })
    expect(backend.getSnapshot().groups[0]?.collapsed).toBe(false)
    const results = await resource.search('tabby')
    await resource.execute(results[0]!.action)
    expect(backend.getSnapshot().tabs.at(-1)?.url).toBe('https://closed.test')
    await resource.execute(
      { kind: 'url', url: 'https://window.test' },
      'new-window',
    )
    expect(backend.getSnapshot().windows).toHaveLength(2)
    expect(backend.getSnapshot().tabs.at(-1)?.url).toBe('https://window.test')
    await resource.execute({ kind: 'options' })
    expect(options).toHaveBeenCalledOnce()
    await resource.saveQuery('saved')
    expect(resource.getSavedQuery()).toBe('saved')
    await resource.start()
    expect(resource.getSnapshot().initialQuery).toBe('saved')
    const persisted = resource.getSnapshot()
    resource.restoreSavedQuery('rewound')
    expect(resource.getSavedQuery()).toBe('rewound')
    expect(resource.getSnapshot().initialQuery).toBe('rewound')
    expect(persisted.initialQuery).toBe('saved')
    await expect(
      resource.execute({ kind: 'group', groupId: 999 }),
    ).rejects.toThrow('no longer available')
    expect(resource.getSavedQuery()).toBe('rewound')
  })

  it('ignores all configured demo commands and rejects work after disposal', async () => {
    const backend = setup()
    const before = backend.getSnapshot()
    const resource = createMemoryOmnibarResource(backend, {
      commands: 'ignore',
      initialQuery: 'keep this query',
    })
    await resource.execute(
      { kind: 'url', url: 'https://new.test' },
      'new-window',
    )
    expect(backend.getSnapshot()).toBe(before)
    expect(resource.getSavedQuery()).toBe('keep this query')
    resource.dispose()
    await expect(resource.search('tabby')).rejects.toThrow('disposed')
  })
  it('navigates an external result and focuses its originating window', async () => {
    const backend = setup()
    await backend.execute({
      type: 'create-window',
      url: 'https://background.test',
    })
    expect(
      backend.getSnapshot().windows.find((window) => window.focused)?.id,
    ).toBe(2)
    const resource = createMemoryOmnibarResource(backend, {
      originalWindowId: 1,
    })
    await resource.execute({ kind: 'url', url: 'https://bookmark.test' })
    expect(
      backend.getSnapshot().windows.find((window) => window.focused)?.id,
    ).toBe(1)
    expect(backend.getSnapshot().tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 11,
          windowId: 1,
          url: 'https://bookmark.test',
          active: true,
        }),
        expect.objectContaining({
          windowId: 2,
          url: 'https://background.test',
        }),
      ]),
    )
    expect(backend.getSnapshot().tabs).toHaveLength(2)
  })
  it.each(['restore', 'dispose'])(
    'does not continue a gated group command after %s',
    async (action) => {
      let release!: () => void
      const backend = setup({
        beforeExecute: (command) =>
          command.type === 'set-group-collapsed'
            ? new Promise<void>((resolve) => {
                release = resolve
              })
            : undefined,
      })
      const checkpoint = backend.capture()
      const execute = vi.spyOn(backend, 'execute')
      const resource = createMemoryOmnibarResource(backend, {
        initialQuery: 'checkpoint',
      })
      const pending = resource.execute({ kind: 'group', groupId: 20 })
      const cancelled = expect(pending).rejects.toMatchObject({
        name: 'AbortError',
      })
      if (action === 'restore') {
        backend.restore(checkpoint)
      } else {
        backend.dispose()
        resource.dispose()
      }
      const restored = backend.getSnapshot()
      release()
      await cancelled
      expect(backend.getSnapshot()).toBe(restored)
      expect(backend.getSnapshot().groups[0]?.collapsed).toBe(true)
      expect(execute).toHaveBeenCalledOnce()
      expect(resource.getSavedQuery()).toBe('checkpoint')
    },
  )
})
