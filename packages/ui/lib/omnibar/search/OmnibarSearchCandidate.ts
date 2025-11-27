import type { OmnibarActionFn } from '../actions/OmnibarActionFn'
import type { OmnibarActionTextFn } from '../actions/OmnibarActionTextFn'
import type { FC } from 'react'

type Fields = keyof Omit<OmnibarSearchCandidate, 'searchFields'>

type StringFields = {
  [K in Fields]: OmnibarSearchCandidate[K] extends string | undefined
    ? K
    : never
}[Fields]

export type SearchableFields = Exclude<StringFields, 'id' | 'type'>

/**
 * Provides a search candidate that can be checked against an
 * OmnibarSearchQuery in order to provide an OmnibarSearchResult.
 *
 * For chrome APIs like `history` and `bookmarks`, they already do
 * the searching and their results can be mapped to a candidate.
 * They still need this layer to conform their shape and to
 * get scored. Things may drop off if they have low scores
 * so they're not true results yet even if they do match.
 *
 * For custom searches like tabs, recently closed items, and bang
 * operators, all of them can be considered candidates. They'll
 * be matched and scored in order to determine if they become
 * results or not.
 */
export type OmnibarSearchCandidate = {
  /**
   * A unique ID that can be generated from unique combinations of
   * search result data, such as the type and a tab id.
   */
  id: string

  /**
   * The type of search result. There are a limited number of things
   * that are search results.
   */
  type:
    | 'url'
    | 'search'
    | 'command'
    | 'tab'
    | 'bookmark'
    | 'recentlyClosed'
    | 'history'

  /**
   * A title for the search result to be displayed prominently.
   */
  title: string

  /**
   * A component that the render can call to display an icon for the item.
   */
  IconComponent: FC<{ size: number }>

  /**
   * A url to display related to the search result.
   */
  url?: string

  /**
   * A timestamp pertaining to the search result, as ms since epoch.
   *
   * For a recently closed item, this would when it was closed.
   * For a history item, when it was last accessed.
   */
  timestamp?: number

  /**
   * Short, supplemental text that can be specific to the type of search result,
   * such as the number of other tabs on a recently closed window or the trigger
   * on a bang operator.
   */
  supplementalText?: string

  /**
   * The fields that are searched and will be highlighted on matches.
   */
  searchFields?: SearchableFields[]

  /**
   * A score modifier that can be used when calculating a match.
   *
   * For example, bangs include a rank which can be used here.
   */
  scoreModifier?: number

  /**
   * Provides the text that will be used as the action of the search result.
   */
  getActionText: OmnibarActionTextFn

  /**
   * Executes the action when the search result is triggered.
   */
  performAction: OmnibarActionFn
}
