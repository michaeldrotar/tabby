// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOmnibarFiltering } from './useOmnibarFiltering'
import type { OmnibarSearchResult } from './OmnibarSearchResult'
import type { OmnibarResultGenerators } from './useOmnibarFiltering'

describe('useOmnibarFiltering', () => {
  const mockTabs: OmnibarSearchResult[] = [
    {
      id: 1,
      title: 'Open Houses - 17 Upcoming | Zillow',
      url: 'https://zillow.com/homes/17',
      type: 'tab',
      execute: async () => {},
    },
    {
      id: 2,
      title: 'Other Tab',
      url: 'https://example.com',
      type: 'tab',
      execute: async () => {},
    },
  ]
  const mockExternalResults: OmnibarSearchResult[] = []

  // Mock generators with basic implementations
  const mockGenerators: OmnibarResultGenerators = {
    getGoogleSearchItem: (query: string) => ({
      id: `google-${query}`,
      type: 'search' as const,
      title: `Search Google for "${query}"`,
      url: `https://google.com/search?q=${encodeURIComponent(query)}`,
      execute: async () => {},
    }),
    getUrlNavigationItem: () => [],
    getMatchingCommands: (queryTerms: string[]) => {
      // Include some mock commands for testing
      const commands: OmnibarSearchResult[] = [
        {
          id: 'chrome-settings',
          type: 'command',
          title: 'Chrome: Open Settings',
          execute: async () => {},
        },
        {
          id: 'tab-manager',
          type: 'command',
          title: 'Tabby: Open Tab Manager',
          execute: async () => {},
        },
      ]
      return commands.filter((cmd) =>
        queryTerms.every((term) =>
          cmd.title?.toLowerCase().includes(term.toLowerCase()),
        ),
      )
    },
    getMatchingTabs: (tabs, queryTerms) =>
      tabs.filter((tab) =>
        queryTerms.every(
          (term) =>
            tab.title?.toLowerCase().includes(term.toLowerCase()) ||
            tab.url?.toLowerCase().includes(term.toLowerCase()),
        ),
      ),
  }

  it('should filter tabs by multiple terms', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering(
        'zillow 17',
        mockTabs,
        mockExternalResults,
        mockGenerators,
      ),
    )

    const tabResults = result.current.filteredItems.filter(
      (item) => item.type === 'tab',
    )
    expect(tabResults).toHaveLength(1)
    expect(tabResults[0]?.title).toBe('Open Houses - 17 Upcoming | Zillow')
  })

  it('should filter tabs by single term', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering(
        'zillow',
        mockTabs,
        mockExternalResults,
        mockGenerators,
      ),
    )

    const tabResults = result.current.filteredItems.filter(
      (item) => item.type === 'tab',
    )
    expect(tabResults).toHaveLength(1)
    expect(tabResults[0]?.title).toBe('Open Houses - 17 Upcoming | Zillow')
  })

  it('should not find non-matching tabs', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering(
        'google',
        mockTabs,
        mockExternalResults,
        mockGenerators,
      ),
    )

    const tabResults = result.current.filteredItems.filter(
      (item) => item.type === 'tab',
    )
    expect(tabResults).toHaveLength(0)
  })

  it('should filter commands by multiple terms', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering(
        'chrome settings',
        mockTabs,
        mockExternalResults,
        mockGenerators,
      ),
    )

    const commandResults = result.current.filteredItems.filter(
      (item) => item.type === 'command',
    )
    // "Chrome: Open Settings" should match "chrome settings"
    const settingsCommand = commandResults.find(
      (c) => c.title === 'Chrome: Open Settings',
    )
    expect(settingsCommand).toBeDefined()
  })
})
