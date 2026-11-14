import { describe, expect, it } from 'vitest'
import { getOmnibarResults } from './omnibarResults.js'
import type { BrowserSnapshot } from './browser.js'
import type { OmnibarResult } from './omnibar.js'

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
  it('keeps short substring searches eligible across local result types', () => {
    const browser = {
      ...snapshot,
      windows: [{ id: 10, type: 'normal', name: 'Workspace' }],
      tabs: [
        {
          ...snapshot.tabs[0]!,
          title: 'Options',
          url: 'chrome-extension://tabby/options/index.html',
        },
        {
          ...snapshot.tabs[1]!,
          windowId: 10,
          title: 'Google Calendar',
          url: 'https://calendar.google.com',
        },
      ],
    }
    const results = getOmnibarResults('e', browser, 10, [], 0)
    expect(results.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'search-google',
        'cmd-extensions',
        'window:10',
        'tab-group:5',
        1,
        2,
      ]),
    )
  })

  it('preserves URL and web-search text and matches address paths, queries and fragments', () => {
    const url = 'https://example.com/CaseSensitive?project=Atlas#Review'
    const tab = { ...snapshot.tabs[0]!, url, title: 'Untitled' }
    const browser = { ...snapshot, tabs: [tab], groups: [] }
    expect(getOmnibarResults(url, browser, 10, [], 0)[0]?.action).toEqual({
      kind: 'url',
      url,
    })
    expect(
      getOmnibarResults('Atlas', browser, 10, [], 0).some(
        (item) => item.type === 'tab',
      ),
    ).toBe(true)
    expect(
      getOmnibarResults('Review', browser, 10, [], 0).some(
        (item) => item.type === 'tab',
      ),
    ).toBe(true)
    expect(
      getOmnibarResults('Cat Pictures', snapshot, 10, [], 0).at(-1)?.url,
    ).toBe('https://www.google.com/search?q=Cat%20Pictures')
  })

  it('filters all query terms while keeping web search pinned above ranked results', () => {
    const results = getOmnibarResults('zillow 17', snapshot, 10, [], 0)
    expect(results.map((result) => result.id)).toEqual(['search-google', 1])
    expect(
      getOmnibarResults('zillow', snapshot, 10, [], 0).map(
        (result) => result.id,
      ),
    ).toEqual(['search-google', 'tab-group:5', 1])
    expect(
      getOmnibarResults('chrome settings', snapshot, 10, [], 0).map(
        (result) => result.id,
      ),
    ).toEqual(['search-google', 'cmd-settings', 'cmd-clear-data'])
    const recalled = getOmnibarResults(
      'zillow',
      snapshot,
      10,
      [],
      0,
      'active',
      [{ query: 'zillow', target: 'tab:1', selectedAt: 0 }],
    )
    expect(recalled.map((result) => result.id)).toEqual([
      'search-google',
      1,
      'tab-group:5',
    ])
    expect(getOmnibarResults('', snapshot, 10, [], 0)).toEqual([])
  })
  it('preserves native bookmark matches and never learns unrelated local results into eligibility', () => {
    const bookmark: OmnibarResult = {
      id: 'cafe-bookmark',
      type: 'bookmark',
      title: 'Café',
      url: 'https://example.com/coffee',
      action: { kind: 'url', url: 'https://example.com/coffee' },
    }
    const browser = {
      ...snapshot,
      tabs: [
        { ...snapshot.tabs[0]!, title: bookmark.title, url: bookmark.url },
      ],
      groups: [],
    }
    expect(
      getOmnibarResults('cafe', browser, 10, [bookmark], 0).map(
        (item) => item.type,
      ),
    ).toEqual(['search', 'bookmark'])
    expect(
      getOmnibarResults('missing', browser, 10, [], 0, 'active', [
        { query: 'missing', target: 'tab:1', selectedAt: 0 },
      ]).map((item) => item.type),
    ).toEqual(['search'])
  })

  it('puts numbered window commands first and retains pinned URL actions', () => {
    const browser = {
      ...snapshot,
      windows: snapshot.windows.map((window) =>
        window.id === 20 ? { ...window, name: 'Workspace' } : window,
      ),
    }
    const results = getOmnibarResults('window', browser, 10, [], 0)
    expect(results.map((result) => result.id)).toEqual([
      'window:10',
      'window:20',
      'search-google',
    ])
    expect(results[0]?.title).toBe('Window 1')
    expect(results[0]?.action).toEqual({ kind: 'window', windowId: 10 })
    expect(results[1]?.title).toBe('Workspace')
    expect(results[1]?.description).toBe('Window 2 · 1 tab')
    expect(
      getOmnibarResults('WINDOW 1', browser, 10, [], 0)[0]?.action,
    ).toEqual({ kind: 'window', windowId: 10 })
    expect(
      getOmnibarResults('example.com', snapshot, 10, [], 0).map(
        (result) => result.id,
      ),
    ).toEqual(['url-go', 'search-google', 2])
  })
  it.each(['active', 'first'] as const)(
    'searches only custom window names with %s-tab window labels',
    (windowSource) => {
      const browser = {
        ...snapshot,
        windows: snapshot.windows.map((window) => ({
          ...window,
          name: window.id === 20 ? 'Inbox workspace' : '   ',
          icon: 'book',
        })),
        tabs: snapshot.tabs.map((tab) => ({
          ...tab,
          title: 'Inbox',
          url: 'https://mail.test/inbox',
        })),
      }
      const results = getOmnibarResults(
        'inbox',
        browser,
        10,
        [],
        0,
        windowSource,
        [{ query: 'inbox', target: 'window:10', selectedAt: 0 }],
      )
      expect(
        results
          .filter((result) => result.type === 'window')
          .map((result) => result.id),
      ).toEqual(['window:20'])
      expect(
        results
          .filter((result) => result.type === 'tab')
          .map((result) => result.id)
          .sort(),
      ).toEqual([1, 2])
    },
  )

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
