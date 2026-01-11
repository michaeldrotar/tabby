import { useMemo } from 'react'
import {
  getGoogleSearchItem,
  getMatchingCommands,
  getMatchingTabs,
  getUrlNavigationItem,
} from './omnibarResultGenerators.js'
import type { OmnibarResultGenerators } from '@extension/ui/omnibar/Omnibar'

/**
 * Provides the omnibar result generators.
 *
 * These generators create OmnibarSearchResult items with execute functions
 * that call Chrome APIs.
 *
 * @example
 * const generators = useOmnibarGenerators()
 * return <Omnibar generators={generators} ... />
 */
export const useOmnibarGenerators = (): OmnibarResultGenerators => {
  return useMemo(
    () => ({
      getGoogleSearchItem,
      getUrlNavigationItem,
      getMatchingCommands,
      getMatchingTabs,
    }),
    [],
  )
}
