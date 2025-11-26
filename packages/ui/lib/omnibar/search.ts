import { executeUrl } from './executeUrl'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const searchHistory = async (
  query: string,
): Promise<OmnibarSearchResult[]> => {
  const results = await chrome.history.search({
    text: query,
    maxResults: 20,
    startTime: 0,
  })
  return results.map((h) => ({
    id: h.id,
    type: 'history',
    title: h.title || h.url || 'Untitled',
    url: h.url,
    description: 'History',
    lastVisitTime: h.lastVisitTime,
    execute: async (modifier, originalWindowId) => {
      if (h.url) {
        await executeUrl(h.url, modifier, originalWindowId)
      }
    },
  }))
}

export const searchBookmarks = async (
  query: string,
): Promise<OmnibarSearchResult[]> => {
  const results = await chrome.bookmarks.search(query)
  return results.map((b) => ({
    id: b.id,
    type: 'bookmark',
    title: b.title,
    url: b.url,
    description: 'Bookmark',
    execute: async (modifier, originalWindowId) => {
      if (b.url) {
        await executeUrl(b.url, modifier, originalWindowId)
      }
    },
  }))
}

export const searchClosedTabs = async (
  query: string,
): Promise<OmnibarSearchResult[]> => {
  const sessionResults = await chrome.sessions.getRecentlyClosed()
  const terms = query
    .toLowerCase()
    .split(' ')
    .filter((t: string) => t.length > 0)
  const isMatch = (title?: string, url?: string) => {
    if (terms.length === 0) return true
    const text = ((title || '') + ' ' + (url || '')).toLowerCase()
    return terms.every((term: string) => text.includes(term))
  }

  const closedTabResults: OmnibarSearchResult[] = []

  sessionResults.forEach((s) => {
    if (s.tab) {
      if (isMatch(s.tab.title, s.tab.url)) {
        closedTabResults.push({
          id: `recently-closed-${s.tab.sessionId}`,
          type: 'recently-closed',
          title: s.tab.title || 'Untitled',
          url: s.tab.url,
          description: 'Recently Closed',
          sessionId: s.tab.sessionId,
          lastVisitTime: s.lastModified ? s.lastModified * 1000 : undefined,
          execute: async () => {
            if (s.tab && s.tab.sessionId) {
              await chrome.sessions.restore(s.tab.sessionId)
            }
          },
        })
      }
    } else if (s.window && s.window.tabs) {
      s.window.tabs.forEach((tab, index) => {
        if (isMatch(tab.title, tab.url)) {
          closedTabResults.push({
            id: `closed-window-${s.window!.sessionId}-tab-${index}`,
            type: 'recently-closed',
            title: tab.title || 'Untitled',
            url: tab.url,
            description: 'Recently Closed Window',
            sessionId: s.window!.sessionId,
            lastVisitTime: s.lastModified ? s.lastModified * 1000 : undefined,
            tabCount: s.window!.tabs!.length,
            execute: async () => {
              if (s.window && s.window.sessionId) {
                await chrome.sessions.restore(s.window.sessionId)
              }
            },
          })
        }
      })
    }
  })

  return closedTabResults
}
