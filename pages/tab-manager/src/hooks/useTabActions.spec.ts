// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMockTab,
  installChromeMock,
  resetChromeMock,
} from '../../../../tests/mocks/chrome'
import { useTabActions } from './useTabActions'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'

// Mock the toast module
vi.mock('@extension/ui/components/Toaster', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the i18n module
vi.mock('@extension/i18n/t', () => ({
  t: vi.fn((key: string) => key),
}))

describe('useTabActions', () => {
  let chromeMock: ReturnType<typeof installChromeMock>
  let mockTab: BrowserTab

  beforeEach(() => {
    chromeMock = installChromeMock()
    mockTab = createMockTab({ id: 123, windowId: 1, index: 0 }) as BrowserTab
  })

  afterEach(() => {
    resetChromeMock()
    vi.clearAllMocks()
  })

  it('returns all expected actions', () => {
    const { result } = renderHook(() => useTabActions(mockTab))

    expect(result.current).toHaveProperty('close')
    expect(result.current).toHaveProperty('pin')
    expect(result.current).toHaveProperty('unpin')
    expect(result.current).toHaveProperty('mute')
    expect(result.current).toHaveProperty('unmute')
    expect(result.current).toHaveProperty('duplicate')
    expect(result.current).toHaveProperty('reload')
    expect(result.current).toHaveProperty('copyUrl')
    expect(result.current).toHaveProperty('copyTitle')
    expect(result.current).toHaveProperty('copyTitleAndUrl')
    expect(result.current).toHaveProperty('addToGroup')
    expect(result.current).toHaveProperty('addToNewGroup')
    expect(result.current).toHaveProperty('removeFromGroup')
    expect(result.current).toHaveProperty('moveToWindow')
    expect(result.current).toHaveProperty('moveToNewWindow')
  })

  describe('close', () => {
    it('calls chrome.tabs.remove with tab id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.close()

      expect(chromeMock.tabs.remove).toHaveBeenCalledWith(123)
    })
  })

  describe('pin', () => {
    it('calls chrome.tabs.update with pinned: true', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.pin()

      expect(chromeMock.tabs.update).toHaveBeenCalledWith(123, { pinned: true })
    })
  })

  describe('unpin', () => {
    it('calls chrome.tabs.update with pinned: false', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.unpin()

      expect(chromeMock.tabs.update).toHaveBeenCalledWith(123, {
        pinned: false,
      })
    })
  })

  describe('mute', () => {
    it('calls chrome.tabs.update with muted: true', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.mute()

      expect(chromeMock.tabs.update).toHaveBeenCalledWith(123, { muted: true })
    })
  })

  describe('unmute', () => {
    it('calls chrome.tabs.update with muted: false', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.unmute()

      expect(chromeMock.tabs.update).toHaveBeenCalledWith(123, { muted: false })
    })
  })

  describe('duplicate', () => {
    it('calls chrome.tabs.duplicate with tab id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.duplicate()

      expect(chromeMock.tabs.duplicate).toHaveBeenCalledWith(123)
    })
  })

  describe('reload', () => {
    it('calls chrome.tabs.reload with tab id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.reload()

      expect(chromeMock.tabs.reload).toHaveBeenCalledWith(123)
    })
  })

  describe('moveToNewWindow', () => {
    it('calls chrome.windows.create with tab id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.moveToNewWindow()

      expect(chromeMock.windows.create).toHaveBeenCalledWith({ tabId: 123 })
    })
  })

  describe('moveToWindow', () => {
    it('calls chrome.tabs.move with target window id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.moveToWindow(456)

      expect(chromeMock.tabs.move).toHaveBeenCalledWith(123, {
        windowId: 456,
        index: -1,
      })
    })
  })

  describe('addToGroup', () => {
    it('calls chrome.tabs.group with group id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.addToGroup(789)

      expect(chromeMock.tabs.group).toHaveBeenCalledWith({
        tabIds: 123,
        groupId: 789,
      })
    })
  })

  describe('addToNewGroup', () => {
    it('calls chrome.tabs.group without group id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.addToNewGroup()

      expect(chromeMock.tabs.group).toHaveBeenCalledWith({ tabIds: 123 })
    })
  })

  describe('removeFromGroup', () => {
    it('calls chrome.tabs.ungroup with tab id', async () => {
      const { result } = renderHook(() => useTabActions(mockTab))

      await result.current.removeFromGroup()

      expect(chromeMock.tabs.ungroup).toHaveBeenCalledWith(123)
    })
  })

  describe('memoization', () => {
    it('returns stable references when tab does not change', () => {
      const { result, rerender } = renderHook(() => useTabActions(mockTab))

      const firstClose = result.current.close
      const firstPin = result.current.pin

      rerender()

      expect(result.current.close).toBe(firstClose)
      expect(result.current.pin).toBe(firstPin)
    })

    it('returns new references when tab id changes', () => {
      const { result, rerender } = renderHook(({ tab }) => useTabActions(tab), {
        initialProps: { tab: mockTab },
      })

      const firstClose = result.current.close

      const newTab = createMockTab({ id: 999, windowId: 1 }) as BrowserTab
      rerender({ tab: newTab })

      expect(result.current.close).not.toBe(firstClose)
    })
  })
})
