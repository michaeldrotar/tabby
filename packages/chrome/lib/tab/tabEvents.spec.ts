import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBrowserStore } from '../useBrowserStore.js'
import { onChromeTabUpdated } from './tabEvents.js'
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
})
