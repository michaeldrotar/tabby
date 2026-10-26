import { getChromeFaviconUrl } from './favicon.js'
import type { ClosedSession } from '@extension/core/recentlyClosed'

export const normalizeClosedSessions = (
  sessions: readonly chrome.sessions.Session[],
  runtime: Pick<typeof chrome.runtime, 'getURL'>,
): ClosedSession[] =>
  sessions.flatMap((session) => {
    const sessionId = session.tab?.sessionId ?? session.window?.sessionId
    if (!sessionId) return []
    return [
      {
        sessionId,
        kind: session.tab ? ('tab' as const) : ('window' as const),
        closedAt: session.lastModified * 1000,
        tabs: (session.tab ? [session.tab] : (session.window?.tabs ?? [])).map(
          (tab) => ({
            title: tab.title || tab.url || 'Untitled tab',
            url: tab.url,
            faviconUrl: tab.url
              ? getChromeFaviconUrl(runtime, tab.url)
              : tab.favIconUrl,
          }),
        ),
      },
    ]
  })
