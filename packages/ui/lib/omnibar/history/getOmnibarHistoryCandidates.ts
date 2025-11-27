import { generateOmnibarActionTextFn } from '../actions/generateOmnibarActionTextFn'
import { generateOmnibarUrlFn } from '../actions/generateOmnibarUrlFn'
import { Favicon } from '@/lib/components'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

export const getOmnibarHistoryCandidates = async (
  tokens: string[],
): Promise<OmnibarSearchCandidate[]> => {
  const histories = await chrome.history.search({ text: tokens.join(' ') })
  return histories.reduce<OmnibarSearchCandidate[]>((acc, history) => {
    if (history.url && history.title) {
      acc.push({
        id: `history:${history.id}`,
        type: 'history',
        title: history.title,
        IconComponent: ({ size }) => Favicon({ pageUrl: history.url, size }),
        url: history.url,
        timestamp: history.lastVisitTime,
        searchFields: ['title', 'url'],
        getActionText: generateOmnibarActionTextFn('Open'),
        performAction: generateOmnibarUrlFn(history.url),
      })
    }
    return acc
  }, [])
}
