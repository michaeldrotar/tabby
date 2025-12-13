import { useEffect } from 'react'

export const useKeyboardNavigation = (
  onSelectWindow?: (windowId: number) => void,
  onActivateWindow?: (windowId: number) => void,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement

      // Ignore if typing in an input
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

      // Global trap: If nothing relevant is focused, focus the sidebar on arrow keys
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

      // Navigation logic when an item is focused
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const selector = `[data-nav-type="${navType}"]`
        // We need to query all focusable elements of this type
        // Note: This assumes all items of the same type are siblings or in a flat list order in DOM
        const elements = Array.from(
          document.querySelectorAll(selector),
        ) as HTMLElement[]

        // Find the index of the current item (or the closest parent that matches)
        const currentIndex = elements.indexOf(navItem)

        let nextIndex = currentIndex
        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
        } else {
          nextIndex =
            currentIndex < elements.length - 1 ? currentIndex + 1 : currentIndex
        }

        const target = elements[nextIndex]
        if (target) {
          // If the target itself is a button or input, focus it.
          // Otherwise, look for a button inside it (e.g. for TabItem where data-nav-type is on the wrapper)
          if (
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.getAttribute('tabindex')
          ) {
            target.focus()
          } else {
            const focusableChild = target.querySelector(
              'button, a, [tabindex]',
            ) as HTMLElement
            focusableChild?.focus()
          }
          target.scrollIntoView({ block: 'nearest' })

          // If navigating windows, select the new window
          if (navType === 'window' && onSelectWindow) {
            const windowId = target.getAttribute('data-nav-id')
            if (windowId) {
              onSelectWindow(parseInt(windowId, 10))
            }
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
          // Move to active tab or first tab
          // We look for the wrapper first, then the button inside
          const activeTabWrapper = document.querySelector(
            '[data-nav-type="tab"][data-active="true"]',
          ) as HTMLElement

          if (activeTabWrapper) {
            const btn = activeTabWrapper.querySelector('button') as HTMLElement
            btn?.focus()
          } else {
            const firstTabWrapper = document.querySelector(
              '[data-nav-type="tab"]',
            ) as HTMLElement
            const btn = firstTabWrapper?.querySelector('button') as HTMLElement
            btn?.focus()
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (navType === 'tab') {
          e.preventDefault()
          // Move to selected window
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
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSelectWindow, onActivateWindow])
}
