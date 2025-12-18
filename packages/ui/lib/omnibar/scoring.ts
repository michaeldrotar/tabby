import type { OmnibarSearchResult } from './OmnibarSearchResult'

const BASE_WEIGHTS: Record<string, number> = {
  command: 100,
  tab: 80,
  bookmark: 70,
  'recently-closed': 35,
  history: 34,
}

// Max 20 points if just now, decaying every day
const MAX_RECENCY_BONUS = 20
const RECENCY_HALF_LIFE_MS = 1 * 24 * 60 * 60 * 1000

const TEXT_MATCH_WEIGHTS = {
  // must be in order since they're checked in this order
  ExactTitleToken: 10, // matches a title token exactly
  PrefixTitleToken: 8, // matches the start of a title token
  ExactHostToken: 8, // matches a host token exactly
  PrefixHostToken: 6, // matches the start of a host token
  ExactPathToken: 5, // matches a path token exactly
  PrefixPathToken: 4, // matches the start of a path token
} as const

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[\s\-_./:?#[\]@!$&'()*+,;=%]+/)
    .filter(Boolean)

const getUrlTokens = (
  url: string,
): { hostTokens: string[]; pathTokens: string[] } => {
  try {
    const parsed = new URL(url)
    const hostTokens = tokenize(parsed.hostname)
    const pathTokens = tokenize(parsed.pathname)
    return { hostTokens, pathTokens }
  } catch {
    // Fallback for non-standard URLs / chrome:// etc
    const parts = url.split('://')
    const withoutScheme = parts.length > 1 ? parts.slice(1).join('://') : url
    const [hostPart, ...pathParts] = withoutScheme.split('/')
    return {
      hostTokens: tokenize(hostPart ?? ''),
      pathTokens: tokenize(pathParts.join('/')),
    }
  }
}

const getUniqueQueryTerms = (query: string): string[] => {
  const terms = tokenize(query)
  return [...new Set(terms)]
}

const calculateTextMatchBonus = (
  item: OmnibarSearchResult,
  queryTerms: string[],
): number => {
  if (queryTerms.length === 0) return 0

  const titleTokens = tokenize(item.title ?? '')
  const urlValue = item.url ?? ''
  const { hostTokens, pathTokens } = urlValue
    ? getUrlTokens(urlValue)
    : { hostTokens: [], pathTokens: [] }

  let score = 0

  for (const term of queryTerms) {
    let termScore = 0

    if (titleTokens.some((t) => t === term)) {
      termScore = TEXT_MATCH_WEIGHTS.ExactTitleToken
    } else if (titleTokens.some((t) => t.startsWith(term))) {
      termScore = TEXT_MATCH_WEIGHTS.PrefixTitleToken
    } else if (hostTokens.some((t) => t === term)) {
      termScore = TEXT_MATCH_WEIGHTS.ExactHostToken
    } else if (hostTokens.some((t) => t.startsWith(term))) {
      termScore = TEXT_MATCH_WEIGHTS.PrefixHostToken
    } else if (pathTokens.some((t) => t === term)) {
      termScore = TEXT_MATCH_WEIGHTS.ExactPathToken
    } else if (pathTokens.some((t) => t.startsWith(term))) {
      termScore = TEXT_MATCH_WEIGHTS.PrefixPathToken
    }

    score += termScore
  }

  return score / queryTerms.length
}

export const calculateScore = (
  item: OmnibarSearchResult,
  query: string,
): number => {
  const baseWeight = BASE_WEIGHTS[item.type] || 0

  // Recency Bonus
  let recencyBonus = 0
  if (typeof item.lastVisitTime === 'number') {
    const ageMs = Math.max(0, Date.now() - item.lastVisitTime)
    recencyBonus =
      MAX_RECENCY_BONUS * Math.exp((-Math.LN2 * ageMs) / RECENCY_HALF_LIFE_MS)
  }

  const queryTerms = getUniqueQueryTerms(query)
  const textBonus = calculateTextMatchBonus(item, queryTerms)

  return baseWeight + recencyBonus + textBonus
}
