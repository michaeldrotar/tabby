import { generateOmnibarActionTextFn } from '../actions/generateOmnibarActionTextFn'
import { generateOmnibarUrlFn } from '../actions/generateOmnibarUrlFn'
import { Favicon } from '@/lib/components'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

export const getOmnibarBookmarkCandidates = async (
  tokens: string[],
): Promise<OmnibarSearchCandidate[]> => {
  const bookmarks = await chrome.bookmarks.search({ query: tokens.join(' ') })
  return bookmarks.reduce<OmnibarSearchCandidate[]>((acc, bookmark) => {
    if (bookmark.url) {
      acc.push({
        id: `bookmark:${bookmark.id}`,
        type: 'bookmark',
        title: bookmark.title,
        IconComponent: ({ size }) => Favicon({ pageUrl: bookmark.url, size }),
        url: bookmark.url,
        timestamp: bookmark.dateLastUsed,
        searchFields: ['title', 'url'],
        getActionText: generateOmnibarActionTextFn('Open'),
        performAction: generateOmnibarUrlFn(bookmark.url),
      })
    }
    return acc
  }, [])
}
