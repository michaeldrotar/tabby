import { duckDuckGoBangs } from './bangs/data/duckDuckGoBangs'
import { getDuckDuckGoBangByTrigger } from './bangs/getDuckDuckGoBangByTrigger'
import { executeUrl } from './executeUrl'
import { tokenizeOmnibarText } from './search/tokenizeOmnibarText'
import { exampleThemeStorage } from '@extension/storage'
import type { DuckDuckGoBang } from './bangs/DuckDuckGoBang'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

// Source: DuckDuckGo Bangs Data (unofficial usage)
// We use the 'd' (domain) field to fetch favicons via Google's service to avoid hotlinking DDG directly.
const getFaviconUrl = (bang: { d?: string; u: string }): string | undefined => {
  let domain = ''
  if (bang.d) {
    if (bang.d.startsWith('http')) {
      try {
        domain = new URL(bang.d).hostname
      } catch {
        domain = bang.d
      }
    } else {
      domain = bang.d.split('/')[0]
    }
  } else {
    try {
      const urlStr = bang.u.replace('{{{s}}}', '')
      if (urlStr.startsWith('http')) {
        domain = new URL(urlStr).hostname
      } else if (urlStr.startsWith('/')) {
        domain = 'duckduckgo.com'
      }
    } catch {
      // ignore
    }
  }

  if (domain) {
    // Use Google's favicon service which is widely used for this purpose
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  }
  return undefined
}

const createBangSearchResult = (
  bang: { t: string; s: string; d?: string; u: string; r?: number },
  query: string,
): OmnibarSearchResult => {
  const favIconUrl = getFaviconUrl(bang)
  const cleanQuery = query.trim()

  // If no query (or it's a suggestion which implies selecting the bang first), treat as "Open"
  // But for suggestions, we might want to show "Open Site (!bang)"
  // If it's a search result (from getBangFromQuery), we check if there is a query term.

  if (!cleanQuery) {
    let url = bang.d

    // If d is empty or contains placeholder, fallback to u
    if (!url || url.includes('{{{s}}}')) {
      url = bang.u.replace('{{{s}}}', '')
      if (url.startsWith('/')) {
        url = `https://duckduckgo.com${url}`
      }
    } else {
      // If d is present, ensure it has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`
      }
    }

    return {
      id: `open-bang-${bang.t}`,
      type: 'search',
      title: `Open ${bang.s}`,
      description: `Run command !${bang.t}`,
      url,
      favIconUrl,
      rank: bang.r,
      execute: async (modifier, originalWindowId) => {
        await executeUrl(url, modifier, originalWindowId)
      },
    }
  }

  let url = bang.u.replace('{{{s}}}', encodeURIComponent(cleanQuery))
  if (url.startsWith('/')) {
    url = `https://duckduckgo.com${url}`
  }
  return {
    id: `search-bang-${bang.t}`,
    type: 'search',
    title: `Search ${bang.s}`,
    description: `Run command !${bang.t}`,
    url,
    favIconUrl,
    rank: bang.r,
    execute: async (modifier, originalWindowId) => {
      await executeUrl(url, modifier, originalWindowId)
    },
  }
}

const searchBangs = (query: string): DuckDuckGoBang[] => {
  return duckDuckGoBangs.filter((bang) => {
    return query.includes(bang.t)
  })
}

export const getBangFromQuery = (
  query: string,
): { bang: DuckDuckGoBang; cleanQuery: string } | undefined => {
  const tokens = tokenizeOmnibarText(query)
  const bang = tokens
    .map((token) => getDuckDuckGoBangByTrigger(token))
    .filter(Boolean)[0]
  if (!bang) return undefined
  return {
    bang,
    cleanQuery: query.replace(bang.t, ''),
  }
}

export const getSearchItems = (query: string): OmnibarSearchResult[] => {
  const results: OmnibarSearchResult[] = []
  const seenIds = new Set<string>()

  // 1. Suggestions (if query contains !)
  const suggestions = searchBangs(query)
  if (suggestions.length > 0) {
    suggestions.forEach((bang) => {
      // For suggestions, we treat the query as empty (just opening/selecting the bang)
      const result = createBangSearchResult(bang, '')
      if (!seenIds.has(result.id as string)) {
        results.push(result)
        seenIds.add(result.id as string)
      }
    })
  }

  // 2. Explicit Bang (e.g. "!g cat")
  const bangResult = getBangFromQuery(query)
  if (bangResult) {
    const { bang, cleanQuery } = bangResult
    const result = createBangSearchResult(bang, cleanQuery)
    if (!seenIds.has(result.id as string)) {
      results.push(result)
      seenIds.add(result.id as string)
    }
  }

  // 3. Fallback (Google)
  if (results.length === 0) {
    const googleBang = getDuckDuckGoBangByTrigger('g')
    if (googleBang) {
      // Treat the entire query as the search term
      const result = createBangSearchResult(googleBang, query)
      // Override title for default search to be cleaner?
      // User said: "treat it as though the google bang (!g) is there"
      // So "Search Google (!g)" is fine, or maybe just "Search Google".
      // Let's stick to the standard format for consistency and scoring.
      results.push(result)
    }
  }

  return results
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
    id: 'cmd-toggle-theme',
    type: 'command',
    title: 'Tabby: Toggle Theme',
    execute: async () => {
      await exampleThemeStorage.toggle()
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
