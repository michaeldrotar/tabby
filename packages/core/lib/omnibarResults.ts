import { isNavigableUrl } from './navigation.js'
import { getOmnibarTarget, normalizeOmnibarQuery } from './omnibarChoices.js'
import { createOmnibarMatcher } from './omnibarMatching.js'
import { rankOmnibarResults } from './omnibarRanking.js'
import { getCustomWindowName, getWindowIdentity } from './windowIdentity.js'
import type { BrowserSnapshot } from './browser.js'
import type {
  OmnibarAction,
  OmnibarChoice,
  OmnibarResult,
  OmnibarScope,
} from './omnibar.js'

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
  includeUnnamedWindows = false,
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
    ...windows.flatMap((window, index) => {
      const name = getCustomWindowName(window)
      if (!name && !includeUnnamedWindows) return []
      const identity = getWindowIdentity(window, snapshot.tabs, windowSource)
      const tabCount = snapshot.tabs.filter(
        (tab) => tab.windowId === window.id,
      ).length
      return [
        {
          id: `window:${window.id}`,
          type: 'window' as const,
          title: name || `Window ${index + 1}`,
          searchAliases: [`window ${index + 1}`],
          description: `Window ${index + 1} · ${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'}`,
          action: { kind: 'window' as const, windowId: window.id },
          windowId: window.id,
          windowIcon:
            identity.icon ?? (identity.iconUrl ? undefined : 'window'),
          windowIconUrl: identity.iconUrl,
          windowIconColor: identity.iconColor,
        },
      ]
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
  const windowLabels = new Map(
    snapshot.windows.map((window, index) => [
      window.id,
      getCustomWindowName(window) ||
        (window.focused ? 'Current window' : `Window ${index + 1}`),
    ]),
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
      groupWindowLabel: windowLabels.get(group.windowId) ?? 'Window 0',
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

const sortDefaultResults = (
  results: readonly OmnibarResult[],
  snapshot: BrowserSnapshot,
) => {
  const windowActivity = new Map<number, number>()
  const groupActivity = new Map<number, number>()
  const timestamp = (value?: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0
  for (const tab of snapshot.tabs) {
    const time = timestamp(tab.lastAccessed)
    windowActivity.set(
      tab.windowId,
      Math.max(windowActivity.get(tab.windowId) ?? 0, time),
    )
    if (tab.groupId !== undefined && tab.groupId >= 0)
      groupActivity.set(
        tab.groupId,
        Math.max(groupActivity.get(tab.groupId) ?? 0, time),
      )
  }
  const activity = (item: OmnibarResult): number => {
    if (item.action.kind === 'tab') return timestamp(item.lastVisitTime)
    if (item.action.kind === 'window')
      return windowActivity.get(item.action.windowId) ?? 0
    if (item.action.kind === 'group')
      return groupActivity.get(item.action.groupId) ?? 0
    return 0
  }
  return [...results].sort((a, b) => activity(b) - activity(a))
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
  scope: OmnibarScope = 'all',
): OmnibarResult[] => {
  query = query.trim()
  const normalized = normalizeOmnibarQuery(query)
  if (!normalized && scope === 'all') return []
  const windowCommandQuery = /^window(?:\s+\d+)?$/.test(normalized)
  const { tabs, groups } = getOmnibarBrowserResults(snapshot)
  const matches = createOmnibarMatcher(query)
  const candidates = [
    ...getOmnibarCommands(
      snapshot,
      originalWindowId,
      windowSource,
      windowCommandQuery || scope === 'windows',
    ),
    ...tabs,
    ...groups,
  ].filter((item) =>
    matches(item.searchTitle ?? item.title, item.url, item.searchAliases),
  )
  candidates.push(...externalResults)
  const scopedCandidates = candidates.filter((item) => {
    switch (scope) {
      case 'current-window':
        return (
          item.type === 'tab' &&
          originalWindowId !== undefined &&
          item.windowId === originalWindowId
        )
      case 'tabs':
        return item.type === 'tab'
      case 'bookmarks':
        return item.type === 'bookmark'
      case 'history':
        return item.type === 'history'
      case 'recently-closed':
        return item.type === 'recently-closed'
      case 'windows':
        return item.type === 'window'
      case 'tab-groups':
        return item.type === 'tab-group'
      case 'commands':
        return item.type === 'command'
      default:
        return true
    }
  })
  const targets = new Set<string>()
  const ranked = (
    normalized
      ? rankOmnibarResults(scopedCandidates, query, now, choices)
      : sortDefaultResults(scopedCandidates, snapshot)
  ).filter((item) => {
    const target = getOmnibarTarget(item)
    if (targets.has(target)) return false
    targets.add(target)
    return true
  })
  if (scope !== 'all') return ranked
  const windowCommands = windowCommandQuery
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
