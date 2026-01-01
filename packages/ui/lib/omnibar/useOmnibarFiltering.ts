import { useMemo, useState } from 'react'
import { calculateScore } from './scoring'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

type OmnibarScoredItem = {
  item: OmnibarSearchResult
  score: number
}

/**
 * Generators for creating omnibar search results.
 * These are passed in from the business logic layer.
 */
export type OmnibarResultGenerators = {
  getGoogleSearchItem: (query: string) => OmnibarSearchResult
  getUrlNavigationItem: (query: string) => OmnibarSearchResult[]
  getMatchingCommands: (queryTerms: string[]) => OmnibarSearchResult[]
  getMatchingTabs: (
    tabs: OmnibarSearchResult[],
    queryTerms: string[],
  ) => OmnibarSearchResult[]
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
  generators: OmnibarResultGenerators,
) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const {
    getGoogleSearchItem,
    getUrlNavigationItem,
    getMatchingCommands,
    getMatchingTabs,
  } = generators

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

    scoredItems.sort(compareOmnibarScoredItems)

    return [...pinnedItems, ...scoredItems.map((i) => i.item)]
  }, [
    query,
    tabs,
    externalResults,
    getGoogleSearchItem,
    getUrlNavigationItem,
    getMatchingCommands,
    getMatchingTabs,
  ])

  return { filteredItems, selectedIndex, setSelectedIndex }
}
