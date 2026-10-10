import { describe, expect, it } from 'vitest'
import { createFixtureBuilder } from './fixtures'

describe('fixture builder', () => {
  it('reproduces a scene from its seed and clock while owning independent ids', () => {
    const build = () => {
      const fixture = createFixtureBuilder({
        seed: 'screenshots',
        now: 100_000,
      })
      return fixture.generateScene({
        windows: [
          fixture.generateWindow({
            tabs: [fixture.generateTab(), fixture.generateTab()],
          }),
          fixture.generateWindow(),
        ],
      })
    }
    expect(build()).toEqual(build())
    expect(new Set(build().tabs.map((tab) => tab.id)).size).toBe(3)
    expect(build().tabs.every((tab) => tab.lastAccessed! <= 100_000)).toBe(true)
  })

  it('preserves important overrides and normalizes the window relationship', () => {
    const fixture = createFixtureBuilder()
    const group = fixture.generateGroup({
      id: 50,
      title: 'Research',
      color: 'red',
    })
    const tab = fixture.generateTab({
      id: 200,
      title: 'Tabby',
      url: 'https://tabby.example',
      groupId: group.id,
    })
    const window = fixture.generateWindow({
      id: 10,
      tabs: [tab],
      groups: [group],
    })
    const scene = fixture.generateScene({ windows: [window] })
    expect(scene.tabs[0]).toMatchObject({
      id: 200,
      title: 'Tabby',
      windowId: 10,
      index: 0,
      active: true,
      groupId: 50,
    })
    expect(scene.groups[0]).toMatchObject({ windowId: 10, title: 'Research' })
    expect(fixture.generateTab().id).toBe(201)
    expect(fixture.generateWindow().id).toBe(11)
  })

  it('fills generated defaults without changing explicit parent or active choices', () => {
    const fixture = createFixtureBuilder()
    const first = fixture.generateWindow({
      tabs: [fixture.generateTab({ active: false }), fixture.generateTab()],
    })
    const second = fixture.generateWindow({ tabs: [fixture.generateTab()] })
    const scene = fixture.generateScene({ windows: [first, second] })
    expect(scene.windows.map((window) => window.focused)).toEqual([true, false])
    expect(
      scene.tabs
        .filter((tab) => tab.windowId === first.id)
        .map((tab) => tab.active),
    ).toEqual([false, true])
    expect(scene.tabs.at(-1)).toMatchObject({
      windowId: second.id,
      index: 0,
      active: true,
    })
    expect(() =>
      fixture.generateWindow({
        id: 10,
        tabs: [fixture.generateTab({ windowId: 99 })],
      }),
    ).toThrow('belongs to window 99, not 10')
    expect(() =>
      fixture.generateWindow({
        tabs: [
          fixture.generateTab({ active: true }),
          fixture.generateTab({ active: true }),
        ],
      }),
    ).toThrow('multiple active tabs')
    expect(() =>
      fixture.generateWindow({ tabs: [fixture.generateTab({ index: 2 })] }),
    ).toThrow('conflicts with position 0')
    expect(fixture.generateScene({ windows: [] })).toMatchObject({
      windows: [],
      tabs: [],
      groups: [],
    })
  })

  it.each([
    {
      name: 'duplicate windows',
      windows: [{ id: 1 }, { id: 1 }],
      tabs: [{ id: 1, windowId: 1, index: 0, title: 'One' }],
      groups: [],
      error: 'Duplicate window id',
    },
    {
      name: 'duplicate tabs',
      windows: [{ id: 1 }],
      tabs: [
        { id: 1, windowId: 1, index: 0, title: 'One' },
        { id: 1, windowId: 1, index: 1, title: 'Two' },
      ],
      groups: [],
      error: 'Duplicate tab id',
    },
    {
      name: 'duplicate groups',
      windows: [{ id: 1 }],
      tabs: [{ id: 1, windowId: 1, index: 0, title: 'One', groupId: 1 }],
      groups: [
        { id: 1, windowId: 1, color: 'blue' as const },
        { id: 1, windowId: 1, color: 'blue' as const },
      ],
      error: 'Duplicate group id',
    },
    {
      name: 'unknown window',
      windows: [{ id: 1 }],
      tabs: [{ id: 1, windowId: 99, index: 0, title: 'One' }],
      groups: [],
      error: 'unknown window 99',
    },
    {
      name: 'unknown group',
      windows: [{ id: 1 }],
      tabs: [{ id: 1, windowId: 1, index: 0, title: 'One', groupId: 99 }],
      groups: [],
      error: 'unknown group 99',
    },
    {
      name: 'cross-window group',
      windows: [{ id: 1 }, { id: 2 }],
      tabs: [
        { id: 1, windowId: 1, index: 0, title: 'One', groupId: 1 },
        { id: 2, windowId: 2, index: 0, title: 'Two' },
      ],
      groups: [{ id: 1, windowId: 2, color: 'blue' as const }],
      error: 'different windows',
    },
    {
      name: 'discontiguous group',
      windows: [{ id: 1 }],
      tabs: [
        { id: 1, windowId: 1, index: 0, title: 'One', groupId: 1 },
        { id: 2, windowId: 1, index: 1, title: 'Two' },
        { id: 3, windowId: 1, index: 2, title: 'Three', groupId: 1 },
      ],
      groups: [{ id: 1, windowId: 1, color: 'blue' as const }],
      error: 'must be contiguous',
    },
    {
      name: 'multiple focused windows',
      windows: [
        { id: 1, focused: true },
        { id: 2, focused: true },
      ],
      tabs: [
        { id: 1, windowId: 1, index: 0, title: 'One' },
        { id: 2, windowId: 2, index: 0, title: 'Two' },
      ],
      groups: [],
      error: 'multiple focused windows',
    },
  ])(
    'rejects $name with a clear fixture error',
    ({ windows, tabs, groups, error }) => {
      expect(() =>
        createFixtureBuilder().generateScene({ windows, tabs, groups }),
      ).toThrow(error)
    },
  )
})
