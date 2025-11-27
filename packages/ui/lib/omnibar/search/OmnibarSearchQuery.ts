import type { OmnibarBang } from '../bangs/OmnibarBang'

/**
 * Captures a structured object representing the user's raw search input.
 * Pairs with an OmnibarSearchCandidate to create an OmnibarSearchResult.
 */
export type OmnibarSearchQuery = {
  /**
   * The raw search string for searches like url detection.
   */
  searchText: string

  /**
   * A potential bang match.
   */
  potentialBangText?: string

  /**
   * The first entered bang that matches exactly, if any.
   */
  activeBang?: OmnibarBang

  /**
   * List of tokens to use with the activeBang.
   */
  activeBangTokens: string[] | undefined

  /**
   * List of tokens the user entered.
   */
  tokens: string[]
}
