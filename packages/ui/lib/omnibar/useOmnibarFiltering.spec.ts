// @vitest-environment jsdom
import { useOmnibarFiltering } from './useOmnibarFiltering'
import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

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

  it('should filter tabs by multiple terms', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering('zillow 17', mockTabs, mockExternalResults),
    )

    const tabResults = result.current.filteredItems.filter(
      (item) => item.type === 'tab',
    )
    expect(tabResults).toHaveLength(1)
    expect(tabResults[0].title).toBe('Open Houses - 17 Upcoming | Zillow')
  })

  it('should filter tabs by single term', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering('zillow', mockTabs, mockExternalResults),
    )

    const tabResults = result.current.filteredItems.filter(
      (item) => item.type === 'tab',
    )
    expect(tabResults).toHaveLength(1)
    expect(tabResults[0].title).toBe('Open Houses - 17 Upcoming | Zillow')
  })

  it('should not find non-matching tabs', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering('google', mockTabs, mockExternalResults),
    )

    const tabResults = result.current.filteredItems.filter(
      (item) => item.type === 'tab',
    )
    expect(tabResults).toHaveLength(0)
  })

  it('should filter commands by multiple terms', () => {
    const { result } = renderHook(() =>
      useOmnibarFiltering('chrome settings', mockTabs, mockExternalResults),
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
