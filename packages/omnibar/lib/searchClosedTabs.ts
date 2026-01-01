import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

/**
 * Searches recently closed tabs/windows and returns matching results.
 */
export const searchClosedTabs = async (
  query: string,
): Promise<OmnibarSearchResult[]> => {
  const sessionResults = await chrome.sessions.getRecentlyClosed()

  const terms = query
    .toLowerCase()
    .split(' ')
    .filter((t) => t.length > 0)

  const isMatch = (title?: string, url?: string) => {
    if (terms.length === 0) return true
    const text = ((title || '') + ' ' + (url || '')).toLowerCase()
    return terms.every((term) => text.includes(term))
  }

  const results: OmnibarSearchResult[] = []

  for (const session of sessionResults) {
    if (session.tab) {
      if (isMatch(session.tab.title, session.tab.url)) {
        results.push({
          id: `recently-closed-${session.tab.sessionId}`,
          type: 'recently-closed',
          title: session.tab.title || 'Untitled',
          url: session.tab.url,
          description: 'Recently Closed',
          sessionId: session.tab.sessionId,
          lastVisitTime: session.lastModified
            ? session.lastModified * 1000
            : undefined,
          execute: async () => {
            if (session.tab?.sessionId) {
              await chrome.sessions.restore(session.tab.sessionId)
            }
          },
        })
      }
    } else if (session.window?.tabs) {
      for (const [index, tab] of session.window.tabs.entries()) {
        if (isMatch(tab.title, tab.url)) {
          results.push({
            id: `closed-window-${session.window.sessionId}-tab-${index}`,
            type: 'recently-closed',
            title: tab.title || 'Untitled',
            url: tab.url,
            description: 'Recently Closed Window',
            sessionId: session.window.sessionId,
            lastVisitTime: session.lastModified
              ? session.lastModified * 1000
              : undefined,
            tabCount: session.window.tabs.length,
            execute: async () => {
              if (session.window?.sessionId) {
                await chrome.sessions.restore(session.window.sessionId)
              }
            },
          })
        }
      }
    }
  }

  return results
}
