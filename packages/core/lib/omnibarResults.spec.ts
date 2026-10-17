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
  it('finds a named window beyond the numbered shortcut slots without a tab-title match', () => {
    const windows = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      type: 'normal',
      name: index === 11 ? 'Project Atlas' : 'Inbox',
      icon: index === 11 ? 'globe' : undefined,
    }))
    const tabs = windows.map((window) => ({
      id: window.id,
      windowId: window.id,
      index: 0,
      title: 'Untitled note',
      active: true,
    }))
    tabs.push(
      ...Array.from({ length: 11 }, (_, index) => ({
        id: index + 13,
        windowId: 1,
        index: index + 1,
        title: 'Untitled note',
        active: false,
      })),
    )
    const results = getOmnibarResults(
      'Atlas',
      { ...snapshot, windows, tabs, groups: [] },
      1,
      [],
      0,
    )
    expect(results.find((result) => result.windowId === 12)).toMatchObject({
      type: 'window',
      title: 'Project Atlas',
      description: 'Window 12 · 1 tab',
      windowIcon: 'globe',
      action: { kind: 'window', windowId: 12 },
    })
    expect(
      getOmnibarResults(
        'window 12',
        { ...snapshot, windows, tabs, groups: [] },
        1,
        [],
        0,
      )
        .filter((result) => result.type === 'window')
        .map((result) => result.action),
    ).toEqual([{ kind: 'window', windowId: 12 }])
  })
})
