import { searchBookmarks, searchClosedTabs, searchHistory } from './search'
import { useCallback, useEffect, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const useOmnibar = () => {
  const [tabs, setTabs] = useState<OmnibarSearchResult[]>([])

  useEffect(() => {
    chrome.tabs.query({}).then((response) => {
      if (response) {
        setTabs(
          response.map((t) => ({
            id: t.id || 0,
            type: 'tab',
            title: t.title || 'Untitled',
            url: t.url,
            favIconUrl: t.favIconUrl,
            windowId: t.windowId,
            tabId: t.id,
            lastVisitTime: t.lastAccessed,
            execute: async () => {
              if (t.windowId) {
                await chrome.windows.update(t.windowId, { focused: true })
              }
              if (t.id) {
                await chrome.tabs.update(t.id, { active: true })
              }
            },
          })),
        )
      }
    })
  }, [])

  const onSearch = useCallback(async (query: string) => {
    const [historyResults, bookmarkResults, closedTabResults] =
      await Promise.all([
        searchHistory(query),
        searchBookmarks(query),
        searchClosedTabs(query),
      ])
    const results = [
      ...closedTabResults,
      ...bookmarkResults,
      ...historyResults,
    ] as OmnibarSearchResult[]
    return results
  }, [])

  const onSelect = useCallback(
    async (
      item: OmnibarSearchResult,
      modifier?: 'new-tab' | 'new-window',
      originalWindowId?: number,
    ) => {
      await item.execute(modifier, originalWindowId)
    },
    [],
  )

  return { tabs, onSearch, onSelect }
}
