// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMockTab,
  createMockWindow,
  installChromeMock,
  resetChromeMock,
} from '../../../../tests/mocks/chrome'
import { useWindowActions } from './useWindowActions'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'

// Mock the toast module
vi.mock('@extension/ui/components/Toaster', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the i18n module
vi.mock('@extension/i18n/plurals', () => ({
  tt: vi.fn((key: string, count: number) => `${key}:${count}`),
}))

describe('useWindowActions', () => {
  let chromeMock: ReturnType<typeof installChromeMock>
  let mockWindow: BrowserWindow
  let mockTabs: BrowserTab[]

  beforeEach(() => {
    chromeMock = installChromeMock()
    mockWindow = createMockWindow({ id: 1 }) as BrowserWindow
    mockTabs = [
      createMockTab({ id: 101, windowId: 1, url: 'https://example.com' }),
      createMockTab({ id: 102, windowId: 1, url: 'https://test.com' }),
      createMockTab({ id: 103, windowId: 1, url: 'https://demo.com' }),
    ] as BrowserTab[]
  })

  afterEach(() => {
    resetChromeMock()
    vi.clearAllMocks()
  })

  it('returns all expected actions', () => {
    const { result } = renderHook(() => useWindowActions(mockWindow, mockTabs))

    expect(result.current).toHaveProperty('close')
    expect(result.current).toHaveProperty('copyAllUrls')
    expect(result.current).toHaveProperty('focus')
    expect(result.current).toHaveProperty('muteAll')
    expect(result.current).toHaveProperty('reloadAll')
    expect(result.current).toHaveProperty('unmuteAll')
  })

  describe('close', () => {
    it('calls chrome.windows.remove with window id', async () => {
      const { result } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      await result.current.close()

      expect(chromeMock.windows.remove).toHaveBeenCalledWith(1)
    })
  })

  describe('copyAllUrls', () => {
    it('calls navigator.clipboard.writeText and shows toast', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
      })

      const { toast } = await import('@extension/ui/components/Toaster')

      const { result } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      await result.current.copyAllUrls()

      expect(toast.success).toHaveBeenCalledWith('toast_nUrlsCopied:3')
    })
  })

  describe('focus', () => {
    it('calls chrome.windows.update with focused: true', async () => {
      const { result } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      await result.current.focus()

      expect(chromeMock.windows.update).toHaveBeenCalledWith(1, {
        focused: true,
      })
    })
  })

  describe('muteAll', () => {
    it('calls chrome.tabs.update for each tab with muted: true', async () => {
      const { result } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      await result.current.muteAll()

      expect(chromeMock.tabs.update).toHaveBeenCalledWith(101, { muted: true })
      expect(chromeMock.tabs.update).toHaveBeenCalledWith(102, { muted: true })
      expect(chromeMock.tabs.update).toHaveBeenCalledWith(103, { muted: true })
    })
  })

  describe('reloadAll', () => {
    it('calls chrome.tabs.reload for each tab', async () => {
      const { result } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      await result.current.reloadAll()

      expect(chromeMock.tabs.reload).toHaveBeenCalledWith(101)
      expect(chromeMock.tabs.reload).toHaveBeenCalledWith(102)
      expect(chromeMock.tabs.reload).toHaveBeenCalledWith(103)
    })
  })

  describe('unmuteAll', () => {
    it('calls chrome.tabs.update for each tab with muted: false', async () => {
      const { result } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      await result.current.unmuteAll()

      expect(chromeMock.tabs.update).toHaveBeenCalledWith(101, { muted: false })
      expect(chromeMock.tabs.update).toHaveBeenCalledWith(102, { muted: false })
      expect(chromeMock.tabs.update).toHaveBeenCalledWith(103, { muted: false })
    })
  })

  describe('memoization', () => {
    it('returns stable references when window does not change', () => {
      const { result, rerender } = renderHook(() =>
        useWindowActions(mockWindow, mockTabs),
      )

      const firstClose = result.current.close
      const firstFocus = result.current.focus

      rerender()

      expect(result.current.close).toBe(firstClose)
      expect(result.current.focus).toBe(firstFocus)
    })

    it('returns new references when window id changes', () => {
      const { result, rerender } = renderHook(
        ({ window, tabs }) => useWindowActions(window, tabs),
        { initialProps: { window: mockWindow, tabs: mockTabs } },
      )

      const firstClose = result.current.close

      const newWindow = createMockWindow({ id: 999 }) as BrowserWindow
      rerender({ window: newWindow, tabs: mockTabs })

      expect(result.current.close).not.toBe(firstClose)
    })
  })
})
