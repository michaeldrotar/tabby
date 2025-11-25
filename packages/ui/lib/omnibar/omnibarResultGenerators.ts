import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const getGoogleSearchItem = (query: string): OmnibarSearchItem => ({
  id: 'search-google',
  type: 'search',
  title: 'Search Google',
  url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
})

export const getUrlNavigationItem = (query: string): OmnibarSearchItem[] => {
  const isUrl =
    /^https?:\/\//.test(query) || (!query.includes(' ') && query.includes('.'))

  if (!isUrl) return []

  return [
    {
      id: 'url-go',
      type: 'url',
      title: 'Open URL',
      url: query.includes('://') ? query : `https://${query}`,
    },
  ]
}

const COMMANDS: OmnibarSearchItem[] = [
  {
    id: 'cmd-side-panel',
    type: 'command',
    title: 'Tabby: Open Tab Manager',
  },
  {
    id: 'cmd-settings',
    type: 'command',
    title: 'Chrome: Open Settings',
    url: 'chrome://settings',
  },
  {
    id: 'cmd-extensions',
    type: 'command',
    title: 'Chrome: Manage Extensions',
    url: 'chrome://extensions',
  },
  {
    id: 'cmd-history',
    type: 'command',
    title: 'Chrome: History',
    url: 'chrome://history',
  },
  {
    id: 'cmd-downloads',
    type: 'command',
    title: 'Chrome: Downloads',
    url: 'chrome://downloads',
  },
  {
    id: 'cmd-bookmarks',
    type: 'command',
    title: 'Chrome: Bookmarks Manager',
    url: 'chrome://bookmarks',
  },
]

export const getMatchingCommands = (
  queryTerms: string[],
): OmnibarSearchItem[] => {
  return COMMANDS.filter((c) => {
    const title = c.title.toLowerCase()
    return queryTerms.every((term) => title.includes(term))
  })
}

export const getMatchingTabs = (
  tabs: OmnibarSearchItem[],
  queryTerms: string[],
): OmnibarSearchItem[] => {
  return tabs
    .filter((tab) => {
      const title = tab.title?.toLowerCase() || ''
      const url = tab.url?.toLowerCase() || ''
      return queryTerms.every(
        (term) => title.includes(term) || url.includes(term),
      )
    })
    .map((t) => ({ ...t, type: 'tab' as const }))
}
