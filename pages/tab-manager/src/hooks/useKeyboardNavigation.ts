import { useEffect, useRef } from 'react'

/**
 * Hook for keyboard navigation in the tab manager.
 * Handles arrow keys for navigation between windows, groups, and tabs.
 * Respects context menu state to avoid conflicts.
 */
export const useKeyboardNavigation = (
  onSelectWindow?: (windowId: number) => void,
  onActivateWindow?: (windowId: number) => void,
) => {
  const isContextMenuOpen = useRef(false)

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
          const selectedWindow = document.querySelector(
            '[data-nav-type="window"][data-selected="true"]',
          ) as HTMLElement
          if (selectedWindow) {
            selectedWindow.focus()
          } else {
            const firstWindow = document.querySelector(
              '[data-nav-type="window"]',
            ) as HTMLElement
            firstWindow?.focus()
          }
        }
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
            target.focus()
            target.scrollIntoView({ block: 'nearest' })

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
            focusNavigableItem(nextItem.element, nextItem.type)
          }
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
          if (activeItem) {
            focusNavigableItem(activeItem.element, activeItem.type)
          } else if (items.length > 0) {
            focusNavigableItem(items[0].element, items[0].type)
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (navType === 'tab' || navType === 'group') {
          e.preventDefault()
          const selectedWindow = document.querySelector(
            '[data-nav-type="window"][data-selected="true"]',
          ) as HTMLElement
          if (selectedWindow) {
            selectedWindow.focus()
          } else {
            const firstWindow = document.querySelector(
              '[data-nav-type="window"]',
            ) as HTMLElement
            firstWindow?.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      observer.disconnect()
    }
  }, [onSelectWindow, onActivateWindow])
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
