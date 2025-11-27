import type {
  OmnibarSearchCandidate,
  SearchableFields,
} from './OmnibarSearchCandidate'

type MatchRange = { start: number; end: number }

export type OmnibarSearchResult = OmnibarSearchCandidate & {
  score: number
  matches: Partial<Record<SearchableFields, MatchRange[]>>
}
