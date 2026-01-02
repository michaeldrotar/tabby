// @vitest-environment jsdom

import { moveTabGroupToNewWindow } from '@extension/chrome/actions/tabGroups/moveTabGroupToNewWindow'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMockTabGroup,
  installChromeMock,
  resetChromeMock,
} from '../../../../tests/mocks/chrome'
import { useTabGroupActions } from './useTabGroupActions'
import type { BrowserTabGroup } from '@extension/chrome/tabGroup/BrowserTabGroup'

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

// Mock the action modules
vi.mock('@extension/chrome/actions/tabGroups/moveTabGroupToNewWindow', () => ({
  moveTabGroupToNewWindow: vi.fn().mockResolvedValue(undefined),
}))

describe('useTabGroupActions', () => {
  let chromeMock: ReturnType<typeof installChromeMock>
  let mockGroup: BrowserTabGroup
  let mockTabIds: readonly number[]

  beforeEach(() => {
    chromeMock = installChromeMock()
    mockGroup = createMockTabGroup({
      id: 123,
      windowId: 1,
      collapsed: false,
    }) as BrowserTabGroup
    mockTabIds = [1, 2, 3]
  })

  afterEach(() => {
    resetChromeMock()
    vi.clearAllMocks()
  })

  it('returns all expected actions', () => {
    const { result } = renderHook(() =>
      useTabGroupActions(mockGroup, mockTabIds),
    )

    expect(result.current).toHaveProperty('changeColor')
    expect(result.current).toHaveProperty('close')
    expect(result.current).toHaveProperty('copyUrls')
    expect(result.current).toHaveProperty('moveBack')
    expect(result.current).toHaveProperty('moveForward')
    expect(result.current).toHaveProperty('moveToNewWindow')
    expect(result.current).toHaveProperty('rename')
    expect(result.current).toHaveProperty('toggleCollapse')
    expect(result.current).toHaveProperty('ungroup')
  })

  describe('changeColor', () => {
    it('calls chrome.tabGroups.update with new color', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.changeColor('red')

      expect(chromeMock.tabGroups.update).toHaveBeenCalledWith(123, {
        color: 'red',
      })
    })
  })

  describe('close', () => {
    it('calls chrome.tabs.remove with all tab ids', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.close()

      expect(chromeMock.tabs.remove).toHaveBeenCalledWith([1, 2, 3])
    })
  })

  describe('rename', () => {
    it('calls chrome.tabGroups.update with new title', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.rename('New Title')

      expect(chromeMock.tabGroups.update).toHaveBeenCalledWith(123, {
        title: 'New Title',
      })
    })
  })

  describe('toggleCollapse', () => {
    it('collapses group when currently expanded', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.toggleCollapse()

      expect(chromeMock.tabGroups.update).toHaveBeenCalledWith(123, {
        collapsed: true,
      })
    })

    it('expands group when currently collapsed', async () => {
      const collapsedGroup = createMockTabGroup({
        id: 123,
        collapsed: true,
      }) as BrowserTabGroup

      const { result } = renderHook(() =>
        useTabGroupActions(collapsedGroup, mockTabIds),
      )

      await result.current.toggleCollapse()

      expect(chromeMock.tabGroups.update).toHaveBeenCalledWith(123, {
        collapsed: false,
      })
    })
  })

  describe('ungroup', () => {
    it('calls chrome.tabs.ungroup with all tab ids', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.ungroup()

      expect(chromeMock.tabs.ungroup).toHaveBeenCalledWith([1, 2, 3])
    })
  })

  describe('moveToNewWindow', () => {
    it('calls moveTabGroupToNewWindow with group id', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.moveToNewWindow()

      expect(moveTabGroupToNewWindow).toHaveBeenCalledWith(123)
    })
  })

  describe('memoization', () => {
    it('returns stable references when group does not change', () => {
      const { result, rerender } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      const firstClose = result.current.close
      const firstRename = result.current.rename

      rerender()

      expect(result.current.close).toBe(firstClose)
      expect(result.current.rename).toBe(firstRename)
    })

    it('returns new references when group id changes', () => {
      const { result, rerender } = renderHook(
        ({ group, tabIds }) => useTabGroupActions(group, tabIds),
        { initialProps: { group: mockGroup, tabIds: mockTabIds } },
      )

      const firstRename = result.current.rename

      const newGroup = createMockTabGroup({ id: 999 }) as BrowserTabGroup
      rerender({ group: newGroup, tabIds: mockTabIds })

      expect(result.current.rename).not.toBe(firstRename)
    })
  })
})
