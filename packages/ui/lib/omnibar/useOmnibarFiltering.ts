import {
  getGoogleSearchItem,
  getMatchingCommands,
  getMatchingTabs,
  getUrlNavigationItem,
} from './omnibarResultGenerators'
import { calculateScore } from './scoring'
import { useMemo, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

type OmnibarScoredItem = {
  item: OmnibarSearchResult
  score: number
}

const compareOmnibarScoredItems = (
  a: OmnibarScoredItem,
  b: OmnibarScoredItem,
) => {
  const scoreDiff = b.score - a.score
  if (scoreDiff !== 0) return scoreDiff

  const aLastVisitTime = a.item.lastVisitTime ?? -1
  const bLastVisitTime = b.item.lastVisitTime ?? -1
  if (aLastVisitTime !== bLastVisitTime) {
    return bLastVisitTime - aLastVisitTime
  }

  return String(a.item.id).localeCompare(String(b.item.id))
}

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
      // item: {
      //   ...item,
      //   title: `${calculateScore(item, query).toFixed(2)} ${item.title}`,
      // },
      score: calculateScore(item, query),
    }))

    scoredItems.sort(compareOmnibarScoredItems)

    return [...pinnedItems, ...scoredItems.map((i) => i.item)]
  }, [query, tabs, externalResults])

  return { filteredItems, selectedIndex, setSelectedIndex }
}
