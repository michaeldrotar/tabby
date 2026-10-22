import { isNavigableUrl } from './navigation.js'
import { getOmnibarTarget, normalizeOmnibarQuery } from './omnibarChoices.js'
import { createOmnibarMatcher } from './omnibarMatching.js'
import { rankOmnibarResults } from './omnibarRanking.js'
import { getWindowIdentity } from './windowIdentity.js'
import type { BrowserSnapshot } from './browser.js'
import type { OmnibarAction, OmnibarChoice, OmnibarResult } from './omnibar.js'

const command = (
  id: string,
  title: string,
  action: OmnibarAction,
  url?: string,
): OmnibarResult => ({
  id,
  title,
  type: 'command',
  action,
  searchTitle: title
    .replace(/^(?:Chrome|Tabby):\s*/, '')
    .replace(/^(?:Open|Manage)\s+/, ''),
  searchAliases: [title, ...(url ? [url] : [])],
  ...(url ? { description: url } : {}),
})

const windowNumber = (item: OmnibarResult) =>
  Number(item.searchAliases?.[0]?.split(' ').at(-1))

export const getOmnibarCommands = (
  snapshot: BrowserSnapshot,
  originalWindowId?: number,
  windowSource: 'active' | 'first' = 'active',
): OmnibarResult[] => {
  const incognito = Boolean(
    snapshot.windows.find((window) => window.id === originalWindowId)
      ?.incognito,
  )
  const windows = [...snapshot.windows]
    .filter((window) => Boolean(window.incognito) === incognito)
    .sort((a, b) => a.id - b.id)
  return [
    command('cmd-side-panel', 'Tabby: Open tab manager', {
      kind: 'tab-manager',
    }),
    command('cmd-open-options', 'Tabby: Open options', { kind: 'options' }),
    ...[
      ['settings', 'Open settings', 'settings'],
      ['extensions', 'Manage extensions', 'extensions'],
      ['history', 'History', 'history'],
      ['downloads', 'Downloads', 'downloads'],
      ['bookmarks', 'Bookmarks manager', 'bookmarks'],
      ['passwords', 'Password manager', 'password-manager'],
      ['clear-data', 'Clear browsing data', 'settings/clearBrowserData'],
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
      const identity = getWindowIdentity(window, snapshot.tabs, windowSource)
      const name = window.name?.trim()
      const tabCount = snapshot.tabs.filter(
        (tab) => tab.windowId === window.id,
      ).length
      return {
        id: `window:${window.id}`,
        type: 'window' as const,
        title: name || identity.title,
        searchAliases: [`window ${index + 1}`],
        url: name ? undefined : active?.url,
        description: `Window ${index + 1} · ${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'}`,
        action: { kind: 'window' as const, windowId: window.id },
        windowId: window.id,
        windowIcon: identity.icon ?? (identity.iconUrl ? undefined : 'window'),
        windowIconUrl: identity.iconUrl,
        windowIconColor: identity.iconColor,
      }
    }),
  ]
}

export const getOmnibarBrowserResults = (
  snapshot: BrowserSnapshot,
): { tabs: OmnibarResult[]; groups: OmnibarResult[] } => {
  const groupCounts = new Map<number, number>()
  for (const tab of snapshot.tabs) {
    if (tab.groupId !== undefined)
      groupCounts.set(tab.groupId, (groupCounts.get(tab.groupId) ?? 0) + 1)
  }
  const windows = new Map(
    snapshot.windows.map((window, index) => [window.id, { window, index }]),
  )
  return {
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
      groupTabCount: groupCounts.get(group.id) ?? 0,
      groupWindowLabel:
        snapshot.windows.find((window) => window.id === group.windowId)?.name ||
        (windows.get(group.windowId)?.window.focused
          ? 'Current window'
          : `Window ${(windows.get(group.windowId)?.index ?? -1) + 1}`),
      groupCollapsed: group.collapsed,
      action: { kind: 'group', groupId: group.id },
    })),
  }
}

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
  if (!isNavigableUrl(url)) return []
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
  windowSource: 'active' | 'first' = 'active',
  choices: readonly OmnibarChoice[] = [],
): OmnibarResult[] => {
  query = query.trim()
  const normalized = normalizeOmnibarQuery(query)
  if (!normalized) return []
  const { tabs, groups } = getOmnibarBrowserResults(snapshot)
  const matches = createOmnibarMatcher(query)
  const candidates = [
    ...getOmnibarCommands(snapshot, originalWindowId, windowSource),
    ...tabs,
    ...groups,
  ].filter((item) =>
    matches(item.searchTitle ?? item.title, item.url, item.searchAliases),
  )
  candidates.push(...externalResults)
  const targets = new Set<string>()
  const ranked = rankOmnibarResults(candidates, query, now, choices).filter(
    (item) => {
      const target = getOmnibarTarget(item)
      if (targets.has(target)) return false
      targets.add(target)
      return true
    },
  )
  const windowCommands = /^window(?:\s+\d+)?$/.test(normalized)
    ? ranked
        .filter((item) => item.type === 'window')
        .sort((a, b) => windowNumber(a) - windowNumber(b))
    : []
  const windowIds = new Set(windowCommands.map((item) => item.id))
  return [
    ...windowCommands,
    ...getOmnibarUrlResults(query),
    getOmnibarSearchResult(query),
    ...ranked.filter((item) => !windowIds.has(item.id)),
  ]
}
