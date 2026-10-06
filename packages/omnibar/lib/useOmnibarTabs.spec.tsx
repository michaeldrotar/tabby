// @vitest-environment jsdom
import { activateTab } from '@extension/chrome/actions/tabs/activateTab'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabs } from '@extension/chrome/tab/useBrowserTabs'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOmnibarTabs } from './useOmnibarTabs'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'

vi.mock('@extension/chrome/actions/tabs/activateTab', () => ({
  activateTab: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@extension/chrome/actions/windows/focusWindow', () => ({
  focusWindow: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@extension/chrome/tab/useBrowserTabs', () => ({
  useBrowserTabs: vi.fn(),
}))

const localhostTabs = [2, 3, 4].map(
  (windowId, index) =>
    ({
      id: index + 1,
      windowId,
      title: `localhost project ${windowId}`,
      url: 'http://localhost:3000',
      lifecycle: 'loaded',
    }) as BrowserTab,
)

describe('useOmnibarTabs', () => {
  const tabsCreate = vi.fn()
  const windowsCreate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useBrowserTabs).mockReturnValue(localhostTabs)
    tabsCreate.mockResolvedValue({})
    windowsCreate.mockResolvedValue({})
    globalThis.chrome = {
      tabs: { create: tabsCreate },
      windows: { create: windowsCreate },
    } as unknown as typeof chrome
  })

  it('keeps the normal action focused on the matched tab', async () => {
    const { result } = renderHook(() => useOmnibarTabs())

    await result.current[1]!.execute()

    expect(focusWindow).toHaveBeenCalledWith(3)
    expect(activateTab).toHaveBeenCalledWith(2)
    expect(tabsCreate).not.toHaveBeenCalled()
    expect(windowsCreate).not.toHaveBeenCalled()
  })

  it('opens a fresh matching URL in the originating window', async () => {
    const { result } = renderHook(() => useOmnibarTabs())

    await result.current[2]!.execute('new-tab', 1)

    expect(tabsCreate).toHaveBeenCalledWith({
      windowId: 1,
      url: 'http://localhost:3000',
      active: true,
    })
    expect(focusWindow).toHaveBeenCalledWith(1)
    expect(activateTab).not.toHaveBeenCalled()
  })

  it('opens a fresh matching URL in a new window', async () => {
    const { result } = renderHook(() => useOmnibarTabs())

    await result.current[0]!.execute('new-window', 1)

    expect(windowsCreate).toHaveBeenCalledWith({
      url: 'http://localhost:3000',
      focused: true,
    })
    expect(tabsCreate).not.toHaveBeenCalled()
    expect(activateTab).not.toHaveBeenCalled()
  })

  it('focuses the matched tab when a restricted URL cannot be opened fresh', async () => {
    tabsCreate.mockRejectedValueOnce(new Error('Restricted URL'))
    const { result } = renderHook(() => useOmnibarTabs())

    await result.current[2]!.execute('new-tab', 1)

    expect(focusWindow).toHaveBeenCalledWith(4)
    expect(activateTab).toHaveBeenCalledWith(3)
  })

  it('focuses the matched tab when the originating window has closed', async () => {
    tabsCreate.mockRejectedValueOnce(new Error('No window with id: 1'))
    const { result } = renderHook(() => useOmnibarTabs())

    await result.current[2]!.execute('new-tab', 1)

    expect(focusWindow).toHaveBeenCalledWith(4)
    expect(activateTab).toHaveBeenCalledWith(3)
  })

  it('focuses the matched tab when a restricted URL cannot open in a new window', async () => {
    windowsCreate.mockRejectedValueOnce(new Error('Restricted URL'))
    const { result } = renderHook(() => useOmnibarTabs())

    await result.current[1]!.execute('new-window')

    expect(focusWindow).toHaveBeenCalledWith(3)
    expect(activateTab).toHaveBeenCalledWith(2)
  })
})
