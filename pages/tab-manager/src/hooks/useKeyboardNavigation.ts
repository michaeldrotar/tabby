import { moveTabGroupBackward } from '@extension/chrome/actions/tabGroups/moveTabGroupBackward'
import { moveTabGroupForward } from '@extension/chrome/actions/tabGroups/moveTabGroupForward'
import { moveTabBackward } from '@extension/chrome/actions/tabs/moveTabBackward'
import { moveTabForward } from '@extension/chrome/actions/tabs/moveTabForward'
import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  isSelectionItemRepresented,
  resolveSelectionItemTabIds,
} from '../actions/batchTabActions'
import { useBatchTabActions } from '../actions/useBatchTabActions'
import { useSelectionInteraction, useSelectionStore } from '../selection'
import type {
  PaneContext,
  SelectionItemRef,
  SelectionItemType,
} from '../selection'

type PendingFocus = {
  type: 'tab' | 'group'
  id: string
}

/**
 * Get selection item info from a navigable element.
 */
const getSelectionItemFromElement = (
  element: HTMLElement,
): { type: SelectionItemType; id: number } | null => {
  const navType = element.getAttribute('data-nav-type')

  if (navType === 'window') {
    const id = element.getAttribute('data-nav-id')
    return id ? { type: 'window', id: parseInt(id, 10) } : null
  } else if (navType === 'group') {
    const id = element.getAttribute('data-group-id')
    return id ? { type: 'group', id: parseInt(id, 10) } : null
  } else if (navType === 'tab') {
    const id = element.getAttribute('data-tab-item')
    return id ? { type: 'tab', id: parseInt(id, 10) } : null
  }
  return null
}

/**
 * Get pane context from a navigable element.
 */
const getPaneContextFromElement = (element: HTMLElement): PaneContext => {
  const navType = element.getAttribute('data-nav-type')
  if (navType === 'window') return 'window'
  // TODO: Add tree view detection when implemented
  return 'tab'
}

/**
 * Hook for keyboard navigation in the tab manager.
 * Handles arrow keys for navigation between windows, groups, and tabs.
 * Handles Space and Escape for selection management.
 * Respects context menu state to avoid conflicts.
 */
export const useKeyboardNavigation = (
  onSelectWindow?: (windowId: number) => void,
  onActivateWindow?: (windowId: number) => void,
) => {
  const pendingFocusRef = useRef<PendingFocus | null>(null)
  const selectionInteraction = useSelectionInteraction()
  const batchActions = useBatchTabActions()
  const closeBatchTabs = batchActions.close
  const getCurrentSnapshot = batchActions.getCurrentSnapshot

  // Restore focus after move operations, before browser paint
  useLayoutEffect(() => {
    const pendingFocus = pendingFocusRef.current
    if (!pendingFocus) return

    const selector =
      pendingFocus.type === 'tab'
        ? `[data-tab-item="${pendingFocus.id}"]`
        : `[data-group-id="${pendingFocus.id}"]`
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      focusNavigableItem(element, pendingFocus.type)
    }
    pendingFocusRef.current = null
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement
      const inActionBar = Boolean(
        activeElement?.closest('[data-action-bar-root]'),
      )
      const actionPopupOpen = Boolean(
        document.querySelector(
          '[data-action-bar-menu], [data-action-bar-panel]',
        ),
      )
      if ((inActionBar || actionPopupOpen) && e.key !== 'Escape') return

      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.isContentEditable ||
          activeElement.getAttribute('role') === 'textbox' ||
          activeElement.getAttribute('role') === 'combobox')
      ) {
        return
      }

      const navItem = activeElement?.closest('[data-nav-type]') as HTMLElement
      const navType = navItem?.getAttribute('data-nav-type')

      if (!navType) {
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
        ) {
          e.preventDefault()
          // No focused item - focus the viewing window (or first window) and select it
          const viewingWindow = document.querySelector(
            '[data-nav-type="window"][data-viewing="true"]',
          ) as HTMLElement
          const targetWindow =
            viewingWindow ??
            (document.querySelector('[data-nav-type="window"]') as HTMLElement)

          if (targetWindow) {
            targetWindow.focus()
            // Also select the window
            const item = getSelectionItemFromElement(targetWindow)
            if (item) {
              selectionInteraction.handleArrowNavigation(item, 'window')
            }
          }
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Window rows own this shortcut so it closes the window itself.
        if (navType === 'window') return

        const item = getSelectionItemFromElement(navItem)
        if (!item) return

        e.preventDefault()
        e.stopPropagation()
        const state = useSelectionStore.getState()
        const selection = {
          windowIds: state.windowIds,
          expandedWindowIds: state.expandedWindowIds,
          groupIds: state.groupIds,
          tabIds: state.tabIds,
        }
        const snapshot = getCurrentSnapshot()
        if (isSelectionItemRepresented(item, selection, snapshot)) {
          void closeBatchTabs()
        } else {
          void closeBatchTabs(item, resolveSelectionItemTabIds(item, snapshot))
        }
        return
      }

      // Alt+Arrow keys for moving tabs/groups
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        if (navType === 'tab' || navType === 'group') {
          e.preventDefault()
          const direction = e.key === 'ArrowUp' ? 'back' : 'forward'
          moveItem(navItem, navType, direction, pendingFocusRef)
        }
        return
      }

      // Ignore Alt+Left/Right - Alt is reserved for move operations
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return
      }

      // Space key: Enter multi-select mode or toggle selection
      if (e.key === ' ') {
        e.preventDefault()
        const item = getSelectionItemFromElement(navItem)
        if (item) {
          const paneContext = getPaneContextFromElement(navItem)
          selectionInteraction.handleKeyboard(item, ' ', paneContext)
        }
        return
      }

      // Escape key: Clear selection, exit multi-select mode, and select focused item
      if (e.key === 'Escape') {
        e.preventDefault()
        const item = getSelectionItemFromElement(navItem)
        if (item) {
          const paneContext = getPaneContextFromElement(navItem)
          selectionInteraction.handleKeyboard(item, 'Escape', paneContext)
        }
        return
      }

      // Cmd/Ctrl+A: Select all in current pane
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        const paneContext = getPaneContextFromElement(navItem)
        selectionInteraction.selectAll(
          paneContext,
          getSelectionItemsInOrder(paneContext),
        )
        return
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()

        if (navType === 'window') {
          const elements = Array.from(
            document.querySelectorAll('[data-nav-type="window"]'),
          ) as HTMLElement[]

          const currentIndex = elements.indexOf(navItem)
          let nextIndex = currentIndex

          if (e.key === 'ArrowUp') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
          } else {
            nextIndex =
              currentIndex < elements.length - 1
                ? currentIndex + 1
                : currentIndex
          }

          const target = elements[nextIndex]
          if (target) {
            // Get item info before moving focus
            const focusedBeforeMove = getSelectionItemFromElement(navItem)

            target.focus()
            target.scrollIntoView({ block: 'nearest' })

            const item = getSelectionItemFromElement(target)
            if (item) {
              if (e.shiftKey) {
                // Shift+Arrow: extend range selection
                selectionInteraction.handleShiftArrow(
                  item,
                  'window',
                  focusedBeforeMove ?? undefined,
                  getSelectionItemsInOrder('window'),
                )
              } else {
                // In default mode, arrow keys select the focused window
                selectionInteraction.handleArrowNavigation(item, 'window')
              }
            }

            if (onSelectWindow) {
              const windowId = target.getAttribute('data-nav-id')
              if (windowId) {
                onSelectWindow(parseInt(windowId, 10))
              }
            }
          }
        } else if (navType === 'tab' || navType === 'group') {
          const allNavigableItems = getNavigableTabItems()
          const currentIndex = allNavigableItems.findIndex(
            (item) => item.element === navItem,
          )

          if (currentIndex === -1) return

          let nextIndex = currentIndex
          if (e.key === 'ArrowUp') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
          } else {
            nextIndex =
              currentIndex < allNavigableItems.length - 1
                ? currentIndex + 1
                : currentIndex
          }

          const nextItem = allNavigableItems[nextIndex]
          if (nextItem) {
            // Get item info before moving focus
            const focusedBeforeMove = getSelectionItemFromElement(navItem)

            focusNavigableItem(nextItem.element, nextItem.type)

            const item = getSelectionItemFromElement(nextItem.element)
            if (item) {
              if (e.shiftKey) {
                // Shift+Arrow: extend range selection
                selectionInteraction.handleShiftArrow(
                  item,
                  'tab',
                  focusedBeforeMove ?? undefined,
                  getSelectionItemsInOrder('tab'),
                )
              } else {
                // In default mode, arrow keys select the focused item
                selectionInteraction.handleArrowNavigation(item, 'tab')
              }
            }
          }
        }
      } else if (
        e.key === 'ContextMenu' ||
        (e.key === 'F10' && e.shiftKey) ||
        (e.key === 'Enter' && e.shiftKey)
      ) {
        // Open the shared action-bar overflow, which replaces row context menus.
        e.preventDefault()
        const overflowTrigger = document.querySelector(
          '[data-action-bar-menu-trigger]',
        ) as HTMLButtonElement | null
        if (overflowTrigger) {
          overflowTrigger.focus()
          overflowTrigger.click()
        } else {
          const firstAction = document.querySelector(
            '[data-action-bar-action-trigger]',
          ) as HTMLButtonElement | null
          firstAction?.focus()
        }
      } else if (e.key === 'Enter') {
        if (navType === 'window' && onActivateWindow) {
          const windowId = navItem.getAttribute('data-nav-id')
          if (windowId) {
            e.preventDefault()
            onActivateWindow(parseInt(windowId, 10))
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (navType === 'window') {
          e.preventDefault()
          const items = getNavigableTabItems()
          const activeItem = items.find(
            (item) =>
              item.type === 'tab' &&
              item.element.getAttribute('data-active') === 'true',
          )
          const targetItem = activeItem ?? items[0]
          if (targetItem) {
            focusNavigableItem(targetItem.element, targetItem.type)
            // Pane switch: exit multi-select mode and select the focused item
            const item = getSelectionItemFromElement(targetItem.element)
            if (item) {
              selectionInteraction.handleArrowNavigation(item, 'tab', {
                forceSingleSelect: true,
              })
            }
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (navType === 'tab' || navType === 'group') {
          e.preventDefault()
          const viewingWindow = document.querySelector(
            '[data-nav-type="window"][data-viewing="true"]',
          ) as HTMLElement
          const targetWindow =
            viewingWindow ??
            (document.querySelector('[data-nav-type="window"]') as HTMLElement)
          if (targetWindow) {
            targetWindow.focus()
            // Pane switch: exit multi-select mode and select the focused window
            const item = getSelectionItemFromElement(targetWindow)
            if (item) {
              selectionInteraction.handleArrowNavigation(item, 'window', {
                forceSingleSelect: true,
              })
            }
          }
        }
      }
    }

    // Handle delete keys before row-level handlers to close a selection once.
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [
    onSelectWindow,
    onActivateWindow,
    selectionInteraction,
    closeBatchTabs,
    getCurrentSnapshot,
  ])
}

type NavigableItem = {
  element: HTMLElement
  type: 'tab' | 'group'
}

/**
 * Returns navigable items (tabs and groups) in visual order.
 * Tabs inside groups are listed individually after their group header.
 */
const getNavigableTabItems = (): NavigableItem[] => {
  const items: NavigableItem[] = []

  const tabPane = document.querySelector('[data-tab-pane]')
  if (!tabPane) {
    const allGroups = document.querySelectorAll('[data-nav-type="group"]')
    const allTabs = document.querySelectorAll('[data-nav-type="tab"]')

    allGroups.forEach((group) => {
      items.push({ element: group as HTMLElement, type: 'group' })
      const tabsInGroup = group.querySelectorAll('[data-nav-type="tab"]')
      tabsInGroup.forEach((tab) => {
        items.push({ element: tab as HTMLElement, type: 'tab' })
      })
    })

    allTabs.forEach((tab) => {
      if (!tab.closest('[data-nav-type="group"]')) {
        items.push({ element: tab as HTMLElement, type: 'tab' })
      }
    })

    return items
  }

  const walker = document.createTreeWalker(tabPane, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const el = node as HTMLElement
      const navType = el.getAttribute('data-nav-type')
      if (navType === 'tab' || navType === 'group') {
        return NodeFilter.FILTER_ACCEPT
      }
      return NodeFilter.FILTER_SKIP
    },
  })

  let node: Node | null = walker.nextNode()
  while (node) {
    const el = node as HTMLElement
    const navType = el.getAttribute('data-nav-type') as 'tab' | 'group'
    items.push({ element: el, type: navType })
    node = walker.nextNode()
  }

  return items
}

/** DOM-to-data adapter for keyboard selection; the selection model itself only
 * receives explicit item references and never queries the document. */
const getSelectionItemsInOrder = (
  paneContext: PaneContext,
): SelectionItemRef[] => {
  if (paneContext === 'window') {
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-nav-type="window"][data-nav-id]',
      ),
    ).flatMap((element) => {
      const item = getSelectionItemFromElement(element)
      return item ? [item] : []
    })
  }

  return getNavigableTabItems()
    .filter(({ element }) => (element as HTMLElement).offsetParent !== null)
    .flatMap(({ element }) => {
      const item = getSelectionItemFromElement(element)
      return item ? [item] : []
    })
}

const focusNavigableItem = (element: HTMLElement, type: 'tab' | 'group') => {
  if (type === 'group') {
    const btn = element.querySelector('button') as HTMLElement
    if (btn) {
      btn.focus()
    } else {
      element.focus()
    }
  } else {
    const option = element.querySelector('[data-tab-option]') as HTMLElement
    if (option) {
      option.focus()
    } else {
      element.focus()
    }
  }
  element.scrollIntoView({ block: 'nearest' })
}

/**
 * Moves a tab or group in the specified direction using the Chrome API.
 * Sets pending focus ref before the API call so it's ready when React re-renders.
 */
const moveItem = (
  element: HTMLElement,
  type: 'tab' | 'group',
  direction: 'back' | 'forward',
  pendingFocusRef: React.RefObject<PendingFocus | null>,
) => {
  if (type === 'tab') {
    const tabId = element.getAttribute('data-tab-item')
    if (!tabId) return

    // Set pending focus before the API call - the re-render from the data
    // change may complete before the await would return
    pendingFocusRef.current = { type: 'tab', id: tabId }

    const tabIdNum = parseInt(tabId, 10)
    if (direction === 'back') {
      moveTabBackward(tabIdNum)
    } else {
      moveTabForward(tabIdNum)
    }
  } else if (type === 'group') {
    const groupId = element.getAttribute('data-group-id')
    if (!groupId) return

    pendingFocusRef.current = { type: 'group', id: groupId }

    const groupIdNum = parseInt(groupId, 10)
    if (direction === 'back') {
      moveTabGroupBackward(groupIdNum)
    } else {
      moveTabGroupForward(groupIdNum)
    }
  }
}
