import { Favicon } from '@/lib/components'
import type { OmnibarActionTextFn } from '../actions/OmnibarActionTextFn'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

const getTabs = (session: chrome.sessions.Session): chrome.tabs.Tab[] => {
  if (session.window && session.window.tabs) {
    return session.window.tabs
  }
  if (session.tab) {
    return [session.tab]
  }
  return []
}

const getRecentlyClosedActionText: OmnibarActionTextFn = () => {
  return { primaryText: 'Restore' }
}

export const getOmnibarRecentlyClosedCandidates = async (): Promise<
  OmnibarSearchCandidate[]
> => {
  const recentlyClosed = await chrome.sessions.getRecentlyClosed()
  return recentlyClosed.reduce<OmnibarSearchCandidate[]>(
    (acc, recentlyClosed) => {
      const window = recentlyClosed.window
      const tabs = getTabs(recentlyClosed)
      tabs.forEach((tab) => {
        if (tab.title && tab.url) {
          acc.push({
            id: `recentlyClosed:${tab.sessionId}`,
            type: 'recentlyClosed',
            title: tab.title,
            IconComponent: ({ size }) => Favicon({ pageUrl: tab.url, size }),
            url: tab.url,
            timestamp: tab.lastAccessed,
            supplementalText:
              window?.sessionId && window.tabs?.length && window.tabs.length > 1
                ? `(+${window.tabs?.length - 1} others)`
                : undefined,
            searchFields: ['title', 'url'],
            getActionText: getRecentlyClosedActionText,
            performAction: async (_modifier, _parentWindowId) => {
              if (tab.sessionId) {
                await chrome.sessions.restore(tab.sessionId)
              } else if (recentlyClosed.window?.sessionId) {
                await chrome.sessions.restore(recentlyClosed.window.sessionId)
              }
            },
          })
        }
      })
      return acc
    },
    [],
  )
}
