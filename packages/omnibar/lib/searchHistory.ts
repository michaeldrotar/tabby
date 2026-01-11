import { executeOmnibarUrl } from './executeOmnibarUrl.js'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

/**
 * Searches browser history and returns results as OmnibarSearchResult items.
 */
export const searchHistory = async (
  query: string,
): Promise<OmnibarSearchResult[]> => {
  const results = await chrome.history.search({
    text: query,
    maxResults: 20,
    startTime: 0,
  })

  return results.map((h) => ({
    id: h.id,
    type: 'history' as const,
    title: h.title || h.url || 'Untitled',
    url: h.url,
    description: 'History',
    lastVisitTime: h.lastVisitTime,
    execute: async (modifier, originalWindowId) => {
      if (h.url) {
        await executeOmnibarUrl(h.url, modifier, originalWindowId)
      }
    },
  }))
}
