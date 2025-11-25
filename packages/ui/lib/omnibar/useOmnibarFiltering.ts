import { useMemo, useState } from 'react'
import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const useOmnibarFiltering = (
  query: string,
  tabs: OmnibarSearchItem[],
  externalResults: OmnibarSearchItem[],
) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredItems = useMemo(() => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()

    // Google Search (Always First)
    const googleSearch: OmnibarSearchItem = {
      id: 'search-google',
      type: 'search',
      title: 'Search Google',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    }

    // URL (Only if valid)
    const urlResults: OmnibarSearchItem[] = []
    const isUrl =
      /^https?:\/\//.test(query) ||
      (!query.includes(' ') && query.includes('.'))
    if (isUrl) {
      urlResults.push({
        id: 'url-go',
        type: 'url',
        title: 'Open URL',
        url: query.includes('://') ? query : `https://${query}`,
      })
    }

    // Commands
    const commands: OmnibarSearchItem[] = [
      {
        id: 'cmd-side-panel',
        type: 'command' as const,
        title: 'Tabby: Open Tab Manager',
      },
      {
        id: 'cmd-settings',
        type: 'command' as const,
        title: 'Chrome: Open Settings',
        url: 'chrome://settings',
      },
      {
        id: 'cmd-extensions',
        type: 'command' as const,
        title: 'Chrome: Manage Extensions',
        url: 'chrome://extensions',
      },
      {
        id: 'cmd-history',
        type: 'command' as const,
        title: 'Chrome: History',
        url: 'chrome://history',
      },
      {
        id: 'cmd-downloads',
        type: 'command' as const,
        title: 'Chrome: Downloads',
        url: 'chrome://downloads',
      },
      {
        id: 'cmd-bookmarks',
        type: 'command' as const,
        title: 'Chrome: Bookmarks Manager',
        url: 'chrome://bookmarks',
      },
    ].filter((c) => c.title.toLowerCase().includes(lowerQuery))

    // Local tabs
    const localResults = tabs
      .filter(
        (tab) =>
          tab.title?.toLowerCase().includes(lowerQuery) ||
          tab.url?.toLowerCase().includes(lowerQuery),
      )
      .map((t) => ({ ...t, type: 'tab' as const }))

    // External Results (Bookmarks & History)
    const bookmarks = externalResults.filter((i) => i.type === 'bookmark')
    const history = externalResults.filter((i) => i.type === 'history')

    return [
      ...urlResults,
      googleSearch,
      ...commands,
      ...localResults,
      ...bookmarks,
      ...history,
    ].slice(0, 20)
  }, [query, tabs, externalResults])

  return { filteredItems, selectedIndex, setSelectedIndex }
}
