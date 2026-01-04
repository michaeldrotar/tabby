import { moveTabGroupBackward } from '@extension/chrome/actions/tabGroups/moveTabGroupBackward'
import { moveTabGroupForward } from '@extension/chrome/actions/tabGroups/moveTabGroupForward'
import { moveTabBackward } from '@extension/chrome/actions/tabs/moveTabBackward'
import { moveTabForward } from '@extension/chrome/actions/tabs/moveTabForward'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSelectionInteraction } from '../selection'
import type { PaneContext, SelectionItemType } from '../selection'

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
  const isContextMenuOpen = useRef(false)
  const pendingFocusRef = useRef<PendingFocus | null>(null)
  const selectionInteraction = useSelectionInteraction()

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
    const observer = new MutationObserver(() => {
      const contextMenuContent = document.querySelector(
        '[data-radix-menu-content]',
      )
      isContextMenuOpen.current = !!contextMenuContent
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isContextMenuOpen.current) {
        return
      }

      const activeElement = document.activeElement as HTMLElement

      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
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
          const viewingWindow = document.querySelector(
            '[data-nav-type="window"][data-viewing="true"]',
          ) as HTMLElement
          if (viewingWindow) {
            viewingWindow.focus()
          } else {
            const firstWindow = document.querySelector(
              '[data-nav-type="window"]',
            ) as HTMLElement
            firstWindow?.focus()
          }
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
        selectionInteraction.selectAll(paneContext)
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
        // Open context menu for the focused item
        // Shift+F10 is the standard Windows shortcut, ContextMenu is the dedicated key
        // Shift+Enter is an alternative that works well on Mac
        e.preventDefault()
        openContextMenuForElement(navItem)
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

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      observer.disconnect()
    }
  }, [onSelectWindow, onActivateWindow, selectionInteraction])
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

const focusNavigableItem = (element: HTMLElement, type: 'tab' | 'group') => {
  if (type === 'group') {
    const btn = element.querySelector('button') as HTMLElement
    if (btn) {
      btn.focus()
    } else {
      element.focus()
    }
  } else {
    const btn = element.querySelector('button') as HTMLElement
    if (btn) {
      btn.focus()
    } else {
      element.focus()
    }
  }
  element.scrollIntoView({ block: 'nearest' })
}

/**
 * Opens a context menu for the given element by dispatching a synthetic
 * contextmenu event. The event is positioned at the element's center.
 */
const openContextMenuForElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const contextMenuEvent = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  })
  element.dispatchEvent(contextMenuEvent)
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
