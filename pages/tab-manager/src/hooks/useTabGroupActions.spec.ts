// @vitest-environment jsdom

import {
  changeTabGroupColor,
  closeTabs,
  moveTabGroupToNewWindow,
  renameTabGroup,
  toggleTabGroupCollapsed,
  ungroupTabs,
} from '@extension/chrome'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMockTabGroup,
  installChromeMock,
  resetChromeMock,
} from '../mocks/chrome'
import { useTabGroupActions } from './useTabGroupActions'
import type { BrowserTabGroup } from '@extension/chrome'

// Mock the toast module
vi.mock('@extension/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the i18n module
vi.mock('@extension/i18n', () => ({
  tt: vi.fn((key: string, count: number) => `${key}:${count}`),
}))

// Mock the action modules
vi.mock('@extension/chrome', () => ({
  changeTabGroupColor: vi.fn().mockResolvedValue(undefined),
  closeTabs: vi.fn().mockResolvedValue(undefined),
  copyTabGroupUrls: vi.fn().mockResolvedValue(undefined),
  moveTabGroupBackward: vi.fn().mockResolvedValue(undefined),
  moveTabGroupForward: vi.fn().mockResolvedValue(undefined),
  moveTabGroupToNewWindow: vi.fn().mockResolvedValue(undefined),
  renameTabGroup: vi.fn().mockResolvedValue(undefined),
  toggleTabGroupCollapsed: vi.fn().mockResolvedValue(undefined),
  ungroupTabs: vi.fn().mockResolvedValue(undefined),
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
    it('calls changeTabGroupColor with group id and color', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.changeColor('red')

      expect(changeTabGroupColor).toHaveBeenCalledWith(123, 'red')
    })
  })

  describe('close', () => {
    it('calls closeTabs with all tab ids', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.close()

      expect(closeTabs).toHaveBeenCalledWith([1, 2, 3])
    })
  })

  describe('rename', () => {
    it('calls renameTabGroup with group id and title', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.rename('New Title')

      expect(renameTabGroup).toHaveBeenCalledWith(123, 'New Title')
    })
  })

  describe('toggleCollapse', () => {
    it('collapses group when currently expanded', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.toggleCollapse()

      expect(toggleTabGroupCollapsed).toHaveBeenCalledWith(123, false)
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

      expect(toggleTabGroupCollapsed).toHaveBeenCalledWith(123, true)
    })
  })

  describe('ungroup', () => {
    it('calls ungroupTabs with all tab ids', async () => {
      const { result } = renderHook(() =>
        useTabGroupActions(mockGroup, mockTabIds),
      )

      await result.current.ungroup()

      expect(ungroupTabs).toHaveBeenCalledWith([1, 2, 3])
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
