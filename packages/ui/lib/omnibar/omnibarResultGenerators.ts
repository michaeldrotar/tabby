import { executeUrl } from './executeUrl'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getGoogleSearchItem = (query: string): OmnibarSearchResult => {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`
  return {
    id: 'search-google',
    type: 'search',
    title: 'Search Google',
    url,
    execute: async (modifier, originalWindowId) => {
      await executeUrl(url, modifier, originalWindowId)
    },
  }
}

export const getUrlNavigationItem = (query: string): OmnibarSearchResult[] => {
  const isUrl =
    /^https?:\/\//.test(query) || (!query.includes(' ') && query.includes('.'))

  if (!isUrl) return []

  const url = query.includes('://') ? query : `https://${query}`
  return [
    {
      id: 'url-go',
      type: 'url',
      title: 'Open URL',
      url,
      execute: async (modifier, originalWindowId) => {
        await executeUrl(url, modifier, originalWindowId)
      },
    },
  ]
}

const COMMANDS: OmnibarSearchResult[] = [
  {
    id: 'cmd-side-panel',
    type: 'command',
    title: 'Tabby: Open Tab Manager',
    execute: async (_modifier, originalWindowId) => {
      if (originalWindowId) {
        await chrome.sidePanel.open({ windowId: originalWindowId })
      } else {
        const window = await chrome.windows.getLastFocused()
        if (window.id) {
          await chrome.sidePanel.open({ windowId: window.id })
        }
      }
    },
  },
  {
    id: 'cmd-open-options',
    type: 'command',
    title: 'Tabby: Open Options',
    execute: async () => {
      chrome.runtime.openOptionsPage()
    },
  },
  {
    id: 'cmd-settings',
    type: 'command',
    title: 'Chrome: Open Settings',
    url: 'chrome://settings',
    execute: async (modifier, originalWindowId) => {
      await executeUrl('chrome://settings', modifier, originalWindowId)
    },
  },
  {
    id: 'cmd-extensions',
    type: 'command',
    title: 'Chrome: Manage Extensions',
    url: 'chrome://extensions',
    execute: async (modifier, originalWindowId) => {
      await executeUrl('chrome://extensions', modifier, originalWindowId)
    },
  },
  {
    id: 'cmd-history',
    type: 'command',
    title: 'Chrome: History',
    url: 'chrome://history',
    execute: async (modifier, originalWindowId) => {
      await executeUrl('chrome://history', modifier, originalWindowId)
    },
  },
  {
    id: 'cmd-downloads',
    type: 'command',
    title: 'Chrome: Downloads',
    url: 'chrome://downloads',
    execute: async (modifier, originalWindowId) => {
      await executeUrl('chrome://downloads', modifier, originalWindowId)
    },
  },
  {
    id: 'cmd-bookmarks',
    type: 'command',
    title: 'Chrome: Bookmarks Manager',
    url: 'chrome://bookmarks',
    execute: async (modifier, originalWindowId) => {
      await executeUrl('chrome://bookmarks', modifier, originalWindowId)
    },
  },
  {
    id: 'cmd-passwords',
    type: 'command',
    title: 'Chrome: Password Manager',
    url: 'chrome://password-manager',
    execute: async (modifier, originalWindowId) => {
      await executeUrl('chrome://password-manager', modifier, originalWindowId)
    },
  },
  {
    id: 'cmd-clear-data',
    type: 'command',
    title: 'Chrome: Clear Browsing Data',
    url: 'chrome://settings/clearBrowserData',
    execute: async (modifier, originalWindowId) => {
      await executeUrl(
        'chrome://settings/clearBrowserData',
        modifier,
        originalWindowId,
      )
    },
  },
]

export const getMatchingCommands = (
  queryTerms: string[],
): OmnibarSearchResult[] => {
  return COMMANDS.filter((c) => {
    const title = c.title.toLowerCase()
    return queryTerms.every((term) => title.includes(term))
  })
}

export const getMatchingTabs = (
  tabs: OmnibarSearchResult[],
  queryTerms: string[],
): OmnibarSearchResult[] => {
  return tabs
    .filter((tab) => {
      const title = tab.title?.toLowerCase() || ''
      const url = tab.url?.toLowerCase() || ''
      return queryTerms.every(
        (term) => title.includes(term) || url.includes(term),
      )
    })
    .map((t) => ({ ...t, type: 'tab' as const }))
}
