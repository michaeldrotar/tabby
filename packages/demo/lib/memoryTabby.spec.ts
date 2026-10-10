import { describe, expect, it } from 'vitest'
import { createFixtureBuilder } from './fixtures'
import { createMemoryTabbyData } from './memoryTabby'
import { createMemoryScene, memorySceneTime } from './scenes'

describe('memory scenes and complete product data', () => {
  it('offers deterministic scenarios with meaningful browser differences', () => {
    const standard = createMemoryScene()
    expect(standard).toEqual(createMemoryScene())
    expect(standard.tabs).toHaveLength(18)
    expect(standard.tabs.find((tab) => tab.id === 12)?.title).toBe(
      'Architecture notes',
    )
    expect(
      createMemoryScene('standard', { variant: 'right' }).tabs.find(
        (tab) => tab.id === 12,
      )?.title,
    ).toBe('Design inspiration')
    expect(createMemoryScene('single-window').windows).toHaveLength(1)
    expect(createMemoryScene('single-window').tabs).toHaveLength(4)
    expect(createMemoryScene('many-windows').windows).toHaveLength(6)
    expect(createMemoryScene('large').tabs).toHaveLength(400)
    expect(createMemoryScene('restricted').windows[1]?.incognito).toBe(true)
    expect(createMemoryScene('error')).toMatchObject({
      state: 'error',
      windows: [],
      tabs: [],
      error: expect.any(String),
    })
    expect(
      standard.tabs.every((tab) => tab.lastAccessed! <= memorySceneTime),
    ).toBe(true)
  })

  it('replaces a preset with nested fixture overrides consistently across surfaces', async () => {
    const fixture = createFixtureBuilder()
    const windows = [
      fixture.generateWindow({
        id: 42,
        tabs: [fixture.generateTab({ title: 'Tabby' })],
      }),
    ]
    const data = createMemoryTabbyData({
      scene: 'many-windows',
      overrides: { windows },
      preferences: { theme: 'dark' },
      omnibar: { isMac: true },
    })
    expect(data.backend.getSnapshot()).toMatchObject({
      windows: [{ id: 42 }],
      tabs: [{ title: 'Tabby', windowId: 42 }],
      groups: [],
    })
    expect(data.omnibar.getSnapshot()).toMatchObject({
      originalWindowId: 42,
      isMac: true,
    })
    expect(data.options.getSnapshot().isMac).toBe(true)
    expect(data.preferences.getSnapshot().theme).toBe('dark')
    await data.omnibar.execute(
      { kind: 'url', url: 'https://tabby.app' },
      'new-tab',
    )
    expect(data.backend.getSnapshot().tabs.at(-1)).toMatchObject({
      windowId: 42,
      url: 'https://tabby.app',
    })
    const swapped = createMemoryTabbyData({ scene: 'single-window' })
    expect(swapped.backend.getSnapshot().windows[0]?.id).toBe(1)
    expect(data.backend.getSnapshot().windows[0]?.id).toBe(42)
  })

  it('shares supplied data handles while independently owning unspecified preferences', async () => {
    const left = createMemoryTabbyData({
      preferences: { theme: 'light' },
    })
    const right = createMemoryTabbyData({
      resources: { backend: left.backend },
      preferences: { theme: 'dark' },
    })
    expect(right.backend).toBe(left.backend)
    expect(right.preferences).not.toBe(left.preferences)
    await right.omnibar.execute(
      { kind: 'url', url: 'https://example.com/shared' },
      'new-tab',
    )
    expect(
      left.backend
        .getSnapshot()
        .tabs.some((tab) => tab.url === 'https://example.com/shared'),
    ).toBe(true)
    await right.preferences.set({ theme: 'system' })
    expect(left.preferences.getSnapshot().theme).toBe('light')
    const shared = createMemoryTabbyData({ resources: left })
    expect(shared).toEqual(left)
  })

  it('ignores data actions when requested and wires injected Options callbacks', async () => {
    let opened = 0
    const data = createMemoryTabbyData({
      commands: 'ignore',
      optionsHost: { openShortcutsSettings: async () => void opened++ },
    })
    const before = data.backend.getSnapshot()
    await data.omnibar.execute({ kind: 'url', url: 'https://tabby.app' })
    await data.backend.execute({ type: 'close-tabs', tabIds: [11] })
    expect(data.backend.getSnapshot()).toBe(before)
    await data.options.openShortcutsSettings()
    expect(opened).toBe(1)
  })
})
