import { describe, expect, it } from 'vitest'
import { getWindowIdentity, matchWindowIdentities } from './windowIdentity.js'
import type { SavedWindowIdentity } from './windowIdentity.js'

const saved = (key: string, hashes: string[]): SavedWindowIdentity => ({
  key,
  hashes,
  name: key,
  updatedAt: 0,
})

describe('Tabby window identity', () => {
  it('uses a saved name and icon consistently and identifies unnamed windows by their active tab', () => {
    const tabs = [
      {
        id: 1,
        windowId: 2,
        index: 0,
        title: 'Notes',
        active: true,
        faviconUrl: '/notes.png',
      },
    ]
    expect(
      getWindowIdentity({ id: 2, name: 'Research', icon: 'book' }, tabs),
    ).toEqual({ title: 'Research', icon: 'book', iconUrl: undefined })
    expect(getWindowIdentity({ id: 2 }, tabs)).toEqual({
      title: 'Notes',
      icon: undefined,
      iconUrl: '/notes.png',
    })
  })
  it('uses the configured tab for both the default name and favicon', () => {
    const tabs = [
      {
        id: 2,
        windowId: 1,
        index: 1,
        title: 'Active',
        active: true,
        faviconUrl: '/active.png',
      },
      {
        id: 1,
        windowId: 1,
        index: 0,
        title: 'First',
        faviconUrl: '/first.png',
      },
    ]
    expect(getWindowIdentity({ id: 1 }, tabs, 'first')).toMatchObject({
      title: 'First',
      iconUrl: '/first.png',
    })
    expect(getWindowIdentity({ id: 1 }, tabs, 'active')).toMatchObject({
      title: 'Active',
      iconUrl: '/active.png',
    })
  })
  it('restores uniquely matching windows despite changed IDs, order, and a small tab change', () => {
    const records = [
      saved('Work', ['a', 'b', 'c', 'd', 'e']),
      saved('Personal', ['x']),
    ]
    expect(
      matchWindowIdentities(
        [
          { id: 99, hashes: ['x'] },
          { id: 88, hashes: ['e', 'd', 'c', 'b'] },
        ],
        records,
      ),
    ).toEqual(
      new Map([
        [99, 'Personal'],
        [88, 'Work'],
      ]),
    )
  })
  it('leaves duplicate, competing, empty, and weak matches unnamed', () => {
    const records = [
      saved('Work', ['a', 'b']),
      saved('Copy', ['a', 'b']),
      saved('Other', ['x', 'y', 'z']),
    ]
    expect(
      matchWindowIdentities(
        [
          { id: 1, hashes: ['b', 'a'] },
          { id: 2, hashes: ['x'] },
          { id: 3, hashes: [] },
        ],
        records,
      ),
    ).toEqual(new Map())
    expect(
      matchWindowIdentities(
        [
          { id: 1, hashes: ['a', 'b'] },
          { id: 2, hashes: ['a', 'b'] },
        ],
        [records[0]!],
      ),
    ).toEqual(new Map())
  })

  it('uses order for similar windows, while stronger tab matches override it', () => {
    const records = [
      { ...saved('Work', ['a', 'b', 'c', 'd', 'e']), position: 0 },
      { ...saved('Research', ['a', 'b', 'x', 'y', 'z']), position: 1 },
    ]
    expect(
      matchWindowIdentities(
        [
          { id: 10, hashes: ['a', 'b'], position: 0 },
          { id: 20, hashes: ['a', 'b'], position: 1 },
        ],
        records,
      ),
    ).toEqual(
      new Map([
        [10, 'Work'],
        [20, 'Research'],
      ]),
    )
    expect(
      matchWindowIdentities(
        [
          { id: 10, hashes: ['a', 'b', 'x', 'y', 'z'], position: 0 },
          { id: 20, hashes: ['a', 'b', 'c', 'd', 'e'], position: 1 },
        ],
        records,
        new Map([
          [10, 'Work'],
          [20, 'Research'],
        ]),
      ),
    ).toEqual(
      new Map([
        [10, 'Research'],
        [20, 'Work'],
      ]),
    )
    expect(
      matchWindowIdentities(
        [{ id: 10, hashes: ['unrelated'], position: 0 }],
        records,
      ),
    ).toEqual(new Map())
  })

  it('keeps a plausible incumbent through close scores and gives a better window its name', () => {
    const records = [saved('Work', ['a', 'b', 'c', 'd', 'e'])]
    expect(
      matchWindowIdentities(
        [
          { id: 10, hashes: ['a', 'b'] },
          { id: 20, hashes: ['a', 'b'] },
        ],
        records,
        new Map([[10, 'Work']]),
      ),
    ).toEqual(new Map([[10, 'Work']]))
    expect(
      matchWindowIdentities(
        [
          { id: 10, hashes: ['a', 'b'] },
          { id: 20, hashes: ['a', 'b', 'c', 'd', 'e'] },
        ],
        records,
        new Map([[10, 'Work']]),
      ),
    ).toEqual(new Map([[20, 'Work']]))
  })

  it('corrects reversed names when similar windows finish with exact fingerprints', () => {
    const records = [
      { ...saved('Work', ['a', 'b', 'c', 'd', 'e']), position: 0 },
      { ...saved('Research', ['a', 'b', 'c', 'd', 'f']), position: 1 },
    ]
    const initial = matchWindowIdentities(
      [
        { id: 10, hashes: ['a', 'b'], position: 0 },
        { id: 20, hashes: ['a', 'b'], position: 1 },
      ],
      records,
    )
    expect(initial).toEqual(
      new Map([
        [10, 'Work'],
        [20, 'Research'],
      ]),
    )
    expect(
      matchWindowIdentities(
        [
          { id: 10, hashes: ['a', 'b', 'c', 'd', 'f'], position: 0 },
          { id: 20, hashes: ['a', 'b', 'c', 'd', 'e'], position: 1 },
        ],
        records,
        initial,
      ),
    ).toEqual(
      new Map([
        [10, 'Research'],
        [20, 'Work'],
      ]),
    )
  })
})
