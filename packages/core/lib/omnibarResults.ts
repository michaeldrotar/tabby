import { calculateScore, compareOmnibarScoredItems } from './omnibarRanking.js'
import type { BrowserSnapshot } from './browser.js'
import type { OmnibarAction, OmnibarResult } from './omnibar.js'

const command = (
  id: string,
  title: string,
  action: OmnibarAction,
  url?: string,
): OmnibarResult => ({ id, title, type: 'command', action, url })

export const getOmnibarCommands = (
  snapshot: BrowserSnapshot,
  originalWindowId?: number,
): OmnibarResult[] => {
  const incognito = Boolean(
    snapshot.windows.find((window) => window.id === originalWindowId)
      ?.incognito,
  )
  const windows = [...snapshot.windows]
    .filter((window) => Boolean(window.incognito) === incognito)
    .sort((a, b) => a.id - b.id)
    .slice(0, 10)
  return [
    command('cmd-side-panel', 'Tabby: Open Tab Manager', {
      kind: 'tab-manager',
    }),
    command('cmd-open-options', 'Tabby: Open Options', { kind: 'options' }),
    ...[
      ['settings', 'Open Settings', 'settings'],
      ['extensions', 'Manage Extensions', 'extensions'],
      ['history', 'History', 'history'],
      ['downloads', 'Downloads', 'downloads'],
      ['bookmarks', 'Bookmarks Manager', 'bookmarks'],
      ['passwords', 'Password Manager', 'password-manager'],
      ['clear-data', 'Clear Browsing Data', 'settings/clearBrowserData'],
    ].map(([id, title, path]) =>
      command(
        `cmd-${id}`,
        `Chrome: ${title}`,
        { kind: 'url', url: `chrome://${path}` },
        `chrome://${path}`,
      ),
    ),
    ...windows.map((window, index) => {
      const active = snapshot.tabs.find(
        (tab) => tab.windowId === window.id && tab.active,
      )
      return {
        ...command(
          `cmd-focus-window-${index + 1}`,
          `Tabby: Focus Window ${index + 1}${active?.title ? ` — ${active.title}` : ''}`,
          { kind: 'window', windowId: window.id },
          active?.url,
        ),
        windowId: window.id,
      }
    }),
  ]
}

export const getOmnibarBrowserResults = (
  snapshot: BrowserSnapshot,
): { tabs: OmnibarResult[]; groups: OmnibarResult[] } => ({
  tabs: snapshot.tabs.map((tab) => ({
    id: tab.id,
    type: 'tab',
    title: tab.title || 'Untitled',
    url: tab.url,
    favIconUrl: tab.faviconUrl,
    windowId: tab.windowId,
    tabId: tab.id,
    active: tab.active,
    lastVisitTime: tab.lastAccessed,
    action: {
      kind: 'tab',
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url,
    },
  })),
  groups: snapshot.groups.map((group) => ({
    id: `tab-group:${group.id}`,
    type: 'tab-group',
    title: group.title?.trim() || 'Untitled group',
    windowId: group.windowId,
    groupColor: group.color,
    groupTabCount: snapshot.tabs.filter((tab) => tab.groupId === group.id)
      .length,
    groupWindowLabel: snapshot.windows.find(
      (window) => window.id === group.windowId,
    )?.focused
      ? 'Current window'
      : `Window ${snapshot.windows.findIndex((window) => window.id === group.windowId) + 1}`,
    groupCollapsed: group.collapsed,
    action: { kind: 'group', groupId: group.id },
  })),
})

export const getOmnibarSearchResult = (query: string): OmnibarResult => {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`
  return {
    id: 'search-google',
    type: 'search',
    title: 'Search Google',
    url,
    action: { kind: 'url', url },
  }
}

export const getOmnibarUrlResults = (query: string): OmnibarResult[] => {
  if (
    !/^https?:\/\//.test(query) &&
    (query.includes(' ') || !query.includes('.'))
  )
    return []
  const url = query.includes('://') ? query : `https://${query}`
  return [
    {
      id: 'url-go',
      type: 'url',
      title: 'Open URL',
      url,
      action: { kind: 'url', url },
    },
  ]
}

/** Compose the exact display order independently of resources and presentation. */
export const getOmnibarResults = (
  query: string,
  snapshot: BrowserSnapshot,
  originalWindowId: number | undefined,
  externalResults: readonly OmnibarResult[],
  now: number,
): OmnibarResult[] => {
  if (!query) return []
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const { tabs, groups } = getOmnibarBrowserResults(snapshot)
  const matching = [
    ...getOmnibarCommands(snapshot, originalWindowId),
    ...tabs,
    ...groups,
  ].filter((item) =>
    terms.every((term) =>
      `${item.title} ${item.url ?? ''}`.toLowerCase().includes(term),
    ),
  )
  const ranked = [...matching, ...externalResults]
    .map((item) => ({ item, score: calculateScore(item, query, now) }))
    .sort(compareOmnibarScoredItems)
    .map(({ item }) => item)
  const windowCommands =
    terms[0] === 'window'
      ? ranked
          .filter((item) => String(item.id).startsWith('cmd-focus-window-'))
          .sort(
            (a, b) =>
              Number(String(a.id).split('-').at(-1)) -
              Number(String(b.id).split('-').at(-1)),
          )
      : []
  const windowIds = new Set(windowCommands.map((item) => item.id))
  return [
    ...windowCommands,
    ...getOmnibarUrlResults(query),
    getOmnibarSearchResult(query),
    ...ranked.filter((item) => !windowIds.has(item.id)),
  ]
}
