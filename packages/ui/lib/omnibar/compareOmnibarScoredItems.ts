import type { OmnibarSearchResult } from './OmnibarSearchResult'

export type OmnibarScoredItem = {
  item: OmnibarSearchResult
  score: number
}

export const compareOmnibarScoredItems = (
  a: OmnibarScoredItem,
  b: OmnibarScoredItem,
): number => {
  const scoreDiff = b.score - a.score
  if (scoreDiff !== 0) return scoreDiff

  const aLastVisitTime = a.item.lastVisitTime ?? -1
  const bLastVisitTime = b.item.lastVisitTime ?? -1
  if (aLastVisitTime !== bLastVisitTime) {
    return bLastVisitTime - aLastVisitTime
  }

  return String(a.item.id).localeCompare(String(b.item.id))
}
