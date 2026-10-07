// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { discardTab } from './discardTab.js'
import type { BrowserTabID } from '../../tab/BrowserTabID.js'

describe('discardTab', () => {
  const originalChrome = globalThis.chrome
  const discard = vi.fn()

  beforeEach(() => {
    discard.mockReset()
    Object.assign(globalThis, {
      chrome: { tabs: { discard } },
    })
  })

  afterEach(() => {
    Object.assign(globalThis, { chrome: originalChrome })
  })

  it('asks Chrome to discard the requested tab and returns its result', async () => {
    const discardedTab = { id: 123, discarded: true } as chrome.tabs.Tab
    discard.mockResolvedValue(discardedTab)

    await expect(discardTab(123 as BrowserTabID)).resolves.toBe(discardedTab)
    expect(discard).toHaveBeenCalledWith(123)
  })
})
