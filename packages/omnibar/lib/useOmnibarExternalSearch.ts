import { useCallback } from 'react'
import { searchBookmarks } from './searchBookmarks.js'
import { searchClosedTabs } from './searchClosedTabs.js'
import { searchHistory } from './searchHistory.js'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

/**
 * Provides a search handler that searches history, bookmarks, and closed tabs.
 *
 * Returns a stable callback function suitable for passing to the Omnibar component.
 *
 * @example
 * const handleSearch = useOmnibarExternalSearch()
 * return <Omnibar onSearch={handleSearch} ... />
 */
export const useOmnibarExternalSearch = () => {
  return useCallback(async (query: string): Promise<OmnibarSearchResult[]> => {
    const [historyResults, bookmarkResults, closedTabResults] =
      await Promise.all([
        searchHistory(query),
        searchBookmarks(query),
        searchClosedTabs(query),
      ])
    return [...closedTabResults, ...bookmarkResults, ...historyResults]
  }, [])
}
