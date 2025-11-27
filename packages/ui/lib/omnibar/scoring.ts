import type { OmnibarSearchResult } from './OmnibarSearchResult'

const BASE_WEIGHTS: Record<string, number> = {
  search: 150,
  command: 100,
  tab: 80,
  bookmark: 60,
  'recently-closed': 50,
  history: 30,
}

const RECENCY_BONUS = {
  ONE_HOUR: 20,
  ONE_DAY: 10,
  ONE_WEEK: 5,
}

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS
const ONE_WEEK_MS = 7 * ONE_DAY_MS

export const calculateScore = (
  item: OmnibarSearchResult,
  query: string,
): number => {
  const baseWeight = BASE_WEIGHTS[item.type] || 0
  const lowerQuery = query.toLowerCase()
  const lowerTitle = (item.title || '').toLowerCase()
  const lowerUrl = (item.url || '').toLowerCase()

  // Match Quality
  let multiplier = 1.0

  if (lowerTitle === lowerQuery || lowerUrl === lowerQuery) {
    multiplier = 1.5
  } else if (lowerTitle.includes(`(${lowerQuery})`)) {
    // Exact match in parentheses (e.g. bang trigger)
    multiplier = 1.4
  } else if (
    lowerTitle.startsWith(lowerQuery) ||
    lowerUrl.startsWith(lowerQuery)
  ) {
    multiplier = 1.2
  } else {
    // Word boundary match
    const titleWords = lowerTitle.split(/[\s-_]+/)
    const urlWords = lowerUrl.split(/[\s-_./]+/)
    const isWordStart = [...titleWords, ...urlWords].some((word) =>
      word.startsWith(lowerQuery),
    )
    if (isWordStart) {
      multiplier = 1.1
    }
  }

  // Recency Bonus
  let recencyBonus = 0
  if (item.lastVisitTime) {
    const diff = Date.now() - item.lastVisitTime
    if (diff < ONE_HOUR_MS) {
      recencyBonus = RECENCY_BONUS.ONE_HOUR
    } else if (diff < ONE_DAY_MS) {
      recencyBonus = RECENCY_BONUS.ONE_DAY
    } else if (diff < ONE_WEEK_MS) {
      recencyBonus = RECENCY_BONUS.ONE_WEEK
    }
  }

  // Rank Bonus (for bangs)
  // Rank is typically 0-100ish? Or higher?
  // Let's assume higher rank is better.
  // We'll add a small bonus based on rank.
  let rankBonus = 0
  if (item.rank) {
    // Logarithmic scale to prevent huge ranks from dominating?
    // Or just a direct small multiplier?
    // Let's try adding rank / 10
    rankBonus = item.rank / 10
  }

  return baseWeight * multiplier + recencyBonus + rankBonus
}
