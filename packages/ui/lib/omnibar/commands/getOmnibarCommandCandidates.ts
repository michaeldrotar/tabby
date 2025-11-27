import { omnibarCommandCandidates } from './omnibarCommandCandidates'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

export const getOmnibarCommandCandidates = (): Promise<
  OmnibarSearchCandidate[]
> => {
  return Promise.resolve(omnibarCommandCandidates)
}
