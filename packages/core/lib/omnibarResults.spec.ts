import { describe, expect, it } from 'vitest'
import { getOmnibarResults } from './omnibarResults.js'
import type { BrowserSnapshot } from './browser.js'

const snapshot: BrowserSnapshot = {
  state: 'loaded',
  revision: 0,
  windows: [
    { id: 20, type: 'normal' },
    { id: 10, type: 'normal', focused: true },
  ],
  tabs: [
    {
      id: 1,
      windowId: 10,
      index: 0,
      title: 'Open Houses - Zillow 17',
      url: 'https://zillow.com/homes/17',
      active: true,
    },
    {
      id: 2,
      windowId: 20,
      index: 0,
      title: 'Other tab',
      url: 'https://example.com',
      active: true,
    },
  ],
  groups: [
    {
      id: 5,
      windowId: 10,
      title: 'Research Zillow',
      color: 'blue',
      collapsed: true,
    },
  ],
}

describe('Omnibar result composition', () => {
  it('filters all query terms, ranks matching sources, and keeps search actions first', () => {
    const results = getOmnibarResults('zillow 17', snapshot, 10, [], 0)
    expect(results.map((result) => result.id)).toEqual([
      'search-google',
      'cmd-focus-window-1',
      1,
    ])
    expect(
      getOmnibarResults('zillow', snapshot, 10, [], 0).map(
        (result) => result.id,
      ),
    ).toEqual(['search-google', 'cmd-focus-window-1', 1, 'tab-group:5'])
    expect(
      getOmnibarResults('chrome settings', snapshot, 10, [], 0).map(
        (result) => result.id,
      ),
    ).toEqual(['search-google', 'cmd-settings', 'cmd-clear-data'])
    expect(getOmnibarResults('', snapshot, 10, [], 0)).toEqual([])
  })
  it('puts numbered window commands first and retains pinned URL actions', () => {
    const results = getOmnibarResults('window', snapshot, 10, [], 0)
    expect(results.slice(0, 3).map((result) => result.id)).toEqual([
      'cmd-focus-window-1',
      'cmd-focus-window-2',
      'search-google',
    ])
    expect(results[0]?.action).toEqual({ kind: 'window', windowId: 10 })
    expect(
      getOmnibarResults('example.com', snapshot, 10, [], 0).map(
        (result) => result.id,
      ),
    ).toEqual(['url-go', 'search-google', 'cmd-focus-window-2', 2])
  })
})
