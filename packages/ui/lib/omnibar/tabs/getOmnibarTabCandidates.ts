import { Favicon } from '@/lib/components'
import type { OmnibarActionTextFn } from '../actions/OmnibarActionTextFn'
import type { OmnibarSearchCandidate } from '../search/OmnibarSearchCandidate'

const getTabActionText: OmnibarActionTextFn = () => {
  return { primaryText: 'Jump to' }
}

export const getOmnibarTabCandidates = async (): Promise<
  OmnibarSearchCandidate[]
> => {
  const tabs = await chrome.tabs.query({})
  return tabs.reduce<OmnibarSearchCandidate[]>((acc, tab) => {
    if (tab.title && tab.url) {
      acc.push({
        id: `tab:${tab.id}`,
        type: 'tab',
        title: tab.title,
        IconComponent: ({ size }) => Favicon({ pageUrl: tab.url, size }),
        url: tab.url,
        timestamp: tab.lastAccessed,
        searchFields: ['title', 'url'],
        getActionText: getTabActionText,
        performAction: async (modifier, parentWindowId) => {
          if (parentWindowId) {
            await chrome.windows.update(parentWindowId, { focused: true })
          }
          if (tab.id) {
            await chrome.tabs.update(tab.id, { active: true })
          }
        },
      })
    }
    return acc
  }, [])
}
