import {
  getGoogleSearchItem,
  getMatchingCommands,
  getMatchingTabs,
  getUrlNavigationItem,
} from './omnibarResultGenerators'
import { useMemo, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const useOmnibarFiltering = (
  query: string,
  tabs: OmnibarSearchResult[],
  externalResults: OmnibarSearchResult[],
) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredItems = useMemo(() => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()
    const queryTerms = lowerQuery.split(' ').filter(Boolean)

    return [
      ...getUrlNavigationItem(query),
      getGoogleSearchItem(query),
      ...getMatchingCommands(queryTerms),
      ...getMatchingTabs(tabs, queryTerms),
      ...externalResults,
    ].slice(0, 20)
  }, [query, tabs, externalResults])

  return { filteredItems, selectedIndex, setSelectedIndex }
}
