import { getOmnibarTarget } from '@extension/core/omnibarChoices'
import { getOmnibarResults } from '@extension/core/omnibarResults'
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
  it.each([true, false])(
    'keeps checked tabs above unchecked matches in selection order (advancing clock: %s)',
    async (advancing) => {
      let now = 100 * 24 * 60 * 60 * 1000
      const backend = new MemoryBackend(
        {
          ...setup().getSnapshot(),
          windows: [{ id: 1, name: 'Workspace', focused: true }],
          groups: [],
          tabs: Array.from({ length: 5 }, (_, index) => ({
            id: index + 1,
            windowId: 1,
            index,
            title: `T3 Code - project ${index + 1}`,
            url: `https://t3code.app/project/${index + 1}`,
            active: index === 4,
            lastAccessed: now - (5 - index) * 1000,
          })),
        },
        { now: () => now },
      )
      const resource = createMemoryOmnibarResource(backend, {
        originalWindowId: 1,
      })
      const results = () =>
        getOmnibarResults(
          't3 code',
          backend.getSnapshot(),
          1,
          [],
          now,
          'active',
          resource.getSnapshot().choices,
        )
      const order = () =>
        results()
          .filter((item) => item.type === 'tab')
          .map((item) => item.id)
      expect(order()).toEqual([5, 4, 3, 2, 1])
      const steps = [
        { pick: 2, expected: [2, 5, 4, 3, 1] },
        { pick: 5, expected: [5, 2, 4, 3, 1] },
        { pick: 1, expected: [1, 5, 2, 4, 3] },
        { pick: 4, expected: [4, 1, 5, 2, 3] },
        { pick: 2, expected: [2, 4, 1, 5, 3] },
      ]
      for (const step of steps) {
        if (advancing) now += 1000
        const result = results().find(
          (item) => item.type === 'tab' && item.id === step.pick,
        )!
        await resource.execute(result.action, undefined, {
          query: 't3 code',
          target: getOmnibarTarget(result),
          selectedAt: now,
        })
        expect(order()).toEqual(step.expected)
        expect(
          backend.getSnapshot().tabs.find((tab) => tab.id === step.pick)
            ?.lastAccessed,
        ).toBe(now)
        expect(results()[0]?.type).toBe('search')
      }
      expect(resource.getSnapshot().choices).toHaveLength(4)
    },
  )

  it('recalls the opened tab before its source and falls back to the source after navigation', async () => {
    const backend = setup()
    backend.restoreSnapshot({
      ...backend.getSnapshot(),
      windows: [{ id: 1, focused: true, name: 'Workspace' }],
    })
    const bookmark = {
      id: 'bookmark',
      type: 'bookmark' as const,
      title: 'Project Atlas',
      url: 'https://atlas.test',
      action: { kind: 'url' as const, url: 'https://atlas.test' },
    }
    const resource = createMemoryOmnibarResource(backend, {
      originalWindowId: 1,
      results: [bookmark],
    })
    const now = 24 * 60 * 60 * 1000
    await resource.execute(bookmark.action, 'new-tab', {
      query: 'project atlas',
      target: getOmnibarTarget(bookmark),
      selectedAt: now,
    })
    const opened = backend
      .getSnapshot()
      .tabs.find((tab) => tab.url === bookmark.url)!
    backend.restoreSnapshot({
      ...backend.getSnapshot(),
      tabs: backend.getSnapshot().tabs.map((tab) =>
        tab.id === opened.id
          ? {
              ...tab,
              title: 'Project Atlas',
              url: 'https://atlas.test/workspace',
            }
          : tab,
      ),
    })
    const results = () =>
      getOmnibarResults(
        'proj',
        backend.getSnapshot(),
        1,
        [bookmark],
        now,
        'active',
        resource.getSnapshot().choices,
      )
    expect(results().map((result) => result.type)).toEqual([
      'search',
      'tab',
      'bookmark',
    ])
    expect(
      resource
        .getSnapshot()
        .choices?.map((choice) => choice.target)
        .sort(),
    ).toEqual([`tab:${opened.id}`, 'url:https://atlas.test'].sort())
    await backend.execute({
      type: 'navigate-tab',
      tabId: opened.id,
      url: 'https://calendar.test',
    })
    expect(results().map((result) => result.type)).toEqual([
      'search',
      'bookmark',
    ])
  })

  it('finds demo results using title and URL substrings', async () => {
    const backend = setup()
    const results = [
      {
        id: 'bookmark',
        type: 'bookmark' as const,
        title: 'Tabby Café',
        url: 'https://example.com/coffee',
        action: { kind: 'url' as const, url: 'https://example.com/coffee' },
      },
      {
        id: 'history',
        type: 'history' as const,
        title: 'Tabby Café',
        url: 'https://example.com/coffee',
        action: { kind: 'url' as const, url: 'https://example.com/coffee' },
      },
    ]
    const resource = createMemoryOmnibarResource(backend, { results })
    expect((await resource.search('ta')).map((item) => item.id)).toEqual([
      'bookmark',
      'history',
    ])
    expect((await resource.search('e')).map((item) => item.id)).toEqual([
      'bookmark',
      'history',
    ])
    expect(
      (await resource.search('tabby coffee')).map((item) => item.id),
    ).toEqual(['bookmark', 'history'])
    expect(await resource.search('cafe')).toEqual([])
  })

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
