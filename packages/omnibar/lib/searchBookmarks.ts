import { executeOmnibarUrl } from './executeOmnibarUrl.js'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

/**
 * Searches bookmarks and returns results as OmnibarSearchResult items.
 */
export const searchBookmarks = async (
  query: string,
): Promise<OmnibarSearchResult[]> => {
  const results = await chrome.bookmarks.search(query)

  return results.map((b) => ({
    id: b.id,
    type: 'bookmark' as const,
    title: b.title,
    url: b.url,
    description: 'Bookmark',
    execute: async (modifier, originalWindowId) => {
      if (b.url) {
        await executeOmnibarUrl(b.url, modifier, originalWindowId)
      }
    },
  }))
}
