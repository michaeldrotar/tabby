import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBrowserStore } from '../useBrowserStore.js'
import { onChromeTabReplaced, onChromeTabUpdated } from './tabEvents.js'
import type { BrowserTab } from './BrowserTab.js'

describe('onChromeTabUpdated', () => {
  const tabId = 123
  const makeTab = (discarded: boolean, status: 'unloaded' | 'loading') =>
    ({
      id: tabId,
      windowId: 1,
      index: 0,
      title: 'Test tab',
      url: 'https://example.com',
      status,
      active: false,
      pinned: false,
      audible: false,
      mutedInfo: { muted: false },
      groupId: -1,
      discarded,
      lifecycle: 'loaded',
    }) as BrowserTab

  beforeEach(() => {
    useBrowserStore.setState({ tabById: {} })
    useBrowserStore.getState().addTab(makeTab(false, 'loading'))
  })

  afterEach(() => {
    useBrowserStore.setState({ tabById: {} })
    vi.unstubAllGlobals()
  })

  it('reflects native discarded and restored tab updates', () => {
    const discardedTab = makeTab(true, 'unloaded') as chrome.tabs.Tab

    onChromeTabUpdated(
      tabId,
      { discarded: true, status: 'unloaded' },
      discardedTab,
    )

    expect(useBrowserStore.getState().tabById[tabId]).toMatchObject({
      discarded: true,
      lifecycle: 'loaded',
    })

    const restoredTab = makeTab(false, 'loading') as chrome.tabs.Tab

    onChromeTabUpdated(
      tabId,
      { discarded: false, status: 'loading' },
      restoredTab,
    )

    expect(useBrowserStore.getState().tabById[tabId]).toMatchObject({
      discarded: false,
      lifecycle: 'reloading',
    })
  })

  it('keeps one tab row through Chrome replacement after discard', async () => {
    const replacementId = 456
    const replacement = {
      ...makeTab(true, 'unloaded'),
      id: replacementId,
    } as chrome.tabs.Tab
    vi.stubGlobal('chrome', {
      tabs: { get: vi.fn().mockResolvedValue(replacement) },
    })
    const updates: number[][] = []
    const unsubscribe = useBrowserStore.subscribe((state) => {
      updates.push(Object.keys(state.tabById).map(Number))
    })

    onChromeTabReplaced(replacementId, tabId)
    await vi.waitFor(() =>
      expect(useBrowserStore.getState().tabById[replacementId]).toMatchObject({
        id: replacementId,
        renderKey: tabId,
        discarded: true,
      }),
    )

    unsubscribe()
    expect(useBrowserStore.getState().tabById[tabId]).toBeUndefined()
    expect(updates).toEqual([[replacementId]])
  })
})
