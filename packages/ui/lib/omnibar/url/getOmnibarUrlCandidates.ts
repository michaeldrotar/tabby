import { generateOmnibarActionTextFn } from '../actions/generateOmnibarActionTextFn'
import { generateOmnibarUrlFn } from '../actions/generateOmnibarUrlFn'
import { Favicon } from '@/lib/components'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

export const getOmnibarUrlCandidates = async (
  searchText: string,
): Promise<OmnibarSearchCandidate[]> => {
  const isUrl =
    /^https?:\/\//.test(searchText) ||
    (!searchText.includes(' ') && searchText.includes('.'))

  if (!isUrl) return []

  const url = searchText.includes('://') ? searchText : `https://${searchText}`
  const candidate: OmnibarSearchCandidate = {
    id: `url:${url}`,
    type: 'url',
    title: 'Open URL',
    IconComponent: ({ size }) => Favicon({ pageUrl: url, size }),
    url,
    searchFields: ['url'],
    getActionText: generateOmnibarActionTextFn('Open'),
    performAction: generateOmnibarUrlFn(url),
  }
  return Promise.resolve([candidate])
}
