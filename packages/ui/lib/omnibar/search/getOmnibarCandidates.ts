import { getOmnibarBookmarkCandidates } from '../bookmarks/getOmnibarBookmarkCandidates'
import { getOmnibarCommandCandidates } from '../commands/getOmnibarCommandCandidates'
import { getOmnibarHistoryCandidates } from '../history/getOmnibarHistoryCandidates'
import { getOmnibarRecentlyClosedCandidates } from '../recently-closed/getOmnibarRecentlyClosedCandidates'
import { getOmnibarTabCandidates } from '../tabs/getOmnibarTabCandidates'
import { getOmnibarUrlCandidates } from '../url/getOmnibarUrlCandidates'
import type { OmnibarSearchCandidate } from './OmnibarSearchCandidate'
import type { OmnibarSearchQuery } from './OmnibarSearchQuery'

const getTokenSearchCandidates = async (
  tokens: string[],
): Promise<OmnibarSearchCandidate[]> => {
  if (!tokens.length) return Promise.resolve([])

  const [bookmarkCandidates, historyCandidates] = await Promise.all([
    getOmnibarBookmarkCandidates(tokens),
    getOmnibarHistoryCandidates(tokens),
  ])
  return [...bookmarkCandidates, ...historyCandidates]
}

const getDomainTokens = (query: OmnibarSearchQuery): string[] => {
  if (query.activeBang) {
    return [query.activeBang.domain, ...(query.activeBangTokens || [])]
  }
  return []
}

export const getOmnibarCandidates = async (
  query: OmnibarSearchQuery,
): Promise<OmnibarSearchCandidate[]> => {
  const domainTokens = getDomainTokens(query)

  const [
    urlCandidates,
    // bangSearchCandidates,
    // bangCandidates,
    commandCandidates,
    tabCandidates,
    recentlyClosedCandidates,
    tokenSearchCandidates,
    domainTokenSearchCandidates,
  ] = await Promise.all([
    getOmnibarUrlCandidates(query.searchText),
    // getOmnibarBangSearchCandidates(query.activeBang, query.activeBangTokens),
    // getOmnibarBangCandidates(query.potentialBangText),
    getOmnibarCommandCandidates(),
    getOmnibarTabCandidates(),
    getOmnibarRecentlyClosedCandidates(),
    getTokenSearchCandidates(query.tokens),
    getTokenSearchCandidates(domainTokens),
  ])

  const tokenSearchCandidateIDs = tokenSearchCandidates.map((candidate) => {
    return candidate.id
  })
  const filteredDomainTokenSearchCandidates =
    domainTokenSearchCandidates.filter((candidate) => {
      return !tokenSearchCandidateIDs.includes(candidate.id)
    })

  console.log(
    'tokenSearchCandidates',
    tokenSearchCandidates.length,
    tokenSearchCandidates,
  )
  console.log(
    'filteredDomainTokenSearchCandidates',
    filteredDomainTokenSearchCandidates.length,
  )

  console.log(
    'recentlyClosedCandidates',
    recentlyClosedCandidates.length,
    recentlyClosedCandidates,
  )

  return [
    ...urlCandidates,
    // ...bangSearchCandidates,
    // ...bangCandidates,
    ...commandCandidates,
    ...tabCandidates,
    ...recentlyClosedCandidates,
    ...tokenSearchCandidates,
    ...domainTokenSearchCandidates.filter((candidate) => {
      return !tokenSearchCandidateIDs.includes(candidate.id)
    }),
  ]
}
