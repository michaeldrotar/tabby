import type { OmnibarSearchCandidate } from './OmnibarSearchCandidate'
import type { OmnibarSearchQuery } from './OmnibarSearchQuery'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

const BASE_WEIGHTS: Record<OmnibarSearchResult['type'], number> = {
  url: 10_000,
  search: 1000,
  command: 500,
  tab: 100,
  bookmark: 80,
  recentlyClosed: 60,
  history: 10,
}

export const processOmnibarCandidates = (
  candidates: OmnibarSearchCandidate[],
  query: OmnibarSearchQuery,
): OmnibarSearchResult[] => {
  console.log('candidates', candidates.length)
  // If we have an active bang, we might want to use the bang tokens for specific items
  // But generally, we match against the user's typed tokens.
  // If the user typed "!w cats", tokens is ["!w", "cats"].
  // If the candidate is "Search Wikipedia for cats", it should match.
  // For now, we'll use the full token list for general matching.
  const searchTokens = query.tokens

  if (searchTokens.length === 0) {
    return []
  }

  return candidates
    .map((candidate) => {
      const matches: OmnibarSearchResult['matches'] = {}
      let totalScore = 0
      let hasAllTokens = true

      // 1. Tokenize Candidate Fields
      // We need to check if EVERY search token matches AT LEAST ONE token in the candidate.
      // And we need to collect ranges for highlighting.

      // Optimization: Pre-calculate candidate tokens for all fields?
      // Or just iterate fields.

      const fieldMatches: Record<string, { start: number; end: number }[]> = {}

      // Check each search token
      for (const searchToken of searchTokens) {
        let tokenFound = false

        // Check against each searchable field
        candidate.searchFields?.forEach((field) => {
          const text = candidate[field]
          if (!text) return

          // We use a simple regex to find the token in the text for highlighting
          // This handles case-insensitivity.
          // Note: This might find "cat" in "category" which is a prefix match.
          // It might also find "cat" in "scatter" which is a substring match.
          // Our tokenizer splits on separators, so we should ideally match tokens.
          // But for highlighting, substring is usually acceptable/expected.

          // Escape special regex characters in the search token
          const escapedToken = searchToken.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          )
          const regex = new RegExp(escapedToken, 'gi')

          let match
          while ((match = regex.exec(text)) !== null) {
            tokenFound = true

            if (!fieldMatches[field]) {
              fieldMatches[field] = []
            }

            // Add range
            fieldMatches[field].push({
              start: match.index,
              end: match.index + match[0].length,
            })

            // Scoring
            let score = 0
            const isExact = match[0].length === text.length
            const isStart = match.index === 0
            // Check if it's a word boundary match (prefix of a word)
            // We look at the character before the match.
            const charBefore = match.index > 0 ? text[match.index - 1] : ' '
            const isWordStart = /[\s\-/ _.]/.test(charBefore)

            if (isExact) score += 100
            else if (isStart) score += 80
            else if (isWordStart) score += 60
            else score += 10 // Substring match

            // Field Weight
            if (field === 'title') score *= 1.5
            else if (field === 'url') score *= 1.2
            else if (field === 'supplementalText') score *= 0.8

            totalScore += score
          }
        })

        if (!tokenFound) {
          hasAllTokens = false
          break // Fail early if any token is missing
        }
      }

      if (!hasAllTokens) {
        return {
          ...candidate,
          matches: {},
          score: 0,
        }
      }

      // Apply Base Weight
      const baseWeight = BASE_WEIGHTS[candidate.type] || 50
      totalScore += baseWeight

      // Apply Recency Bonus
      if (candidate.timestamp) {
        const age = Date.now() - candidate.timestamp
        // Simple decay: Score * (Factor ^ (Age / Period))
        // Or just a flat bonus. Let's use a bonus to avoid crushing old items too hard.
        // If item is < 1 hour old, +50. < 1 day, +30. < 1 week, +10.
        if (age < 3600000) totalScore += 50
        else if (age < 86400000) totalScore += 30
        else if (age < 604800000) totalScore += 10
      }

      // Apply Modifier
      if (candidate.scoreModifier) {
        totalScore += candidate.scoreModifier
      }

      // Merge overlapping ranges for matches
      Object.keys(fieldMatches).forEach((field) => {
        const ranges = fieldMatches[field]
        ranges.sort((a, b) => a.start - b.start)

        const merged: { start: number; end: number }[] = []
        let current = ranges[0]

        for (let i = 1; i < ranges.length; i++) {
          const next = ranges[i]
          if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end)
          } else {
            merged.push(current)
            current = next
          }
        }
        merged.push(current)
        // @ts-expect-error - we know field is a key of matches because we iterated searchFields
        matches[field] = merged
      })

      return {
        ...candidate,
        matches,
        score: totalScore,
      }
    })
    .filter((result) => result.score > 0)
    .sort((resultA, resultB) => resultB.score - resultA.score)
}
