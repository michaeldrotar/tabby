import {
  getGoogleSearchItem,
  getMatchingCommands,
  getMatchingTabs,
  getUrlNavigationItem,
} from './omnibarResultGenerators'
import { calculateScore } from './scoring'
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

    const pinnedItems = [
      ...getUrlNavigationItem(query),
      getGoogleSearchItem(query),
    ]

    const rankedItems = [
      ...getMatchingCommands(queryTerms),
      ...getMatchingTabs(tabs, queryTerms),
      ...externalResults,
    ]

    const scoredItems = rankedItems.map((item) => ({
      item,
      score: calculateScore(item, query),
    }))

    scoredItems.sort((a, b) => b.score - a.score)

    return [...pinnedItems, ...scoredItems.map((i) => i.item)]
  }, [query, tabs, externalResults])

  return { filteredItems, selectedIndex, setSelectedIndex }
}
