import { getOmnibarCandidates } from './getOmnibarCandidates'
import { parseOmnibarSearchText } from './parseOmnibarSearchText'
import { processOmnibarCandidates } from './processOmnibarCandidates'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarSearchResults = async (
  searchText: string,
): Promise<OmnibarSearchResult[]> => {
  const query = parseOmnibarSearchText(searchText)
  const candidates = await getOmnibarCandidates(query)
  return processOmnibarCandidates(candidates, query)
}
